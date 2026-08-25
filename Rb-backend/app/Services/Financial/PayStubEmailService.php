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

    public static function buildSubject(Payslip $payslip): string
    {
        return self::rendered($payslip)['subject'];
    }

    public static function buildBody(Payslip $payslip): string
    {
        return self::rendered($payslip)['body_text'];
    }

    /**
     * @return array{subject: string, body_html: string, body_text: string}
     */
    public static function rendered(Payslip $payslip): array
    {
        $period = FinancialPdfService::payslipPeriodLabelText($payslip);
        $company = EmailTemplateService::companyName($payslip->tenant_id);
        $driverName = trim((string) ($payslip->driver?->user?->name ?? 'Driver'));
        $vars = [
            'company_name' => $company,
            'period' => $period,
            'driver_name' => $driverName !== '' ? $driverName : 'Driver',
            'week_start' => $payslip->period_start?->format('M j, Y') ?? '',
            'week_end' => $payslip->period_end?->format('M j, Y') ?? '',
            ...EmailTemplateService::legacyContactEmails($payslip->tenant_id),
        ];

        $template = EmailTemplateService::findActive(
            $payslip->tenant_id,
            \App\Models\EmailTemplate::KEY_PAY_STUB
        );

        if ($template) {
            return EmailTemplateService::renderTemplate($template, $vars);
        }

        $ndash = "\u{2013}";

        return [
            'subject' => 'Pay stub '.$ndash.' '.$period,
            'body_html' => '<p>'.e("Please find your pay stub for the pay period of {$period}, attached.").'</p>',
            'body_text' => "Please find your pay stub for the pay period of {$period}, attached.",
        ];
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
        $rendered = self::rendered($payslip);

        $fromName = (string) config('financial.pay_stub_email.from_name', config('mail.from.name', 'Finance'));

        $mailable = new DriverPayStubMail(
            $rendered['subject'],
            $rendered['body_text'],
            $pdf['filename'],
            $pdf['content'],
            $fromName,
            $rendered['body_html'],
        );

        $mail = Mail::to([new Address($to, $recipientName)]);
        if ($cc !== []) {
            $mail->cc($cc);
        }
        $mail->send($mailable);
    }
}
