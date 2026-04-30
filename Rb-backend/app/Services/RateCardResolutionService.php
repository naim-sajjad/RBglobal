<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\RateCard;
use App\Models\TimesheetTrip;
use Carbon\Carbon;

class RateCardResolutionService
{
    /**
     * Get the rate card active for an employer on a given date.
     * Uses the card whose effective_from <= date <= effective_to (status can be active or we use the covering range).
     */
    public static function getActiveRateCardForDate(int $employerId, Carbon $date): ?RateCard
    {
        $date = $date->copy()->startOfDay();
        return RateCard::where('employer_id', $employerId)
            ->where('effective_from', '<=', $date)
            ->where('effective_to', '>=', $date)
            ->whereIn('status', ['active', 'scheduled'])
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    /**
     * Resolve rates from the employer's rate card for the trip date and driver class,
     * compute all line items and totals, and persist to the trip (rate_snapshot, trip_total, total_agency_billing, minimum_applied).
     */
    public static function resolveTrip(TimesheetTrip $trip): void
    {
        // If admin manually adjusted this trip, keep the manual snapshot unless recalculation is forced elsewhere.
        if (! empty($trip->is_adjusted) && is_array($trip->manual_rate_snapshot) && $trip->manual_rate_snapshot !== []) {
            $snap = $trip->manual_rate_snapshot;
            $tripTotal = (float) ($snap['total_driver_pay'] ?? 0);
            $agencyTotal = (float) ($snap['total_agency_billing'] ?? 0);
            $trip->update([
                'rate_snapshot' => $snap,
                'trip_total' => round($tripTotal, 2),
                'total_agency_billing' => round($agencyTotal, 2),
                'minimum_applied' => (bool) ($snap['minimum_applied'] ?? false),
            ]);
            return;
        }

        $trip->load(['timesheet.driver.driverClass', 'employer']);
        $driver = $trip->timesheet->driver;
        if (! $driver) {
            return;
        }

        $driverClassCode = $driver->driverClass?->code ?? null;
        $rateCard = self::getActiveRateCardForDate($trip->employer_id, Carbon::parse($trip->trip_date));
        if (! $rateCard || ! $rateCard->rates) {
            $trip->update([
                'rate_snapshot' => ['error' => 'No active rate card for this employer on trip date'],
                'trip_total' => 0,
                'total_agency_billing' => 0,
                'minimum_applied' => false,
            ]);
            return;
        }

        $rates = $rateCard->rates;
        $distance = (float) ($trip->distance ?? 0);
        $additionalQuantities = is_array($trip->additional_quantities) ? $trip->additional_quantities : [];

        $lines = [];
        $totalDriverPay = 0.0;
        $totalAgencyBilling = 0.0;

        // Distance pay
        $distanceBands = $rates['distance_bands'] ?? [];
        $driverDistanceRate = 0.0;
        $agencyDistanceRate = 0.0;
        foreach ($distanceBands as $band) {
            $from = (float) ($band['distance_from'] ?? 0);
            $to = isset($band['distance_to']) ? (float) $band['distance_to'] : null;
            if ($distance >= $from && ($to === null || $distance < $to)) {
                $agencyDistanceRate = (float) ($band['agency_rate'] ?? 0);
                $driverDistanceRate = (float) ($band['driver_rate'] ?? 0);
                if (! empty($band['driver_rates_by_class']) && $driverClassCode !== null && isset($band['driver_rates_by_class'][$driverClassCode])) {
                    $driverDistanceRate = (float) $band['driver_rates_by_class'][$driverClassCode];
                }
                break;
            }
        }
        $driverDistancePay = round($distance * $driverDistanceRate, 2);
        $agencyDistancePay = round($distance * $agencyDistanceRate, 2);
        $lines[] = [
            'line_type' => 'distance',
            'label' => 'Distance Pay',
            'quantity' => $distance,
            'unit' => $rates['measurement_unit'] ?? 'km',
            'rate' => $driverDistanceRate,
            'agency_rate' => $agencyDistanceRate,
            'driver_amount' => $driverDistancePay,
            'agency_amount' => $agencyDistancePay,
            'is_payable' => $driverDistancePay != 0.0,
            'is_billable' => $agencyDistancePay != 0.0,
        ];
        $totalDriverPay += $driverDistancePay;
        $totalAgencyBilling += $agencyDistancePay;

        // Additional charges (stops, delay, handbomb, etc.)
        $additionalCharges = $rates['additional_charges'] ?? [];
        foreach ($additionalCharges as $charge) {
            if (empty($charge['active'])) {
                continue;
            }
            $unit = $charge['unit'] ?? '';
            $chargeType = $charge['charge_type'] ?? 'Other';
            $quantity = 0.0;
            // Use explicit key when present; otherwise fall back to charge_type so it matches frontend mapping.
            $key = $charge['key'] ?? ($chargeType ?? null);

            // Per-charge quantity must come from additional_quantities (contract-driven).
            if ($key !== null && array_key_exists($key, $additionalQuantities)) {
                $quantity = (float) ($additionalQuantities[$key] ?? 0);
            }
            if ($quantity <= 0) {
                continue;
            }
            $agencyRate = (float) ($charge['agency_rate'] ?? 0);
            $driverRate = (float) ($charge['driver_rate'] ?? 0);
            if (! empty($charge['driver_rates_by_class']) && $driverClassCode !== null && isset($charge['driver_rates_by_class'][$driverClassCode])) {
                $driverRate = (float) $charge['driver_rates_by_class'][$driverClassCode];
            }
            $driverAmount = round($quantity * $driverRate, 2);
            $agencyAmount = round($quantity * $agencyRate, 2);
            $lines[] = [
                'line_type' => 'additional',
                'label' => $chargeType,
                'quantity' => $quantity,
                'unit' => $unit,
                'rate' => $driverRate,
                'agency_rate' => $agencyRate,
                'driver_amount' => $driverAmount,
                'agency_amount' => $agencyAmount,
                'is_payable' => $driverAmount != 0.0,
                'is_billable' => $agencyAmount != 0.0,
            ];
            $totalDriverPay += $driverAmount;
            $totalAgencyBilling += $agencyAmount;
        }

        // Minimum trip guarantee
        $minimumDriver = null;
        if (isset($rates['minimum_trip_pay_driver'])) {
            $minimumDriver = (float) $rates['minimum_trip_pay_driver'];
        }
        if (! empty($rates['minimum_trip_pay_driver_by_class']) && $driverClassCode !== null && isset($rates['minimum_trip_pay_driver_by_class'][$driverClassCode])) {
            $minimumDriver = (float) $rates['minimum_trip_pay_driver_by_class'][$driverClassCode];
        }
        $minimumApplied = false;
        if ($minimumDriver !== null && $totalDriverPay < $minimumDriver) {
            $minimumAdjustment = round($minimumDriver - $totalDriverPay, 2);
            $lines[] = [
                'line_type' => 'minimum_adjustment',
                'label' => 'Minimum Trip Guarantee',
                'quantity' => 1,
                'unit' => 'flat',
                'rate' => $minimumAdjustment,
                'agency_rate' => 0,
                'driver_amount' => $minimumAdjustment,
                'agency_amount' => 0,
                'is_payable' => true,
                'is_billable' => false,
            ];
            $totalDriverPay = $minimumDriver;
            $minimumApplied = true;
        }

        $trip->update([
            'rate_snapshot' => [
                'rate_card_id' => $rateCard->id,
                'driver_class_code' => $driverClassCode,
                'lines' => $lines,
                'total_driver_pay' => round($totalDriverPay, 2),
                'total_agency_billing' => round($totalAgencyBilling, 2),
            ],
            'trip_total' => round($totalDriverPay, 2),
            'total_agency_billing' => round($totalAgencyBilling, 2),
            'minimum_applied' => $minimumApplied,
        ]);
    }

    /**
     * Get driver rate for a charge (agency or driver) using driver_rates_by_class when present.
     */
    private static function getDriverRate(array $charge, string $driverClassCode = null): float
    {
        if ($driverClassCode !== null && ! empty($charge['driver_rates_by_class'][$driverClassCode])) {
            return (float) $charge['driver_rates_by_class'][$driverClassCode];
        }
        return (float) ($charge['driver_rate'] ?? 0);
    }
}
