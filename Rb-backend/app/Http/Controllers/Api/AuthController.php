<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'tenant_id' => 'nullable|string', // Optional tenant context
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // If tenant_id provided, verify user belongs to tenant
        if ($request->tenant_id) {
            if (!$user->belongsToTenant($request->tenant_id)) {
                throw ValidationException::withMessages([
                    'tenant_id' => ['User does not belong to this tenant.'],
                ]);
            }
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Load user's tenants
        $user->load('roles', 'permissions', 'tenants');

        return response()->json([
            'user' => $user,
            'token' => $token,
            'tenant_id' => $request->tenant_id ?? ($user->tenants->first()?->id ?? null),
            'tenants' => $user->tenants, // Return all tenants user belongs to
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'tenant_id' => 'nullable|string',
            'roles' => 'nullable|array', // Optional: allow role assignment during registration
        ]);

        // Check if super-admin role is being assigned
        $isSuperAdmin = isset($request->roles) && in_array('super-admin', $request->roles);

        // Super admin should not belong to any tenant
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => null, // Always null - use pivot table for tenant relationships
            'is_global_admin' => $isSuperAdmin, // Set global admin flag
        ]);

        // Assign roles
        if (isset($request->roles) && !empty($request->roles)) {
            $user->assignRole($request->roles);
        } else {
            // Assign default 'user' role for all new registrations
            $user->assignRole('user');
        }

        // Assign user to tenant(s) if provided and not super admin
        if (!$isSuperAdmin && isset($request->tenant_id) && $request->tenant_id) {
            $tenantIds = is_array($request->tenant_id) ? $request->tenant_id : [$request->tenant_id];
            $user->tenants()->sync($tenantIds);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Load user's tenants
        $user->load('roles', 'permissions', 'tenants');

        return response()->json([
            'user' => $user,
            'token' => $token,
            'tenants' => $user->tenants,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles', 'permissions', 'tenants');

        return response()->json([
            'user' => $user,
            'tenant' => tenant() ? tenant()->only(['id', 'data']) : null,
            'tenants' => $user->tenants, // Return all tenants user belongs to
        ]);
    }
}

