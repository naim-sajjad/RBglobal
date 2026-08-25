<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\Financial\EmailTemplateService;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    protected function assertStaff(): void
    {
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }
    }

    public function index()
    {
        $this->assertStaff();
        $tenantId = tenant('id');
        $templates = EmailTemplateService::ensureForTenant($tenantId);
        $catalog = EmailTemplateService::catalog();

        $payload = collect($templates)->map(function (EmailTemplate $t) use ($catalog) {
            return [
                'id' => $t->id,
                'key' => $t->key,
                'name' => $t->name,
                'subject' => $t->subject,
                'body_html' => $t->body_html,
                'body_text' => $t->body_text,
                'is_active' => $t->is_active,
                'placeholders' => $catalog[$t->key]['placeholders'] ?? [],
                'updated_at' => $t->updated_at,
            ];
        })->values();

        return response()->json($payload);
    }

    public function update(Request $request, string $key)
    {
        $this->assertStaff();
        $tenantId = tenant('id');
        $catalog = EmailTemplateService::catalog();
        if (! isset($catalog[$key])) {
            return response()->json(['message' => 'Unknown template.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'required|string|max:512',
            'body_html' => 'required|string|max:100000',
            'body_text' => 'nullable|string|max:100000',
            'is_active' => 'sometimes|boolean',
        ]);

        EmailTemplateService::ensureForTenant($tenantId);
        $template = EmailTemplate::query()
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->firstOrFail();

        $template->update([
            'name' => $validated['name'] ?? $template->name,
            'subject' => $validated['subject'],
            'body_html' => $validated['body_html'],
            'body_text' => $validated['body_text'] ?? $template->body_text,
            'is_active' => array_key_exists('is_active', $validated)
                ? (bool) $validated['is_active']
                : $template->is_active,
        ]);

        return response()->json([
            'id' => $template->id,
            'key' => $template->key,
            'name' => $template->name,
            'subject' => $template->subject,
            'body_html' => $template->body_html,
            'body_text' => $template->body_text,
            'is_active' => $template->is_active,
            'placeholders' => $catalog[$key]['placeholders'] ?? [],
            'updated_at' => $template->updated_at,
        ]);
    }

    public function reset(string $key)
    {
        $this->assertStaff();
        $tenantId = tenant('id');
        $catalog = EmailTemplateService::catalog();
        if (! isset($catalog[$key])) {
            return response()->json(['message' => 'Unknown template.'], 404);
        }

        try {
            $template = EmailTemplateService::resetToDefault($tenantId, $key);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'id' => $template->id,
            'key' => $template->key,
            'name' => $template->name,
            'subject' => $template->subject,
            'body_html' => $template->body_html,
            'body_text' => $template->body_text,
            'is_active' => $template->is_active,
            'placeholders' => $catalog[$key]['placeholders'] ?? [],
            'updated_at' => $template->updated_at,
            'message' => 'Template reset to default.',
        ]);
    }
}
