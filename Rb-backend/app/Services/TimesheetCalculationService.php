<?php

namespace App\Services;

use App\Models\Timesheet;
use App\Models\TimesheetTrip;

/**
 * Contract-driven pricing: all rates come from Employer Rate Cards.
 * Trip totals and breakdown are resolved by RateCardResolutionService and stored in rate_snapshot.
 */
class TimesheetCalculationService
{
    /**
     * Recalculate trip totals from the employer's rate card (driver class, distance, stops, delay, etc.).
     * Persists rate_snapshot, trip_total, total_agency_billing, minimum_applied.
     */
    public static function recalculateTrip(TimesheetTrip $trip): void
    {
        RateCardResolutionService::resolveTrip($trip);
    }

    /**
     * Recalculate timesheet weekly totals from all trips.
     */
    public static function recalculateTimesheet(Timesheet $timesheet): void
    {
        $timesheet->weekly_total = $timesheet->trips()->sum('trip_total');
        $timesheet->save();
    }

    /**
     * Recalculate full chain: trip -> timesheet.
     */
    public static function recalculateFromTrip(TimesheetTrip $trip): void
    {
        self::recalculateTrip($trip);
        self::recalculateTimesheet($trip->timesheet);
    }
}
