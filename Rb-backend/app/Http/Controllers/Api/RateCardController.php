<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\RateCard;
use Illuminate\Http\Request;

class RateCardController extends Controller
{
    public function index(Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $cards = $employer->rateCards()->orderBy('effective_from', 'desc')->get();
        foreach ($cards as $card) {
            if ($card->status !== 'draft') {
                RateCard::updateStatus($card);
            }
        }
        return response()->json($cards);
    }

    public function store(Request $request, Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'effective_from' => 'required|date',
            'effective_to' => 'required|date|after_or_equal:effective_from',
            'status' => 'nullable|in:draft,active,scheduled,expired',
            'rates' => 'nullable|array',
            'rates.measurement_unit' => 'nullable|string|in:miles,km',
            'rates.currency' => 'nullable|string|max:10',
            'rates.minimum_trip_pay_agency' => 'nullable|numeric|min:0',
            'rates.minimum_trip_pay_driver' => 'nullable|numeric|min:0',
            'rates.minimum_trip_pay_driver_by_class' => 'nullable|array',
            'rates.minimum_trip_pay_driver_by_class.*' => 'nullable|numeric|min:0',
            'rates.distance_bands' => 'nullable|array',
            'rates.distance_bands.*.distance_from' => 'required_with:rates.distance_bands|numeric|min:0',
            'rates.distance_bands.*.distance_to' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.agency_rate' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.driver_rate' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.driver_rates_by_class' => 'nullable|array',
            'rates.distance_bands.*.driver_rates_by_class.*' => 'nullable|numeric|min:0',
            'rates.additional_charges' => 'nullable|array',
            'rates.additional_charges.*.charge_type' => 'nullable|string|max:255',
            'rates.additional_charges.*.agency_rate' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.driver_rate' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.driver_rates_by_class' => 'nullable|array',
            'rates.additional_charges.*.driver_rates_by_class.*' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.unit' => 'nullable|string|max:50',
            'rates.additional_charges.*.active' => 'nullable|boolean',
        ]);

        $validated['employer_id'] = $employer->id;
        if (! isset($validated['status'])) {
            $from = \Carbon\Carbon::parse($validated['effective_from'])->startOfDay();
            $to = \Carbon\Carbon::parse($validated['effective_to'])->startOfDay();
            $today = now()->startOfDay();
            if ($to < $today) {
                $validated['status'] = 'expired';
            } elseif ($from <= $today && $to >= $today) {
                $validated['status'] = 'active';
            } else {
                $validated['status'] = 'scheduled';
            }
        }

        if (($validated['status'] ?? null) === 'active') {
            $employer->rateCards()->where('status', 'active')->where('id', '!=', 0)->update(['status' => 'expired']);
        }

        $rateCard = RateCard::create($validated);
        return response()->json($rateCard, 201);
    }

    public function show(Employer $employer, RateCard $rateCard)
    {
        if ($employer->tenant_id !== tenant('id') || $rateCard->employer_id != $employer->id) {
            abort(403, 'Unauthorized');
        }
        if ($rateCard->status !== 'draft') {
            RateCard::updateStatus($rateCard);
        }
        return response()->json($rateCard->fresh());
    }

    public function update(Request $request, Employer $employer, RateCard $rateCard)
    {
        if ($employer->tenant_id !== tenant('id') || $rateCard->employer_id != $employer->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'effective_from' => 'sometimes|date',
            'effective_to' => 'sometimes|date|after_or_equal:effective_from',
            'status' => 'nullable|in:draft,active,scheduled,expired',
            'rates' => 'nullable|array',
            'rates.measurement_unit' => 'nullable|string|in:miles,km',
            'rates.currency' => 'nullable|string|max:10',
            'rates.minimum_trip_pay_agency' => 'nullable|numeric|min:0',
            'rates.minimum_trip_pay_driver' => 'nullable|numeric|min:0',
            'rates.minimum_trip_pay_driver_by_class' => 'nullable|array',
            'rates.minimum_trip_pay_driver_by_class.*' => 'nullable|numeric|min:0',
            'rates.distance_bands' => 'nullable|array',
            'rates.distance_bands.*.distance_from' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.distance_to' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.agency_rate' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.driver_rate' => 'nullable|numeric|min:0',
            'rates.distance_bands.*.driver_rates_by_class' => 'nullable|array',
            'rates.distance_bands.*.driver_rates_by_class.*' => 'nullable|numeric|min:0',
            'rates.additional_charges' => 'nullable|array',
            'rates.additional_charges.*.charge_type' => 'nullable|string|max:255',
            'rates.additional_charges.*.agency_rate' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.driver_rate' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.driver_rates_by_class' => 'nullable|array',
            'rates.additional_charges.*.driver_rates_by_class.*' => 'nullable|numeric|min:0',
            'rates.additional_charges.*.unit' => 'nullable|string|max:50',
            'rates.additional_charges.*.active' => 'nullable|boolean',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'active') {
            $employer->rateCards()->where('status', 'active')->where('id', '!=', $rateCard->id)->update(['status' => 'expired']);
        }

        $rateCard->update($validated);
        if ($rateCard->status !== 'draft') {
            RateCard::updateStatus($rateCard);
        }
        return response()->json($rateCard->fresh());
    }

    public function duplicate(Employer $employer, RateCard $rateCard)
    {
        if ($employer->tenant_id !== tenant('id') || $rateCard->employer_id != $employer->id) {
            abort(403, 'Unauthorized');
        }

        $newCard = $rateCard->replicate();
        $newCard->name = $rateCard->name . ' (Copy)';
        $newCard->status = 'draft';
        $newCard->save();
        return response()->json($newCard, 201);
    }

    public function deactivate(Employer $employer, RateCard $rateCard)
    {
        if ($employer->tenant_id !== tenant('id') || $rateCard->employer_id != $employer->id) {
            abort(403, 'Unauthorized');
        }

        $rateCard->update(['status' => 'expired']);
        return response()->json($rateCard->fresh());
    }
}
