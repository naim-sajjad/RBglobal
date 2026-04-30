<?php

namespace App\Services\Financial;

use App\Models\TimesheetTrip;

/**
 * Reads rate_snapshot.lines with is_payable / is_billable semantics for payroll vs client billing.
 */
class TimesheetTripLineService
{
    /**
     * @return list<array{line_index:int,line:array}>
     */
    public static function allLines(TimesheetTrip $trip): array
    {
        $snapshot = $trip->rate_snapshot;
        if (! is_array($snapshot) || empty($snapshot['lines']) || ! is_array($snapshot['lines'])) {
            return [];
        }
        $out = [];
        foreach ($snapshot['lines'] as $idx => $line) {
            if (! is_array($line)) {
                continue;
            }
            $out[] = ['line_index' => (int) $idx, 'line' => self::normalizeLine($line, (int) $idx)];
        }

        return $out;
    }

    public static function normalizeLine(array $line, int $index): array
    {
        $driverAmount = (float) ($line['driver_amount'] ?? 0);
        $agencyAmount = (float) ($line['agency_amount'] ?? 0);
        $lineType = (string) ($line['line_type'] ?? '');

        $payable = array_key_exists('is_payable', $line)
            ? (bool) $line['is_payable']
            : ($driverAmount != 0.0 || $lineType === 'minimum_adjustment');

        $billable = array_key_exists('is_billable', $line)
            ? (bool) $line['is_billable']
            : ($agencyAmount != 0.0);

        return array_merge($line, [
            'is_payable' => $payable,
            'is_billable' => $billable,
            '_line_index' => $index,
        ]);
    }

    /**
     * @return list<array{line_index:int,line:array}>
     */
    public static function billableLines(TimesheetTrip $trip): array
    {
        return array_values(array_filter(self::allLines($trip), function (array $row) {
            return ! empty($row['line']['is_billable']) && (float) ($row['line']['agency_amount'] ?? 0) != 0.0;
        }));
    }

    /**
     * @return list<array{line_index:int,line:array}>
     */
    public static function payableLines(TimesheetTrip $trip): array
    {
        return array_values(array_filter(self::allLines($trip), function (array $row) {
            return ! empty($row['line']['is_payable']) && (float) ($row['line']['driver_amount'] ?? 0) != 0.0;
        }));
    }
}
