<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'company_code',
        'contact_person',
        'phone',
        'email',
        'billing_address',
        'service_location',
        'status',
        'notes',
        'measurement_unit',
        'default_currency',
        'minimum_trip_guarantee',
        'requires_driver_rate_tracking',
    ];

    protected $casts = [
        'requires_driver_rate_tracking' => 'boolean',
        'minimum_trip_guarantee' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    public function rateCards(): HasMany
    {
        return $this->hasMany(RateCard::class)->orderBy('effective_from', 'desc');
    }

    public function payItemRates(): HasMany
    {
        return $this->hasMany(EmployerPayItemRate::class)->with('payItemTemplate');
    }
}
