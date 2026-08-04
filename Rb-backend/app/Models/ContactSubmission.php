<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContactSubmission extends Model
{
    use SoftDeletes;
    public const STATUS_UNREAD = 'unread';
    public const STATUS_READ = 'read';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'secondary_email',
        'phone',
        'secondary_phone',
        'location',
        'role',
        'form_key',
        'form_name',
        'subject',
        'message',
        'status',
        'read_at',
        'original_created_at',
        'email_subscriber_status',
        'sms_subscriber_status',
        'last_activity',
        'last_activity_at',
        'source',
        'language',
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
            'read_at' => 'datetime',
            'original_created_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'imported_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_UNREAD);
    }

    public function scopeLatestSubmissions(Builder $query): Builder
    {
        return $query->latest('created_at');
    }
}
