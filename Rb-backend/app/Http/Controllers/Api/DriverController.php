<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DriverController extends Controller
{
    /**
     * Get all drivers (admin only or tenant-scoped)
     */
    public function index()
    {
        $currentUser = auth()->user();
        $query = Driver::with(['user.roles', 'user.permissions', 'tenant']);

        // If tenant context is initialized, filter by tenant
        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        } elseif ($currentUser && $currentUser->is_global_admin) {
            // Super admin can see all drivers
        } else {
            // Regular users can only see drivers in their tenant
            if ($currentUser->tenants->isNotEmpty()) {
                $tenantIds = $currentUser->tenants->pluck('id')->toArray();
                $query->whereIn('tenant_id', $tenantIds);
            } else {
                return response()->json([]);
            }
        }

        $drivers = $query->get();
        return response()->json($drivers);
    }

    /**
     * Get a specific driver
     */
    public function show(Driver $driver)
    {
        $currentUser = auth()->user();

        // Check access: admin or driver viewing their own profile
        if (!$currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            // Check if user has permission to view drivers
            if (!$currentUser->hasPermissionTo('drivers.view')) {
                abort(403, 'You do not have permission to view this driver');
            }
        }

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant']));
    }

    /**
     * Create driver (admin flow)
     */
    public function store(Request $request)
    {
        $currentUser = auth()->user();

        // Only admins can create drivers via this endpoint
        if (!$currentUser->hasPermissionTo('drivers.create') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to create drivers');
        }

        $validated = $this->validateDriverData($request);

        // Determine tenant
        $tenantId = null;
        if (tenant('id')) {
            $tenantId = tenant('id');
        } elseif ($request->has('tenant_id') && $currentUser->is_global_admin) {
            $tenantId = $request->tenant_id;
        }

        // Create or get user
        $user = null;
        if ($request->has('user_id') && $request->user_id) {
            $user = User::findOrFail($request->user_id);
        } else {
            // Create new user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'temporary_password_123'),
                'is_global_admin' => false,
            ]);

            // Assign driver role
            $user->assignRole('driver');

            // Assign to tenant if provided
            if ($tenantId) {
                $user->tenants()->sync([$tenantId]);
            }
        }

        // Handle document uploads
        $documentPaths = $this->handleDocumentUploads($request);

        // Convert drug_alcohol_test to boolean
        $drugAlcoholTest = false;
        if (isset($validated['drug_alcohol_test'])) {
            $drugAlcoholTest = filter_var($validated['drug_alcohol_test'], FILTER_VALIDATE_BOOLEAN);
        }

        // Create driver profile
        $driver = Driver::create([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'years_of_experience' => $validated['years_of_experience'] ?? 0,
            'driving_history' => $validated['driving_history'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'vehicle_ownership' => $validated['vehicle_ownership'] ?? null,
            'vehicle_capacity' => $validated['vehicle_capacity'] ?? null,
            'route_type' => $validated['route_type'] ?? null,
            'route_details' => $validated['route_details'] ?? null,
            'shift_timing' => $validated['shift_timing'] ?? null,
            'pay_type' => $validated['pay_type'] ?? null,
            'medical_certificate_path' => $documentPaths['medical_certificate'] ?? null,
            'license_document_path' => $documentPaths['license_document'] ?? null,
            'abstract_document_path' => $documentPaths['abstract_document'] ?? null,
            'cvor_document_path' => $documentPaths['cvor_document'] ?? null,
            'safety_certificate_path' => $documentPaths['safety_certificate'] ?? null,
            'background_check_status' => $validated['background_check_status'] ?? 'pending',
            'drug_alcohol_test' => $drugAlcoholTest,
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => $validated['status'] ?? 'pending_approval', // Admin can set initial status
        ]);

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant']), 201);
    }

    /**
     * Driver self-registration (public flow)
     */
    public function selfRegister(Request $request)
    {
        $validated = $this->validateDriverData($request, true);

        // Determine tenant from request or context
        $tenantId = null;
        if ($request->has('tenant_id')) {
            $tenantId = $request->tenant_id;
        } elseif (tenant('id')) {
            $tenantId = tenant('id');
        }

        // Create user account
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_global_admin' => false,
        ]);

        // Assign driver role
        $user->assignRole('driver');

        // Assign to tenant if provided
        if ($tenantId) {
            $user->tenants()->sync([$tenantId]);
        }

        // Handle document uploads
        $documentPaths = $this->handleDocumentUploads($request);

        // Convert drug_alcohol_test to boolean
        $drugAlcoholTest = false;
        if (isset($validated['drug_alcohol_test'])) {
            $drugAlcoholTest = filter_var($validated['drug_alcohol_test'], FILTER_VALIDATE_BOOLEAN);
        }

        // Create driver profile with pending_approval status
        $driver = Driver::create([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'years_of_experience' => $validated['years_of_experience'] ?? 0,
            'driving_history' => $validated['driving_history'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'vehicle_ownership' => $validated['vehicle_ownership'] ?? null,
            'vehicle_capacity' => $validated['vehicle_capacity'] ?? null,
            'route_type' => $validated['route_type'] ?? null,
            'route_details' => $validated['route_details'] ?? null,
            'shift_timing' => $validated['shift_timing'] ?? null,
            'pay_type' => $validated['pay_type'] ?? null,
            'medical_certificate_path' => $documentPaths['medical_certificate'] ?? null,
            'license_document_path' => $documentPaths['license_document'] ?? null,
            'abstract_document_path' => $documentPaths['abstract_document'] ?? null,
            'cvor_document_path' => $documentPaths['cvor_document'] ?? null,
            'safety_certificate_path' => $documentPaths['safety_certificate'] ?? null,
            'background_check_status' => 'pending',
            'drug_alcohol_test' => $drugAlcoholTest,
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => 'pending_approval', // Always pending for self-registration
        ]);

        // Create auth token for immediate login
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'driver' => $driver->load(['user.roles', 'user.permissions', 'tenant']),
            'user' => $user->load('roles', 'permissions', 'tenants'),
            'token' => $token,
            'message' => 'Driver registration successful. Your account is pending approval.',
        ], 201);
    }

    /**
     * Update driver profile
     */
    public function update(Request $request, Driver $driver)
    {
        $currentUser = auth()->user();

        // Check access: admin or driver updating their own profile
        if (!$currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            if (!$currentUser->hasPermissionTo('drivers.update')) {
                abort(403, 'You do not have permission to update this driver');
            }
        }

        $validated = $this->validateDriverData($request, false, true);

        // Handle document uploads
        $documentPaths = $this->handleDocumentUploads($request, $driver);

        // Merge document paths into validated data
        foreach ($documentPaths as $key => $path) {
            if ($path) {
                $validated[$key . '_path'] = $path;
            }
        }

        // Convert drug_alcohol_test to boolean if provided
        if (isset($validated['drug_alcohol_test'])) {
            $validated['drug_alcohol_test'] = filter_var($validated['drug_alcohol_test'], FILTER_VALIDATE_BOOLEAN);
        }

        // Drivers can only update their own profile, not status
        if ($driver->user_id === $currentUser->id && !$currentUser->is_global_admin) {
            unset($validated['status']); // Drivers can't change their own status
        }

        $driver->update($validated);

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant']));
    }

    /**
     * Approve driver (admin only)
     */
    public function approve(Driver $driver)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasPermissionTo('drivers.approve') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to approve drivers');
        }

        $driver->update(['status' => 'active']);

        return response()->json([
            'message' => 'Driver approved successfully',
            'driver' => $driver->load(['user.roles', 'user.permissions', 'tenant']),
        ]);
    }

    /**
     * Delete driver
     */
    public function destroy(Driver $driver)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasPermissionTo('drivers.delete') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to delete drivers');
        }

        // Delete all documents if they exist
        $documentFields = [
            'medical_certificate_path',
            'license_document_path',
            'abstract_document_path',
            'cvor_document_path',
            'safety_certificate_path',
        ];

        foreach ($documentFields as $field) {
            if ($driver->$field) {
                Storage::disk('public')->delete($driver->$field);
            }
        }

        $driver->delete();

        return response()->json(['message' => 'Driver deleted successfully']);
    }

    /**
     * Validate driver data
     */
    private function validateDriverData(Request $request, bool $isSelfRegister = false, bool $isUpdate = false): array
    {
        $rules = [
            // User info (required for new users)
            'name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'email' => $isUpdate
                ? 'sometimes|required|string|email|max:255|unique:users,email'
                : 'required|string|email|max:255|unique:users,email',
            'password' => $isUpdate
                ? 'sometimes|string|min:8'
                : ($isSelfRegister ? 'required|string|min:8' : 'nullable|string|min:8'),

            // License Information
            'license_number' => 'nullable|string|max:255',
            'license_type' => ['nullable', Rule::in(['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'])],
            'license_other' => 'nullable|string|max:255|required_if:license_type,Other',
            'issuing_authority' => 'nullable|string|max:255',
            'license_expiry_date' => 'nullable|date|after:today',

            // Driving Experience
            'years_of_experience' => 'nullable|integer|min:0',
            'driving_history' => 'nullable|string',

            // Vehicle Information
            'vehicle_types' => 'nullable|array',
            'vehicle_types.*' => ['nullable', Rule::in(['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'])],
            'vehicle_ownership' => ['nullable', Rule::in(['company-owned', 'self-owned'])],
            'vehicle_capacity' => 'nullable|string|max:255',

            // Route & Shift Details
            'route_type' => ['nullable', Rule::in(['local', 'regional', 'long-haul', 'intercity'])],
            'route_details' => 'nullable|string',
            'shift_timing' => ['nullable', Rule::in(['day', 'night', 'rotational'])],
            'pay_type' => ['nullable', Rule::in(['hourly', 'per_mile', 'per_trip', 'fixed_salary'])],

            // Compliance Requirements & Documents
            'medical_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
            'license_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'abstract_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'cvor_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'safety_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'background_check_status' => ['nullable', Rule::in(['pending', 'completed'])],
            'drug_alcohol_test' => 'nullable|string|in:true,false,1,0',
            'compliance_notes' => 'nullable|string',

            // Status (admin only)
            'status' => ['nullable', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],
        ];

        return $request->validate($rules);
    }

    /**
     * Handle document uploads
     */
    private function handleDocumentUploads(Request $request, ?Driver $driver = null): array
    {
        $documentPaths = [];
        $documentFields = [
            'medical_certificate' => 'drivers/medical',
            'license_document' => 'drivers/license',
            'abstract_document' => 'drivers/abstract',
            'cvor_document' => 'drivers/cvor',
            'safety_certificate' => 'drivers/safety',
        ];

        foreach ($documentFields as $field => $storagePath) {
            if ($request->hasFile($field)) {
                // Delete old document if exists (for updates)
                if ($driver && $driver->{$field . '_path'}) {
                    Storage::disk('public')->delete($driver->{$field . '_path'});
                }

                $documentPaths[$field] = $request->file($field)->store($storagePath, 'public');
            }
        }

        return $documentPaths;
    }
}

