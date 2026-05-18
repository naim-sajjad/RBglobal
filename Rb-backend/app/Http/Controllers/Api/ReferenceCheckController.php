<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\ReferenceCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ReferenceCheckController extends Controller
{
    /**
     * When a referee or admin submits the full reference form, mark the driver's reference check completed (auto).
     * Admins can still set pending/completed manually on the driver record.
     */
    private function markDriverReferenceCheckCompleted(ReferenceCheck $check): void
    {
        if (! Schema::hasColumn('drivers', 'reference_check_status')) {
            return;
        }
        Driver::query()->whereKey($check->driver_id)->update([
            'reference_check_status' => 'completed',
        ]);
    }

    /**
     * Ensure the driver can be accessed by the current user (tenant scope or super admin).
     */
    protected function authorizeDriver(Driver $driver): void
    {
        $user = auth()->user();
        if ($user->is_global_admin) {
            return;
        }
        $tenantId = tenant('id');
        if ($tenantId && $driver->tenant_id === $tenantId) {
            return;
        }
        if ($user->tenants->contains('id', $driver->tenant_id)) {
            return;
        }
        abort(403, 'You do not have permission to access this driver.');
    }

    /**
     * List reference checks for a driver.
     * GET /tenant/drivers/{driver}/reference-checks
     */
    public function index(Driver $driver)
    {
        $this->authorizeDriver($driver);
        $checks = ReferenceCheck::where('driver_id', $driver->id)
            ->orderByDesc('created_at')
            ->get();
        return response()->json($checks);
    }

    /**
     * Get a single reference check.
     * GET /tenant/drivers/{driver}/reference-checks/{referenceCheck}
     */
    public function show(Driver $driver, ReferenceCheck $referenceCheck)
    {
        $this->authorizeDriver($driver);
        if ((int) $referenceCheck->driver_id !== (int) $driver->id) {
            abort(404);
        }
        $referenceCheck->load('driver.user');
        return response()->json($referenceCheck);
    }

    /**
     * Create a reference check request.
     * POST /tenant/drivers/{driver}/reference-checks
     */
    public function store(Request $request, Driver $driver)
    {
        $this->authorizeDriver($driver);

        $validated = $request->validate([
            'referee_email' => 'nullable|email',
            'reference_request' => 'required|array',
            'reference_request.applicant_name' => 'required|string',
            'reference_request.drivers_license_number' => 'nullable|string',
            'reference_request.previous_company_name' => 'required|string',
            'reference_request.previous_company_phone' => 'nullable|string',
            'reference_request.supervisor_employer_name' => 'required|string',
            'applicant_consent' => 'nullable|array',
            'applicant_consent.applicant_name' => 'nullable|string',
            'applicant_consent.consent_date' => 'nullable|string',
            'applicant_consent.agreed_to_investigation' => 'nullable|boolean',
            'applicant_consent.agreed_to_rules' => 'nullable|boolean',
            'applicant_consent.certified_truthful' => 'nullable|boolean',
        ]);

        $tenantId = tenant('id') ?? $driver->tenant_id;

        $check = ReferenceCheck::create([
            'driver_id' => $driver->id,
            'tenant_id' => $tenantId,
            'status' => ! empty($validated['referee_email']) ? 'sent' : 'pending',
            'referee_email' => $validated['referee_email'] ?? null,
            'reference_request' => $validated['reference_request'],
            'applicant_consent' => $validated['applicant_consent'] ?? null,
            'sent_at' => ! empty($validated['referee_email']) ? now() : null,
        ]);

        return response()->json($check, 201);
    }

    /**
     * Send reference check link to referee (optional: trigger email here).
     * POST /tenant/drivers/{driver}/reference-checks/{referenceCheck}/send-link
     */
    public function sendLink(Request $request, Driver $driver, ReferenceCheck $referenceCheck)
    {
        $this->authorizeDriver($driver);
        if ((int) $referenceCheck->driver_id !== (int) $driver->id) {
            abort(404);
        }

        $validated = $request->validate([
            'referee_email' => 'required|email',
        ]);

        $referenceCheck->update([
            'referee_email' => $validated['referee_email'],
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // TODO: Optionally send email with link: url("/reference/{$referenceCheck->token}")
        return response()->json([
            'message' => 'Link sent.',
            'reference_check' => $referenceCheck->fresh(),
            'link' => url("/reference/{$referenceCheck->token}"),
        ]);
    }

    /**
     * Fill reference check as admin.
     * PUT /tenant/drivers/{driver}/reference-checks/{referenceCheck}/fill
     */
    public function fill(Request $request, Driver $driver, ReferenceCheck $referenceCheck)
    {
        $this->authorizeDriver($driver);
        if ((int) $referenceCheck->driver_id !== (int) $driver->id) {
            abort(404);
        }

        $validated = $request->validate([
            'form_data' => 'required|array',
            'form_data.applicant_name' => 'required|string',
            'form_data.date_of_reference_check' => 'required|string',
            'form_data.relationship_to_applicant' => 'required|in:supervisor,other',
            'form_data.date_of_employment_from' => 'required|string',
            'form_data.date_of_employment_to' => 'required|string',
            'form_data.positions_held' => 'required|string',
            'form_data.nature_of_job' => 'required|string',
            'form_data.driver_off_illness_injury' => 'required|string',
            'form_data.involved_in_accidents' => 'required|in:yes,no',
            'form_data.reason_for_leaving' => 'required|in:discharged,resignation,lay_off',
            'form_data.attendance_rating' => 'required|string',
            'form_data.dependability_rating' => 'required|string',
            'form_data.willingness_rating' => 'required|string',
            'form_data.ability_to_follow_instructions_rating' => 'required|string',
            'form_data.quality_of_work_rating' => 'required|string',
            'form_data.name_of_person_supplying_info' => 'required|string',
            'form_data.referee_signature_date' => 'required|string',
        ]);

        $referenceCheck->update([
            'form_data' => $validated['form_data'],
            'filled_by' => 'admin',
            'status' => 'admin_filled',
            'completed_at' => now(),
        ]);

        $this->markDriverReferenceCheckCompleted($referenceCheck);

        return response()->json($referenceCheck->fresh());
    }

    /**
     * Public: Get reference check by token (for referee form link).
     * GET /reference-check/{token}
     */
    public function getByToken(string $token)
    {
        $check = ReferenceCheck::where('token', $token)->first();
        if (! $check) {
            return response()->json(['message' => 'Invalid or expired link.'], 404);
        }
        $check->load('driver.user');
        return response()->json($check);
    }

    /**
     * Public: Submit reference check form (referee or link submission).
     * POST /reference-check/{token}/submit
     */
    public function submitByToken(Request $request, string $token)
    {
        $check = ReferenceCheck::where('token', $token)->first();
        if (! $check) {
            return response()->json(['message' => 'Invalid or expired link.'], 404);
        }
        if (in_array($check->status, ['completed', 'admin_filled'], true)) {
            return response()->json(['message' => 'This reference check has already been submitted.'], 422);
        }

        $validated = $request->validate([
            'form_data' => 'required|array',
            'form_data.applicant_name' => 'required|string',
            'form_data.date_of_reference_check' => 'required|string',
            'form_data.relationship_to_applicant' => 'required|in:supervisor,other',
            'form_data.date_of_employment_from' => 'required|string',
            'form_data.date_of_employment_to' => 'required|string',
            'form_data.positions_held' => 'required|string',
            'form_data.nature_of_job' => 'required|string',
            'form_data.driver_off_illness_injury' => 'required|string',
            'form_data.involved_in_accidents' => 'required|in:yes,no',
            'form_data.reason_for_leaving' => 'required|in:discharged,resignation,lay_off',
            'form_data.attendance_rating' => 'required|string',
            'form_data.dependability_rating' => 'required|string',
            'form_data.willingness_rating' => 'required|string',
            'form_data.ability_to_follow_instructions_rating' => 'required|string',
            'form_data.quality_of_work_rating' => 'required|string',
            'form_data.name_of_person_supplying_info' => 'required|string',
            'form_data.referee_signature_date' => 'required|string',
        ]);

        $check->update([
            'form_data' => $validated['form_data'],
            'filled_by' => 'referee',
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->markDriverReferenceCheckCompleted($check);

        return response()->json(['message' => 'Reference check submitted successfully.', 'reference_check' => $check->fresh()]);
    }
}
