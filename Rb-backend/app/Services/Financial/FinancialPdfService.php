<?php

namespace App\Services\Financial;

use App\Models\DriverCalculation;
use App\Models\Invoice;
use App\Models\Payslip;
use App\Models\TimesheetTrip;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;

class FinancialPdfService
{
    public static function invoice(Invoice $invoice): Response
    {
        $invoice->load(['employer', 'items.driver.user', 'payments']);

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'title' => 'Invoice',
        ])->setPaper('a4', 'portrait');

        $name = 'invoice-'.($invoice->invoice_number ?: $invoice->id).'.pdf';

        return $pdf->download($name);
    }

    public static function payslip(Payslip $payslip): Response
    {
        [$pdf, $name] = self::renderPayslipPdf($payslip);

        return $pdf->download($name);
    }

    /**
     * @return array{content: string, filename: string}
     */
    public static function payslipPdfBinary(Payslip $payslip): array
    {
        [$pdf, $name] = self::renderPayslipPdf($payslip);

        return [
            'content' => $pdf->output(),
            'filename' => $name,
        ];
    }

    /**
     * @return array{0: mixed, 1: string}
     */
    private static function renderPayslipPdf(Payslip $payslip): array
    {
        $payslip->load(['driver.user', 'trips', 'remittances']);

        $driver = $payslip->driver;
        $driverName = $driver && $driver->relationLoaded('user') && $driver->user
            ? (string) ($driver->user->name ?? '')
            : '';
        if ($driverName === '' && $driver) {
            $driverName = 'Driver #'.$driver->id;
        }
        $driverRef = $driver && $driver->license_number
            ? (string) $driver->license_number
            : (string) ($payslip->driver_id ?? '');
        $employeeLine = trim($driverName.' ('.$driverRef.')');

        [$issuerName, $issuerAddress, $issuerPhone, $issuerEmail] = self::resolveIssuerBlockForDocuments();

        $employeeAddress = '';
        if ($driver) {
            $employeeAddress = trim((string) ($driver->payee_address ?? ''));
        }

        $periodBeginning = $payslip->period_start
            ? Carbon::parse($payslip->period_start)->format('d-m-Y')
            : '—';
        $periodEnding = $payslip->period_end
            ? Carbon::parse($payslip->period_end)->format('d-m-Y')
            : '—';

        $latestRemittance = $payslip->remittances->sortByDesc('payment_date')->first();
        $payDate = $latestRemittance && $latestRemittance->payment_date
            ? Carbon::parse($latestRemittance->payment_date)->format('d-m-Y')
            : now()->format('d-m-Y');

        $hours = self::payslipTotalPayableHours($payslip);
        $totalHoursLabel = $hours !== null ? number_format($hours, 2) : '—';

        $ytdPlaceholder = '—';
        $breakdown = is_array($payslip->breakdown) ? $payslip->breakdown : [];
        $payRows = [];
        foreach ($breakdown as $label => $amt) {
            if (! is_numeric($amt)) {
                continue;
            }
            $payRows[] = [
                'label' => (string) $label,
                'hours' => $ytdPlaceholder,
                'rate' => $ytdPlaceholder,
                'current' => (float) $amt,
                'ytd' => $ytdPlaceholder,
            ];
        }
        $vacation = (float) $payslip->vacation_pay;
        $vacationInBreakdown = false;
        foreach ($payRows as $row) {
            if (stripos($row['label'], 'vacation') !== false) {
                $vacationInBreakdown = true;
                break;
            }
        }
        if ($vacation > 0.0001 && ! $vacationInBreakdown) {
            $payRows[] = [
                'label' => 'Vacation pay',
                'hours' => $ytdPlaceholder,
                'rate' => $ytdPlaceholder,
                'current' => $vacation,
                'ytd' => $ytdPlaceholder,
            ];
        }
        if ($payRows === [] && (float) $payslip->total_pay > 0.0001) {
            $payRows[] = [
                'label' => 'Regular pay',
                'hours' => $ytdPlaceholder,
                'rate' => $ytdPlaceholder,
                'current' => (float) $payslip->total_pay,
                'ytd' => $ytdPlaceholder,
            ];
        }
        if ($payRows === []) {
            $payRows[] = [
                'label' => 'Regular pay',
                'hours' => $ytdPlaceholder,
                'rate' => $ytdPlaceholder,
                'current' => 0.0,
                'ytd' => $ytdPlaceholder,
            ];
        }

        $taxRows = [];
        $taxesCurrent = 0.0;

        $deductions = (float) $payslip->deductions;
        $deductionRows = [
            ['label' => 'Deductions', 'current' => $deductions, 'ytd' => $ytdPlaceholder],
        ];

        $grossCurrent = (float) $payslip->total_pay + $vacation;
        $summaryRows = [
            ['label' => 'Total pay', 'current' => $grossCurrent, 'ytd' => $ytdPlaceholder],
            ['label' => 'Taxes', 'current' => $taxesCurrent, 'ytd' => $ytdPlaceholder],
            ['label' => 'Deductions', 'current' => $deductions, 'ytd' => $ytdPlaceholder],
            ['label' => 'Net pay', 'current' => (float) $payslip->net_pay, 'ytd' => $ytdPlaceholder],
        ];

        $detailEarningRows = [];
        foreach ($payRows as $row) {
            $detailEarningRows[] = [
                'label' => $row['label'],
                'current' => $row['current'],
                'ytd' => $row['ytd'],
            ];
        }
        $detailDeductionRows = [];
        if ($deductions > 0.0001) {
            $detailDeductionRows[] = [
                'label' => 'Deductions',
                'current' => $deductions,
                'ytd' => $ytdPlaceholder,
            ];
        }

        $memoText = 'Payslip #'.$payslip->id;
        if ($payslip->status) {
            $memoText .= ' · Status: '.$payslip->status;
        }

        $pdf = Pdf::loadView('pdf.payslip', [
            'payslip' => $payslip,
            'issuerName' => $issuerName,
            'issuerAddress' => $issuerAddress,
            'issuerPhone' => $issuerPhone,
            'issuerEmail' => $issuerEmail,
            'employeeLine' => $employeeLine,
            'employeeAddress' => $employeeAddress,
            'periodBeginning' => $periodBeginning,
            'periodEnding' => $periodEnding,
            'payDate' => $payDate,
            'totalHoursLabel' => $totalHoursLabel,
            'payRows' => $payRows,
            'taxRows' => $taxRows,
            'ytdPlaceholder' => $ytdPlaceholder,
            'deductionRows' => $deductionRows,
            'summaryRows' => $summaryRows,
            'detailEarningRows' => $detailEarningRows,
            'detailDeductionRows' => $detailDeductionRows,
            'vacationAccrued' => $ytdPlaceholder,
            'vacationUsed' => $ytdPlaceholder,
            'vacationAvailable' => $ytdPlaceholder,
            'benefitsNote' => $ytdPlaceholder,
            'memoText' => $memoText,
        ])->setPaper('a4', 'portrait');

        $name = self::payslipPeriodDocumentFilename($payslip, $driverName, $driverRef, 'Payroll');

        return [$pdf, $name];
    }

    /**
     * Sums payable line quantities where the unit indicates hours (for payroll stub display).
     */
    private static function payslipTotalPayableHours(Payslip $payslip): ?float
    {
        $sum = 0.0;
        $found = false;
        foreach ($payslip->trips as $trip) {
            foreach (TimesheetTripLineService::payableLines($trip) as $row) {
                $line = $row['line'];
                $unit = strtolower((string) ($line['unit'] ?? ''));
                if ($unit === '' || ! preg_match('/\b(hr|hour|hours)\b/i', $unit)) {
                    continue;
                }
                $sum += (float) ($line['quantity'] ?? 0);
                $found = true;
            }
        }

        return $found ? round($sum, 2) : null;
    }

    public static function remittanceSummary(Payslip $payslip): Response
    {
        $payslip->load(['driver.user', 'remittances']);

        $driver = $payslip->driver;
        $driverRef = $driver && $driver->license_number
            ? (string) $driver->license_number
            : (string) $payslip->driver_id;
        $driverName = $driver?->user?->name ?? ('Driver #'.$payslip->driver_id);

        [$issuerName, $issuerAddress, $issuerPhone, $issuerEmail] = self::resolveIssuerBlockForDocuments();

        $payToName = $driverName;
        $payToBusiness = trim((string) ($driver?->payee_business_name ?? ''));
        $payToAddress = trim((string) ($driver?->payee_address ?? ''));

        $net = round((float) $payslip->net_pay, 2);
        $referenceNo = $payslip->id.'-'.$payslip->driver_id;

        $remittances = $payslip->remittances->sort(function ($a, $b) {
            $da = $a->payment_date?->format('Y-m-d') ?? '';
            $db = $b->payment_date?->format('Y-m-d') ?? '';
            if ($da !== $db) {
                return $da <=> $db;
            }

            return $a->id <=> $b->id;
        })->values();

        $tableRows = [];
        $running = $net;

        if ($remittances->isEmpty()) {
            $d = $payslip->period_end ?? $payslip->period_start ?? now();
            $dStr = Carbon::parse($d)->format('d/m/Y');
            $tableRows[] = [
                'bill_number' => $referenceNo,
                'bill_date' => $dStr,
                'due_date' => $dStr,
                'original' => $net,
                'balance' => $net,
                'payment' => $net,
            ];
            $docDateCarbon = Carbon::parse($d);
        } else {
            foreach ($remittances as $r) {
                $pay = round((float) $r->amount_paid, 2);
                $balanceBefore = round($running, 2);
                $pd = $r->payment_date;
                $dStr = $pd ? Carbon::parse($pd)->format('d/m/Y') : now()->format('d/m/Y');
                $tableRows[] = [
                    'bill_number' => $referenceNo,
                    'bill_date' => $dStr,
                    'due_date' => $dStr,
                    'original' => $net,
                    'balance' => $balanceBefore,
                    'payment' => $pay,
                ];
                $running = round($running - $pay, 2);
            }
            $last = $remittances->last();
            $docDateCarbon = $last->payment_date ? Carbon::parse($last->payment_date) : now();
        }

        $documentDate = $docDateCarbon->format('d/m/Y');

        $fullName = (string) ($driver?->user?->name ?? '');
        $firstName = $fullName !== '' ? explode(' ', trim($fullName), 2)[0] : 'Driver';
        $periodLabel = self::payslipPeriodLabelText($payslip);
        $memoLine = 'Memo: '.$firstName.': '.$periodLabel.' Total: $'.number_format($net, 2);

        $filename = self::payslipPeriodDocumentFilename($payslip, $driverName, $driverRef, 'Remittance');

        $pdf = Pdf::loadView('pdf.remittance-slip', [
            'issuerName' => $issuerName,
            'issuerAddress' => $issuerAddress,
            'issuerPhone' => $issuerPhone,
            'issuerEmail' => $issuerEmail,
            'payToName' => $payToName,
            'payToBusiness' => $payToBusiness,
            'payToAddress' => $payToAddress,
            'documentDate' => $documentDate,
            'referenceNo' => $referenceNo,
            'tableRows' => $tableRows,
            'memoLine' => $memoLine,
        ])->setPaper('letter', 'portrait');

        return $pdf->download($filename);
    }

    /**
     * Driver contractor-style invoice from payslip billing snapshot (matches common Zoho layout).
     */
    public static function payslipInvoice(Payslip $payslip): Response
    {
        $payslip->load(['driver.user']);
        $driver = $payslip->driver;
        $driverRef = $driver && $driver->license_number
            ? (string) $driver->license_number
            : (string) $payslip->driver_id;
        $driverName = $driver?->user?->name ?? ('Driver #'.$payslip->driver_id);

        $trips = TimesheetTrip::query()
            ->where('payslip_id', $payslip->id)
            ->with('employer')
            ->orderBy('trip_date')
            ->orderBy('trip_number')
            ->get();

        $hourRows = self::aggregateBillableAmountsByLabel($trips);
        $subtotal = round((float) ($payslip->agency_billing_subtotal ?? 0), 2);
        if ($hourRows === [] && $subtotal > 0.0001) {
            $hourRows[] = ['description' => 'Trip billing', 'amount' => $subtotal];
        }

        $byEmployerId = [];
        foreach ($trips as $t) {
            $e = $t->employer;
            if ($e) {
                $byEmployerId[(int) $e->id] = $e;
            }
        }
        $employers = collect(array_values($byEmployerId));

        $billToName = '';
        $billToAddress = '';
        if ($employers->count() === 1) {
            $e = $employers->first();
            $billToName = (string) ($e->name ?? '');
            $billToAddress = trim((string) ($e->billing_address ?? ''));
        } elseif ($employers->count() > 1) {
            $billToName = $employers->pluck('name')->filter()->unique()->implode(', ');
            $addrs = $employers->pluck('billing_address')->filter()->unique()->values();
            $billToAddress = $addrs->implode("\n\n");
        }

        if (function_exists('tenant') && tenant()) {
            $t = tenant();
            $profileName = trim((string) ($t->company_legal_name ?? ''));
            $profileAddr = trim((string) ($t->company_address ?? ''));
            if ($profileName !== '' || $profileAddr !== '') {
                $billToName = $profileName;
                $billToAddress = $profileAddr;
            }
        }

        [$issuerName, $issuerAddress] = self::resolveIssuerBlockForDocuments();

        $invoiceDate = Carbon::now()->format('M j, Y');
        $invoiceNumber = $payslip->id.'-'.$payslip->driver_id;

        $taxRows = self::payslipInvoiceTaxRows($payslip);
        $grandTotal = round((float) ($payslip->agency_billing_total ?? 0), 2);

        $payPeriodLabel = self::payslipPeriodLabelText($payslip);
        $filename = self::payslipPeriodDocumentFilename($payslip, $driverName, $driverRef, 'Invoice');

        $pdf = Pdf::loadView('pdf.payslip-invoice', [
            'issuerName' => $issuerName,
            'issuerAddress' => $issuerAddress,
            'invoiceDate' => $invoiceDate,
            'invoiceNumber' => $invoiceNumber,
            'driverName' => $driverName,
            'driverRef' => $driverRef,
            'billToName' => $billToName,
            'billToAddress' => $billToAddress,
            'hourRows' => $hourRows,
            'subtotal' => $subtotal,
            'taxRows' => $taxRows,
            'grandTotal' => $grandTotal,
            'payPeriodLabel' => $payPeriodLabel,
        ])->setPaper('letter', 'portrait');

        return $pdf->download($filename);
    }

    public static function driverCalculation(DriverCalculation $calculation): Response
    {
        $calculation->load(['driver.user', 'payslip']);

        /** @var Payslip|null $payslip */
        $payslip = $calculation->payslip;
        $trips = collect();
        if ($payslip) {
            $trips = TimesheetTrip::query()
                ->where('payslip_id', $payslip->id)
                ->with('employer')
                ->orderBy('trip_date')
                ->orderBy('trip_number')
                ->get();
        }

        $driver = $calculation->driver;
        $driverRef = $driver && $driver->license_number
            ? (string) $driver->license_number
            : (string) $calculation->driver_id;
        $driverName = $driver?->user?->name ?? ('Driver #'.$calculation->driver_id);

        $payrollRows = [];
        $payrollSubtotal = 0.0;
        foreach ($trips as $trip) {
            $employerName = $trip->employer?->name ?? '—';
            $tripNum = $trip->trip_number ? (string) $trip->trip_number : '—';
            $tripDateStr = $trip->trip_date?->format('n-j-Y') ?? '—';
            foreach (TimesheetTripLineService::payableLines($trip) as $row) {
                $line = $row['line'];
                $pay = round((float) ($line['driver_amount'] ?? 0), 2);
                $payrollSubtotal += $pay;
                $payrollRows[] = [
                    'driver_ref' => $driverRef,
                    'driver_name' => $driverName,
                    'employer' => $employerName,
                    'trip_number' => $tripNum,
                    'trip_date' => $tripDateStr,
                    'pay_item' => (string) ($line['label'] ?? $line['line_type'] ?? 'Line'),
                    'qty' => (float) ($line['quantity'] ?? 0),
                    'rate' => (float) ($line['rate'] ?? 0),
                    'pay' => $pay,
                ];
            }
        }

        if ($payrollRows === [] && is_array($calculation->breakdown) && count($calculation->breakdown) > 0) {
            foreach ($calculation->breakdown as $key => $amt) {
                $pay = round((float) $amt, 2);
                $payrollSubtotal += $pay;
                $payrollRows[] = [
                    'driver_ref' => $driverRef,
                    'driver_name' => $driverName,
                    'employer' => '—',
                    'trip_number' => '—',
                    'trip_date' => '—',
                    'pay_item' => (string) $key,
                    'qty' => null,
                    'rate' => null,
                    'pay' => $pay,
                ];
            }
        }

        $tenantLabel = null;
        if (function_exists('tenant') && tenant()) {
            $t = tenant();
            $tenantLabel = $t->name ?? $t->id ?? null;
        }

        $periodLabel = $calculation->period_start && $calculation->period_end
            ? $calculation->period_start->format('m-d-Y').' to '.$calculation->period_end->format('m-d-Y')
            : '';

        $pdf = Pdf::loadView('pdf.driver-calculation', [
            'calculation' => $calculation,
            'title' => 'Driver calculation',
            'tenantLabel' => $tenantLabel,
            'periodLabel' => $periodLabel,
            'payrollRows' => $payrollRows,
            'payrollSubtotal' => round($payrollSubtotal, 2),
        ])->setPaper('a4', 'landscape');

        $downloadName = self::driverCalculationDownloadFilename($calculation, $driverName, $driverRef);

        return $pdf->download($downloadName);
    }

    /**
     * Human-readable download name, e.g. "Walters, Dasilver (A25832) - Feb 15–21, 2026 Calculation.pdf"
     */
    private static function driverCalculationDownloadFilename(
        DriverCalculation $calculation,
        string $driverDisplayName,
        string $driverRefToken
    ): string {
        $ref = preg_replace('/[^\w-]+/u', '', $driverRefToken) ?: (string) $calculation->driver_id;

        $period = 'Calculation period';
        if ($calculation->period_start && $calculation->period_end) {
            $start = Carbon::parse($calculation->period_start);
            $end = Carbon::parse($calculation->period_end);
            $ndash = "\u{2013}";
            if ($start->format('Y-m') === $end->format('Y-m')) {
                $period = $start->format('M j').$ndash.$end->format('j, Y');
            } elseif ($start->format('Y') === $end->format('Y')) {
                $period = $start->format('M j').' '.$ndash.' '.$end->format('M j, Y');
            } else {
                $period = $start->format('M j, Y').' '.$ndash.' '.$end->format('M j, Y');
            }
        }

        $base = $driverDisplayName.' ('.$ref.') - '.$period.' Calculation';
        $base = preg_replace('/[\\\\\\/:\\*\\?\"<>\\|]+/u', '', $base);
        $base = trim(preg_replace('/\s+/u', ' ', $base));

        return $base.'.pdf';
    }

    /**
     * @return list<array{description: string, amount: float}>
     */
    private static function aggregateBillableAmountsByLabel(Collection $trips): array
    {
        $sums = [];
        foreach ($trips as $trip) {
            foreach (TimesheetTripLineService::billableLines($trip) as $row) {
                $line = $row['line'];
                $key = trim((string) ($line['label'] ?? ''));
                if ($key === '') {
                    $key = trim((string) ($line['line_type'] ?? ''));
                }
                if ($key === '') {
                    $key = 'Line';
                }
                $amt = round((float) ($line['agency_amount'] ?? 0), 2);
                if ($amt == 0.0) {
                    continue;
                }
                $sums[$key] = round(($sums[$key] ?? 0) + $amt, 2);
            }
        }
        $out = [];
        foreach ($sums as $desc => $amt) {
            $out[] = ['description' => $desc, 'amount' => $amt];
        }
        usort($out, fn ($a, $b) => strcmp($a['description'], $b['description']));

        return $out;
    }

    /**
     * @return list<array{label: string, amount: float}>
     */
    private static function payslipInvoiceTaxRows(Payslip $payslip): array
    {
        $rows = [];
        $raw = $payslip->billing_tax_lines ?? null;
        $lines = is_array($raw) ? $raw : [];
        if ($lines === [] && is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            $lines = is_array($decoded) ? $decoded : [];
        }
        foreach ($lines as $tl) {
            if (! is_array($tl)) {
                continue;
            }
            $name = (string) ($tl['name'] ?? 'Tax');
            $tt = (string) ($tl['type'] ?? '');
            $tval = (float) ($tl['value'] ?? 0);
            $tamt = (float) ($tl['amount'] ?? 0);
            $suffix = $tt === 'percentage' ? ' ('.number_format($tval, 2).'%)' : ($tt === 'fixed' ? ' (fixed)' : '');
            $rows[] = ['label' => $name.$suffix, 'amount' => $tamt];
        }
        if ($rows !== []) {
            return $rows;
        }
        $fromPct = (float) ($payslip->billing_tax_from_percent ?? 0);
        $fixed = (float) ($payslip->billing_tax_fixed ?? 0);
        $rate = (float) ($payslip->billing_tax_rate ?? 0);
        if ($fromPct > 0.0001) {
            $lbl = 'Tax on subtotal';
            if ($rate > 0.00001) {
                $lbl .= ' ('.number_format($rate * 100, 2).'%)';
            }
            $rows[] = ['label' => $lbl, 'amount' => $fromPct];
        }
        if ($fixed > 0.0001) {
            $rows[] = ['label' => 'Tax (fixed amount)', 'amount' => $fixed];
        }
        $totalTax = (float) ($payslip->billing_tax_amount ?? 0);
        if ($rows === [] && $totalTax > 0.0001) {
            $rows[] = ['label' => 'Tax', 'amount' => $totalTax];
        }

        return $rows;
    }

    public static function payslipPeriodLabelText(Payslip $payslip): string
    {
        if (! $payslip->period_start || ! $payslip->period_end) {
            return '—';
        }
        $start = Carbon::parse($payslip->period_start);
        $end = Carbon::parse($payslip->period_end);
        $ndash = "\u{2013}";
        if ($start->format('Y-m') === $end->format('Y-m')) {
            return $start->format('M j').$ndash.$end->format('j, Y');
        }
        if ($start->format('Y') === $end->format('Y')) {
            return $start->format('M j').' '.$ndash.' '.$end->format('M j, Y');
        }

        return $start->format('M j, Y').' '.$ndash.' '.$end->format('M j, Y');
    }

    private static function payslipPeriodDocumentFilename(Payslip $payslip, string $driverDisplayName, string $driverRefToken, string $documentLabel): string
    {
        $ref = preg_replace('/[^\w-]+/u', '', $driverRefToken) ?: (string) $payslip->driver_id;
        $period = self::payslipPeriodLabelText($payslip);
        $base = $driverDisplayName.' ('.$ref.') - '.$period.' '.$documentLabel;
        $base = preg_replace('/[\\\\\\/:\\*\\?\"<>\\|]+/u', '', $base);
        $base = trim(preg_replace('/\s+/u', ' ', $base));

        return $base.'.pdf';
    }

    /**
     * Issuer block for invoice & remittance PDFs (tenant company profile, then env, then app name).
     *
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private static function resolveIssuerBlockForDocuments(): array
    {
        $issuerName = '';
        $issuerAddress = '';
        $issuerPhone = '';
        $issuerEmail = '';
        if (function_exists('tenant') && tenant()) {
            $t = tenant();
            $issuerName = trim((string) ($t->company_legal_name ?? ''));
            $issuerAddress = trim((string) ($t->company_address ?? ''));
            $issuerPhone = trim((string) ($t->company_phone ?? ''));
            $issuerEmail = trim((string) ($t->company_email ?? ''));
        }

        $envLegal = config('financial.payslip_invoice.issuer_legal_name');
        if ($issuerName === '' && is_string($envLegal) && $envLegal !== '') {
            $issuerName = $envLegal;
        }
        if ($issuerName === '' && function_exists('tenant') && tenant()) {
            $issuerName = (string) (tenant()->name ?? tenant('id') ?? '');
        }
        if ($issuerName === '') {
            $issuerName = (string) config('app.name', 'Company');
        }

        if ($issuerAddress === '') {
            $ia = config('financial.payslip_invoice.issuer_address');
            $issuerAddress = is_string($ia) ? trim($ia) : '';
        }
        if ($issuerAddress === '') {
            $rf = config('financial.payslip_invoice.remit_address');
            $issuerAddress = is_string($rf) ? trim($rf) : '';
        }

        return [$issuerName, $issuerAddress, $issuerPhone, $issuerEmail];
    }
}
