<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverClass;
use Illuminate\Http\Request;

class DriverClassController extends Controller
{
    public function index(Request $request)
    {
        $query = DriverClass::query()
            ->where('tenant_id', tenant('id'))
            ->orderBy('code');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:65535',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['tenant_id'] = tenant('id');
        $validated['status'] = $validated['status'] ?? 'active';

        // Ensure unique code per tenant
        $exists = DriverClass::where('tenant_id', $validated['tenant_id'])
            ->where('code', $validated['code'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'A driver class with this code already exists.'], 422);
        }

        $driverClass = DriverClass::create($validated);
        return response()->json($driverClass, 201);
    }

    public function show(DriverClass $driverClass)
    {
        if ($driverClass->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        return response()->json($driverClass);
    }

    public function update(Request $request, DriverClass $driverClass)
    {
        if ($driverClass->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:65535',
            'status' => 'nullable|in:active,inactive',
        ]);

        if (isset($validated['code']) && $validated['code'] !== $driverClass->code) {
            $exists = DriverClass::where('tenant_id', $driverClass->tenant_id)
                ->where('code', $validated['code'])
                ->where('id', '!=', $driverClass->id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'A driver class with this code already exists.'], 422);
            }
        }

        $driverClass->update($validated);
        return response()->json($driverClass->fresh());
    }

    public function destroy(DriverClass $driverClass)
    {
        if ($driverClass->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        $driverClass->delete();
        return response()->json(null, 204);
    }
}
