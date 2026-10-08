<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewsletterPromotion extends Mailable
{
    public function __construct(public string $promotionSubject, public string $body, public ?string $unsubscribeUrl = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->promotionSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.newsletter-promotion');
    }
}
