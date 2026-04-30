<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantPayrollBillingTax extends Model
{
    protected $table = 'tenant_payroll_billing_taxes';

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'value',
        'sort_order',
    ];

    protected $casts = [
        'value' => 'decimal:4',
        'sort_order' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }
}
