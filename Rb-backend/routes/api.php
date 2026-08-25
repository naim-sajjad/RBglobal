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
use App\Http\Controllers\Api\TimesheetDocumentController;
use App\Http\Controllers\Api\TimesheetDocumentReviewController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\InvoiceFinancialController;
use App\Http\Controllers\Api\PayrollFinancialController;
use App\Http\Controllers\Api\TenantCompanyProfileController;
use App\Http\Controllers\ContactSubmissionController;
use App\Http\Controllers\NewsletterSubscriberController;
use App\Http\Controllers\AdminFormsController;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\DashboardStatsController;
use App\Http\Controllers\JobPostController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\CareerGrowthRegistrationController;

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

    // Public timesheet document review (driver email link – no auth)
    Route::get('/timesheet-document-review/{token}', [TimesheetDocumentReviewController::class, 'showByToken']);
    Route::post('/timesheet-document-review/{token}/approve', [TimesheetDocumentReviewController::class, 'approveByToken']);
    Route::post('/timesheet-document-review/{token}/request-adjustment', [TimesheetDocumentReviewController::class, 'requestAdjustmentByToken']);
    Route::get('/timesheet-document-review/{token}/documents/{type}', [TimesheetDocumentReviewController::class, 'viewDocumentByToken']);

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
    Route::post('/drivers/import', [DriverController::class, 'import'])->middleware('permission:drivers.create');
    Route::get('/drivers/my-profile', [DriverController::class, 'myProfile']); // Driver's own profile
    Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:drivers.view');
    Route::get('/drivers/{driver}/application-pdf', [DriverController::class, 'applicationPdf'])->middleware('permission:drivers.view');
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
    Route::post('/timesheets/import', [TimesheetController::class, 'import']);
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
    Route::get('/timesheets/{timesheet}/documents', [TimesheetDocumentController::class, 'index']);
    Route::post('/timesheets/{timesheet}/documents/generate', [TimesheetDocumentController::class, 'generate']);
    Route::post('/timesheets/{timesheet}/documents/upload', [TimesheetDocumentController::class, 'upload']);
    Route::get('/timesheets/{timesheet}/documents/{document}/download', [TimesheetDocumentController::class, 'download']);
    Route::get('/timesheets/{timesheet}/documents/{document}/view', [TimesheetDocumentController::class, 'view']);
    Route::delete('/timesheets/{timesheet}/documents/{document}', [TimesheetDocumentController::class, 'destroy']);
    Route::get('/timesheet-document-adjustment-requests', [TimesheetDocumentReviewController::class, 'listAdjustmentRequests']);
    Route::put('/timesheet-document-reviews/{review}/adjustment', [TimesheetDocumentReviewController::class, 'updateAdjustment']);
    Route::get('/timesheets/{timesheet}/document-reviews', [TimesheetDocumentReviewController::class, 'index']);
    Route::post('/timesheets/{timesheet}/document-reviews/send', [TimesheetDocumentReviewController::class, 'send']);

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

    Route::get('/email-templates', [EmailTemplateController::class, 'index']);
    Route::put('/email-templates/{key}', [EmailTemplateController::class, 'update']);
    Route::post('/email-templates/{key}/reset', [EmailTemplateController::class, 'reset']);

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




/**
 * Website Admin Routes
 */

Route::post('/contact-submissions', [ContactSubmissionController::class, 'store'])
    ->middleware('throttle:contact-submissions');
Route::post('/newsletter-subscriptions', [NewsletterSubscriberController::class, 'store'])
    ->middleware('throttle:newsletter-subscriptions');
Route::get('/newsletter/unsubscribe/{token}', [NewsletterSubscriberController::class, 'unsubscribe']);
Route::get('/blog-posts', [BlogPostController::class, 'publicIndex']);
Route::get('/blog-posts/{slug}', [BlogPostController::class, 'publicShow']);
Route::get('/blog-categories', [BlogCategoryController::class, 'publicIndex']);
Route::get('/jobs', [JobPostController::class, 'publicIndex']);
Route::get('/jobs/{slug}', [JobPostController::class, 'publicShow']);
Route::get('/job-posts', [JobPostController::class, 'publicIndex']);
Route::get('/job-posts/{slug}', [JobPostController::class, 'publicShow']);
Route::post('/job-applications', [JobApplicationController::class, 'store'])
    ->middleware('throttle:job-applications');
Route::post('/career-growth-registrations', [CareerGrowthRegistrationController::class, 'store'])
    ->middleware('throttle:career-growth-registrations');

Route::prefix('admin')->group(function (): void {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:admin-login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/change-password', [AdminAuthController::class, 'changePassword']);
        Route::get('/dashboard/stats', DashboardStatsController::class);
        Route::get('/forms/summary', [AdminFormsController::class, 'summary']);
        Route::get('/forms/submissions', [AdminFormsController::class, 'submissions']);
        Route::get('/forms/submissions/export', [AdminFormsController::class, 'export']);
        Route::post('/forms/submissions/export-selected', [AdminFormsController::class, 'exportSelected']);
        Route::post('/forms/submissions/bulk-action', [AdminFormsController::class, 'bulkAction']);
        Route::get('/forms/submissions/{type}/{id}', [AdminFormsController::class, 'show'])
            ->whereIn('type', ['contact', 'newsletter', 'career_growth', 'job_application'])
            ->whereNumber('id');

        //Route::middleware('admin.role:super_admin,admin')->group(function (): void {
            Route::get('/contact-submissions', [ContactSubmissionController::class, 'index']);
            Route::get('/contact-submissions/export', [ContactSubmissionController::class, 'export']);
            Route::get('/contact-submissions/import-template', [ContactSubmissionController::class, 'importTemplate']);
            Route::post('/contact-submissions/import/preview', [ContactSubmissionController::class, 'previewImport'])->middleware('throttle:contact-imports');
            Route::post('/contact-submissions/import', [ContactSubmissionController::class, 'import'])->middleware('throttle:contact-imports');
            Route::get('/contact-imports', [ContactSubmissionController::class, 'imports']);
            Route::get('/contact-imports/{importBatch}', [ContactSubmissionController::class, 'importShow']);
            Route::get('/contact-imports/{importBatch}/errors', [ContactSubmissionController::class, 'importErrors']);
            Route::get('/contact-submissions/{contactSubmission}', [ContactSubmissionController::class, 'show']);
            Route::patch('/contact-submissions/{contactSubmission}/status', [ContactSubmissionController::class, 'updateStatus']);
            Route::delete('/contact-submissions/{contactSubmission}', [ContactSubmissionController::class, 'destroy']);

            Route::get('/newsletter-subscribers/export', [NewsletterSubscriberController::class, 'export']);
            Route::get('/newsletter-subscribers/import-template', [NewsletterSubscriberController::class, 'importTemplate']);
            Route::post('/newsletter-subscribers/import/preview', [NewsletterSubscriberController::class, 'previewImport'])->middleware('throttle:newsletter-imports');
            Route::post('/newsletter-subscribers/import', [NewsletterSubscriberController::class, 'import'])->middleware('throttle:newsletter-imports');
            Route::get('/newsletter-imports', [NewsletterSubscriberController::class, 'imports']);
            Route::get('/newsletter-imports/{importBatch}', [NewsletterSubscriberController::class, 'importShow']);
            Route::get('/newsletter-imports/{importBatch}/errors', [NewsletterSubscriberController::class, 'importErrors']);
            Route::get('/newsletter-subscribers', [NewsletterSubscriberController::class, 'index']);
            Route::get('/newsletter-subscribers/{newsletterSubscriber}', [NewsletterSubscriberController::class, 'show']);
            Route::patch('/newsletter-subscribers/{newsletterSubscriber}/status', [NewsletterSubscriberController::class, 'updateStatus']);
            Route::delete('/newsletter-subscribers/{newsletterSubscriber}', [NewsletterSubscriberController::class, 'destroy']);
       // });

        //Route::middleware('admin.role:super_admin,admin,editor')->group(function (): void {
            Route::get('/blog-posts', [BlogPostController::class, 'index']);
            Route::post('/blog-posts', [BlogPostController::class, 'store']);
            Route::get('/blog-posts/{blogPost}', [BlogPostController::class, 'show']);
            Route::post('/blog-posts/{blogPost}', [BlogPostController::class, 'update']);
            Route::match(['put', 'patch'], '/blog-posts/{blogPost}', [BlogPostController::class, 'update']);
            Route::patch('/blog-posts/{blogPost}/status', [BlogPostController::class, 'updateStatus']);
            Route::delete('/blog-posts/{blogPost}', [BlogPostController::class, 'destroy']);

            Route::get('/blog-categories', [BlogCategoryController::class, 'index']);
            Route::post('/blog-categories', [BlogCategoryController::class, 'store']);
            Route::get('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'show']);
            Route::put('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'update']);
            Route::delete('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'destroy']);

            Route::get('/jobs', [JobPostController::class, 'index']);
            Route::post('/jobs', [JobPostController::class, 'store']);
            Route::get('/jobs/{jobPost}', [JobPostController::class, 'show']);
            Route::post('/jobs/{jobPost}', [JobPostController::class, 'update']);
            Route::match(['put', 'patch'], '/jobs/{jobPost}', [JobPostController::class, 'update']);
            Route::patch('/jobs/{jobPost}/status', [JobPostController::class, 'updateStatus']);
            Route::delete('/jobs/{jobPost}', [JobPostController::class, 'destroy']);

            Route::get('/job-posts', [JobPostController::class, 'index']);
            Route::post('/job-posts', [JobPostController::class, 'store']);
            Route::get('/job-posts/{jobPost}', [JobPostController::class, 'show']);
            Route::post('/job-posts/{jobPost}', [JobPostController::class, 'update']);
            Route::match(['put', 'patch'], '/job-posts/{jobPost}', [JobPostController::class, 'update']);
            Route::patch('/job-posts/{jobPost}/status', [JobPostController::class, 'updateStatus']);
            Route::delete('/job-posts/{jobPost}', [JobPostController::class, 'destroy']);
      //  });

        //Route::middleware('admin.role:super_admin')->group(function (): void {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::put('/users/{user}', [AdminUserController::class, 'update']);
            Route::patch('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
            Route::post('/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
            Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
        //});
    });
});
