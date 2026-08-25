<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\DriverNotification;
use App\Models\Timesheet;
use App\Models\TimesheetAdjustmentLog;
use App\Models\TimesheetTrip;
use App\Services\TimesheetCalculationService;
use App\Services\Financial\TimesheetImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class TimesheetController extends Controller
{
    protected function getCurrentDriverId(): ?int
    {
        $user = auth()->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->where('tenant_id', tenant('id'))->first();
        return $driver?->id;
    }

    protected function isStaff(): bool
    {
        return (bool) auth()->user()?->hasPermissionTo('drivers.view');
    }

    public function index(Request $request)
    {
        $query = Timesheet::with([
            'driver.user',
            'driver.driverClass',
            'employer',
            'trips.employer',
            'latestDocumentReview',
        ]);

        $driverId = $request->input('driver_id');
        $currentDriverId = $this->getCurrentDriverId();
        $isDriver = $currentDriverId && ! auth()->user()?->hasPermissionTo('drivers.view');

        if ($driverId) {
            if ($isDriver && (int) $driverId !== $currentDriverId) {
                abort(403, 'You can only list your own timesheets.');
            }
            $query->where('driver_id', $driverId);
        } elseif ($isDriver) {
            $query->where('driver_id', $currentDriverId);
        }

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('employer_id')) {
            $employerId = $request->employer_id;
            $query->where(function ($q) use ($employerId) {
                $q->where('employer_id', $employerId)
                    ->orWhereHas('trips', fn ($trips) => $trips->where('employer_id', $employerId));
            });
        }

        if ($request->filled('week_start_from') || $request->filled('week_start_to')) {
            $request->validate([
                'week_start_from' => 'nullable|date',
                'week_start_to' => 'nullable|date',
            ]);

            $fromStr = $request->filled('week_start_from')
                ? Carbon::parse($request->query('week_start_from'))->format('Y-m-d')
                : null;
            $toStr = $request->filled('week_start_to')
                ? Carbon::parse($request->query('week_start_to'))->format('Y-m-d')
                : null;

            if ($fromStr && $toStr && $toStr < $fromStr) {
                abort(422, 'week_start_to must be on or after week_start_from.');
            }

            if ($fromStr !== null) {
                $query->where('week_start_date', '>=', $fromStr);
            }
            if ($toStr !== null) {
                $query->where('week_start_date', '<=', $toStr);
            }
        }

        $timesheets = $query->orderBy('week_start_date', 'desc')->paginate($request->input('per_page', 15));

        return response()
            ->json($timesheets)
            ->header('Cache-Control', 'private, no-store, must-revalidate');
    }

    public function store(Request $request)
    {
        $isStaff = $this->isStaff();
        $validated = $request->validate([
            'driver_id' => 'nullable|integer|exists:drivers,id',
            'employer_id' => ($isStaff ? 'required' : 'nullable').'|integer|exists:employers,id',
            'week_start_date' => 'required|date',
            'week_end_date' => 'required|date|after_or_equal:week_start_date',
        ]);

        $currentDriverId = $this->getCurrentDriverId();
        $driverId = $validated['driver_id'] ?? $currentDriverId;
        if (! $driverId) {
            return response()->json(['message' => 'Driver context required.'], 422);
        }
        if ($currentDriverId && $driverId != $currentDriverId && ! $isStaff) {
            abort(403, 'You can only create timesheets for yourself.');
        }

        $driver = \App\Models\Driver::findOrFail($driverId);
        if ($driver->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $employerId = $validated['employer_id'] ?? null;
        if ($employerId) {
            $employer = Employer::findOrFail($employerId);
            if ($employer->tenant_id !== tenant('id')) {
                abort(403, 'Unauthorized');
            }
        }

        $existsQuery = Timesheet::where('driver_id', $driverId)
            ->where('week_start_date', $validated['week_start_date']);
        if ($employerId) {
            $existsQuery->where('employer_id', $employerId);
        } else {
            $existsQuery->whereNull('employer_id');
        }
        if ($existsQuery->exists()) {
            return response()->json([
                'message' => $employerId
                    ? 'A timesheet for this driver, employer, and week already exists.'
                    : 'A timesheet for this week already exists.',
            ], 422);
        }

        $timesheet = Timesheet::create([
            'driver_id' => $driverId,
            'employer_id' => $employerId,
            'tenant_id' => tenant('id'),
            'week_start_date' => $validated['week_start_date'],
            'week_end_date' => $validated['week_end_date'],
            'status' => 'draft',
        ]);
        return response()->json($timesheet->load(['driver.user', 'employer', 'trips']), 201);
    }

    public function import(Request $request)
    {
        if (! $this->isStaff()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension() ?: '');
        if (! in_array($ext, ['csv', 'xlsx', 'txt'], true)) {
            return response()->json([
                'message' => 'Unsupported file type. Upload a .csv or .xlsx customer timesheet.',
            ], 422);
        }

        try {
            $result = TimesheetImportService::import(
                $file,
                tenant('id'),
                auth()->id()
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => preg_split("/\r\n|\n|\r/", $e->getMessage()) ?: [$e->getMessage()],
            ], 422);
        }

        return response()->json(array_merge([
            'message' => 'Import completed.',
        ], $result), 201);
    }

    public function show(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $currentDriverId = $this->getCurrentDriverId();
        if ($currentDriverId && $timesheet->driver_id != $currentDriverId && ! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'You can only view your own timesheets.');
        }
        $timesheet->load([
            'driver.user',
            'driver.driverClass',
            'employer',
            'trips.employer',
            'documents.creator:id,name',
            'documentReviews.sender:id,name',
            'documentReviews.events',
        ]);
        return response()->json($timesheet);
    }

    public function update(Request $request, Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $currentDriverId = $this->getCurrentDriverId();
        $isStaff = $this->isStaff();
        $canEdit = $timesheet->status === 'draft' && ($timesheet->driver_id == $currentDriverId || $isStaff);
        $canReview = in_array($timesheet->status, ['submitted', 'under_review']) && $isStaff;
        if (! $canEdit && ! $canReview) {
            return response()->json(['message' => 'This timesheet cannot be edited.'], 422);
        }

        $validated = $request->validate([
            'week_start_date' => 'sometimes|date',
            'week_end_date' => 'sometimes|date|after_or_equal:week_start_date',
            'notes' => 'nullable|string|max:65535',
        ]);
        if ($timesheet->status === 'draft') {
            $timesheet->update($validated);
        } else {
            if (array_key_exists('notes', $validated)) {
                $timesheet->update(['notes' => $validated['notes']]);
            }
        }
        return response()->json($timesheet->fresh()->load(['driver.user', 'trips.employer', 'trips.payItems.payItemTemplate']));
    }

    public function destroy(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if ($timesheet->status !== 'draft') {
            return response()->json(['message' => 'Only draft timesheets can be deleted.'], 422);
        }
        $currentDriverId = $this->getCurrentDriverId();
        $isStaff = $this->isStaff();
        if ($currentDriverId && $timesheet->driver_id != $currentDriverId && ! $isStaff) {
            abort(403, 'Unauthorized');
        }
        $timesheet->delete();
        return response()->json(null, 204);
    }

    public function submit(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if ($timesheet->status !== 'draft') {
            return response()->json(['message' => 'Only draft timesheets can be submitted.'], 422);
        }
        $currentDriverId = $this->getCurrentDriverId();
        $isStaff = $this->isStaff();
        if ($timesheet->driver_id != $currentDriverId && ! $isStaff) {
            abort(403, 'Unauthorized');
        }
        $timesheet->update(['status' => 'submitted', 'submitted_at' => now()]);
        return response()->json($timesheet->fresh()->load(['driver.user', 'trips.employer', 'trips.payItems.payItemTemplate']));
    }

    public function approve(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $isStaff = $this->isStaff();
        $approvable = in_array($timesheet->status, ['submitted', 'under_review'])
            || ($isStaff && $timesheet->status === 'draft');
        if (! $approvable) {
            return response()->json(['message' => 'Only submitted, under-review, or staff-managed draft timesheets can be approved.'], 422);
        }
        $timesheet->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
            'reject_reason' => null,
        ]);
        return response()->json($timesheet->fresh()->load(['driver.user', 'trips.employer', 'trips.payItems.payItemTemplate']));
    }

    public function reject(Request $request, Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! in_array($timesheet->status, ['submitted', 'under_review'])) {
            return response()->json(['message' => 'Only submitted or under-review timesheets can be rejected.'], 422);
        }
        $validated = $request->validate(['reject_reason' => 'nullable|string|max:65535']);
        $timesheet->update([
            'status' => 'rejected',
            'reject_reason' => $validated['reject_reason'] ?? null,
        ]);
        return response()->json($timesheet->fresh()->load(['driver.user', 'trips.employer', 'trips.payItems.payItemTemplate']));
    }

    public function markPaid(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if ($timesheet->status !== 'approved') {
            return response()->json(['message' => 'Only approved timesheets can be marked as paid.'], 422);
        }
        $timesheet->update(['status' => 'paid', 'paid_at' => now(), 'paid_by' => auth()->id()]);
        return response()->json($timesheet->fresh()->load(['driver.user', 'driver.driverClass', 'trips.employer']));
    }

    public function storeTrip(Request $request, Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! in_array($timesheet->status, ['draft', 'submitted', 'under_review'])) {
            return response()->json(['message' => 'Cannot add trips to this timesheet.'], 422);
        }
        $weekStart = $timesheet->week_start_date->format('Y-m-d');
        $weekEnd = $timesheet->week_end_date->format('Y-m-d');
        $validated = $request->validate([
            'employer_id' => 'nullable|integer|exists:employers,id',
            'trip_date' => "required|date|after_or_equal:{$weekStart}|before_or_equal:{$weekEnd}",
            'trip_number' => 'nullable|string|max:50',
            'distance' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'additional_quantities' => 'nullable|array',
            'additional_quantities.*' => 'nullable|numeric|min:0',
            'custom_pay_lines' => 'nullable|array',
            'custom_pay_lines.*.label' => 'required_with:custom_pay_lines|string|max:255',
            'custom_pay_lines.*.quantity' => 'required_with:custom_pay_lines|numeric|min:0',
            'custom_pay_lines.*.unit' => 'nullable|string|max:50',
            'custom_pay_lines.*.rate' => 'nullable|numeric|min:0',
            'custom_pay_lines.*.driver_rate' => 'nullable|numeric|min:0',
            'custom_pay_lines.*.agency_rate' => 'nullable|numeric|min:0',
            'rate_overrides' => 'nullable|array',
        ]);
        $employerId = $validated['employer_id'] ?? $timesheet->employer_id;
        if (! $employerId) {
            return response()->json(['message' => 'Employer is required.'], 422);
        }
        $employer = Employer::findOrFail($employerId);
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $customPayLines = self::normalizeCustomPayLines($validated['custom_pay_lines'] ?? null);
        $rateOverrides = self::normalizeRateOverrides($validated['rate_overrides'] ?? null);
        $trip = $timesheet->trips()->create([
            'employer_id' => $employerId,
            'trip_date' => $validated['trip_date'],
            'trip_number' => $validated['trip_number'] ?? null,
            'distance' => $validated['distance'],
            'notes' => $validated['notes'] ?? null,
            'additional_quantities' => $validated['additional_quantities'] ?? null,
            'custom_pay_lines' => $customPayLines,
            'rate_overrides' => $rateOverrides,
        ]);
        TimesheetCalculationService::recalculateTrip($trip);
        TimesheetCalculationService::recalculateTimesheet($timesheet);
        return response()->json($trip->fresh()->load('employer'), 201);
    }

    public function updateTrip(Request $request, Timesheet $timesheet, TimesheetTrip $trip)
    {
        if ($trip->timesheet_id !== $timesheet->id || $timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! in_array($timesheet->status, ['draft', 'submitted', 'under_review'])) {
            return response()->json(['message' => 'Cannot edit trips.'], 422);
        }
        $validated = $request->validate([
            'employer_id' => 'sometimes|integer|exists:employers,id',
            'trip_date' => 'sometimes|date|after_or_equal:' . $timesheet->week_start_date->format('Y-m-d') . '|before_or_equal:' . $timesheet->week_end_date->format('Y-m-d'),
            'trip_number' => 'nullable|string|max:50',
            'distance' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'additional_quantities' => 'nullable|array',
            'additional_quantities.*' => 'nullable|numeric|min:0',
            'custom_pay_lines' => 'nullable|array',
            'custom_pay_lines.*.label' => 'required_with:custom_pay_lines|string|max:255',
            'custom_pay_lines.*.quantity' => 'required_with:custom_pay_lines|numeric|min:0',
            'custom_pay_lines.*.unit' => 'nullable|string|max:50',
            'custom_pay_lines.*.rate' => 'nullable|numeric|min:0',
            'custom_pay_lines.*.driver_rate' => 'nullable|numeric|min:0',
            'custom_pay_lines.*.agency_rate' => 'nullable|numeric|min:0',
            'rate_overrides' => 'nullable|array',
        ]);
        if (isset($validated['employer_id'])) {
            $employer = Employer::findOrFail($validated['employer_id']);
            if ($employer->tenant_id !== tenant('id')) {
                abort(403, 'Unauthorized');
            }
        }
        if (array_key_exists('custom_pay_lines', $validated)) {
            $validated['custom_pay_lines'] = self::normalizeCustomPayLines($validated['custom_pay_lines']);
        }
        if (array_key_exists('rate_overrides', $validated)) {
            $validated['rate_overrides'] = self::normalizeRateOverrides($validated['rate_overrides']);
        }
        $trip->update($validated);
        // If admin manually adjusted the trip, avoid overwriting the manual snapshot unless explicitly forced.
        $force = (bool) $request->boolean('force_recalculate', false);
        if (! $trip->is_adjusted || $force) {
            if ($force) {
                $trip->update(['is_adjusted' => false, 'adjusted_at' => null, 'adjusted_reason' => null, 'manual_rate_snapshot' => null]);
            }
            TimesheetCalculationService::recalculateTrip($trip);
        }
        TimesheetCalculationService::recalculateTimesheet($timesheet);
        return response()->json($trip->fresh()->load('employer'));
    }

    /**
     * Admin-only: manually override rate snapshot for a trip to match employer-provided invoice.
     */
    public function adjustTrip(Request $request, Timesheet $timesheet, TimesheetTrip $trip)
    {
        if ($trip->timesheet_id !== $timesheet->id || $timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }
        if (! in_array($timesheet->status, ['draft', 'submitted', 'under_review', 'approved', 'paid'])) {
            return response()->json(['message' => 'Cannot adjust timesheet.'], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
            'manual_rate_snapshot' => 'required|array',
            'manual_rate_snapshot.lines' => 'required|array|min:1',
            'manual_rate_snapshot.total_driver_pay' => 'required|numeric|min:0',
            'manual_rate_snapshot.total_agency_billing' => 'required|numeric|min:0',
            'notify_driver' => 'nullable|boolean',
            'email_driver' => 'nullable|boolean',
        ]);

        $before = [
            'rate_snapshot' => $trip->rate_snapshot,
            'trip_total' => (float) $trip->trip_total,
            'total_agency_billing' => (float) $trip->total_agency_billing,
            'is_adjusted' => (bool) $trip->is_adjusted,
            'adjusted_reason' => $trip->adjusted_reason,
            'manual_rate_snapshot' => $trip->manual_rate_snapshot,
        ];

        $snap = $validated['manual_rate_snapshot'];
        $trip->update([
            'manual_rate_snapshot' => $snap,
            'rate_snapshot' => $snap,
            'trip_total' => round((float) $snap['total_driver_pay'], 2),
            'total_agency_billing' => round((float) $snap['total_agency_billing'], 2),
            'is_adjusted' => true,
            'adjusted_at' => now(),
            'adjusted_reason' => $validated['reason'] ?? null,
        ]);
        $timesheet->update([
            'adjusted_at' => now(),
            'adjusted_by' => auth()->id(),
        ]);
        TimesheetCalculationService::recalculateTimesheet($timesheet);

        TimesheetAdjustmentLog::create([
            'tenant_id' => tenant('id'),
            'timesheet_id' => $timesheet->id,
            'timesheet_trip_id' => $trip->id,
            'admin_user_id' => auth()->id(),
            'reason' => $validated['reason'] ?? null,
            'before' => $before,
            'after' => [
                'manual_rate_snapshot' => $snap,
                'trip_total' => (float) $trip->trip_total,
                'total_agency_billing' => (float) $trip->total_agency_billing,
            ],
        ]);

        $notify = (bool) ($validated['notify_driver'] ?? true);
        $email = (bool) ($validated['email_driver'] ?? false);
        if ($notify) {
            DriverNotification::create([
                'tenant_id' => tenant('id'),
                'driver_id' => $timesheet->driver_id,
                'type' => 'timesheet_updated',
                'title' => 'Timesheet updated',
                'message' => 'Your timesheet has been updated. Please review the changes.',
                'meta' => ['timesheet_id' => $timesheet->id, 'timesheet_trip_id' => $trip->id],
                'created_by_user_id' => auth()->id(),
            ]);
        }
        if ($email) {
            $driverUser = $timesheet->driver?->user;
            $to = $driverUser?->email;
            if (is_string($to) && $to !== '') {
                $subject = 'Timesheet अपडेट / Updated';
                $body = 'Your timesheet has been updated by the admin based on employer-provided invoice. Please log in and review the changes.';
                Mail::raw($body, function ($m) use ($to, $subject) {
                    $m->to($to)->subject($subject);
                });
            }
        }

        return response()->json([
            'message' => 'Trip adjusted.',
            'timesheet' => $timesheet->fresh()->load(['driver.user', 'driver.driverClass', 'trips.employer']),
            'trip' => $trip->fresh()->load('employer'),
        ]);
    }

    public function destroyTrip(Timesheet $timesheet, TimesheetTrip $trip)
    {
        if ($trip->timesheet_id !== $timesheet->id || $timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! in_array($timesheet->status, ['draft', 'submitted', 'under_review'])) {
            return response()->json(['message' => 'Cannot delete trips.'], 422);
        }
        $trip->delete();
        TimesheetCalculationService::recalculateTimesheet($timesheet);
        return response()->json(null, 204);
    }

    /**
     * Pay items are deprecated: pricing is now contract-driven from Employer Rate Cards only.
     */
    public function storePayItem(Request $request, Timesheet $timesheet, TimesheetTrip $trip)
    {
        return response()->json([
            'message' => 'Pricing is now driven by Employer Rate Cards only. Enter distance, stops, delay, and handbomb on the trip; rates are calculated automatically.',
        ], 410);
    }

    public function updatePayItem(Request $request, Timesheet $timesheet, TimesheetTrip $trip, $payItem)
    {
        return response()->json([
            'message' => 'Pricing is now driven by Employer Rate Cards only. Edit trip distance, stops, delay, or handbomb to recalculate.',
        ], 410);
    }

    public function destroyPayItem(Timesheet $timesheet, TimesheetTrip $trip, $payItem)
    {
        return response()->json([
            'message' => 'Pricing is now driven by Employer Rate Cards only.',
        ], 410);
    }

    /**
     * Recalculate entire timesheet from Rate Cards (distance, stops, delay, handbomb → rates).
     */
    public function recalculate(Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        foreach ($timesheet->trips as $trip) {
            TimesheetCalculationService::recalculateTrip($trip->fresh());
        }
        TimesheetCalculationService::recalculateTimesheet($timesheet->fresh());
        return response()->json($timesheet->fresh()->load(['driver.user', 'driver.driverClass', 'trips.employer']));
    }

    /**
     * @param  array<int, mixed>|null  $lines
     * @return array<int, array{label: string, quantity: float, unit: ?string, rate: float, agency_rate: float}>|null
     */
    private static function normalizeCustomPayLines(?array $lines): ?array
    {
        if ($lines === null) {
            return null;
        }
        $normalized = [];
        foreach ($lines as $line) {
            if (! is_array($line)) {
                continue;
            }
            $label = trim((string) ($line['label'] ?? ''));
            $quantity = (float) ($line['quantity'] ?? 0);
            if ($label === '' || $quantity <= 0) {
                continue;
            }
            $unit = trim((string) ($line['unit'] ?? ''));
            $rate = (float) ($line['rate'] ?? $line['driver_rate'] ?? 0);
            $agencyRate = (float) ($line['agency_rate'] ?? 0);
            $normalized[] = [
                'label' => $label,
                'quantity' => $quantity,
                'unit' => $unit !== '' ? $unit : null,
                'rate' => $rate,
                'agency_rate' => $agencyRate,
            ];
        }

        return $normalized === [] ? null : $normalized;
    }

    /**
     * @param  array<string, mixed>|null  $overrides
     * @return array<string, array{rate: float, agency_rate: float}>|null
     */
    private static function normalizeRateOverrides(?array $overrides): ?array
    {
        if ($overrides === null) {
            return null;
        }
        $normalized = [];
        foreach ($overrides as $key => $value) {
            if (! is_string($key) || $key === '' || ! is_array($value)) {
                continue;
            }
            $normalized[$key] = [
                'rate' => (float) ($value['rate'] ?? $value['driver_rate'] ?? 0),
                'agency_rate' => (float) ($value['agency_rate'] ?? 0),
            ];
        }

        return $normalized === [] ? null : $normalized;
    }
}
