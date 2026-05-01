<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\ReferenceCheckController;
use App\Http\Controllers\Api\EmployerController;
use App\Http\Controllers\Api\RateCardController;
use App\Http\Controllers\Api\DriverClassController;
use App\Http\Controllers\Api\PayItemTemplateController;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\InvoiceFinancialController;
use App\Http\Controllers\Api\PayrollFinancialController;
use App\Http\Controllers\Api\TenantCompanyProfileController;

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

    // Public reference check (referee form by link – no auth)
    Route::get('/reference-check/{token}', [ReferenceCheckController::class, 'getByToken']);
    Route::post('/reference-check/{token}/submit', [ReferenceCheckController::class, 'submitByToken']);

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

    // Driver Management (show/index JSON appends *_{document,image}_url — full storage URLs)
    Route::get('/drivers', [DriverController::class, 'index'])->middleware('permission:drivers.view');
    Route::post('/drivers', [DriverController::class, 'store'])->middleware('permission:drivers.create');
    Route::get('/drivers/my-profile', [DriverController::class, 'myProfile']); // Driver's own profile
    Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:drivers.view');
    // POST + PUT: multipart uploads are unreliable on PUT with PHP; SPA uses POST + FormData for updates with files
    Route::match(['put', 'post'], '/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:drivers.update');
    Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:drivers.delete');
    Route::post('/drivers/{driver}/approve', [DriverController::class, 'approve'])->middleware('permission:drivers.approve');

    // Reference checks (per driver)
    Route::get('/drivers/{driver}/reference-checks', [ReferenceCheckController::class, 'index'])->middleware('permission:drivers.view');
    Route::post('/drivers/{driver}/reference-checks', [ReferenceCheckController::class, 'store'])->middleware('permission:drivers.view');
    Route::get('/drivers/{driver}/reference-checks/{referenceCheck}', [ReferenceCheckController::class, 'show'])->middleware('permission:drivers.view');
    Route::post('/drivers/{driver}/reference-checks/{referenceCheck}/send-link', [ReferenceCheckController::class, 'sendLink'])->middleware('permission:drivers.view');
    Route::put('/drivers/{driver}/reference-checks/{referenceCheck}/fill', [ReferenceCheckController::class, 'fill'])->middleware('permission:drivers.view');

    // Driver Classes (pay tiers)
    Route::get('/driver-classes', [DriverClassController::class, 'index']);
    Route::post('/driver-classes', [DriverClassController::class, 'store']);
    Route::get('/driver-classes/{driverClass}', [DriverClassController::class, 'show']);
    Route::put('/driver-classes/{driverClass}', [DriverClassController::class, 'update']);
    Route::delete('/driver-classes/{driverClass}', [DriverClassController::class, 'destroy']);

    // Employers (clients) & Rate Cards
    Route::get('/employers', [EmployerController::class, 'index']);
    Route::post('/employers', [EmployerController::class, 'store']);
    Route::get('/employers/{employer}', [EmployerController::class, 'show']);
    Route::put('/employers/{employer}', [EmployerController::class, 'update']);
    Route::delete('/employers/{employer}', [EmployerController::class, 'destroy']);
    Route::get('/employers/{employer}/rate-cards', [RateCardController::class, 'index']);
    Route::post('/employers/{employer}/rate-cards', [RateCardController::class, 'store']);
    Route::get('/employers/{employer}/rate-cards/{rateCard}', [RateCardController::class, 'show']);
    Route::put('/employers/{employer}/rate-cards/{rateCard}', [RateCardController::class, 'update']);
    Route::post('/employers/{employer}/rate-cards/{rateCard}/duplicate', [RateCardController::class, 'duplicate']);
    Route::post('/employers/{employer}/rate-cards/{rateCard}/deactivate', [RateCardController::class, 'deactivate']);
    Route::get('/employers/{employer}/pay-item-rates', [EmployerController::class, 'payItemRates']);
    Route::put('/employers/{employer}/pay-item-rates', [EmployerController::class, 'updatePayItemRate']);

    // Pay Item Templates
    Route::get('/pay-item-templates', [PayItemTemplateController::class, 'index']);
    Route::post('/pay-item-templates', [PayItemTemplateController::class, 'store']);
    Route::get('/pay-item-templates/{payItemTemplate}', [PayItemTemplateController::class, 'show']);
    Route::put('/pay-item-templates/{payItemTemplate}', [PayItemTemplateController::class, 'update']);
    Route::delete('/pay-item-templates/{payItemTemplate}', [PayItemTemplateController::class, 'destroy']);

    // Timesheets
    Route::get('/timesheets', [TimesheetController::class, 'index']);
    Route::post('/timesheets', [TimesheetController::class, 'store']);
    Route::get('/timesheets/{timesheet}', [TimesheetController::class, 'show']);
    Route::put('/timesheets/{timesheet}', [TimesheetController::class, 'update']);
    Route::delete('/timesheets/{timesheet}', [TimesheetController::class, 'destroy']);
    Route::post('/timesheets/{timesheet}/submit', [TimesheetController::class, 'submit']);
    Route::post('/timesheets/{timesheet}/approve', [TimesheetController::class, 'approve']);
    Route::post('/timesheets/{timesheet}/reject', [TimesheetController::class, 'reject']);
    Route::post('/timesheets/{timesheet}/mark-paid', [TimesheetController::class, 'markPaid']);
    Route::post('/timesheets/{timesheet}/recalculate', [TimesheetController::class, 'recalculate']);
    Route::post('/timesheets/{timesheet}/trips', [TimesheetController::class, 'storeTrip']);
    Route::put('/timesheets/{timesheet}/trips/{trip}', [TimesheetController::class, 'updateTrip']);
    Route::post('/timesheets/{timesheet}/trips/{trip}/adjust', [TimesheetController::class, 'adjustTrip']);
    Route::delete('/timesheets/{timesheet}/trips/{trip}', [TimesheetController::class, 'destroyTrip']);
    Route::post('/timesheets/{timesheet}/trips/{trip}/pay-items', [TimesheetController::class, 'storePayItem']);
    Route::put('/timesheets/{timesheet}/trips/{trip}/pay-items/{payItem}', [TimesheetController::class, 'updatePayItem']);
    Route::delete('/timesheets/{timesheet}/trips/{trip}/pay-items/{payItem}', [TimesheetController::class, 'destroyPayItem']);

    // Client billing (invoices from approved timesheet trips — billable lines only)
    Route::post('/billing/invoice-preview', [InvoiceFinancialController::class, 'preview']);
    Route::get('/billing/invoices', [InvoiceFinancialController::class, 'index']);
    Route::post('/billing/invoices', [InvoiceFinancialController::class, 'store']);
    Route::get('/billing/invoices/{invoice}', [InvoiceFinancialController::class, 'show']);
    Route::patch('/billing/invoices/{invoice}', [InvoiceFinancialController::class, 'update']);
    Route::patch('/billing/invoices/{invoice}/status', [InvoiceFinancialController::class, 'updateStatus']);
    Route::post('/billing/invoices/{invoice}/payments', [InvoiceFinancialController::class, 'storePayment']);
    Route::get('/billing/invoices/{invoice}/pdf', [InvoiceFinancialController::class, 'downloadPdf']);

    // Tenant company profile (invoice client / billing identity)
    Route::get('/company-profile', [TenantCompanyProfileController::class, 'show']);
    Route::put('/company-profile', [TenantCompanyProfileController::class, 'update']);

    // Driver payroll (payslips from approved trips — payable lines only)
    Route::get('/payroll/billing-tax-settings', [PayrollFinancialController::class, 'getBillingTaxSettings']);
    Route::put('/payroll/billing-tax-settings', [PayrollFinancialController::class, 'putBillingTaxSettings']);
    Route::post('/payroll/calculation-preview', [PayrollFinancialController::class, 'previewCalculations']);
    Route::post('/payroll/generate', [PayrollFinancialController::class, 'generate']);
    Route::get('/payroll/payslips', [PayrollFinancialController::class, 'payslipsIndex']);
    Route::get('/payroll/payslips/{payslip}', [PayrollFinancialController::class, 'payslipShow']);
    Route::delete('/payroll/payslips/{payslip}', [PayrollFinancialController::class, 'payslipDestroy']);
    Route::post('/payroll/payslips/{payslip}/remittances', [PayrollFinancialController::class, 'storeRemittance']);
    Route::get('/payroll/payslips/{payslip}/pdf', [PayrollFinancialController::class, 'payslipPdf']);
    Route::post('/payroll/payslips/{payslip}/email-pay-stub', [PayrollFinancialController::class, 'emailPayStub']);
    Route::get('/payroll/payslips/{payslip}/invoice-pdf', [PayrollFinancialController::class, 'payslipInvoicePdf']);
    Route::get('/payroll/payslips/{payslip}/remittance-pdf', [PayrollFinancialController::class, 'remittancePdf']);
    Route::get('/payroll/driver-calculations/{driverCalculation}/pdf', [PayrollFinancialController::class, 'calculationPdf']);
});

