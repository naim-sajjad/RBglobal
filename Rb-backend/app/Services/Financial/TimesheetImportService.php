<?php

namespace App\Services\Financial;

use App\Models\Driver;
use App\Models\Employer;
use App\Models\Timesheet;
use App\Models\TimesheetTrip;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class TimesheetImportService
{
    /** @var array<string, list<string>> */
    private const HEADER_ALIASES = [
        'driver_number' => ['driver no', 'driver no.', 'driver number', 'driver #', 'driver id'],
        'driver_name' => ['driver name', 'name'],
        'customer' => ['customer', 'employer', 'client'],
        'trip_number' => ['trip #', 'trip#', 'trip number', 'trip no', 'trip no.'],
        'trip_date' => ['trip date', 'date'],
        'pay_item' => ['pay item', 'payitem', 'item', 'description'],
        'quantity' => ['qty', 'quantity'],
        'rate' => ['rate'],
        'pay' => ['pay', 'amount', 'driver pay'],
    ];

    /**
     * @return array{timesheets: list<array{id:int,driver_id:int,week_start_date:string}>, trips_created: int, lines_imported: int, warnings: list<string>}
     *
     * @throws \InvalidArgumentException
     */
    public static function import(UploadedFile $file, ?string $tenantId, ?int $userId = null): array
    {
        $rows = self::readRows($file);
        if ($rows === []) {
            throw new \InvalidArgumentException('The file has no data rows.');
        }

        $headerMap = self::mapHeaders($rows[0]);
        $missing = [];
        foreach (['driver_number', 'customer', 'trip_number', 'trip_date', 'pay_item', 'quantity', 'rate'] as $req) {
            if (! isset($headerMap[$req])) {
                $missing[] = $req;
            }
        }
        if ($missing !== []) {
            throw new \InvalidArgumentException(
                'Missing required columns: '.implode(', ', $missing).'. Expected headers such as Driver No, Customer, Trip #, Trip Date, Pay Item, Qty, Rate.'
            );
        }

        $errors = [];
        /** @var list<array{row:int,driver_number:string,driver_name:?string,customer:string,trip_number:string,trip_date:string,pay_item:string,quantity:float,rate:float,pay:float}> $parsed */
        $parsed = [];

        for ($i = 1; $i < count($rows); $i++) {
            $raw = $rows[$i];
            $excelRow = $i + 1;
            if (self::rowIsEmpty($raw)) {
                continue;
            }

            $driverNumber = trim((string) self::cell($raw, $headerMap['driver_number']));
            $driverName = isset($headerMap['driver_name'])
                ? trim((string) self::cell($raw, $headerMap['driver_name']))
                : null;
            $customer = trim((string) self::cell($raw, $headerMap['customer']));
            $tripNumber = trim((string) self::cell($raw, $headerMap['trip_number']));
            $tripDateRaw = trim((string) self::cell($raw, $headerMap['trip_date']));
            $payItem = trim((string) self::cell($raw, $headerMap['pay_item']));
            $qtyRaw = self::cell($raw, $headerMap['quantity']);
            $rateRaw = self::cell($raw, $headerMap['rate']);
            $payRaw = isset($headerMap['pay']) ? self::cell($raw, $headerMap['pay']) : null;

            if ($driverNumber === '') {
                $errors[] = "Row {$excelRow}: Driver No is required.";
            }
            if ($customer === '') {
                $errors[] = "Row {$excelRow}: Customer is required.";
            }
            if ($tripNumber === '') {
                $errors[] = "Row {$excelRow}: Trip # is required.";
            }
            if ($payItem === '') {
                $errors[] = "Row {$excelRow}: Pay Item is required.";
            }

            $tripDate = self::parseDate($tripDateRaw);
            if ($tripDate === null) {
                $errors[] = "Row {$excelRow}: Invalid trip date \"{$tripDateRaw}\".";
            }

            $qty = self::parseNumber($qtyRaw);
            if ($qty === null) {
                $errors[] = "Row {$excelRow}: Qty must be numeric.";
            }
            $rate = self::parseNumber($rateRaw);
            if ($rate === null) {
                $errors[] = "Row {$excelRow}: Rate must be numeric.";
            }

            $computedPay = ($qty !== null && $rate !== null)
                ? round($qty * $rate, 2)
                : null;
            $excelPay = $payRaw !== null && trim((string) $payRaw) !== '' && trim((string) $payRaw) !== '-'
                ? self::parseNumber($payRaw)
                : $computedPay;

            if ($excelPay === null && $computedPay !== null) {
                $excelPay = $computedPay;
            }

            if ($driverNumber === '' || $customer === '' || $tripNumber === '' || $payItem === '' || $tripDate === null || $qty === null || $rate === null) {
                continue;
            }

            $parsed[] = [
                'row' => $excelRow,
                'driver_number' => $driverNumber,
                'driver_name' => $driverName !== '' ? $driverName : null,
                'customer' => $customer,
                'trip_number' => $tripNumber,
                'trip_date' => $tripDate,
                'pay_item' => $payItem,
                'quantity' => $qty,
                'rate' => $rate,
                'pay' => $excelPay ?? $computedPay ?? 0.0,
                'computed_pay' => $computedPay ?? 0.0,
            ];
        }

        if ($errors !== []) {
            throw new \InvalidArgumentException(implode("\n", array_slice($errors, 0, 40)));
        }
        if ($parsed === []) {
            throw new \InvalidArgumentException('No valid data rows found after the header.');
        }

        $warnings = [];
        foreach ($parsed as $p) {
            if (abs($p['pay'] - $p['computed_pay']) > 0.02) {
                $warnings[] = "Row {$p['row']}: Pay {$p['pay']} differs from Qty×Rate {$p['computed_pay']}; using Qty×Rate.";
            }
        }

        return DB::transaction(function () use ($parsed, $tenantId, $warnings) {
            $driverCache = [];
            $employerCache = [];
            $groups = [];

            foreach ($parsed as $p) {
                $driverKey = strtolower($p['driver_number']);
                if (! isset($driverCache[$driverKey])) {
                    $driver = self::resolveDriver($p['driver_number'], $tenantId);
                    if (! $driver) {
                        throw new \InvalidArgumentException(
                            "Row {$p['row']}: Driver \"{$p['driver_number']}\" not found (match license number or driver id)."
                        );
                    }
                    $driverCache[$driverKey] = $driver;
                }
                $driver = $driverCache[$driverKey];

                $empKey = strtolower($p['customer']);
                if (! isset($employerCache[$empKey])) {
                    $employer = self::resolveEmployer($p['customer'], $tenantId);
                    if (! $employer) {
                        throw new \InvalidArgumentException(
                            "Row {$p['row']}: Customer \"{$p['customer']}\" not found."
                        );
                    }
                    $employerCache[$empKey] = $employer;
                }
                $employer = $employerCache[$empKey];

                $weekStart = Carbon::parse($p['trip_date'])->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
                $weekEnd = Carbon::parse($p['trip_date'])->endOfWeek(Carbon::SUNDAY)->format('Y-m-d');
                $groupKey = $driver->id.'|'.$employer->id.'|'.$weekStart.'|'.$p['trip_number'].'|'.$p['trip_date'];

                if (! isset($groups[$groupKey])) {
                    $groups[$groupKey] = [
                        'driver' => $driver,
                        'employer' => $employer,
                        'week_start' => $weekStart,
                        'week_end' => $weekEnd,
                        'trip_number' => $p['trip_number'],
                        'trip_date' => $p['trip_date'],
                        'lines' => [],
                    ];
                }

                $pay = round((float) $p['computed_pay'], 2);
                $groups[$groupKey]['lines'][] = [
                    'line_type' => 'imported',
                    'label' => $p['pay_item'],
                    'quantity' => round((float) $p['quantity'], 2),
                    'unit' => '',
                    'rate' => round((float) $p['rate'], 4),
                    'agency_rate' => round((float) $p['rate'], 4),
                    'driver_amount' => $pay,
                    'agency_amount' => $pay,
                    'is_payable' => true,
                    'is_billable' => $pay != 0.0,
                ];
            }

            $timesheetIds = [];
            $tripsCreated = 0;
            $linesImported = 0;
            $timesheetCache = [];

            foreach ($groups as $g) {
                /** @var Driver $driver */
                $driver = $g['driver'];
                /** @var Employer $employer */
                $employer = $g['employer'];
                $tsKey = $driver->id.'|'.$employer->id.'|'.$g['week_start'];

                if (! isset($timesheetCache[$tsKey])) {
                    $timesheet = Timesheet::query()
                        ->where('driver_id', $driver->id)
                        ->where('week_start_date', $g['week_start'])
                        ->where(function ($q) use ($employer) {
                            $q->where('employer_id', $employer->id)
                                ->orWhereNull('employer_id');
                        })
                        ->first();

                    if (! $timesheet) {
                        $timesheet = Timesheet::create([
                            'driver_id' => $driver->id,
                            'employer_id' => $employer->id,
                            'tenant_id' => $tenantId,
                            'week_start_date' => $g['week_start'],
                            'week_end_date' => $g['week_end'],
                            'status' => 'draft',
                            'weekly_total' => 0,
                        ]);
                    } elseif ($timesheet->employer_id === null) {
                        $timesheet->update(['employer_id' => $employer->id]);
                    }

                    $timesheetCache[$tsKey] = $timesheet;
                }

                $timesheet = $timesheetCache[$tsKey];
                $lines = $g['lines'];
                $totalDriver = round(array_sum(array_map(fn ($l) => (float) $l['driver_amount'], $lines)), 2);
                $snapshot = [
                    'rate_card_id' => null,
                    'driver_class_code' => null,
                    'lines' => $lines,
                    'total_driver_pay' => $totalDriver,
                    'total_agency_billing' => $totalDriver,
                ];

                $trip = TimesheetTrip::query()
                    ->where('timesheet_id', $timesheet->id)
                    ->where('trip_number', $g['trip_number'])
                    ->whereDate('trip_date', $g['trip_date'])
                    ->first();

                if ($trip) {
                    $trip->update([
                        'employer_id' => $employer->id,
                        'is_adjusted' => true,
                        'adjusted_at' => now(),
                        'adjusted_reason' => 'Imported from customer timesheet',
                        'manual_rate_snapshot' => $snapshot,
                        'rate_snapshot' => $snapshot,
                        'trip_total' => $totalDriver,
                        'total_agency_billing' => $totalDriver,
                        'distance' => $trip->distance ?? 0,
                    ]);
                } else {
                    TimesheetTrip::create([
                        'timesheet_id' => $timesheet->id,
                        'employer_id' => $employer->id,
                        'trip_date' => $g['trip_date'],
                        'trip_number' => $g['trip_number'],
                        'distance' => 0,
                        'notes' => null,
                        'is_adjusted' => true,
                        'adjusted_at' => now(),
                        'adjusted_reason' => 'Imported from customer timesheet',
                        'manual_rate_snapshot' => $snapshot,
                        'rate_snapshot' => $snapshot,
                        'trip_total' => $totalDriver,
                        'total_agency_billing' => $totalDriver,
                        'minimum_applied' => false,
                    ]);
                    $tripsCreated++;
                }

                $linesImported += count($lines);
                $timesheetIds[$timesheet->id] = $timesheet;
            }

            $outTimesheets = [];
            foreach ($timesheetIds as $timesheet) {
                $weekly = 0.0;
                $timesheet->load('trips');
                foreach ($timesheet->trips as $trip) {
                    $snap = (! empty($trip->is_adjusted) && is_array($trip->manual_rate_snapshot))
                        ? $trip->manual_rate_snapshot
                        : $trip->rate_snapshot;
                    $tripLines = is_array($snap['lines'] ?? null) ? $snap['lines'] : [];
                    foreach ($tripLines as $line) {
                        $amt = round((float) ($line['driver_amount'] ?? 0), 2);
                        if ($amt != 0.0) {
                            $weekly += $amt;
                        }
                    }
                }
                $timesheet->update(['weekly_total' => round($weekly, 2)]);
                $outTimesheets[] = [
                    'id' => (int) $timesheet->id,
                    'driver_id' => (int) $timesheet->driver_id,
                    'week_start_date' => Carbon::parse($timesheet->week_start_date)->format('Y-m-d'),
                ];
            }

            return [
                'timesheets' => $outTimesheets,
                'trips_created' => $tripsCreated,
                'lines_imported' => $linesImported,
                'warnings' => $warnings,
            ];
        });
    }

    private static function resolveDriver(string $driverNumber, ?string $tenantId): ?Driver
    {
        $q = Driver::query();
        if ($tenantId) {
            $q->where('tenant_id', $tenantId);
        }
        $byLicense = (clone $q)->where('license_number', $driverNumber)->first();
        if ($byLicense) {
            return $byLicense;
        }
        if (ctype_digit($driverNumber)) {
            return (clone $q)->where('id', (int) $driverNumber)->first();
        }

        return null;
    }

    private static function resolveEmployer(string $name, ?string $tenantId): ?Employer
    {
        $q = Employer::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
        if ($tenantId) {
            $q->where('tenant_id', $tenantId);
        }

        return $q->first();
    }

    /**
     * @return list<list<string>>
     */
    private static function readRows(UploadedFile $file): array
    {
        $ext = strtolower($file->getClientOriginalExtension() ?: '');
        $path = $file->getRealPath();
        if (! $path) {
            throw new \InvalidArgumentException('Could not read uploaded file.');
        }

        if (in_array($ext, ['xlsx', 'xlsm'], true) || str_contains((string) $file->getMimeType(), 'spreadsheet')) {
            return self::readXlsx($path);
        }

        return self::readCsv($path);
    }

    /**
     * @return list<list<string>>
     */
    private static function readCsv(string $path): array
    {
        $handle = fopen($path, 'rb');
        if (! $handle) {
            throw new \InvalidArgumentException('Could not open CSV file.');
        }
        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            $rows[] = array_map(fn ($v) => is_string($v) ? $v : (string) $v, $data);
        }
        fclose($handle);

        return $rows;
    }

    /**
     * Minimal XLSX reader (first sheet) without PhpSpreadsheet.
     *
     * @return list<list<string>>
     */
    private static function readXlsx(string $path): array
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw new \InvalidArgumentException('Could not open Excel file. Try exporting as CSV.');
        }

        $shared = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $sx = @simplexml_load_string($sharedXml);
            if ($sx) {
                foreach ($sx->si as $si) {
                    if (isset($si->t)) {
                        $shared[] = (string) $si->t;
                    } else {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) ($r->t ?? '');
                        }
                        $shared[] = $text;
                    }
                }
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();
        if ($sheetXml === false) {
            throw new \InvalidArgumentException('Excel sheet not found. Try exporting as CSV.');
        }

        $sheet = @simplexml_load_string($sheetXml);
        if (! $sheet) {
            throw new \InvalidArgumentException('Could not parse Excel sheet.');
        }

        $rows = [];
        foreach ($sheet->sheetData->row as $row) {
            $cells = [];
            $maxCol = -1;
            foreach ($row->c as $c) {
                $ref = (string) ($c['r'] ?? '');
                $col = self::columnIndexFromRef($ref);
                if ($col > $maxCol) {
                    $maxCol = $col;
                }
                $type = (string) ($c['t'] ?? '');
                $value = '';
                if ($type === 's') {
                    $idx = (int) ($c->v ?? 0);
                    $value = $shared[$idx] ?? '';
                } elseif ($type === 'inlineStr') {
                    $value = (string) ($c->is->t ?? '');
                } else {
                    $value = (string) ($c->v ?? '');
                }
                $cells[$col] = $value;
            }
            $line = [];
            for ($i = 0; $i <= $maxCol; $i++) {
                $line[] = $cells[$i] ?? '';
            }
            $rows[] = $line;
        }

        return $rows;
    }

    private static function columnIndexFromRef(string $ref): int
    {
        if (! preg_match('/^([A-Z]+)/i', $ref, $m)) {
            return 0;
        }
        $letters = strtoupper($m[1]);
        $n = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $n = $n * 26 + (ord($letters[$i]) - 64);
        }

        return max(0, $n - 1);
    }

    /**
     * @param  list<string>  $headerRow
     * @return array<string, int>
     */
    private static function mapHeaders(array $headerRow): array
    {
        $map = [];
        foreach ($headerRow as $idx => $label) {
            $norm = self::normalizeHeader((string) $label);
            if ($norm === '') {
                continue;
            }
            foreach (self::HEADER_ALIASES as $field => $aliases) {
                if (in_array($norm, $aliases, true) && ! isset($map[$field])) {
                    $map[$field] = (int) $idx;
                }
            }
        }

        return $map;
    }

    private static function normalizeHeader(string $label): string
    {
        $label = strtolower(trim($label));
        $label = preg_replace('/\s+/', ' ', $label) ?? $label;

        return $label;
    }

    /**
     * @param  list<string>  $row
     */
    private static function cell(array $row, int $idx): mixed
    {
        return $row[$idx] ?? '';
    }

    /**
     * @param  list<string>  $row
     */
    private static function rowIsEmpty(array $row): bool
    {
        foreach ($row as $v) {
            if (trim((string) $v) !== '') {
                return false;
            }
        }

        return true;
    }

    private static function parseNumber(mixed $raw): ?float
    {
        if ($raw === null) {
            return null;
        }
        $s = trim((string) $raw);
        if ($s === '' || $s === '-') {
            return 0.0;
        }
        $s = str_replace([',', '$', ' '], '', $s);
        if (! is_numeric($s)) {
            return null;
        }

        return (float) $s;
    }

    private static function parseDate(string $raw): ?string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }
        // Excel serial date
        if (is_numeric($raw) && (float) $raw > 20000 && (float) $raw < 80000) {
            try {
                $base = Carbon::create(1899, 12, 30);

                return $base->copy()->addDays((int) $raw)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        $formats = ['n-j-Y', 'm-d-Y', 'n/j/Y', 'm/d/Y', 'Y-m-d', 'Y/m/d', 'd-m-Y', 'd/m/Y', 'M j, Y'];
        foreach ($formats as $fmt) {
            try {
                $d = Carbon::createFromFormat($fmt, $raw);

                return $d->format('Y-m-d');
            } catch (\Throwable) {
                // try next
            }
        }
        try {
            return Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
