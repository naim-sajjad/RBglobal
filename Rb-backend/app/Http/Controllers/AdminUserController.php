<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $role = $request->query('role');
        $status = $request->query('status');

        $users = User::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->when(in_array($role, [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN, User::ROLE_EDITOR], true), fn ($query) => $query->where('role', $role))
            ->when(in_array($status, [User::STATUS_ACTIVE, User::STATUS_INACTIVE], true), fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($users->items())->map(fn (User $user) => $this->safeUser($user))->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::in([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN, User::ROLE_EDITOR])],
            'status' => ['required', Rule::in([User::STATUS_ACTIVE, User::STATUS_INACTIVE])],
        ]);

        $password = $this->temporaryPassword();
        $user = User::create([
            ...$validated,
            'email' => strtolower($validated['email']),
            'password' => Hash::make($password),
            'must_change_password' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->safeUser($user),
            'temporary_password' => $password,
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->safeUser($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['required', Rule::in([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN, User::ROLE_EDITOR])],
            'status' => ['required', Rule::in([User::STATUS_ACTIVE, User::STATUS_INACTIVE])],
        ]);

        $this->guardFinalSuperAdmin($user, $validated['role'], $validated['status'], $request->user());
        $user->update([...$validated, 'email' => strtolower($validated['email'])]);

        return response()->json(['success' => true, 'data' => $this->safeUser($user->fresh())]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([User::STATUS_ACTIVE, User::STATUS_INACTIVE])],
        ]);

        $this->guardFinalSuperAdmin($user, $user->role, $validated['status'], $request->user());
        $user->forceFill(['status' => $validated['status']])->save();

        return response()->json(['success' => true, 'data' => $this->safeUser($user->fresh())]);
    }

    public function resetPassword(User $user): JsonResponse
    {
        $password = $this->temporaryPassword();
        $user->forceFill([
            'password' => Hash::make($password),
            'must_change_password' => true,
        ])->save();
        $user->adminApiTokens()->delete();

        return response()->json([
            'success' => true,
            'data' => $this->safeUser($user->fresh()),
            'temporary_password' => $password,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $this->guardFinalSuperAdmin($user, 'deleted', User::STATUS_INACTIVE, $request->user());
        $user->delete();

        return response()->json(['success' => true, 'message' => 'Admin user deleted successfully.']);
    }

    private function guardFinalSuperAdmin(User $user, string $nextRole, string $nextStatus, User $actor): void
    {
        if (! $actor->isSuperAdmin()) {
            abort(response()->json(['message' => 'Forbidden.'], 403));
        }

        if ($user->isSuperAdmin() && ($nextRole !== User::ROLE_SUPER_ADMIN || $nextStatus !== User::STATUS_ACTIVE)) {
            $activeSuperAdmins = User::where('role', User::ROLE_SUPER_ADMIN)
                ->where('status', User::STATUS_ACTIVE)
                ->whereKeyNot($user->id)
                ->count();

            if ($activeSuperAdmins === 0) {
                abort(response()->json(['message' => 'The final active super administrator cannot be removed or disabled.'], 422));
            }
        }
    }

    private function temporaryPassword(): string
    {
        return Str::password(16, true, true, false, false);
    }

    private function safeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'must_change_password' => $user->must_change_password,
            'last_login_at' => optional($user->last_login_at)->toISOString(),
            'created_at' => optional($user->created_at)->toISOString(),
            'updated_at' => optional($user->updated_at)->toISOString(),
        ];
    }
}
