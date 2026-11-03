<?php

namespace App\Services\Financial;

use App\Models\Driver;
use App\Models\Employer;
use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use App\Models\TimesheetTrip;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;

class TimesheetImportService
{
    /** @var array<string, list<string>> */
    private const HEADER_ALIASES = [
        'driver_number' => ['driver no', 'driver no.', 'driver number', 'driver n', 'driver #', 'driver id'],
        'driver_name' => ['driver name', 'name'],
        'customer' => ['customer', 'employer', 'client'],
        'trip_number' => ['trip #', 'trip#', 'trip number', 'trip no', 'trip no.'],
        'trip_date' => ['trip date', 'date'],
        'start_date' => ['start date', 'trip start', 'start', 'from date'],
        'end_date' => ['end date', 'trip end', 'end', 'to date'],
        'pay_item' => ['pay item', 'payitem', 'item', 'description'],
        'quantity' => ['qty', 'quantity'],
        'rate' => ['rate'],
        'pay' => ['pay', 'amount', 'driver pay'],
    ];

    /**
     * @return array{
     *   timesheets: list<array{id:int,driver_id:int,week_start_date:string,week_end_date:string}>,
     *   trips_created: int,
     *   lines_imported: int,
     *   warnings: list<string>,
     *   unmatched: list<array{row:int,driver_number:?string,driver_name:?string,customer:?string,trip_number:?string,trip_date:?string,reason:string}>
     * }
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
        if (! isset($headerMap['pay_item']) || ! isset($headerMap['quantity']) || ! isset($headerMap['rate'])) {
            throw new \InvalidArgumentException(
                'Missing required columns. Expected Pay Item, Qty, and Rate, plus Driver Number or Driver Name, Customer, Trip #, and Trip Date (or Start Date).'
            );
        }
        if (! isset($headerMap['trip_date']) && ! isset($headerMap['start_date'])) {
            throw new \InvalidArgumentException('A Trip Date or Start Date column is required.');
        }

        $unmatched = [];
        $warnings = [];
        /** @var list<array{row:int,driver_number:?string,driver_name:?string,customer:string,trip_number:string,trip_date:string,end_date:?string,pay_item:string,quantity:float,rate:float,pay:float,computed_pay:float}> $parsed */
        $parsed = [];

        for ($i = 1; $i < count($rows); $i++) {
            $raw = $rows[$i];
            $excelRow = $i + 1;
            if (self::rowIsEmpty($raw)) {
                continue;
            }

            $payItem = isset($headerMap['pay_item'])
                ? trim((string) self::cell($raw, $headerMap['pay_item']))
                : '';
            if (self::isSummaryLabel($payItem) || self::isSummaryRow($raw)) {
                continue;
            }

            $driverNumber = isset($headerMap['driver_number'])
                ? trim((string) self::cell($raw, $headerMap['driver_number']))
                : '';
            $driverName = isset($headerMap['driver_name'])
                ? trim((string) self::cell($raw, $headerMap['driver_name']))
                : '';
            $customer = isset($headerMap['customer'])
                ? trim((string) self::cell($raw, $headerMap['customer']))
                : '';
            $tripNumber = isset($headerMap['trip_number'])
                ? trim((string) self::cell($raw, $headerMap['trip_number']))
                : '';
            $startRaw = isset($headerMap['start_date'])
                ? trim((string) self::cell($raw, $headerMap['start_date']))
                : '';
            $endRaw = isset($headerMap['end_date'])
                ? trim((string) self::cell($raw, $headerMap['end_date']))
                : '';
            $tripDateRaw = isset($headerMap['trip_date'])
                ? trim((string) self::cell($raw, $headerMap['trip_date']))
                : $startRaw;
            $qtyRaw = self::cell($raw, $headerMap['quantity']);
            $rateRaw = self::cell($raw, $headerMap['rate']);
            $payRaw = isset($headerMap['pay']) ? self::cell($raw, $headerMap['pay']) : null;

            $tripDate = self::parseDate($startRaw !== '' ? $startRaw : $tripDateRaw);
            $endDate = $endRaw !== '' ? self::parseDate($endRaw) : null;
            if ($endDate === null && $tripDate !== null) {
                $endDate = $tripDate;
            }

            $qty = self::parseNumber($qtyRaw);
            $rate = self::parseNumber($rateRaw);

            $rowMeta = [
                'row' => $excelRow,
                'driver_number' => $driverNumber !== '' ? $driverNumber : null,
                'driver_name' => $driverName !== '' ? $driverName : null,
                'customer' => $customer !== '' ? $customer : null,
                'trip_number' => $tripNumber !== '' ? $tripNumber : null,
                'trip_date' => $tripDate,
            ];

            if ($driverNumber === '' && $driverName === '') {
                $unmatched[] = $rowMeta + ['reason' => 'Driver ID and driver name are both missing.'];
                continue;
            }
            if ($customer === '') {
                $unmatched[] = $rowMeta + ['reason' => 'Customer is missing.'];
                continue;
            }
            if ($tripNumber === '') {
                $unmatched[] = $rowMeta + ['reason' => 'Trip # is missing.'];
                continue;
            }
            if ($payItem === '') {
                $unmatched[] = $rowMeta + ['reason' => 'Pay item is missing.'];
                continue;
            }
            if ($tripDate === null) {
                $unmatched[] = $rowMeta + ['reason' => 'Trip start date is missing or invalid.'];
                continue;
            }
            if ($qty === null) {
                $unmatched[] = $rowMeta + ['reason' => 'Qty must be numeric.'];
                continue;
            }
            if ($rate === null) {
                $unmatched[] = $rowMeta + ['reason' => 'Rate must be numeric.'];
                continue;
            }

            $computedPay = round($qty * $rate, 2);
            $excelPay = $payRaw !== null && trim((string) $payRaw) !== '' && trim((string) $payRaw) !== '-'
                ? self::parseNumber($payRaw)
                : $computedPay;
            if ($excelPay === null) {
                $excelPay = $computedPay;
            }
            if (abs($excelPay - $computedPay) > 0.02) {
                $warnings[] = "Row {$excelRow}: Pay {$excelPay} differs from Qty×Rate {$computedPay}; using Qty×Rate.";
            }

            $parsed[] = [
                'row' => $excelRow,
                'driver_number' => $driverNumber !== '' ? $driverNumber : null,
                'driver_name' => $driverName !== '' ? $driverName : null,
                'customer' => $customer,
                'trip_number' => $tripNumber,
                'trip_date' => $tripDate,
                'end_date' => $endDate,
                'pay_item' => $payItem,
                'quantity' => $qty,
                'rate' => $rate,
                'pay' => $excelPay,
                'computed_pay' => $computedPay,
            ];
        }

        if ($parsed === [] && $unmatched === []) {
            throw new \InvalidArgumentException('No trip rows were found in the calculation sheet.');
        }

        $result = DB::transaction(function () use ($parsed, $tenantId, $warnings, $unmatched, $userId) {
            $driverCache = [];
            $employerCache = [];
            $groups = [];
            $periods = [];
            $review = $unmatched;

            foreach ($parsed as $p) {
                $driverKey = strtolower(trim((string) ($p['driver_number'] ?? '')).'|'.self::normalizePersonName((string) ($p['driver_name'] ?? '')));
                if (! isset($driverCache[$driverKey])) {
                    $resolved = self::resolveDriverForImport(
                        $p['driver_number'] ?? null,
                        $p['driver_name'] ?? null,
                        $tenantId
                    );
                    $driverCache[$driverKey] = $resolved;
                }
                $resolved = $driverCache[$driverKey];
                if (($resolved['status'] ?? '') !== 'matched') {
                    $review[] = [
                        'row' => $p['row'],
                        'driver_number' => $p['driver_number'],
                        'driver_name' => $p['driver_name'],
                        'customer' => $p['customer'],
                        'trip_number' => $p['trip_number'],
                        'trip_date' => $p['trip_date'],
                        'reason' => $resolved['reason'] ?? 'Driver could not be matched.',
                    ];
                    continue;
                }
                /** @var Driver $driver */
                $driver = $resolved['driver'];
                if (($resolved['matched_by'] ?? '') === 'name') {
                    $warnings[] = "Row {$p['row']}: Matched driver by name ({$driver->name}).";
                }

                $empKey = strtolower($p['customer']);
                if (! isset($employerCache[$empKey])) {
                    $employerCache[$empKey] = self::resolveEmployerForImport($p['customer'], $tenantId);
                }
                $employerResolved = $employerCache[$empKey];
                if (($employerResolved['status'] ?? '') !== 'matched') {
                    $review[] = [
                        'row' => $p['row'],
                        'driver_number' => $p['driver_number'],
                        'driver_name' => $p['driver_name'],
                        'customer' => $p['customer'],
                        'trip_number' => $p['trip_number'],
                        'trip_date' => $p['trip_date'],
                        'reason' => $employerResolved['reason'] ?? ('No customer matched name "'.$p['customer'].'".'),
                    ];
                    continue;
                }
                /** @var Employer $employer */
                $employer = $employerResolved['employer'];

                $periodKey = $driver->id.'|'.$employer->id;
                $tripStart = $p['trip_date'];
                $tripEnd = $p['end_date'] ?? $p['trip_date'];
                if (! isset($periods[$periodKey])) {
                    $periods[$periodKey] = [
                        'driver' => $driver,
                        'employer' => $employer,
                        'start' => $tripStart,
                        'end' => $tripEnd,
                    ];
                } else {
                    if ($tripStart < $periods[$periodKey]['start']) {
                        $periods[$periodKey]['start'] = $tripStart;
                    }
                    if ($tripEnd > $periods[$periodKey]['end']) {
                        $periods[$periodKey]['end'] = $tripEnd;
                    }
                }

                $groupKey = $periodKey.'|'.$p['trip_number'].'|'.$p['trip_date'];
                if (! isset($groups[$groupKey])) {
                    $groups[$groupKey] = [
                        'period_key' => $periodKey,
                        'driver' => $driver,
                        'employer' => $employer,
                        'trip_number' => $p['trip_number'],
                        'trip_date' => $p['trip_date'],
                        'end_date' => $tripEnd,
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
                    'is_billable' => true,
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
                $period = $periods[$g['period_key']];
                $periodStart = $period['start'];
                $periodEnd = $period['end'];
                $tsKey = $g['period_key'];

                if (! isset($timesheetCache[$tsKey])) {
                    $timesheet = Timesheet::query()
                        ->where('driver_id', $driver->id)
                        ->whereDate('week_start_date', $periodStart)
                        ->whereDate('week_end_date', $periodEnd)
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
                            'week_start_date' => $periodStart,
                            'week_end_date' => $periodEnd,
                            'status' => 'draft',
                            'weekly_total' => 0,
                            'created_by_user_id' => $userId,
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

                $endDate = $g['end_date'] ?? $g['trip_date'];
                $notes = ($endDate && $endDate !== $g['trip_date'])
                    ? 'Trip dates: '.$g['trip_date'].' – '.$endDate
                    : null;

                if ($trip) {
                    $trip->update([
                        'employer_id' => $employer->id,
                        'notes' => $notes ?? $trip->notes,
                        'is_adjusted' => true,
                        'adjusted_at' => now(),
                        'adjusted_reason' => 'Imported from calculation sheet',
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
                        'notes' => $notes,
                        'is_adjusted' => true,
                        'adjusted_at' => now(),
                        'adjusted_reason' => 'Imported from calculation sheet',
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
                    'week_end_date' => Carbon::parse($timesheet->week_end_date)->format('Y-m-d'),
                ];
            }

            return [
                'timesheets' => $outTimesheets,
                'trips_created' => $tripsCreated,
                'lines_imported' => $linesImported,
                'warnings' => array_values(array_unique($warnings)),
                'unmatched' => $review,
            ];
        });

        foreach ($result['timesheets'] as $ts) {
            $timesheet = Timesheet::query()->find($ts['id']);
            if ($timesheet) {
                try {
                    TimesheetDocumentService::upload(
                        $timesheet,
                        TimesheetDocument::TYPE_CALCULATION_SHEET,
                        $file,
                        $userId,
                        true
                    );
                } catch (\Throwable) {
                    // Timesheet rows already saved; document attach is optional.
                }
            }
        }

        return $result;
    }

    /**
     * @return array{status: string, driver?: Driver, matched_by?: string, reason?: string}
     */
    private static function resolveDriverForImport(?string $driverNumber, ?string $driverName, ?string $tenantId): array
    {
        $q = Driver::query()->with('user');
        if ($tenantId) {
            $q->where('tenant_id', $tenantId);
        }

        $normalized = Driver::normalizeDriverNumber((string) $driverNumber);
        if ($normalized) {
            $byNumber = (clone $q)->whereRaw('UPPER(driver_number) = ?', [$normalized])->first();
            if ($byNumber) {
                return ['status' => 'matched', 'driver' => $byNumber, 'matched_by' => 'id'];
            }
        }

        $name = trim((string) $driverName);
        if ($name !== '') {
            $matches = self::matchDriversByName($name, $tenantId);
            if (count($matches) === 1) {
                return ['status' => 'matched', 'driver' => $matches[0], 'matched_by' => 'name'];
            }
            if (count($matches) > 1) {
                return [
                    'status' => 'unmatched',
                    'reason' => 'Driver name "'.$name.'" matched more than one driver. Assign a unique Driver ID.',
                ];
            }
        }

        if ($normalized) {
            return [
                'status' => 'unmatched',
                'reason' => 'No driver matched Driver ID '.$normalized
                    .($name !== '' ? ' or name "'.$name.'"' : '').'.',
            ];
        }

        return [
            'status' => 'unmatched',
            'reason' => $name !== ''
                ? 'No driver matched name "'.$name.'".'
                : 'Driver ID and name are missing.',
        ];
    }

    /**
     * @return list<Driver>
     */
    private static function matchDriversByName(string $name, ?string $tenantId): array
    {
        $want = self::normalizePersonName($name);
        if ($want === '') {
            return [];
        }

        $drivers = Driver::query()
            ->with('user')
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->get();

        $matches = [];
        foreach ($drivers as $driver) {
            $candidates = array_filter([
                self::normalizePersonName((string) $driver->name),
                self::normalizePersonName((string) ($driver->user?->name ?? '')),
            ]);
            if (in_array($want, $candidates, true)) {
                $matches[] = $driver;
            }
        }

        return $matches;
    }

    private static function normalizePersonName(string $name): string
    {
        $name = strtolower(trim(preg_replace('/\s+/', ' ', $name) ?? $name));
        $name = str_replace('.', '', $name);
        if (str_contains($name, ',')) {
            [$last, $first] = array_map('trim', explode(',', $name, 2));

            return trim($first.' '.$last);
        }

        return $name;
    }

    private static function isSummaryLabel(string $label): bool
    {
        $n = strtolower(trim($label));

        return $n !== '' && preg_match('/^(sub[\s-]*total|grand\s*total|total|hst|gst|pst|qst|vat)$/', $n) === 1;
    }

    /**
     * @param  list<string>  $row
     */
    private static function isSummaryRow(array $row): bool
    {
        $joined = strtolower(implode(' ', $row));

        return preg_match('/\b(sub[\s-]*total|grand\s*total|\btotal\b|hst|gst)\b/', $joined) === 1
            && ! preg_match('/\b(actual hours|delay|drops|kms|trip)\b/', $joined);
    }

    /**
     * Match a calculation-sheet customer to an employer by name.
     *
     * @return array{status: string, employer?: Employer, reason?: string}
     */
    private static function resolveEmployerForImport(string $name, ?string $tenantId): array
    {
        $trimmed = trim($name);
        if ($trimmed === '') {
            return ['status' => 'unmatched', 'reason' => 'Customer name is missing.'];
        }

        $query = Employer::query()->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId));
        $needle = mb_strtolower($trimmed);

        $exact = (clone $query)->whereRaw('LOWER(name) = ?', [$needle])->get();
        if ($exact->count() === 1) {
            return ['status' => 'matched', 'employer' => $exact->first()];
        }
        if ($exact->count() > 1) {
            return [
                'status' => 'unmatched',
                'reason' => 'Customer name "'.$trimmed.'" matched more than one customer.',
            ];
        }

        $byCode = (clone $query)->whereRaw('LOWER(COALESCE(company_code, "")) = ?', [$needle])->first();
        if ($byCode) {
            return ['status' => 'matched', 'employer' => $byCode];
        }

        $want = self::normalizeOrgName($trimmed);
        $all = (clone $query)->get();
        $normalizedMatches = [];
        $containsMatches = [];
        foreach ($all as $employer) {
            $candidate = self::normalizeOrgName((string) $employer->name);
            if ($candidate === '') {
                continue;
            }
            if ($candidate === $want) {
                $normalizedMatches[] = $employer;
            } elseif (str_contains($want, $candidate) || str_contains($candidate, $want)) {
                $containsMatches[] = $employer;
            }
        }

        if (count($normalizedMatches) === 1) {
            return ['status' => 'matched', 'employer' => $normalizedMatches[0]];
        }
        if (count($normalizedMatches) > 1) {
            return [
                'status' => 'unmatched',
                'reason' => 'Customer name "'.$trimmed.'" matched more than one customer.',
            ];
        }

        if (count($containsMatches) === 1) {
            return ['status' => 'matched', 'employer' => $containsMatches[0]];
        }
        if (count($containsMatches) > 1) {
            usort(
                $containsMatches,
                fn (Employer $a, Employer $b) => strlen(self::normalizeOrgName((string) $b->name))
                    <=> strlen(self::normalizeOrgName((string) $a->name))
            );
            $bestLen = strlen(self::normalizeOrgName((string) $containsMatches[0]->name));
            $tied = array_values(array_filter(
                $containsMatches,
                fn (Employer $employer) => strlen(self::normalizeOrgName((string) $employer->name)) === $bestLen
            ));
            if (count($tied) === 1) {
                return ['status' => 'matched', 'employer' => $tied[0]];
            }

            return [
                'status' => 'unmatched',
                'reason' => 'Customer name "'.$trimmed.'" matched more than one customer. Use the exact customer name.',
            ];
        }

        return [
            'status' => 'unmatched',
            'reason' => 'No customer matched name "'.$trimmed.'".',
        ];
    }

    private static function normalizeOrgName(string $name): string
    {
        $name = strtolower(trim(preg_replace('/\s+/', ' ', $name) ?? $name));
        $name = preg_replace('/[^a-z0-9 ]+/', '', $name) ?? $name;

        return trim($name);
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
     * @return list<list<string>>
     */
    private static function readXlsx(string $path): array
    {
        if (class_exists(IOFactory::class)) {
            try {
                $reader = IOFactory::createReaderForFile($path);
                $reader->setReadDataOnly(true);
                $spreadsheet = $reader->load($path);
                $raw = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
                $spreadsheet->disconnectWorksheets();
                $rows = [];
                foreach ($raw as $row) {
                    $cells = [];
                    foreach ((array) $row as $cell) {
                        if ($cell instanceof \DateTimeInterface) {
                            $cells[] = $cell->format('Y-m-d');
                            continue;
                        }
                        $cells[] = trim((string) ($cell ?? ''));
                    }
                    $rows[] = $cells;
                }

                return $rows;
            } catch (\Throwable) {
                // Fall through to the ZipArchive reader.
            }
        }

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
        if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $raw, $iso)) {
            return $iso[1];
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

        $formats = ['n/j/Y', 'm/d/Y', 'n-j-Y', 'm-d-Y', 'Y-m-d', 'Y/m/d', 'M j, Y', 'd-m-Y', 'd/m/Y'];
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
