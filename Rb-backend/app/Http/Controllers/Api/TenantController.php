<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Database\Models\Tenant;
use Stancl\Tenancy\Database\Models\Domain;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::all()->map(function ($tenant) {
            $tenant->domains = Domain::where('tenant_id', $tenant->id)->get();
            // Get user count for each tenant via pivot table
            $tenant->user_count = \DB::table('tenant_user')
                ->where('tenant_id', $tenant->id)
                ->count();
            return $tenant;
        });
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|string',
            'data' => 'nullable|array',
            'name' => 'nullable|string',
            'domain' => 'required|string|unique:domains,domain',
            'subdomain' => 'nullable|string|unique:domains,domain',
        ]);

        // Create tenant with data
        $tenantData = [
            'data' => $validated['data'] ?? [],
        ];

        if (isset($validated['name'])) {
            $tenantData['data']['name'] = $validated['name'];
        }

        if (isset($validated['id'])) {
            $tenantData['id'] = $validated['id'];
        }

        $tenant = Tenant::create($tenantData);

        // Create primary domain
        Domain::create([
            'tenant_id' => $tenant->id,
            'domain' => $validated['domain'],
        ]);

        // Create subdomain if provided
        if (isset($validated['subdomain'])) {
            Domain::create([
                'tenant_id' => $tenant->id,
                'domain' => $validated['subdomain'],
            ]);
        }

        // Load domains for response
        $tenant->domains = Domain::where('tenant_id', $tenant->id)->get();

        return response()->json($tenant, 201);
    }

    public function show(Tenant $tenant)
    {
        $tenant->domains = Domain::where('tenant_id', $tenant->id)->get();
        $tenant->user_count = DB::table('tenant_user')
            ->where('tenant_id', $tenant->id)
            ->count();
        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'data' => 'nullable|array',
            'name' => 'nullable|string',
        ]);

        if (isset($validated['name'])) {
            $tenant->data = array_merge($tenant->data ?? [], ['name' => $validated['name']]);
        }

        if (isset($validated['data'])) {
            $tenant->data = array_merge($tenant->data ?? [], $validated['data']);
        }

        $tenant->save();

        $tenant->domains = Domain::where('tenant_id', $tenant->id)->get();
        return response()->json($tenant);
    }

    public function destroy(Tenant $tenant)
    {
        // Detach all users before deleting tenant
        DB::table('tenant_user')->where('tenant_id', $tenant->id)->delete();
        $tenant->delete();
        return response()->json(['message' => 'Tenant deleted successfully']);
    }

    /**
     * Get all users belonging to a tenant
     */
    public function users(Tenant $tenant)
    {
        $userIds = DB::table('tenant_user')
            ->where('tenant_id', $tenant->id)
            ->pluck('user_id');

        $users = User::whereIn('id', $userIds)
            ->with('roles', 'permissions')
            ->get();

        return response()->json($users);
    }

    /**
     * Assign users to a tenant
     */
    public function assignUsers(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        // Get users and filter out super admins
        $users = User::whereIn('id', $validated['user_ids'])
            ->where('is_global_admin', false)
            ->get();

        // Attach users to tenant via pivot table
        $userIds = $users->pluck('id')->toArray();
        foreach ($userIds as $userId) {
            DB::table('tenant_user')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'user_id' => $userId],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        return response()->json([
            'message' => 'Users assigned to tenant successfully',
            'users' => User::whereIn('id', $userIds)->with('roles', 'permissions')->get(),
        ]);
    }

    /**
     * Remove users from a tenant
     */
    public function removeUsers(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        DB::table('tenant_user')
            ->where('tenant_id', $tenant->id)
            ->whereIn('user_id', $validated['user_ids'])
            ->delete();

        return response()->json([
            'message' => 'Users removed from tenant successfully',
        ]);
    }
}

