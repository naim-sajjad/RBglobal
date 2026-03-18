<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\Timesheet;
use App\Models\TimesheetTrip;
use App\Services\TimesheetCalculationService;
use Illuminate\Http\Request;

class TimesheetController extends Controller
{
    protected function getCurrentDriverId(): ?int
    {
        $user = auth()->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)->where('tenant_id', tenant('id'))->first();
        return $driver?->id;
    }

    public function index(Request $request)
    {
        $query = Timesheet::with(['driver.user', 'driver.driverClass', 'trips.employer']);

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
            $query->whereHas('trips', fn ($q) => $q->where('employer_id', $request->employer_id));
        }

        $timesheets = $query->orderBy('week_start_date', 'desc')->paginate($request->input('per_page', 15));
        return response()->json($timesheets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'driver_id' => 'nullable|integer|exists:drivers,id',
            'week_start_date' => 'required|date',
            'week_end_date' => 'required|date|after_or_equal:week_start_date',
        ]);

        $currentDriverId = $this->getCurrentDriverId();
        $driverId = $validated['driver_id'] ?? $currentDriverId;
        if (! $driverId) {
            return response()->json(['message' => 'Driver context required.'], 422);
        }
        if ($currentDriverId && $driverId != $currentDriverId && ! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'You can only create timesheets for yourself.');
        }

        $driver = \App\Models\Driver::findOrFail($driverId);
        if ($driver->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $exists = Timesheet::where('driver_id', $driverId)
            ->where('week_start_date', $validated['week_start_date'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'A timesheet for this week already exists.'], 422);
        }

        $timesheet = Timesheet::create([
            'driver_id' => $driverId,
            'tenant_id' => tenant('id'),
            'week_start_date' => $validated['week_start_date'],
            'week_end_date' => $validated['week_end_date'],
            'status' => 'draft',
        ]);
        return response()->json($timesheet->load(['driver.user', 'trips']), 201);
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
        $timesheet->load(['driver.user', 'driver.driverClass', 'trips.employer']);
        return response()->json($timesheet);
    }

    public function update(Request $request, Timesheet $timesheet)
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $currentDriverId = $this->getCurrentDriverId();
        $canEdit = $timesheet->status === 'draft' && $timesheet->driver_id == $currentDriverId;
        $canReview = in_array($timesheet->status, ['submitted', 'under_review']) && auth()->user()?->hasPermissionTo('drivers.view');
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
        if ($currentDriverId && $timesheet->driver_id != $currentDriverId) {
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
        if ($timesheet->driver_id != $currentDriverId) {
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
        if (! in_array($timesheet->status, ['submitted', 'under_review'])) {
            return response()->json(['message' => 'Only submitted or under-review timesheets can be approved.'], 422);
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
            'employer_id' => 'required|integer|exists:employers,id',
            'trip_date' => "required|date|after_or_equal:{$weekStart}|before_or_equal:{$weekEnd}",
            'trip_number' => 'nullable|string|max:50',
            'distance' => 'required|numeric|min:0',
            'stops_count' => 'nullable|integer|min:0',
            'delay_hours' => 'nullable|numeric|min:0',
            'handbomb_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);
        $employer = Employer::findOrFail($validated['employer_id']);
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $trip = $timesheet->trips()->create([
            'employer_id' => $validated['employer_id'],
            'trip_date' => $validated['trip_date'],
            'trip_number' => $validated['trip_number'] ?? null,
            'distance' => $validated['distance'],
            'stops_count' => $validated['stops_count'] ?? 0,
            'delay_hours' => $validated['delay_hours'] ?? 0,
            'handbomb_count' => $validated['handbomb_count'] ?? 0,
            'notes' => $validated['notes'] ?? null,
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
            'stops_count' => 'nullable|integer|min:0',
            'delay_hours' => 'nullable|numeric|min:0',
            'handbomb_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);
        if (isset($validated['employer_id'])) {
            $employer = Employer::findOrFail($validated['employer_id']);
            if ($employer->tenant_id !== tenant('id')) {
                abort(403, 'Unauthorized');
            }
        }
        $trip->update($validated);
        TimesheetCalculationService::recalculateTrip($trip);
        TimesheetCalculationService::recalculateTimesheet($timesheet);
        return response()->json($trip->fresh()->load('employer'));
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
}
