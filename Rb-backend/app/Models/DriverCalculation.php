<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DriverCalculation extends Model
{
    protected $fillable = [
        'tenant_id',
        'driver_id',
        'period_start',
        'period_end',
        'gross_pay',
        'vacation_pay',
        'deductions',
        'net_pay',
        'agency_billing_subtotal',
        'billing_tax_rate',
        'billing_tax_from_percent',
        'billing_tax_fixed',
        'billing_tax_amount',
        'agency_billing_total',
        'billing_tax_lines',
        'breakdown',
        'status',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_pay' => 'decimal:2',
        'vacation_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'agency_billing_subtotal' => 'decimal:2',
        'billing_tax_rate' => 'decimal:4',
        'billing_tax_from_percent' => 'decimal:2',
        'billing_tax_fixed' => 'decimal:2',
        'billing_tax_amount' => 'decimal:2',
        'agency_billing_total' => 'decimal:2',
        'billing_tax_lines' => 'array',
        'breakdown' => 'array',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function payslip(): HasOne
    {
        return $this->hasOne(Payslip::class);
    }
}
