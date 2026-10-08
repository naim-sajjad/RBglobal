<?php

namespace App\Jobs;

use App\Mail\NewsletterPromotion;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendNewsletterPromotion implements ShouldQueue
{
    use Queueable;

    // Avoid automatically sending a duplicate after an ambiguous SMTP timeout.
    public int $tries = 1;
    public int $timeout = 60;

    public function __construct(public int $deliveryId) {}

    public function handle(): void
    {
        $claimed = DB::table('newsletter_deliveries')->where('id', $this->deliveryId)->where('status', 'queued')
            ->update(['status' => 'sending', 'updated_at' => now()]);
        if (! $claimed) return;
        $delivery = DB::table('newsletter_deliveries')->find($this->deliveryId);
        $campaign = NewsletterCampaign::findOrFail($delivery->campaign_id);
        $subscriber = NewsletterSubscriber::find($delivery->subscriber_id);
        if (! $subscriber || ! $subscriber->consent || $subscriber->status !== NewsletterSubscriber::STATUS_ACTIVE) {
            $this->finish('skipped');
            return;
        }
        try {
            Mail::to($subscriber->email)->send(new NewsletterPromotion($campaign->subject, $campaign->body,
                url('/api/newsletter/unsubscribe/'.$subscriber->unsubscribe_token)));
            $this->finish('sent');
        } catch (\Throwable $error) {
            $this->finish('failed');
            throw $error;
        }
    }

    public function failed(?\Throwable $error): void
    {
        $this->finish('failed');
    }

    private function finish(string $status): void
    {
        DB::table('newsletter_deliveries')->where('id', $this->deliveryId)->whereIn('status', ['queued', 'sending'])
            ->update(['status' => $status, 'sent_at' => $status === 'sent' ? now() : null, 'updated_at' => now()]);
    }
}
