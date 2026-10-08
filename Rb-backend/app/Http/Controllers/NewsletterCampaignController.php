<?php

namespace App\Http\Controllers;

use App\Jobs\SendNewsletterPromotion;
use App\Mail\NewsletterPromotion;
use App\Models\NewsletterCampaign;
use App\Support\BlogHtml;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class NewsletterCampaignController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => NewsletterCampaign::latest()->limit(100)->get()->map(fn ($campaign) => $this->summary($campaign))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        return response()->json(['data' => $this->summary(NewsletterCampaign::create($data))], 201);
    }

    public function update(Request $request, NewsletterCampaign $campaign): JsonResponse
    {
        DB::transaction(function () use ($request, $campaign): void {
            $locked = NewsletterCampaign::whereKey($campaign->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'draft', 422, 'A sent campaign cannot be edited.');
            $locked->update($this->validated($request));
        });
        return response()->json(['data' => $this->summary($campaign->fresh())]);
    }

    public function test(Request $request, NewsletterCampaign $campaign): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        Mail::to($data['email'])->send(new NewsletterPromotion('[TEST] '.$campaign->subject, $campaign->body));
        return response()->json(['message' => 'Test email sent.']);
    }

    public function send(Request $request, NewsletterCampaign $campaign): JsonResponse
    {
        $data = $request->validate(['recipient_count' => ['required', 'integer', 'min:1']]);
        DB::transaction(function () use ($campaign, $data): void {
            $locked = NewsletterCampaign::whereKey($campaign->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'draft', 422, 'This campaign has already been queued.');
            $query = $locked->eligibleSubscribers();
            $count = (clone $query)->count();
            abort_unless($count === $data['recipient_count'], 422, 'The audience changed. Refresh and review the recipient count again.');
            $locked->update(['status' => 'queued', 'sent_at' => now()]);
            $query->chunkById(200, function ($subscribers) use ($locked): void {
                foreach ($subscribers as $subscriber) {
                    $id = DB::table('newsletter_deliveries')->insertGetId([
                        'campaign_id' => $locked->id, 'subscriber_id' => $subscriber->id, 'status' => 'queued',
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    SendNewsletterPromotion::dispatch($id)->onQueue('newsletter')->afterCommit();
                }
            });
        });
        return response()->json(['data' => $this->summary($campaign->fresh()), 'message' => 'Campaign queued for delivery.']);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'], 'body' => ['required', 'string', 'max:100000'],
            'audience' => ['required', Rule::in(['all', 'seeker', 'employer'])],
        ]);
        $data['body'] = BlogHtml::clean($data['body']);
        abort_unless(trim(strip_tags($data['body'])) !== '', 422, 'Enter an email message.');
        return $data;
    }

    private function summary(NewsletterCampaign $campaign): array
    {
        $counts = DB::table('newsletter_deliveries')->where('campaign_id', $campaign->id)->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');
        $pending = ($counts['queued'] ?? 0) + ($counts['sending'] ?? 0);
        return array_merge($campaign->toArray(), [
            'status' => $campaign->status === 'draft' ? 'draft' : ($pending ? 'queued' : (($counts['failed'] ?? 0) ? 'completed_with_errors' : 'completed')),
            'recipient_count' => $campaign->status === 'draft' ? $campaign->eligibleSubscribers()->count() : $counts->sum(),
            'sent_count' => $counts['sent'] ?? 0, 'failed_count' => $counts['failed'] ?? 0,
            'skipped_count' => $counts['skipped'] ?? 0, 'pending_count' => $pending,
        ]);
    }
}
