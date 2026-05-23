<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use App\Services\DriverApplicationPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DriverController extends Controller
{
    /**
     * Filter out attributes that don't exist as DB columns.
     * This prevents hard failures when a migration hasn't been applied yet.
     */
    private function filterToDriverTableColumns(array $attributes): array
    {
        static $driverColumns = null;

        if ($driverColumns === null) {
            $driverColumns = Schema::getColumnListing('drivers');
        }

        return array_intersect_key($attributes, array_flip($driverColumns));
    }

    /**
     * Get all drivers (admin only or tenant-scoped)
     */
    public function index(Request $request)
    {
        $currentUser = auth()->user();
        $query = Driver::with(['user.roles', 'user.permissions', 'tenant', 'driverClass']);

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

        $sortBy = $request->query('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSortBy = [
            'created_at' => 'created_at',
        ];
        $query->orderBy($allowedSortBy[$sortBy] ?? 'created_at', $sortDir);

        $drivers = $query->get();
        return response()->json($drivers);
    }

    /**
     * Get current user's driver profile
     */
    public function myProfile()
    {
        $currentUser = auth()->user();

        // Find driver profile for current user
        $query = Driver::where('user_id', $currentUser->id);

        // If tenant context is initialized, filter by tenant
        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        $driver = $query->first();

        if (!$driver) {
            return response()->json(['message' => 'Driver profile not found'], 404);
        }

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
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

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
    }

    /**
     * Employment application PDF (DomPDF): compliance JSON, uploads summary, licence photos, references.
     */
    public function applicationPdf(Driver $driver)
    {
        $currentUser = auth()->user();

        if (! $currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            if (! $currentUser->hasPermissionTo('drivers.view')) {
                abort(403, 'You do not have permission to view this driver');
            }
        }

        return DriverApplicationPdfService::download($driver);
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

        $validated = $this->validateDriverData($request, false, false, null);

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

        $driverAttributes = $this->filterToDriverTableColumns([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_issue_date' => $validated['license_issue_date'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'background_check_status' => $validated['background_check_status'] ?? 'pending',
            'reference_check_status' => $validated['reference_check_status'] ?? 'pending',
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => $validated['status'] ?? 'pending_approval', // Admin can set initial status
            'driver_class_id' => $validated['driver_class_id'] ?? null,
            'driver_class_effective_date' => $validated['driver_class_effective_date'] ?? null,
            'payee_business_name' => $validated['payee_business_name'] ?? null,
            'payee_address' => $validated['payee_address'] ?? null,
        ]);

        return DB::transaction(function () use ($request, $driverAttributes) {
            $driver = Driver::create($driverAttributes);
            $this->persistDriverDocumentPaths($driver, $this->handleDocumentUploads($request, $driver));

            return response()->json(
                $driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
                201,
            );
        });
    }

    /**
     * Driver self-registration (public flow)
     */
    public function selfRegister(Request $request)
    {
        $validated = $this->validateDriverData($request, true, false, null);

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

        $driverAttributes = $this->filterToDriverTableColumns([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_issue_date' => $validated['license_issue_date'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'background_check_status' => 'pending',
            'reference_check_status' => 'pending',
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => 'pending_approval', // Always pending for self-registration
            'driver_class_id' => $validated['driver_class_id'] ?? null,
            'driver_class_effective_date' => $validated['driver_class_effective_date'] ?? null,
            'payee_business_name' => $validated['payee_business_name'] ?? null,
            'payee_address' => $validated['payee_address'] ?? null,
        ]);

        return DB::transaction(function () use ($request, $driverAttributes, $user) {
            $driver = Driver::create($driverAttributes);
            $this->persistDriverDocumentPaths($driver, $this->handleDocumentUploads($request, $driver));

            // Create auth token for immediate login
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'driver' => $driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
                'user' => $user->load('roles', 'permissions', 'tenants'),
                'token' => $token,
                'message' => 'Driver registration successful. Your account is pending approval.',
            ], 201);
        });
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

        // Normalize empty driver_class_id so clearing the class works (FormData sends empty string)
        if ($request->has('driver_class_id') && ($request->input('driver_class_id') === '' || $request->input('driver_class_id') === null)) {
            $request->merge(['driver_class_id' => null]);
        }

        $validated = $this->validateDriverData($request, false, true, $driver);

        // Handle document uploads
        $documentPaths = $this->handleDocumentUploads($request, $driver);

        // Merge document paths into validated data
        foreach ($documentPaths as $key => $path) {
            if ($path) {
                $validated[$key . '_path'] = $path;
            }
        }

        $nameForUser = $validated['name'] ?? null;
        $emailForUser = $validated['email'] ?? null;
        $passwordPlain = isset($validated['password']) ? $validated['password'] : null;

        $stripKeys = [
            'name',
            'email',
            'password',
            'pcc_document',
            'license_document',
            'license_front_image',
            'license_back_image',
            'abstract_document',
            'cvor_document',
            'safety_certificate',
        ];
        foreach ($stripKeys as $stripKey) {
            unset($validated[$stripKey]);
        }

        // Drivers can only update their own profile, not status or HR verification flags
        if ($driver->user_id === $currentUser->id && !$currentUser->is_global_admin) {
            unset($validated['status']); // Drivers can't change their own status
            unset($validated['reference_check_status']);
        }

        $driver->update($this->filterToDriverTableColumns($validated));

        $userUpdates = [];
        if ($nameForUser !== null && $nameForUser !== '') {
            $userUpdates['name'] = $nameForUser;
        }
        if ($emailForUser !== null && $emailForUser !== '') {
            $userUpdates['email'] = $emailForUser;
        }
        if (is_string($passwordPlain) && strlen($passwordPlain) >= 8) {
            $userUpdates['password'] = Hash::make($passwordPlain);
        }
        if ($userUpdates !== []) {
            $driver->user()->update($userUpdates);
        }

        return response()->json($driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
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
            'driver' => $driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
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
            'pcc_document_path',
            'license_document_path',
            'license_front_image_path',
            'license_back_image_path',
            'abstract_document_path',
            'cvor_document_path',
            'safety_certificate_path',
        ];

        foreach ($documentFields as $field) {
            $rel = Driver::normalizePublicRelativePath($driver->$field ?? null);
            if ($rel !== null) {
                Storage::disk('public')->delete($rel);
            }
        }

        $driver->delete();

        return response()->json(['message' => 'Driver deleted successfully']);
    }

    /**
     * Validate driver data
     */
    private function validateDriverData(Request $request, bool $isSelfRegister = false, bool $isUpdate = false, ?Driver $driver = null): array
    {
        $emailRules = ['required', 'string', 'email', 'max:255'];

        if ($isUpdate && $driver !== null) {
            $emailRules = ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driver->user_id)];
        } elseif (!$isUpdate) {
            $emailRules[] = Rule::unique('users', 'email');
        }

        $rules = [
            // User info (required for new users)
            'name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'email' => $emailRules,
            'password' => $isUpdate
                ? 'sometimes|string|min:8'
                : ($isSelfRegister ? 'required|string|min:8' : 'nullable|string|min:8'),

            // License Information
            'license_number' => ($isUpdate ? 'sometimes|required' : 'required') . '|string|max:255',
            'license_type' => [($isUpdate ? 'sometimes' : 'required'), Rule::in(['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'])],
            'license_other' => 'nullable|string|max:255|required_if:license_type,Other',
            'issuing_authority' => ($isUpdate ? 'sometimes|required' : 'required') . '|string|max:255',
            'license_issue_date' => ($isUpdate ? 'sometimes|required' : 'required') . '|date|before_or_equal:today',
            'license_expiry_date' => ($isUpdate ? 'sometimes|required' : 'required') . '|date|after_or_equal:today',

            // Vehicle Information
            'vehicle_types' => 'nullable|array',
            'vehicle_types.*' => ['nullable', Rule::in(['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'])],

            // Compliance Requirements & Documents
            'pcc_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'license_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'license_front_image' => ($isUpdate ? 'nullable' : 'required') . '|file|mimes:jpg,jpeg,png|max:5120',
            'license_back_image' => ($isUpdate ? 'nullable' : 'required') . '|file|mimes:jpg,jpeg,png|max:5120',
            'abstract_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'cvor_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'safety_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'background_check_status' => ['nullable', Rule::in(['pending', 'completed'])],
            'reference_check_status' => ['nullable', Rule::in(['pending', 'completed'])],
            'compliance_notes' => 'nullable|string',

            // Status (admin only)
            'status' => ['nullable', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],

            // Driver class (pay tier) - required on create for contract-driven pricing; optional on update/self-register
            'driver_class_id' => ($isSelfRegister || $isUpdate ? 'nullable' : 'required') . '|integer|exists:driver_classes,id',
            'driver_class_effective_date' => 'nullable|date',

            'payee_business_name' => 'nullable|string|max:255',
            'payee_address' => 'nullable|string|max:4000',
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
            'pcc_document' => 'pcc',
            'license_document' => 'license',
            'license_front_image' => 'license',
            'license_back_image' => 'license',
            'abstract_document' => 'abstract',
            'cvor_document' => 'cvor',
            'safety_certificate' => 'safety',
        ];

        $disk = 'public';

        $basePrefix = ($driver !== null && $driver->exists)
            ? ('drivers/'.$driver->id)
            : 'drivers';

        foreach ($documentFields as $field => $subfolder) {
            if ($request->hasFile($field)) {
                if ($driver && $driver->{$field . '_path'}) {
                    $oldRelative = Driver::normalizePublicRelativePath($driver->{$field . '_path'});
                    if ($oldRelative !== null) {
                        Storage::disk($disk)->delete($oldRelative);
                    }
                }

                $documentPaths[$field] = $request->file($field)->store($basePrefix.'/'.$subfolder, $disk);
            }
        }

        return $documentPaths;
    }

    /**
     * @param  array<string, non-empty-string>  $pathsByFieldKey keys like "pcc_document" (no _path suffix)
     */
    private function persistDriverDocumentPaths(Driver $driver, array $pathsByFieldKey): void
    {
        if ($pathsByFieldKey === []) {
            return;
        }

        $patch = [];
        foreach ($pathsByFieldKey as $baseKey => $path) {
            if (is_string($path) && $path !== '') {
                $patch[$baseKey.'_path'] = $path;
            }
        }

        if ($patch === []) {
            return;
        }

        $driver->update($this->filterToDriverTableColumns($patch));
    }
}

