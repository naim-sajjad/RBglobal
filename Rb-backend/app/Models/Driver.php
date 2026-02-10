<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tenant_id',
        // License Information
        'license_number',
        'license_type',
        'license_other',
        'issuing_authority',
        'license_expiry_date',
        // Driving Experience
        'years_of_experience',
        'driving_history',
        // Vehicle Information
        'vehicle_types',
        'vehicle_ownership',
        'vehicle_capacity',
        // Route & Shift Details
        'route_type',
        'route_details',
        'shift_timing',
        'pay_type',
        // Compliance Requirements & Documents
        'medical_certificate_path',
        'license_document_path',
        'abstract_document_path',
        'cvor_document_path',
        'safety_certificate_path',
        'background_check_status',
        'drug_alcohol_test',
        'compliance_notes',
        // Status
        'status',
    ];

    protected $casts = [
        'license_expiry_date' => 'date',
        'vehicle_types' => 'array',
        'drug_alcohol_test' => 'boolean',
        'years_of_experience' => 'integer',
    ];

    /**
     * Get the user that owns the driver profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tenant that owns the driver
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\Stancl\Tenancy\Database\Models\Tenant::class, 'tenant_id');
    }

    /**
     * Check if driver is approved and active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if driver is pending approval
     */
    public function isPendingApproval(): bool
    {
        return $this->status === 'pending_approval';
    }
}

