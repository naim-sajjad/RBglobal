<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

trait TenantScoped
{
    /**
     * Boot the trait.
     */
    protected static function bootTenantScoped(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (tenant()) {
                $tenantId = tenant('id');
                $builder->where(function ($query) use ($tenantId) {
                    // Users who are global admins
                    $query->where('is_global_admin', true)
                        // Or users who belong to this tenant via pivot table
                        ->orWhereHas('tenants', function ($q) use ($tenantId) {
                            $q->where('tenant_id', $tenantId);
                        })
                        // Or legacy: users with tenant_id (for backward compatibility)
                        ->orWhere('tenant_id', $tenantId);
                });
            }
        });

        static::creating(function ($model) {
            // Don't auto-assign tenant_id anymore - use pivot table instead
            // Tenant assignments are now handled via the tenant_user pivot table
        });
    }

    /**
     * Get the primary tenant (legacy - for backward compatibility)
     * Use tenants() relationship for many-to-many access
     */
    public function tenant()
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    /**
     * Query without tenant scope (useful for global admins)
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }
}

