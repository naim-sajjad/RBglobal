<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BlogPost extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'status',
        'published_at',
        'reading_time',
        'seo_title',
        'meta_description',
        'cta_title',
        'cta_description',
        'cta_button_label',
        'cta_button_url',
        'content_format',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'reading_time' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)->where('published_at', '>', now());
    }

    public function scopeLatestPosts(Builder $query): Builder
    {
        return $query->latest('created_at');
    }
}
