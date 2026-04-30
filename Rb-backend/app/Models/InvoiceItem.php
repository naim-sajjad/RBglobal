<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'timesheet_trip_id',
        'driver_id',
        'trip_date',
        'pay_item_type',
        'line_type',
        'quantity',
        'unit',
        'rate',
        'amount',
        'line_index',
    ];

    protected $casts = [
        'trip_date' => 'date',
        'quantity' => 'decimal:4',
        'rate' => 'decimal:4',
        'amount' => 'decimal:2',
        'line_index' => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function timesheetTrip(): BelongsTo
    {
        return $this->belongsTo(TimesheetTrip::class, 'timesheet_trip_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
