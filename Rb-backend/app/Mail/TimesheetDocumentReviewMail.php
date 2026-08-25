<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TimesheetDocumentReviewMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $emailSubject,
        public string $htmlBody,
        public string $plainBody,
        public string $invoiceFilename,
        public string $invoiceBinary,
        public string $calculationFilename,
        public string $calculationBinary,
        public string $fromName,
    ) {}

    public function envelope(): Envelope
    {
        $fromAddr = (string) config('mail.from.address', 'hello@example.com');

        return new Envelope(
            subject: $this->emailSubject,
            from: new Address($fromAddr, $this->fromName),
            replyTo: [
                new Address($fromAddr, $this->fromName),
            ],
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

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->invoiceBinary, $this->invoiceFilename)
                ->withMime('application/pdf'),
            Attachment::fromData(fn () => $this->calculationBinary, $this->calculationFilename)
                ->withMime('application/pdf'),
        ];
    }
}
