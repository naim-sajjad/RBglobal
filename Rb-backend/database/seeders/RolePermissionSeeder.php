<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Global permissions (for super admin)
        $globalPermissions = [
            'tenants.create',
            'tenants.read',
            'tenants.update',
            'tenants.delete',
        ];

        // Tenant-scoped permissions
        $tenantPermissions = [
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            'roles.manage',
            'permissions.manage',
            // Driver permissions
            'drivers.create',
            'drivers.view',
            'drivers.update',
            'drivers.delete',
            'drivers.approve',
        ];

        // Create permissions
        foreach (array_merge($globalPermissions, $tenantPermissions) as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo($globalPermissions);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->givePermissionTo($tenantPermissions);

        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $user->givePermissionTo(['users.read']);

        // Driver role - can create their own profile and update it
        $driver = Role::firstOrCreate(['name' => 'driver', 'guard_name' => 'web']);
        $driver->givePermissionTo([
            'drivers.create', // Self-registration
            'drivers.update', // Update own profile (limited)
        ]);
    }
}

