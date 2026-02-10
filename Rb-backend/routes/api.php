<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\DriverController;

/*
|--------------------------------------------------------------------------
| Central API Routes (No Tenant Context)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Public driver self-registration
    Route::post('/drivers/register', [DriverController::class, 'selfRegister']);

    // Protected routes (require authentication)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Global admin routes
        Route::middleware(['role:super-admin'])->group(function () {
            Route::apiResource('tenants', TenantController::class);
            // Tenant user management routes
            Route::get('/tenants/{tenant}/users', [TenantController::class, 'users']);
            Route::post('/tenants/{tenant}/users/assign', [TenantController::class, 'assignUsers']);
            Route::post('/tenants/{tenant}/users/remove', [TenantController::class, 'removeUsers']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Tenant API Routes (Tenant Context Required)
|--------------------------------------------------------------------------
*/

Route::prefix('v1/tenant')->middleware([
    'auth:sanctum',
    \App\Http\Middleware\InitializeTenancyOrSuperAdmin::class,
])->group(function () {
    // Tenant-scoped routes (accessible by tenant users or super admins)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');

    // Roles and Permissions
    Route::apiResource('roles', RoleController::class)->middleware('permission:roles.manage');
    Route::apiResource('permissions', PermissionController::class)->middleware('permission:permissions.manage');

    // Driver Management
    Route::get('/drivers', [DriverController::class, 'index'])->middleware('permission:drivers.view');
    Route::post('/drivers', [DriverController::class, 'store'])->middleware('permission:drivers.create');
    Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:drivers.view');
    Route::put('/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:drivers.update');
    Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:drivers.delete');
    Route::post('/drivers/{driver}/approve', [DriverController::class, 'approve'])->middleware('permission:drivers.approve');
});

