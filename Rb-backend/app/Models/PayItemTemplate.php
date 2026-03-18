<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayItemTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'unit',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    public function employerRates(): HasMany
    {
        return $this->hasMany(EmployerPayItemRate::class, 'pay_item_template_id');
    }
}
