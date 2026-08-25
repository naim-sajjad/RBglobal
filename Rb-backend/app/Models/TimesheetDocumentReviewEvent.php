<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimesheetDocumentReviewEvent extends Model
{
    use HasFactory;

    public const SENT = 'sent';

    public const APPROVED = 'approved';

    public const ADJUSTMENT_REQUESTED = 'adjustment_requested';

    public const ADJUSTMENT_STATUS_UPDATED = 'adjustment_status_updated';

    public const SUPERSEDED = 'superseded';

    public const DOCUMENT_VIEWED = 'document_viewed';

    protected $fillable = [
        'timesheet_document_review_id',
        'event_type',
        'actor_type',
        'actor_id',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(TimesheetDocumentReview::class, 'timesheet_document_review_id');
    }
}
