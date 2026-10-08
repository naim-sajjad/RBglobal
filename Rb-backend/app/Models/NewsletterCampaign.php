<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class NewsletterCampaign extends Model
{
    protected $fillable = ['subject', 'body', 'audience', 'status', 'sent_at'];

    public function eligibleSubscribers(): Builder
    {
        return NewsletterSubscriber::query()->active()->where('consent', true)
            ->when($this->audience !== 'all', fn ($query) => $query->where('role', $this->audience));
    }
}
