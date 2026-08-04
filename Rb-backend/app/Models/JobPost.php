<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPost extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'title',
        'slug',
        'location',
        'category',
        'job_type',
        'application_form_key',
        'application_form_name',
        'image',
        'bullets',
        'note',
        'application_email',
        'application_url',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'bullets' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PUBLISHED)
            ->where(fn (Builder $query) => $query->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }
}
