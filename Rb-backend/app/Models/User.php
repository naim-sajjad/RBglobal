<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\TenantScoped;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles, TenantScoped;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'is_global_admin', // For super admin access across tenants
        'status', // User status: active or inactive
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_global_admin' => 'boolean',
        ];
    }

    /**
     * Get the tenants that belong to the user (many-to-many relationship)
     */
    public function tenants()
    {
        return $this->belongsToMany(
            \Stancl\Tenancy\Database\Models\Tenant::class,
            'tenant_user',
            'user_id',
            'tenant_id'
        )->withTimestamps();
    }

    /**
     * Check if user belongs to a specific tenant
     */
    public function belongsToTenant($tenantId): bool
    {
        if ($this->is_global_admin) {
            return true; // Super admins have access to all tenants
        }

        return $this->tenants()->where('tenant_id', $tenantId)->exists();
    }

    /**
     * Check if user has permission (tenant-scoped or global)
     * Override the HasRoles trait method to allow super admins to bypass permission checks
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        // Super admins have all permissions
        if ($this->is_global_admin) {
            return true;
        }

        // Handle wildcard permissions if enabled
        if ($this->getWildcardClass()) {
            return $this->hasWildcardPermission($permission, $guardName);
        }

        // Use the trait's filterPermission method
        $permission = $this->filterPermission($permission, $guardName);

        // Use the trait's methods to check permissions
        return $this->hasDirectPermission($permission) || $this->hasPermissionViaRole($permission);
    }

    /**
     * Get the driver profile for this user
     */
    public function driver()
    {
        return $this->hasOne(\App\Models\Driver::class);
    }
}
