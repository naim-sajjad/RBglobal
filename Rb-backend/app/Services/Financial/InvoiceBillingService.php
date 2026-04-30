<?php

namespace App\Services\Financial;

use App\Models\Employer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoicePayment;
use App\Models\TimesheetTrip;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class InvoiceBillingService
{
    public static function tripsQuery(
        ?string $tenantId,
        int $employerId,
        string $startDate,
        string $endDate,
        ?int $driverId = null
    ): Builder {
        return TimesheetTrip::query()
            ->where('employer_id', $employerId)
            ->whereNull('invoice_id')
            ->whereDate('trip_date', '>=', $startDate)
            ->whereDate('trip_date', '<=', $endDate)
            ->whereHas('timesheet', function ($q) use ($tenantId, $driverId) {
                $q->where('status', 'approved');
                if ($tenantId) {
                    $q->where('tenant_id', $tenantId);
                }
                if ($driverId !== null) {
                    $q->where('driver_id', $driverId);
                }
            })
            ->with(['timesheet.driver.user']);
    }

    public static function preview(
        ?string $tenantId,
        int $employerId,
        string $startDate,
        string $endDate,
        ?int $driverId = null
    ): array {
        $trips = self::tripsQuery($tenantId, $employerId, $startDate, $endDate, $driverId)
            ->orderBy('trip_date')
            ->orderBy('id')
            ->get();

        $drivers = [];
        $grandTotal = 0.0;

        foreach ($trips as $trip) {
            $driver = $trip->timesheet?->driver;
            if (! $driver) {
                continue;
            }
            $driverId = $driver->id;
            if (! isset($drivers[$driverId])) {
                $drivers[$driverId] = [
                    'driver_id' => $driverId,
                    'driver_name' => $driver->user?->name ?? "Driver #{$driverId}",
                    'total_billing' => 0.0,
                    'quantities_by_unit' => [],
                    'trip_count' => 0,
                ];
            }

            $lines = TimesheetTripLineService::billableLines($trip);
            if ($lines === []) {
                continue;
            }
            $drivers[$driverId]['trip_count']++;

            foreach ($lines as $row) {
                $line = $row['line'];
                $amt = round((float) ($line['agency_amount'] ?? 0), 2);
                $grandTotal += $amt;
                $drivers[$driverId]['total_billing'] += $amt;
                $unit = (string) ($line['unit'] ?? 'unit');
                $qty = (float) ($line['quantity'] ?? 0);
                $drivers[$driverId]['quantities_by_unit'][$unit] = round(
                    ($drivers[$driverId]['quantities_by_unit'][$unit] ?? 0) + $qty,
                    4
                );
            }
        }

        foreach ($drivers as &$d) {
            $d['total_billing'] = round($d['total_billing'], 2);
        }
        unset($d);

        return [
            'employer_id' => $employerId,
            'driver_id' => $driverId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'trip_count' => $trips->count(),
            'billable_trip_count' => count(array_filter($drivers, fn ($x) => $x['trip_count'] > 0)),
            'subtotal' => round($grandTotal, 2),
            'drivers' => array_values(array_filter($drivers, fn ($x) => $x['trip_count'] > 0)),
        ];
    }

    public static function create(
        ?string $tenantId,
        int $employerId,
        string $startDate,
        string $endDate,
        float $taxRate,
        ?string $notes = null,
        ?int $driverId = null
    ): Invoice {
        return DB::transaction(function () use ($tenantId, $employerId, $startDate, $endDate, $taxRate, $notes, $driverId) {
            $employer = Employer::query()->findOrFail($employerId);
            $resolvedTenant = $tenantId ?? $employer->tenant_id;

            $trips = self::tripsQuery($tenantId, $employerId, $startDate, $endDate, $driverId)
                ->lockForUpdate()
                ->orderBy('trip_date')
                ->orderBy('id')
                ->get();

            if ($trips->isEmpty()) {
                abort(422, 'No uninvoiced trips found for this employer and date range.');
            }

            $invoice = Invoice::create([
                'tenant_id' => $resolvedTenant,
                'employer_id' => $employerId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'draft',
                'subtotal' => 0,
                'tax_rate' => $taxRate,
                'tax_amount' => 0,
                'total' => 0,
                'invoice_number' => null,
                'notes' => $notes,
            ]);

            $subtotal = 0.0;
            $tripsTouched = [];

            foreach ($trips as $trip) {
                foreach (TimesheetTripLineService::billableLines($trip) as $row) {
                    $line = $row['line'];
                    $idx = $row['line_index'];
                    $amount = round((float) ($line['agency_amount'] ?? 0), 2);
                    $qty = (float) ($line['quantity'] ?? 0);
                    $rate = (float) ($line['agency_rate'] ?? 0);
                    if ($qty > 0 && $rate == 0.0 && $amount != 0.0) {
                        $rate = round($amount / $qty, 4);
                    }

                    $subtotal += $amount;

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'timesheet_trip_id' => $trip->id,
                        'driver_id' => $trip->timesheet->driver_id,
                        'trip_date' => $trip->trip_date,
                        'pay_item_type' => (string) ($line['label'] ?? $line['line_type'] ?? 'Line'),
                        'line_type' => (string) ($line['line_type'] ?? ''),
                        'quantity' => $qty,
                        'unit' => isset($line['unit']) ? (string) $line['unit'] : null,
                        'rate' => $rate,
                        'amount' => $amount,
                        'line_index' => $idx,
                    ]);

                    $tripsTouched[$trip->id] = $trip;
                }
            }

            if ($subtotal <= 0) {
                $invoice->items()->delete();
                $invoice->delete();
                abort(422, 'No billable lines (client billing amounts) found for the selected trips.');
            }

            $taxAmount = round($subtotal * $taxRate, 2);
            $total = round($subtotal + $taxAmount, 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);

            foreach (array_values($tripsTouched) as $trip) {
                $trip->update(['invoice_id' => $invoice->id]);
            }

            return $invoice->load(['items', 'employer']);
        });
    }

    public static function recordPayment(Invoice $invoice, float $amount, string $paymentDate, ?string $reference): InvoicePayment
    {
        if ($amount <= 0) {
            abort(422, 'Payment amount must be positive.');
        }

        return DB::transaction(function () use ($invoice, $amount, $paymentDate, $reference) {
            $invoice->lockForUpdate();
            $payment = InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'amount' => $amount,
                'payment_date' => $paymentDate,
                'reference' => $reference,
            ]);

            $paid = round((float) $invoice->payments()->sum('amount'), 2);
            $total = (float) $invoice->total;

            if ($paid >= $total - 0.0001) {
                $invoice->update(['status' => 'paid']);
            } elseif ($paid > 0) {
                $invoice->update(['status' => 'partially_paid']);
            }

            return $payment;
        });
    }

    public static function syncInvoiceStatusFromPayments(Invoice $invoice): void
    {
        $paid = round((float) $invoice->payments()->sum('amount'), 2);
        $total = (float) $invoice->total;
        if ($invoice->status === 'draft' || $invoice->status === 'sent') {
            if ($paid >= $total - 0.0001 && $total > 0) {
                $invoice->update(['status' => 'paid']);
            } elseif ($paid > 0) {
                $invoice->update(['status' => 'partially_paid']);
            }
        }
    }
}
