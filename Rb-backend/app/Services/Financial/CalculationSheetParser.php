<?php

namespace App\Services\Financial;

use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;
use Throwable;

class CalculationSheetParser
{
    /**
     * @return array{
     *   sheet_name: string,
     *   headers: list<string>,
     *   display_rows: list<list<string>>,
     *   lines: list<array{label: string, quantity: float|null, rate: float|null, amount: float, is_tax?: bool}>,
     *   meta: array{driver: string|null, employer: string|null, period: string|null},
     *   subtotal: float,
     *   tax: float,
     *   total: float
     * }
     */
    public static function parseFile(string $absolutePath): array
    {
        if (! is_file($absolutePath)) {
            throw new RuntimeException('Spreadsheet file was not found.');
        }

        try {
            $reader = IOFactory::createReaderForFile($absolutePath);
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($absolutePath);
        } catch (Throwable $exception) {
            throw new RuntimeException('Could not read the Excel file. Use .xlsx, .xls, or .csv.');
        }

        $sheet = $spreadsheet->getActiveSheet();
        $sheetName = (string) $sheet->getTitle();
        $raw = $sheet->toArray(null, true, true, false);
        $spreadsheet->disconnectWorksheets();

        $normalized = [];
        $maxWidth = 0;
        foreach ($raw as $row) {
            $cells = [];
            foreach ((array) $row as $cell) {
                if ($cell === null) {
                    $cells[] = '';
                    continue;
                }
                if ($cell instanceof \DateTimeInterface) {
                    $cells[] = $cell->format('Y-m-d');
                    continue;
                }
                $cells[] = trim((string) $cell);
            }
            if (self::rowIsEmpty($cells)) {
                continue;
            }
            $maxWidth = max($maxWidth, count($cells));
            $normalized[] = $cells;
        }

        if ($normalized === []) {
            throw new RuntimeException('The spreadsheet is empty.');
        }

        foreach ($normalized as $i => $row) {
            while (count($normalized[$i]) < $maxWidth) {
                $normalized[$i][] = '';
            }
        }

        $headerIndex = self::detectHeaderIndex($normalized);
        $rawHeaders = $headerIndex !== null
            ? $normalized[$headerIndex]
            : [];
        $kinds = self::classifyHeaders($rawHeaders);
        $headers = $headerIndex !== null
            ? self::padHeaders($rawHeaders)
            : ['Column A', 'Column B', 'Column C', 'Column D'];

        $dataRows = $headerIndex !== null
            ? array_slice($normalized, $headerIndex + 1)
            : $normalized;

        $colMap = self::buildColumnMap($headers, $kinds, $dataRows);

        $lines = [];
        $totalFromSheet = null;
        $subtotalFromSheet = null;
        $taxFromSheet = 0.0;

        foreach ($dataRows as $row) {
            $kind = self::rowKind($row);
            $amount = self::mappedAmount($row, $colMap);

            if ($kind === 'total') {
                if ($amount !== null) {
                    $totalFromSheet = $amount;
                }
                continue;
            }
            if ($kind === 'subtotal') {
                if ($amount !== null) {
                    $subtotalFromSheet = $amount;
                }
                continue;
            }
            if ($kind === 'tax') {
                $taxAmount = $amount ?? self::largestMoneyOnRow($row, $colMap);
                if ($taxAmount !== null && abs($taxAmount) >= 0.0001) {
                    $taxFromSheet += $taxAmount;
                    $lines[] = [
                        'label' => self::taxLabel($row) ?: 'HST',
                        'quantity' => null,
                        'rate' => null,
                        'amount' => round($taxAmount, 2),
                        'is_tax' => true,
                    ];
                }
                continue;
            }

            $qty = self::cellFloat($row, $colMap['quantity'] ?? null);
            $rate = self::cellFloat($row, $colMap['rate'] ?? null);
            if ($amount === null && $qty !== null && $rate !== null) {
                $amount = round($qty * $rate, 2);
            }
            if ($amount === null || abs($amount) < 0.0001) {
                continue;
            }

            $label = self::rowLabel($row, $colMap);
            if ($label === '') {
                $label = 'Line item';
            }

            $lines[] = [
                'label' => $label,
                'quantity' => $qty,
                'rate' => $rate,
                'amount' => round($amount, 2),
                'is_tax' => false,
            ];
        }

        $lineSumExTax = 0.0;
        foreach ($lines as $line) {
            if (! empty($line['is_tax'])) {
                continue;
            }
            $lineSumExTax += (float) $line['amount'];
        }
        $lineSumExTax = round($lineSumExTax, 2);

        $subtotal = $subtotalFromSheet ?? $lineSumExTax;
        $tax = round($taxFromSheet, 2);
        $total = $totalFromSheet ?? round($subtotal + $tax, 2);

        $displayRows = [];
        foreach ($dataRows as $row) {
            $displayRows[] = array_slice($row, 0, count($headers));
        }

        return [
            'sheet_name' => $sheetName,
            'headers' => $headers,
            'display_rows' => array_slice($displayRows, 0, 80),
            'lines' => $lines,
            'meta' => self::extractMeta($headers, $kinds, $normalized, $headerIndex),
            'subtotal' => round((float) $subtotal, 2),
            'tax' => $tax,
            'total' => round((float) $total, 2),
        ];
    }

    /**
     * @param  list<list<string>>  $rows
     */
    private static function detectHeaderIndex(array $rows): ?int
    {
        $best = null;
        $bestScore = 0;
        $limit = min(25, count($rows));
        for ($i = 0; $i < $limit; $i++) {
            $score = 0;
            foreach ($rows[$i] as $cell) {
                $n = self::normalizeHeader($cell);
                if ($n === '') {
                    continue;
                }
                if (preg_match('/^(qty|quantity|hrs?|hours|rate|amount|pay|pay item|description|item|trip|trip date|unit)$/', $n)) {
                    $score += 3;
                } elseif (preg_match('/qty|quantity|rate|amount|pay item|pay|desc|item|hour|trip/', $n)) {
                    $score += 1;
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }

        return $bestScore >= 2 ? $best : null;
    }

    /**
     * @param  list<string>  $headers
     * @return list<string>
     */
    private static function classifyHeaders(array $headers): array
    {
        $kinds = [];
        foreach ($headers as $i => $header) {
            $kinds[$i] = self::headerKind($header);
        }

        return $kinds;
    }

    private static function headerKind(string $header): string
    {
        $n = self::normalizeHeader($header);
        if ($n === '') {
            return 'empty';
        }
        if (preg_match('/^pay item$|^description$|^particulars?$|^service$|^work type$|^item$/', $n)) {
            return 'label';
        }
        if (preg_match('/^trip ?#$|^trip no|^trip number$|^trip id$|^trip$/', $n)) {
            return 'trip';
        }
        if (preg_match('/^qty$|^quantity$|^units?$/', $n)) {
            return 'qty';
        }
        if (preg_match('/^rate( \d+)?$|^price$|^unit (cost|rate|price)$/', $n)) {
            return 'rate';
        }
        if (preg_match('/^(pay|amount|earnings|earn|driver pay|total pay)( \d+)?$/', $n)) {
            return 'pay';
        }
        if (preg_match('/profit|wsib|emp tax|employee tax|^tax$/', $n)) {
            return 'summary';
        }
        if (preg_match('/^hours$|^hrs$/', $n)) {
            return 'hours';
        }
        if (preg_match('/driver name|^name$/', $n)) {
            return 'driver';
        }
        if (preg_match('/customer|employer|client/', $n)) {
            return 'customer';
        }
        if (preg_match('/trip date|^date$/', $n)) {
            return 'date';
        }

        return 'other';
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string>  $kinds
     * @param  list<list<string>>  $dataRows
     * @return array<string, int>
     */
    private static function buildColumnMap(array $headers, array $kinds, array $dataRows): array
    {
        $label = self::firstIndex($kinds, 'label');
        $trip = self::firstIndex($kinds, 'trip');
        $qty = self::firstIndex($kinds, 'qty');
        if ($qty === null) {
            $qty = self::firstIndex($kinds, 'hours');
        }

        $summaryStart = null;
        foreach ($kinds as $i => $kind) {
            if ($kind === 'summary') {
                $summaryStart = $i;
                break;
            }
        }

        $rateCols = [];
        $payCols = [];
        foreach ($kinds as $i => $kind) {
            if ($summaryStart !== null && $i >= $summaryStart) {
                continue;
            }
            if ($kind === 'rate') {
                $rateCols[] = $i;
            } elseif ($kind === 'pay') {
                $payCols[] = $i;
            }
        }

        $amountIndex = self::choosePayColumn($payCols, $rateCols, $qty, $dataRows);
        $rateIndex = self::chooseRateForPay($rateCols, $amountIndex, $qty);

        $map = [];
        if ($label !== null) {
            $map['label'] = $label;
        } elseif ($trip !== null) {
            $map['label'] = $trip;
        } else {
            $map['label'] = 0;
        }
        if ($trip !== null) {
            $map['trip'] = $trip;
        }
        if ($qty !== null) {
            $map['quantity'] = $qty;
        }
        if ($rateIndex !== null) {
            $map['rate'] = $rateIndex;
        }
        if ($amountIndex !== null) {
            $map['amount'] = $amountIndex;
        }

        return $map;
    }

    /**
     * Prefer the Pay column that carries HST and the settlement total
     * (often the last Rate/Pay pair, not the first one next to Qty).
     *
     * @param  list<int>  $payCols
     * @param  list<int>  $rateCols
     * @param  list<list<string>>  $dataRows
     */
    private static function choosePayColumn(array $payCols, array $rateCols, ?int $qty, array $dataRows): ?int
    {
        if ($payCols === []) {
            return null;
        }
        if (count($payCols) === 1) {
            return $payCols[0];
        }

        $best = $payCols[0];
        $bestScore = -1;
        $lastPay = $payCols[count($payCols) - 1];

        foreach ($payCols as $col) {
            $score = 0;
            if ($col === $lastPay) {
                $score += 8;
            }
            foreach ($rateCols as $rateCol) {
                if (abs($rateCol - $col) === 1) {
                    $score += 6;
                    break;
                }
            }
            if ($qty !== null && $col === $qty + 2) {
                $score += 2;
            }

            foreach ($dataRows as $row) {
                $kind = self::rowKind($row);
                $value = self::cellFloat($row, $col);
                if ($value === null || abs($value) < 0.0001) {
                    continue;
                }
                if ($kind === 'tax') {
                    $score += 25;
                } elseif ($kind === 'subtotal') {
                    $score += 10;
                } elseif ($kind === 'total') {
                    $score += 12;
                }
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $col;
            }
        }

        return $best;
    }

    /**
     * @param  list<int>  $rateCols
     */
    private static function chooseRateForPay(array $rateCols, ?int $payCol, ?int $qty): ?int
    {
        if ($rateCols === []) {
            return null;
        }
        if ($payCol !== null) {
            foreach ($rateCols as $rateCol) {
                if ($rateCol === $payCol - 1) {
                    return $rateCol;
                }
            }
        }
        if ($qty !== null) {
            foreach ($rateCols as $rateCol) {
                if ($rateCol === $qty + 1) {
                    return $rateCol;
                }
            }
        }

        return $rateCols[count($rateCols) - 1];
    }

    /**
     * @param  list<string>  $kinds
     */
    private static function firstIndex(array $kinds, string $want): ?int
    {
        foreach ($kinds as $i => $kind) {
            if ($kind === $want) {
                return $i;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $row
     */
    private static function rowKind(array $row): string
    {
        $joined = strtolower(implode(' ', $row));
        if (preg_match('/\b(hst|gst|pst|qst|sales tax|vat)\b/', $joined)) {
            return 'tax';
        }
        if (preg_match('/\bsub[\s-]*total\b/', $joined)) {
            return 'subtotal';
        }
        if (preg_match('/\b(grand\s+)?total\b/', $joined) && ! preg_match('/sub[\s-]*total/', $joined)) {
            return 'total';
        }

        return 'data';
    }

    /**
     * @param  list<string>  $row
     * @param  array<string, int>  $colMap
     */
    private static function mappedAmount(array $row, array $colMap): ?float
    {
        if (! isset($colMap['amount'])) {
            return null;
        }

        return self::cellFloat($row, $colMap['amount']);
    }

    /**
     * @param  list<string>  $row
     * @param  array<string, int>  $colMap
     */
    private static function largestMoneyOnRow(array $row, array $colMap): ?float
    {
        $skip = [];
        foreach (['quantity'] as $key) {
            if (isset($colMap[$key])) {
                $skip[$colMap[$key]] = true;
            }
        }
        $best = null;
        foreach ($row as $i => $cell) {
            if (isset($skip[$i])) {
                continue;
            }
            $value = self::parseNumber((string) $cell);
            if ($value === null) {
                continue;
            }
            if ($best === null || abs($value) > abs($best)) {
                $best = $value;
            }
        }

        return $best;
    }

    /**
     * @param  list<string>  $row
     */
    private static function taxLabel(array $row): string
    {
        foreach ($row as $cell) {
            $cell = trim((string) $cell);
            if ($cell !== '' && preg_match('/hst|gst|pst|qst|tax|vat/i', $cell)) {
                return $cell;
            }
        }

        return 'HST';
    }

    /**
     * @param  list<string>  $row
     * @param  array<string, int>  $colMap
     */
    private static function rowLabel(array $row, array $colMap): string
    {
        $item = trim((string) ($row[$colMap['label'] ?? 0] ?? ''));
        if ($item !== '' && self::parseNumber($item) !== null) {
            $item = '';
        }
        $trip = '';
        if (isset($colMap['trip'])) {
            $trip = trim((string) ($row[$colMap['trip']] ?? ''));
        }
        if ($item !== '' && $trip !== '' && strcasecmp($item, $trip) !== 0) {
            return $item.' ('.$trip.')';
        }
        if ($item !== '') {
            return $item;
        }
        if ($trip !== '') {
            return $trip;
        }
        foreach ($row as $cell) {
            $cell = trim((string) $cell);
            if ($cell !== '' && self::parseNumber($cell) === null) {
                return $cell;
            }
        }

        return '';
    }

    /**
     * @param  list<string>  $row
     */
    private static function cellFloat(array $row, ?int $index): ?float
    {
        if ($index === null || ! array_key_exists($index, $row)) {
            return null;
        }

        return self::parseNumber($row[$index]);
    }

    private static function parseNumber(string $value): ?float
    {
        $value = trim(str_replace(["\xc2\xa0", ' '], '', $value));
        $value = str_replace([',', '$', 'CAD', 'cad'], '', $value);
        $value = str_replace(['−', '–'], '-', $value);
        if ($value === '' || ! preg_match('/^-?\d+(\.\d+)?$/', $value)) {
            return null;
        }

        return round((float) $value, 2);
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string>  $kinds
     * @param  list<list<string>>  $rows
     * @return array{driver: string|null, employer: string|null, period: string|null}
     */
    private static function extractMeta(array $headers, array $kinds, array $rows, ?int $headerIndex): array
    {
        $meta = ['driver' => null, 'employer' => null, 'period' => null];
        $driverCol = self::firstIndex($kinds, 'driver');
        $customerCol = self::firstIndex($kinds, 'customer');
        $dateCol = self::firstIndex($kinds, 'date');

        $dataRows = $headerIndex !== null ? array_slice($rows, $headerIndex + 1) : $rows;
        $drivers = [];
        $customers = [];
        $dates = [];
        foreach ($dataRows as $row) {
            if (self::rowKind($row) !== 'data') {
                continue;
            }
            if ($driverCol !== null) {
                $name = trim((string) ($row[$driverCol] ?? ''));
                if ($name !== '' && ! preg_match('/^driver name$/i', $name)) {
                    $drivers[$name] = true;
                }
            }
            if ($customerCol !== null) {
                $name = trim((string) ($row[$customerCol] ?? ''));
                if ($name !== '') {
                    $customers[$name] = true;
                }
            }
            if ($dateCol !== null) {
                $date = trim((string) ($row[$dateCol] ?? ''));
                if ($date !== '') {
                    $dates[] = $date;
                }
            }
        }

        $driverNames = array_keys($drivers);
        $customerNames = array_keys($customers);
        $meta['driver'] = $driverNames[0] ?? null;
        if (count($customerNames) === 1) {
            $meta['employer'] = $customerNames[0];
        } elseif (count($customerNames) > 1) {
            $meta['employer'] = implode(', ', array_slice($customerNames, 0, 4));
        }
        if ($dates !== []) {
            $meta['period'] = $dates[0].(end($dates) !== $dates[0] ? ' – '.end($dates) : '');
        }

        if ($meta['driver'] !== null && $meta['employer'] !== null) {
            return $meta;
        }

        foreach (array_slice($rows, 0, 20) as $i => $row) {
            if ($headerIndex !== null && $i === $headerIndex) {
                continue;
            }
            $key = self::normalizeHeader((string) ($row[0] ?? ''));
            $value = trim((string) ($row[1] ?? ''));
            if ($value === '' && count($row) > 2) {
                $value = trim((string) $row[2]);
            }
            if ($value === '' || preg_match('/^driver name$/i', $value)) {
                continue;
            }
            if ($meta['driver'] === null && preg_match('/^driver$|^employee$|^name$/', $key)) {
                $meta['driver'] = $value;
            } elseif ($meta['employer'] === null && preg_match('/employer|customer|client|company/', $key)) {
                $meta['employer'] = $value;
            } elseif ($meta['period'] === null && preg_match('/period|week/', $key)) {
                $meta['period'] = $value;
            }
        }

        return $meta;
    }

    /**
     * @param  list<string>  $headers
     * @return list<string>
     */
    private static function padHeaders(array $headers): array
    {
        $out = [];
        $seen = [];
        foreach ($headers as $i => $header) {
            $header = trim($header);
            if ($header === '') {
                $header = 'Column '.($i + 1);
            }
            $key = strtolower($header);
            if (isset($seen[$key])) {
                $seen[$key]++;
                $header .= ' '.$seen[$key];
            } else {
                $seen[$key] = 1;
            }
            $out[] = $header;
        }

        return $out === [] ? ['Item'] : $out;
    }

    /**
     * @param  list<string>  $row
     */
    private static function rowIsEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    private static function normalizeHeader(string $header): string
    {
        $header = strtolower(trim($header));
        $header = preg_replace('/[^a-z0-9#]+/', ' ', $header) ?? $header;

        return trim($header);
    }
}
