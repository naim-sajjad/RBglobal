<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimesheetTripPayItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'timesheet_trip_id',
        'pay_item_template_id',
        'quantity',
        'rate',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function timesheetTrip(): BelongsTo
    {
        return $this->belongsTo(TimesheetTrip::class);
    }

    public function payItemTemplate(): BelongsTo
    {
        return $this->belongsTo(PayItemTemplate::class);
    }
}
