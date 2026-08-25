<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimesheetDocumentReview extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_ADJUSTMENT_REQUESTED = 'adjustment_requested';

    public const STATUS_SUPERSEDED = 'superseded';

    public const STATUS_EXPIRED = 'expired';

    public const ADJUSTMENT_OPEN = 'open';

    public const ADJUSTMENT_IN_PROGRESS = 'in_progress';

    public const ADJUSTMENT_RESOLVED = 'resolved';

    public const ADJUSTMENT_DISMISSED = 'dismissed';

    protected $fillable = [
        'tenant_id',
        'timesheet_id',
        'invoice_document_id',
        'calculation_document_id',
        'driver_id',
        'token',
        'status',
        'token_expires_at',
        'sent_at',
        'sent_by',
        'driver_name',
        'driver_email',
        'reviewed_at',
        'adjustment_comment',
        'adjustment_status',
        'admin_notes',
        'resolved_at',
        'resolved_by',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    protected $hidden = [
        'token',
    ];

    protected $appends = [
        'status_label',
    ];

    public function timesheet(): BelongsTo
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function invoiceDocument(): BelongsTo
    {
        return $this->belongsTo(TimesheetDocument::class, 'invoice_document_id');
    }

    public function calculationDocument(): BelongsTo
    {
        return $this->belongsTo(TimesheetDocument::class, 'calculation_document_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(TimesheetDocumentReviewEvent::class)->orderByDesc('id');
    }

    public function isActionable(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }
        if ($this->token_expires_at && $this->token_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function statusLabel(): string
    {
        if ($this->status === self::STATUS_ADJUSTMENT_REQUESTED) {
            return match ($this->adjustment_status) {
                self::ADJUSTMENT_IN_PROGRESS => 'Adjustment In Progress',
                self::ADJUSTMENT_RESOLVED => 'Adjustment Resolved',
                self::ADJUSTMENT_DISMISSED => 'Adjustment Dismissed',
                default => 'Adjustment Requested',
            };
        }

        return match ($this->status) {
            self::STATUS_PENDING => 'Pending Review',
            self::STATUS_APPROVED => 'Confirmed',
            self::STATUS_SUPERSEDED => 'Superseded',
            self::STATUS_EXPIRED => 'Expired',
            default => $this->status,
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->statusLabel();
    }
}
