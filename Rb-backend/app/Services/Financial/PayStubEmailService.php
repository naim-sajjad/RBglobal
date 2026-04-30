<?php

namespace App\Services\Financial;

use App\Mail\DriverPayStubMail;
use App\Models\Payslip;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Facades\Mail;
use Stancl\Tenancy\Database\Models\Tenant;

class PayStubEmailService
{
    /**
     * Parse comma/newline/semicolon-separated addresses into unique valid emails.
     *
     * @return list<string>
     */
    public static function parseEmailList(?string $raw): array
    {
        if ($raw === null || trim($raw) === '') {
            return [];
        }
        $parts = preg_split('/[\s,;|]+/u', $raw, -1, PREG_SPLIT_NO_EMPTY);
        if (! is_array($parts)) {
            return [];
        }
        $out = [];
        foreach ($parts as $p) {
            $e = strtolower(trim((string) $p));
            if ($e === '' || ! filter_var($e, FILTER_VALIDATE_EMAIL)) {
                continue;
            }
            $out[$e] = $e;
        }

        return array_values($out);
    }

    /**
     * CC = env config (PAY_STUB_EMAIL_CC) ∪ tenant company profile field pay_stub_cc_emails.
     *
     * @return list<string>
     */
    public static function resolveCcAddresses(?string $tenantId, string $excludeEmail): array
    {
        $exclude = strtolower(trim($excludeEmail));

        $fromConfig = config('financial.pay_stub_email.cc_addresses', []);
        if (! is_array($fromConfig)) {
            $fromConfig = [];
        }
        $merged = [];
        foreach ($fromConfig as $e) {
            $e = strtolower(trim((string) $e));
            if ($e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)) {
                $merged[$e] = $e;
            }
        }

        $tenantRaw = '';
        if ($tenantId !== null && $tenantId !== '') {
            $t = Tenant::query()->find($tenantId);
            if ($t !== null) {
                $tenantRaw = (string) ($t->pay_stub_cc_emails ?? '');
            }
        }
        foreach (self::parseEmailList($tenantRaw) as $e) {
            $merged[$e] = $e;
        }

        unset($merged[$exclude]);

        return array_values($merged);
    }

    public static function buildBody(Payslip $payslip): string
    {
        $period = FinancialPdfService::payslipPeriodLabelText($payslip);

        return <<<TXT
Please find your pay stub for the pay period of {$period}, attached. You will receive your pay over the weekend. Kindly forward the calculation sheet and invoice to us in a new email with the same subject line.

Adjustments:
Kindly send all adjustment requests to adjustments@randbservicesplug.ca to ensure they are not missed.

Document request:
Requests for experience letters and other documents will be processed within 3–5 business days. Requests should be sent to asita@randbservicesplus.ca.

Kind regards,
R&B Finance
TXT;
    }

    public static function buildSubject(Payslip $payslip): string
    {
        $period = FinancialPdfService::payslipPeriodLabelText($payslip);
        $ndash = "\u{2013}";

        return 'Pay stub '.$ndash.' '.$period;
    }

    public static function send(Payslip $payslip): void
    {
        $payslip->loadMissing(['driver.user', 'trips', 'remittances']);

        $driver = $payslip->driver;
        $user = $driver?->user;
        $to = $user !== null ? strtolower(trim((string) ($user->email ?? ''))) : '';
        if ($to === '' || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Driver has no valid user email on file.');
        }

        $recipientName = trim((string) ($user->name ?? ''));
        if ($recipientName === '') {
            $recipientName = 'Driver';
        }

        $pdf = FinancialPdfService::payslipPdfBinary($payslip);
        $cc = self::resolveCcAddresses($payslip->tenant_id, $to);

        $fromName = (string) config('financial.pay_stub_email.from_name', config('mail.from.name', 'Finance'));

        $mailable = new DriverPayStubMail(
            self::buildSubject($payslip),
            self::buildBody($payslip),
            $pdf['filename'],
            $pdf['content'],
            $fromName,
        );

        $mail = Mail::to([new Address($to, $recipientName)]);
        if ($cc !== []) {
            $mail->cc($cc);
        }
        $mail->send($mailable);
    }
}
