<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportBatch extends Model
{
    public const TYPE_CONTACTS = 'contacts';
    public const TYPE_NEWSLETTER_SUBSCRIBERS = 'newsletter_subscribers';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_COMPLETED_WITH_ERRORS = 'completed_with_errors';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'type',
        'original_filename',
        'stored_filename',
        'status',
        'total_rows',
        'imported_rows',
        'skipped_rows',
        'failed_rows',
        'duplicate_rows',
        'active_rows',
        'non_consented_rows',
        'error_file_path',
        'imported_by',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ContactSubmission::class);
    }
}
