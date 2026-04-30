<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimesheetAdjustmentLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'timesheet_id',
        'timesheet_trip_id',
        'admin_user_id',
        'reason',
        'before',
        'after',
        'invoice_file_path',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
    ];

    public function timesheet(): BelongsTo
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(TimesheetTrip::class, 'timesheet_trip_id');
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}

