<?php

namespace App\Services\Financial;

use App\Models\DriverCalculation;
use App\Models\Payslip;
use App\Models\Remittance;
use App\Models\TenantPayrollBillingTax;
use App\Models\TimesheetTrip;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class PayrollFinancialService
{
    /**
     * Sum agency (client) billable amounts from trip rate snapshots for the payroll period.
     */
    public static function agencyBillingSubtotalFromTrips(iterable $trips): float
    {
        $sum = 0.0;
        foreach ($trips as $trip) {
            foreach (TimesheetTripLineService::billableLines($trip) as $row) {
                $sum += round((float) ($row['line']['agency_amount'] ?? 0), 2);
            }
        }

        return round($sum, 2);
    }

    /**
     * Configured billing tax rules for the tenant (name + percentage | fixed + value).
     *
     * @return list<array{name: string, type: string, value: float}>
     */
    public static function resolveBillingTaxRules(?string $tenantId): array
    {
        if ($tenantId === null || $tenantId === '') {
            return [];
        }

        return TenantPayrollBillingTax::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (TenantPayrollBillingTax $t) => [
                'name' => $t->name,
                'type' => $t->type,
                'value' => (float) $t->value,
            ])
            ->all();
    }

    /**
     * @param  list<array{name: string, type: string, value: float}>  $rules
     * @return array{lines: list<array{name: string, type: string, value: float, amount: float}>, sumFromPercent: float, sumFixed: float, taxAmount: float, agencyTotal: float}
     */
    public static function applyBillingTaxRules(float $agencySubtotal, array $rules): array
    {
        $lines = [];
        $sumFromPercent = 0.0;
        $sumFixed = 0.0;

        foreach ($rules as $r) {
            $type = (string) ($r['type'] ?? '');
            $val = (float) ($r['value'] ?? 0);
            $name = (string) ($r['name'] ?? 'Tax');
            if ($name === '') {
                $name = 'Tax';
            }

            if ($type === 'percentage') {
                $amt = round($agencySubtotal * ($val / 100), 2);
                $sumFromPercent += $amt;
            } elseif ($type === 'fixed') {
                $amt = round($val, 2);
                $sumFixed += $amt;
            } else {
                continue;
            }

            if ($amt < 0) {
                continue;
            }

            $lines[] = [
                'name' => $name,
                'type' => $type,
                'value' => $val,
                'amount' => $amt,
            ];
        }

        $taxAmount = round($sumFromPercent + $sumFixed, 2);
        $agencyTotal = round($agencySubtotal + $taxAmount, 2);

        return [
            'lines' => $lines,
            'sumFromPercent' => round($sumFromPercent, 2),
            'sumFixed' => round($sumFixed, 2),
            'taxAmount' => $taxAmount,
            'agencyTotal' => $agencyTotal,
        ];
    }

    public static function tripsForPayroll(?string $tenantId, string $startDate, string $endDate, ?int $onlyDriverId = null): Builder
    {
        $q = TimesheetTrip::query()
            ->whereNull('payslip_id')
            ->whereDate('trip_date', '>=', $startDate)
            ->whereDate('trip_date', '<=', $endDate)
            ->whereHas('timesheet', function ($q2) use ($tenantId, $onlyDriverId) {
                $q2->where('status', 'approved');
                if ($tenantId) {
                    $q2->where('tenant_id', $tenantId);
                }
                if ($onlyDriverId) {
                    $q2->where('driver_id', $onlyDriverId);
                }
            })
            ->with(['timesheet.driver.user']);

        return $q;
    }

    /**
     * @param  list<array{name: string, type: string, value: float}>  $billingTaxRules
     */
    public static function preview(
        ?string $tenantId,
        string $startDate,
        string $endDate,
        float $vacationPercent,
        float $defaultDeductions = 0,
        array $billingTaxRules = []
    ): array {
        $trips = self::tripsForPayroll($tenantId, $startDate, $endDate)
            ->orderBy('trip_date')
            ->get()
            ->groupBy(fn (TimesheetTrip $t) => $t->timesheet->driver_id);

        $drivers = [];
        foreach ($trips as $driverId => $group) {
            $gross = 0.0;
            $breakdown = [];

            /** @var TimesheetTrip $trip */
            foreach ($group as $trip) {
                foreach (TimesheetTripLineService::payableLines($trip) as $row) {
                    $line = $row['line'];
                    $key = (string) ($line['line_type'] ?? 'other').':'.(string) ($line['label'] ?? '');
                    $amt = round((float) ($line['driver_amount'] ?? 0), 2);
                    $gross += $amt;
                    $breakdown[$key] = round(($breakdown[$key] ?? 0) + $amt, 2);
                }
            }

            if ($gross <= 0) {
                continue;
            }

            $vacation = round($gross * ($vacationPercent / 100), 2);
            $ded = round($defaultDeductions, 2);
            $net = round($gross + $vacation - $ded, 2);
            $driver = $group->first()->timesheet->driver;

            $agencySubtotal = self::agencyBillingSubtotalFromTrips($group);
            $taxParts = self::applyBillingTaxRules($agencySubtotal, $billingTaxRules);

            $drivers[] = [
                'driver_id' => (int) $driverId,
                'driver_name' => $driver->user?->name ?? "Driver #{$driverId}",
                'gross_pay' => $gross,
                'vacation_pay' => $vacation,
                'deductions' => $ded,
                'net_pay' => $net,
                'breakdown' => $breakdown,
                'trip_count' => $group->count(),
                'agency_billing_subtotal' => $agencySubtotal,
                'billing_tax_lines' => $taxParts['lines'],
                'billing_tax_from_percent' => $taxParts['sumFromPercent'],
                'billing_tax_fixed' => $taxParts['sumFixed'],
                'billing_tax_amount' => $taxParts['taxAmount'],
                'agency_billing_total' => $taxParts['agencyTotal'],
            ];
        }

        return [
            'period_start' => $startDate,
            'period_end' => $endDate,
            'vacation_percent' => $vacationPercent,
            'default_deductions' => $defaultDeductions,
            'billing_taxes' => array_map(fn ($r) => [
                'name' => $r['name'],
                'type' => $r['type'],
                'value' => $r['value'],
            ], $billingTaxRules),
            'drivers' => $drivers,
        ];
    }

    /**
     * Creates driver_calculations + payslips and links trips (snapshot; no dynamic recompute).
     *
     * @param  list<array{name: string, type: string, value: float}>  $billingTaxRules
     */
    public static function generate(
        ?string $tenantId,
        string $startDate,
        string $endDate,
        float $vacationPercent,
        float $defaultDeductions = 0,
        array $billingTaxRules = []
    ): array {
        return DB::transaction(function () use ($tenantId, $startDate, $endDate, $vacationPercent, $defaultDeductions, $billingTaxRules) {
            $grouped = self::tripsForPayroll($tenantId, $startDate, $endDate)
                ->lockForUpdate()
                ->orderBy('trip_date')
                ->get()
                ->groupBy(fn (TimesheetTrip $t) => $t->timesheet->driver_id);

            $created = [];

            foreach ($grouped as $driverId => $group) {
                $driverId = (int) $driverId;
                $gross = 0.0;
                $breakdown = [];

                foreach ($group as $trip) {
                    foreach (TimesheetTripLineService::payableLines($trip) as $row) {
                        $line = $row['line'];
                        $key = (string) ($line['line_type'] ?? 'other').':'.(string) ($line['label'] ?? '');
                        $amt = round((float) ($line['driver_amount'] ?? 0), 2);
                        $gross += $amt;
                        $breakdown[$key] = round(($breakdown[$key] ?? 0) + $amt, 2);
                    }
                }

                if ($gross <= 0) {
                    continue;
                }

                $vacation = round($gross * ($vacationPercent / 100), 2);
                $ded = round($defaultDeductions, 2);
                $net = round($gross + $vacation - $ded, 2);

                $agencySubtotal = self::agencyBillingSubtotalFromTrips($group);
                $taxParts = self::applyBillingTaxRules($agencySubtotal, $billingTaxRules);

                $resolvedTenant = $tenantId ?? $group->first()->timesheet->tenant_id;

                $existingPayslip = Payslip::query()
                    ->where('driver_id', $driverId)
                    ->whereDate('period_start', $startDate)
                    ->whereDate('period_end', $endDate)
                    ->where(function ($q) use ($resolvedTenant) {
                        if ($resolvedTenant !== null && $resolvedTenant !== '') {
                            $q->where('tenant_id', $resolvedTenant);
                        } else {
                            $q->whereNull('tenant_id');
                        }
                    })
                    ->first();
                if ($existingPayslip) {
                    abort(422, "A payslip already exists for driver #{$driverId} in this period.");
                }

                $calc = DriverCalculation::create([
                    'tenant_id' => $resolvedTenant,
                    'driver_id' => $driverId,
                    'period_start' => $startDate,
                    'period_end' => $endDate,
                    'gross_pay' => $gross,
                    'vacation_pay' => $vacation,
                    'deductions' => $ded,
                    'net_pay' => $net,
                    'agency_billing_subtotal' => $agencySubtotal,
                    'billing_tax_rate' => 0,
                    'billing_tax_from_percent' => $taxParts['sumFromPercent'],
                    'billing_tax_fixed' => $taxParts['sumFixed'],
                    'billing_tax_amount' => $taxParts['taxAmount'],
                    'agency_billing_total' => $taxParts['agencyTotal'],
                    'billing_tax_lines' => $taxParts['lines'],
                    'breakdown' => $breakdown,
                    'status' => 'finalized',
                ]);

                $payslip = Payslip::create([
                    'tenant_id' => $resolvedTenant,
                    'driver_calculation_id' => $calc->id,
                    'driver_id' => $driverId,
                    'period_start' => $startDate,
                    'period_end' => $endDate,
                    'total_pay' => $gross,
                    'vacation_pay' => $vacation,
                    'deductions' => $ded,
                    'net_pay' => $net,
                    'agency_billing_subtotal' => $agencySubtotal,
                    'billing_tax_rate' => 0,
                    'billing_tax_from_percent' => $taxParts['sumFromPercent'],
                    'billing_tax_fixed' => $taxParts['sumFixed'],
                    'billing_tax_amount' => $taxParts['taxAmount'],
                    'agency_billing_total' => $taxParts['agencyTotal'],
                    'billing_tax_lines' => $taxParts['lines'],
                    'breakdown' => $breakdown,
                    'status' => 'pending',
                ]);

                foreach ($group as $trip) {
                    $payable = TimesheetTripLineService::payableLines($trip);
                    if ($payable !== []) {
                        $trip->update(['payslip_id' => $payslip->id]);
                    }
                }

                $created[] = $payslip->load('driver.user', 'driverCalculation');
            }

            return $created;
        });
    }

    public static function recordRemittance(Payslip $payslip, float $amountPaid, string $paymentDate, ?string $reference): Remittance
    {
        if ($amountPaid <= 0) {
            abort(422, 'Amount paid must be positive.');
        }

        return DB::transaction(function () use ($payslip, $amountPaid, $paymentDate, $reference) {
            $payslip->lockForUpdate();

            $remittance = Remittance::create([
                'payslip_id' => $payslip->id,
                'driver_id' => $payslip->driver_id,
                'amount_paid' => $amountPaid,
                'payment_date' => $paymentDate,
                'reference' => $reference,
            ]);

            $totalPaid = round((float) $payslip->remittances()->sum('amount_paid'), 2);
            $net = (float) $payslip->net_pay;

            if ($totalPaid >= $net - 0.0001) {
                $payslip->update(['status' => 'paid']);
            }

            return $remittance;
        });
    }

    /**
     * Deletes the payslip snapshot and linked driver calculation. Remittances are removed
     * (cascade). Timesheet trips with this payslip_id are unlinked so payroll can be regenerated.
     */
    public static function deletePayslip(Payslip $payslip): void
    {
        DB::transaction(function () use ($payslip) {
            $payslip->lockForUpdate();
            $calc = $payslip->driverCalculation;
            if ($calc !== null) {
                $calc->delete();

                return;
            }
            $payslip->delete();
        });
    }
}
