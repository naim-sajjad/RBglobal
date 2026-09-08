<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    protected function assertStaff(): void
    {
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Request $request)
    {
        $this->assertStaff();
        $user = auth()->user();

        $validated = $request->validate([
            'unread_only' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = AdminNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        if (! empty($validated['unread_only'])) {
            $query->whereNull('read_at');
        }

        $perPage = $validated['per_page'] ?? 20;

        return response()->json($query->paginate($perPage));
    }

    /**
     * Poll for new notifications since a given id (for browser push).
     */
    public function recent(Request $request)
    {
        $this->assertStaff();
        $user = auth()->user();

        $validated = $request->validate([
            'after_id' => 'nullable|integer|min:0',
        ]);

        $query = AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->orderBy('id');

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        if (! empty($validated['after_id'])) {
            $query->where('id', '>', $validated['after_id']);
        }

        return response()->json([
            'data' => $query->limit(20)->get(),
        ]);
    }

    public function unreadCount()
    {
        $this->assertStaff();
        $user = auth()->user();

        $query = AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at');

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        return response()->json(['count' => $query->count()]);
    }

    public function markRead(AdminNotification $notification)
    {
        $this->assertStaff();
        if ((int) $notification->user_id !== (int) auth()->id()) {
            abort(403, 'Unauthorized');
        }
        if (tenant('id') && $notification->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification->fresh());
    }

    public function markAllRead()
    {
        $this->assertStaff();
        $user = auth()->user();

        $query = AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at');

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        $updated = $query->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'updated' => $updated,
        ]);
    }
}
