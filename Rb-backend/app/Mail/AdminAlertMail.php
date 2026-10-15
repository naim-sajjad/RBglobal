<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AdminAlertMail extends Mailable
{
    public function __construct(
        public string $emailSubject,
        public string $htmlBody,
        public string $plainBody,
    ) {}

    public function envelope(): Envelope
    {
        $fromAddr = (string) config('mail.from.address', 'noreply@gennextglobaltech.ca');
        $fromName = (string) config('mail.from.name', 'R&B Services Plus');

        return new Envelope(
            subject: $this->emailSubject,
            from: new Address($fromAddr, $fromName),
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.driver-pay-stub-html',
            text: 'emails.timesheet-document-review-text',
            with: [
                'htmlBody' => $this->htmlBody,
                'plainBody' => $this->plainBody,
            ],
        );
    }
}
