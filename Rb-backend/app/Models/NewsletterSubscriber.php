<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\SoftDeletes;

class NewsletterSubscriber extends Model
{
    use SoftDeletes;
    public const STATUS_ACTIVE = 'active';
    public const STATUS_UNSUBSCRIBED = 'unsubscribed';
    public const STATUS_BLOCKED = 'blocked';

    protected $fillable = [
        'email',
        'name',
        'role',
        'subscriber_type',
        'form_key',
        'form_name',
        'consent',
        'consent_at',
        'status',
        'source',
        'original_submitted_at',
        'unsubscribe_token',
        'subscribed_at',
        'unsubscribed_at',
        'import_batch_id',
        'imported_at',
        'imported_by',
        'import_source_file',
        'deleted_by',
        'restored_by',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'consent' => 'boolean',
            'consent_at' => 'datetime',
            'original_submitted_at' => 'datetime',
            'imported_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (NewsletterSubscriber $subscriber): void {
            if (! $subscriber->unsubscribe_token) {
                $subscriber->unsubscribe_token = Str::random(64);
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeUnsubscribed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_UNSUBSCRIBED);
    }

    public function scopeLatestSubscribers(Builder $query): Builder
    {
        return $query->latest('subscribed_at');
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
