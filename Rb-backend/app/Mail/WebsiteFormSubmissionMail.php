<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Storage;

class WebsiteFormSubmissionMail extends Mailable
{
    /**
     * @param  array<string, string|null>  $fields
     */
    public function __construct(
        public string $emailSubject,
        public string $formName,
        public array $fields,
        public string $fromAddress,
        public string $fromName,
        public ?string $replyToEmail = null,
        public ?string $replyToName = null,
        public ?string $attachmentPath = null,
        public ?string $attachmentName = null,
        public string $attachmentDisk = 'local',
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = [];
        if (filled($this->replyToEmail) && filter_var($this->replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $replyTo[] = new Address(
                $this->replyToEmail,
                filled($this->replyToName) ? (string) $this->replyToName : $this->replyToEmail
            );
        }

        return new Envelope(
            subject: $this->emailSubject,
            from: new Address($this->fromAddress, $this->fromName),
            replyTo: $replyTo,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->htmlBody(),
        );
    }

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        if (! filled($this->attachmentPath)) {
            return [];
        }

        try {
            if (! Storage::disk($this->attachmentDisk)->exists($this->attachmentPath)) {
                return [];
            }
        } catch (\Throwable) {
            return [];
        }

        $name = $this->attachmentName ?: basename($this->attachmentPath);

        return [
            Attachment::fromStorageDisk($this->attachmentDisk, $this->attachmentPath)
                ->as($name),
        ];
    }

    private function htmlBody(): string
    {
        $rows = '';
        foreach ($this->fields as $label => $value) {
            $display = filled($value) ? e((string) $value) : '—';
            $rows .= '<tr>'
                .'<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;width:180px;color:#6b7280;font-size:13px;vertical-align:top;">'.e((string) $label).'</td>'
                .'<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;line-height:1.5;white-space:pre-wrap;">'.$display.'</td>'
                .'</tr>';
        }

        $formName = e($this->formName);

        return <<<HTML
<!doctype html>
<html lang="en">
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f3f4f6;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px;background:#075da8;color:#ffffff;">
<p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">Website form entry</p>
<h1 style="margin:0;font-size:24px;">{$formName}</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
A new submission was received on the public website and saved in the dashboard under Website → Forms and Submissions.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">{$rows}</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
