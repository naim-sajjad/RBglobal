<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $currentUser = auth()->user();

        // Get users excluding super admins (they don't belong to tenants)
        // The TenantScoped trait's global scope includes super admins, so we need to
        // override it and apply our own filtering
        $query = User::withoutGlobalScope('tenant')
            ->with('roles', 'permissions', 'tenants')
            ->where('is_global_admin', false)
            ->where('id', '!=', $currentUser->id); // Exclude the current user

        // If tenant context is initialized, only return users belonging to this tenant
        // If super admin, they can optionally filter by tenant via X-Tenant header or see all users
        if (tenant('id')) {
            $tenantId = tenant('id');
            $query->whereHas('tenants', function ($q) use ($tenantId) {
                $q->where('tenants.id', $tenantId);
            });
        } elseif ($currentUser && $currentUser->is_global_admin) {
            // Super admin without tenant context - return all non-super-admin users
            // They can see users from all tenants
        }

        $users = $query->get();

        // Ensure status is included in the response (default to 'active' if not set)
        $users->transform(function ($user) {
            if (!isset($user->status) || $user->status === null) {
                $user->status = 'active';
            }
            return $user;
        });

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'roles' => 'nullable|array', // Array of role names or IDs
            'role_id' => 'nullable|integer|exists:roles,id', // Single role ID (alternative to roles array)
            'tenant_id' => 'nullable|string|exists:tenants,id',
            'tenant_ids' => 'nullable|array', // For multiple tenants
            'tenant_ids.*' => 'string|exists:tenants,id',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['tenant_id'] = null; // Always null - use pivot table

        $user = User::create($validated);

        // Assign roles - handle both role_id and roles array
        if (isset($validated['roles']) && is_array($validated['roles']) && !empty($validated['roles'])) {
            // If roles is provided as array, assign them
            $user->assignRole($validated['roles']);
        } elseif (isset($validated['role_id']) && $validated['role_id']) {
            // If role_id is provided, find the role and assign it
            // Convert to integer if it's a string
            $roleId = is_numeric($validated['role_id']) ? (int) $validated['role_id'] : $validated['role_id'];
            $role = \Spatie\Permission\Models\Role::findById($roleId, 'web');
            if ($role) {
                $user->assignRole($role);
            }
        }

        // Assign user to tenant(s)
        $tenantIds = [];
        if (isset($validated['tenant_ids']) && is_array($validated['tenant_ids'])) {
            $tenantIds = $validated['tenant_ids'];
        } elseif (isset($validated['tenant_id'])) {
            $tenantIds = [$validated['tenant_id']];
        } elseif (tenant('id')) {
            // If in tenant context, assign to current tenant
            $tenantIds = [tenant('id')];
        }

        if (!empty($tenantIds) && !$user->is_global_admin) {
            $user->tenants()->sync($tenantIds);
        }

        return response()->json($user->load('roles', 'permissions', 'tenants'), 201);
    }

    public function show(User $user)
    {
        // Ensure user belongs to current tenant (if in tenant context)
        if (tenant('id') && !$user->belongsToTenant(tenant('id'))) {
            abort(403, 'User does not belong to this tenant');
        }

        return response()->json($user->load('roles', 'permissions', 'tenants'));
    }

    public function update(Request $request, User $user)
    {
        // Ensure user belongs to current tenant (if in tenant context)
        if (tenant('id') && !$user->belongsToTenant(tenant('id'))) {
            abort(403, 'User does not belong to this tenant');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'roles' => 'nullable|array', // Array of role names or IDs
            'role_id' => 'nullable|integer|exists:roles,id', // Single role ID (alternative to roles array)
            'tenant_id' => 'nullable|string|exists:tenants,id',
            'tenant_ids' => 'nullable|array', // For multiple tenants
            'tenant_ids.*' => 'string|exists:tenants,id',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Capture role/tenant data before unset (they are handled separately, not in $user->update())
        $roleId = $validated['role_id'] ?? null;
        $roles = $validated['roles'] ?? null;
        $tenantIdsRequest = $validated['tenant_ids'] ?? null;
        $tenantIdRequest = $validated['tenant_id'] ?? null;

        // Don't update tenant_id, tenant_ids, roles, or role_id via $user->update()
        unset($validated['tenant_id'], $validated['tenant_ids'], $validated['roles'], $validated['role_id']);

        $user->update($validated);

        // Update roles if provided - handle both role_id and roles array
        if (is_array($roles) && !empty($roles)) {
            $user->syncRoles($roles);
        } elseif ($roleId) {
            $roleIdInt = is_numeric($roleId) ? (int) $roleId : $roleId;
            $role = \Spatie\Permission\Models\Role::findById($roleIdInt, 'web');
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        // Update tenant assignments if provided
        if ($tenantIdsRequest !== null || $tenantIdRequest !== null) {
            if ($user->is_global_admin) {
                $user->tenants()->detach();
            } else {
                $ids = is_array($tenantIdsRequest) ? $tenantIdsRequest : ($tenantIdRequest ? [$tenantIdRequest] : []);
                $user->tenants()->sync($ids);
            }
        }

        return response()->json($user->load('roles', 'permissions', 'tenants'));
    }

    public function destroy(User $user)
    {
        // Ensure user belongs to current tenant (if in tenant context)
        if (tenant('id') && !$user->belongsToTenant(tenant('id'))) {
            abort(403, 'User does not belong to this tenant');
        }

        // Detach from all tenants before deleting
        $user->tenants()->detach();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}

