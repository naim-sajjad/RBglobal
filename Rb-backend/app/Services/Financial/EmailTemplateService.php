<?php

namespace App\Services\Financial;

use App\Models\EmailTemplate;
use Stancl\Tenancy\Database\Models\Tenant;

class EmailTemplateService
{
    public const DEFAULT_ADJUSTMENTS_EMAIL = 'adjustments@randbservicesplus.ca';

    public const DEFAULT_CLEARANCE_EMAIL = 'asifa@randbservicesplus.ca';

    /**
     * Legacy contact emails (in-app review still offers mailto to these).
     *
     * @return array{adjustments_email: string, clearance_email: string}
     */
    public static function legacyContactEmails(?string $tenantId): array
    {
        $adjustments = self::DEFAULT_ADJUSTMENTS_EMAIL;
        $clearance = self::DEFAULT_CLEARANCE_EMAIL;

        if ($tenantId) {
            $tenant = Tenant::query()->find($tenantId);
            if ($tenant) {
                $a = trim((string) ($tenant->adjustments_email ?? ''));
                $c = trim((string) ($tenant->clearance_email ?? ''));
                if ($a !== '' && filter_var($a, FILTER_VALIDATE_EMAIL)) {
                    $adjustments = $a;
                }
                if ($c !== '' && filter_var($c, FILTER_VALIDATE_EMAIL)) {
                    $clearance = $c;
                }
            }
        }

        return [
            'adjustments_email' => $adjustments,
            'clearance_email' => $clearance,
        ];
    }

    /**
     * Built-in templates seeded per tenant on first access.
     *
     * @return array<string, array{name: string, subject: string, body_html: string, body_text: string, placeholders: list<string>}>
     */
    public static function catalog(): array
    {
        return [
            EmailTemplate::KEY_PAY_STUB => [
                'name' => 'Pay stub',
                'subject' => '{{company_name}} - {{period}}',
                'body_html' => <<<'HTML'
<p>Good evening,</p>
<p>Please find your pay stub for the pay period of <strong>{{period}}</strong>, attached. You will receive your pay over the weekend.</p>
<p style="background:#fff59d;padding:6px 8px;"><strong>Kindly forward the calculation sheet and invoice to us in a new email with the same subject line.</strong></p>
<p><strong>Adjustments:</strong><br>
You can request an adjustment in the app from your review link, or email <a href="mailto:{{adjustments_email}}">{{adjustments_email}}</a> to ensure it is not missed.</p>
<p><strong>Document / Clearance Request:</strong><br>
Requests for Experience Letters and other documents will be processed within 3–5 business days. Requests should be sent to <a href="mailto:{{clearance_email}}">{{clearance_email}}</a>.</p>
<p>Kind regards,<br>{{company_name}}</p>
HTML,
                'body_text' => <<<'TXT'
Good evening,

Please find your pay stub for the pay period of {{period}}, attached. You will receive your pay over the weekend.

Kindly forward the calculation sheet and invoice to us in a new email with the same subject line.

Adjustments:
You can request an adjustment in the app from your review link, or email {{adjustments_email}} to ensure it is not missed.

Document / Clearance Request:
Requests for Experience Letters and other documents will be processed within 3–5 business days. Requests should be sent to {{clearance_email}}.

Kind regards,
{{company_name}}
TXT,
                'placeholders' => [
                    'company_name',
                    'period',
                    'driver_name',
                    'week_start',
                    'week_end',
                    'adjustments_email',
                    'clearance_email',
                ],
            ],
            EmailTemplate::KEY_TIMESHEET_DOCUMENT_REVIEW => [
                'name' => 'Timesheet document review',
                'subject' => '{{company_name}} - Timesheet review - {{period}}',
                'body_html' => <<<'HTML'
<p>Hi {{driver_name}},</p>
<p>Your timesheet documents for <strong>{{period}}</strong> are ready for review. Please open the calculation sheet and invoice, then choose one of the options below.</p>
<p>
  <a href="{{invoice_url}}" style="display:inline-block;padding:10px 16px;background:#27272a;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;margin:0 0 8px;">View Invoice</a><br>
  <a href="{{calculation_url}}" style="display:inline-block;padding:10px 16px;background:#27272a;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;margin:0 0 8px;">View Calculation Sheet</a>
</p>
<p><strong>In the app:</strong></p>
<p>
  <a href="{{approve_url}}" style="display:inline-block;padding:12px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700;margin:0 0 8px;">Everything is Fine</a><br>
  <a href="{{adjust_url}}" style="display:inline-block;padding:10px 16px;background:#fff;color:#b91c1c;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #fecaca;margin:0 0 8px;">Request Adjustment</a>
</p>
<p><strong>Or use the legacy email process:</strong><br>
Adjustments: <a href="mailto:{{adjustments_email}}">{{adjustments_email}}</a><br>
Clearance / documents: <a href="mailto:{{clearance_email}}">{{clearance_email}}</a></p>
<p style="font-size:12px;color:#71717a;">Both PDFs are also attached. Full review page: <a href="{{review_url}}">{{review_url}}</a></p>
<p style="font-size:11px;color:#a1a1aa;">This link expires in 14 days. If documents are updated later, this link will stop working and you will receive a new email.</p>
<p>Kind regards,<br>{{company_name}}</p>
HTML,
                'body_text' => <<<'TXT'
Hi {{driver_name}},

Your timesheet documents for {{period}} are ready for review.

View Invoice: {{invoice_url}}
View Calculation Sheet: {{calculation_url}}

In the app:
Everything is Fine: {{approve_url}}
Request Adjustment: {{adjust_url}}

Or use the legacy email process:
Adjustments: {{adjustments_email}}
Clearance / documents: {{clearance_email}}

Full review page: {{review_url}}

Both PDFs are attached. This link expires in 14 days.

Kind regards,
{{company_name}}
TXT,
                'placeholders' => [
                    'company_name',
                    'period',
                    'driver_name',
                    'review_url',
                    'approve_url',
                    'adjust_url',
                    'invoice_url',
                    'calculation_url',
                    'adjustments_email',
                    'clearance_email',
                ],
            ],
        ];
    }

    public static function companyName(?string $tenantId): string
    {
        if ($tenantId) {
            $tenant = Tenant::query()->find($tenantId);
            if ($tenant) {
                $legal = trim((string) ($tenant->company_legal_name ?? ''));
                if ($legal !== '') {
                    return $legal;
                }
                $name = trim((string) ($tenant->name ?? ''));
                if ($name !== '') {
                    return $name;
                }
            }
        }

        return (string) config('app.name', 'R&B Services');
    }

    /**
     * Ensure catalog templates exist for the tenant and return them.
     *
     * @return list<EmailTemplate>
     */
    public static function ensureForTenant(?string $tenantId): array
    {
        $out = [];
        foreach (self::catalog() as $key => $def) {
            $template = EmailTemplate::query()
                ->where('tenant_id', $tenantId)
                ->where('key', $key)
                ->first();

            if (! $template) {
                $template = EmailTemplate::create([
                    'tenant_id' => $tenantId,
                    'key' => $key,
                    'name' => $def['name'],
                    'subject' => $def['subject'],
                    'body_html' => $def['body_html'],
                    'body_text' => $def['body_text'],
                    'is_active' => true,
                ]);
            }
            $out[] = $template;
        }

        return $out;
    }

    public static function findActive(?string $tenantId, string $key): ?EmailTemplate
    {
        self::ensureForTenant($tenantId);

        return EmailTemplate::query()
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->where('is_active', true)
            ->first();
    }

    /**
     * @param  array<string, string|null>  $vars
     */
    public static function render(string $template, array $vars): string
    {
        $replacements = [];
        foreach ($vars as $key => $value) {
            $replacements['{{'.$key.'}}'] = (string) ($value ?? '');
        }

        return strtr($template, $replacements);
    }

    /**
     * @param  array<string, string|null>  $vars
     * @return array{subject: string, body_html: string, body_text: string}
     */
    public static function renderTemplate(EmailTemplate $template, array $vars): array
    {
        $html = self::render($template->body_html, $vars);
        $text = $template->body_text
            ? self::render($template->body_text, $vars)
            : trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], ["\n", "\n", "\n", "\n\n"], $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        return [
            'subject' => self::render($template->subject, $vars),
            'body_html' => $html,
            'body_text' => $text,
        ];
    }

    public static function resetToDefault(?string $tenantId, string $key): EmailTemplate
    {
        $catalog = self::catalog();
        if (! isset($catalog[$key])) {
            throw new \InvalidArgumentException('Unknown email template key.');
        }
        $def = $catalog[$key];

        $template = EmailTemplate::query()
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->first();

        if (! $template) {
            return EmailTemplate::create([
                'tenant_id' => $tenantId,
                'key' => $key,
                'name' => $def['name'],
                'subject' => $def['subject'],
                'body_html' => $def['body_html'],
                'body_text' => $def['body_text'],
                'is_active' => true,
            ]);
        }

        $template->update([
            'name' => $def['name'],
            'subject' => $def['subject'],
            'body_html' => $def['body_html'],
            'body_text' => $def['body_text'],
            'is_active' => true,
        ]);

        return $template->fresh();
    }
}
