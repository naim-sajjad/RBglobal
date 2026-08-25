<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimesheetTrip extends Model
{
    use HasFactory;

    protected $fillable = [
        'timesheet_id',
        'invoice_id',
        'payslip_id',
        'employer_id',
        'trip_date',
        'trip_number',
        'distance',
        'notes',
        'trip_total',
        'minimum_applied',
        'rate_snapshot',
        'manual_rate_snapshot',
        'total_agency_billing',
        'additional_quantities',
        'custom_pay_lines',
        'rate_overrides',
        'is_adjusted',
        'adjusted_at',
        'adjusted_reason',
    ];

    protected $casts = [
        'trip_date' => 'date',
        'trip_total' => 'decimal:2',
        'total_agency_billing' => 'decimal:2',
        'minimum_applied' => 'boolean',
        'distance' => 'decimal:2',
        'rate_snapshot' => 'array',
        'manual_rate_snapshot' => 'array',
        'additional_quantities' => 'array',
        'custom_pay_lines' => 'array',
        'rate_overrides' => 'array',
        'is_adjusted' => 'boolean',
        'adjusted_at' => 'datetime',
    ];

    public function timesheet(): BelongsTo
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payslip(): BelongsTo
    {
        return $this->belongsTo(Payslip::class);
    }

    public function payItems(): HasMany
    {
        return $this->hasMany(TimesheetTripPayItem::class, 'timesheet_trip_id');
    }
}
