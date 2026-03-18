<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayItemTemplate;
use Illuminate\Http\Request;

class PayItemTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = PayItemTemplate::query()
            ->where('tenant_id', tenant('id'))
            ->orderBy('code');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'unit' => 'nullable|string|max:30|in:per_km,per_mile,per_hour,flat,per_stop,other',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['tenant_id'] = tenant('id');
        $validated['unit'] = $validated['unit'] ?? 'flat';
        $validated['is_active'] = $validated['is_active'] ?? true;

        $exists = PayItemTemplate::where('tenant_id', $validated['tenant_id'])
            ->where('code', $validated['code'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'A pay item with this code already exists.'], 422);
        }

        $template = PayItemTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function show(PayItemTemplate $payItemTemplate)
    {
        if ($payItemTemplate->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        return response()->json($payItemTemplate);
    }

    public function update(Request $request, PayItemTemplate $payItemTemplate)
    {
        if ($payItemTemplate->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'nullable|string|max:30|in:per_km,per_mile,per_hour,flat,per_stop,other',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['code']) && $validated['code'] !== $payItemTemplate->code) {
            $exists = PayItemTemplate::where('tenant_id', $payItemTemplate->tenant_id)
                ->where('code', $validated['code'])
                ->where('id', '!=', $payItemTemplate->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'A pay item with this code already exists.'], 422);
            }
        }

        $payItemTemplate->update($validated);
        return response()->json($payItemTemplate->fresh());
    }

    public function destroy(PayItemTemplate $payItemTemplate)
    {
        if ($payItemTemplate->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $payItemTemplate->delete();
        return response()->json(null, 204);
    }
}
