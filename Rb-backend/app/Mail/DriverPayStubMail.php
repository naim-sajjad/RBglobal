<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DriverPayStubMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $emailSubject,
        public string $plainBody,
        public string $pdfFilename,
        public string $pdfBinary,
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
            text: 'emails.driver-pay-stub',
        );
    }

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfBinary, $this->pdfFilename)
                ->withMime('application/pdf'),
        ];
    }
}
