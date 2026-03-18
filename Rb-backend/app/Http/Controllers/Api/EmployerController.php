<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\EmployerPayItemRate;
use App\Models\PayItemTemplate;
use Illuminate\Http\Request;

class EmployerController extends Controller
{
    public function index(Request $request)
    {
        $query = Employer::query()
            ->where('tenant_id', tenant('id'))
            ->withCount('rateCards');

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'like', "%{$q}%")
                    ->orWhere('company_code', 'like', "%{$q}%")
                    ->orWhere('contact_person', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $employers = $query->orderBy('name')->get();
        return response()->json($employers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_code' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'billing_address' => 'nullable|string',
            'service_location' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string',
            'measurement_unit' => 'nullable|in:miles,km',
            'default_currency' => 'nullable|string|size:3',
            'minimum_trip_guarantee' => 'nullable|numeric|min:0',
            'requires_driver_rate_tracking' => 'nullable|boolean',
        ]);

        $validated['tenant_id'] = tenant('id');
        $validated['status'] = $validated['status'] ?? 'active';
        $validated['measurement_unit'] = $validated['measurement_unit'] ?? 'km';
        $validated['default_currency'] = $validated['default_currency'] ?? 'CAD';
        $validated['requires_driver_rate_tracking'] = (bool) ($validated['requires_driver_rate_tracking'] ?? false);

        $employer = Employer::create($validated);
        return response()->json($employer->loadCount('rateCards'), 201);
    }

    public function show(Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $employer->load(['rateCards']);
        return response()->json($employer);
    }

    public function update(Request $request, Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'company_code' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'billing_address' => 'nullable|string',
            'service_location' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string',
            'measurement_unit' => 'nullable|in:miles,km',
            'default_currency' => 'nullable|string|size:3',
            'minimum_trip_guarantee' => 'nullable|numeric|min:0',
            'requires_driver_rate_tracking' => 'nullable|boolean',
        ]);

        $employer->update($validated);
        return response()->json($employer->loadCount('rateCards'));
    }

    public function destroy(Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $employer->delete();
        return response()->json(['message' => 'Employer deleted']);
    }

    /**
     * Get pay item rates for this employer (all templates with rate, default 0 if not set).
     */
    public function payItemRates(Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $templates = PayItemTemplate::where('tenant_id', tenant('id'))->where('is_active', true)->orderBy('code')->get();
        $rates = $employer->payItemRates()->with('payItemTemplate')->get()->keyBy('pay_item_template_id');
        $result = $templates->map(function ($t) use ($rates) {
            $r = $rates->get($t->id);
            return [
                'pay_item_template_id' => $t->id,
                'pay_item_template' => $t,
                'rate' => $r ? (float) $r->rate : 0,
            ];
        });
        return response()->json($result->values());
    }

    /**
     * Update pay item rate for this employer.
     */
    public function updatePayItemRate(Request $request, Employer $employer)
    {
        if ($employer->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $validated = $request->validate([
            'pay_item_template_id' => 'required|integer|exists:pay_item_templates,id',
            'rate' => 'required|numeric|min:0',
        ]);
        $template = PayItemTemplate::findOrFail($validated['pay_item_template_id']);
        if ($template->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $rate = EmployerPayItemRate::firstOrNew([
            'employer_id' => $employer->id,
            'pay_item_template_id' => $validated['pay_item_template_id'],
        ]);
        $rate->rate = $validated['rate'];
        $rate->save();
        return response()->json($rate->load('payItemTemplate'));
    }
}
