<?php

namespace Tests\Feature;

use App\Jobs\SendNewsletterPromotion;
use App\Mail\NewsletterPromotion;
use App\Models\NewsletterSubscriber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NewsletterCampaignTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        (require database_path('migrations/2026_07_10_000001_create_newsletter_subscribers_table.php'))->up();
        Schema::table('newsletter_subscribers', function ($table): void {
            $table->boolean('consent')->default(false);
            $table->string('subscriber_type')->nullable();
            $table->softDeletes();
        });
        (require database_path('migrations/2026_10_08_000001_create_newsletter_campaigns.php'))->up();
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);
        Mail::fake(); Queue::fake();
    }

    private function subscriber(string $email, string $role = 'seeker', string $status = 'active', bool $consent = true): NewsletterSubscriber
    {
        return NewsletterSubscriber::create(['email' => $email, 'role' => $role, 'subscriber_type' => $role === 'seeker' ? 'job_seeker' : 'employer', 'status' => $status, 'consent' => $consent, 'subscribed_at' => now()]);
    }

    private function campaign(string $audience = 'all'): int
    {
        return $this->postJson('/api/admin/newsletter-campaigns', [
            'subject' => 'Career updates', 'body' => '<p><strong>Hello</strong></p><script>bad()</script>', 'audience' => $audience,
        ])->assertCreated()->assertJsonPath('data.body', '<p><strong>Hello</strong></p>')->json('data.id');
    }

    public function test_campaigns_only_queue_consented_active_subscribers_in_selected_audience(): void
    {
        $eligible = $this->subscriber('seeker@example.com');
        $this->subscriber('employer@example.com', 'employer');
        $this->subscriber('blocked@example.com', 'seeker', 'blocked');
        $this->subscriber('optedout@example.com', 'seeker', 'unsubscribed');
        $this->subscriber('noconsent@example.com', 'seeker', 'active', false);
        $this->subscriber('deleted@example.com')->delete();
        $id = $this->campaign('seeker');
        $this->getJson('/api/admin/newsletter-campaigns')->assertOk()->assertJsonPath('data.0.recipient_count', 1);
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 2])->assertUnprocessable();
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 1])->assertOk();
        Queue::assertPushed(SendNewsletterPromotion::class, 1);
        $this->assertSame($eligible->id, (int) DB::table('newsletter_deliveries')->value('subscriber_id'));
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 1])->assertUnprocessable();
        Queue::assertPushed(SendNewsletterPromotion::class, 1);
        $deliveryId = DB::table('newsletter_deliveries')->value('id');
        (new SendNewsletterPromotion($deliveryId))->handle();
        (new SendNewsletterPromotion($deliveryId))->handle();
        Mail::assertSent(NewsletterPromotion::class, 1);
        Mail::assertSent(NewsletterPromotion::class, fn ($mail) => $mail->hasTo('seeker@example.com') && str_contains($mail->unsubscribeUrl, $eligible->unsubscribe_token));
        $this->getJson('/api/admin/newsletter-campaigns')->assertOk()->assertJsonPath('data.0.status', 'completed')->assertJsonPath('data.0.sent_count', 1);
    }

    public function test_unsubscribe_after_queueing_prevents_delivery_and_test_email_only_goes_to_test_address(): void
    {
        $subscriber = $this->subscriber('subscriber@example.com');
        $id = $this->campaign();
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/test', ['email' => 'admin-test@example.com'])->assertOk();
        Mail::assertSent(NewsletterPromotion::class, fn ($mail) => $mail->hasTo('admin-test@example.com') && $mail->unsubscribeUrl === null);
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 1])->assertOk();
        $subscriber->update(['status' => 'unsubscribed']);
        (new SendNewsletterPromotion(DB::table('newsletter_deliveries')->value('id')))->handle();
        Mail::assertSent(NewsletterPromotion::class, 1);
        $this->getJson('/api/admin/newsletter-campaigns')->assertOk()->assertJsonPath('data.0.skipped_count', 1);
    }

    public function test_sent_campaigns_cannot_be_modified_and_empty_audiences_cannot_be_sent(): void
    {
        $id = $this->campaign();
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 0])->assertUnprocessable();
        $this->subscriber('one@example.com');
        $this->postJson('/api/admin/newsletter-campaigns/'.$id.'/send', ['recipient_count' => 1])->assertOk();
        $this->putJson('/api/admin/newsletter-campaigns/'.$id, ['subject' => 'Changed', 'body' => '<p>Changed</p>', 'audience' => 'all'])->assertUnprocessable();
    }
}
