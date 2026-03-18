<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ReferenceCheck extends Model
{
    protected $fillable = [
        'driver_id',
        'tenant_id',
        'token',
        'status',
        'referee_email',
        'sent_at',
        'completed_at',
        'filled_by',
        'applicant_consent',
        'reference_request',
        'form_data',
    ];

    protected $casts = [
        'applicant_consent' => 'array',
        'reference_request' => 'array',
        'form_data' => 'array',
        'sent_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (ReferenceCheck $model) {
            if (empty($model->token)) {
                $model->token = Str::random(48);
            }
        });
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    public function scopeForDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }
}
