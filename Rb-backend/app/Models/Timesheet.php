<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timesheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'employer_id',
        'tenant_id',
        'week_start_date',
        'week_end_date',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'paid_at',
        'paid_by',
        'reject_reason',
        'notes',
        'weekly_total',
        'adjusted_at',
        'adjusted_by',
    ];

    protected $casts = [
        'week_start_date' => 'date',
        'week_end_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'weekly_total' => 'decimal:2',
        'adjusted_at' => 'datetime',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(TimesheetTrip::class)->orderBy('trip_date')->orderBy('id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(TimesheetDocument::class)->orderByDesc('created_at');
    }

    public function documentReviews(): HasMany
    {
        return $this->hasMany(TimesheetDocumentReview::class)->orderByDesc('id');
    }

    public function latestDocumentReview(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TimesheetDocumentReview::class)->latestOfMany();
    }

    public function adjustmentLogs(): HasMany
    {
        return $this->hasMany(TimesheetAdjustmentLog::class)->orderByDesc('id');
    }
}
