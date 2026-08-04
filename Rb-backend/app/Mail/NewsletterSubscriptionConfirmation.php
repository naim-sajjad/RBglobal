<?php

namespace App\Mail;

use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterSubscriptionConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public NewsletterSubscriber $subscriber) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to the R&B Services Plus newsletter',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter-subscription-confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
