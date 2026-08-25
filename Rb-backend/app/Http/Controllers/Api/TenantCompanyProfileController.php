<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Stancl\Tenancy\Database\Models\Tenant;

class TenantCompanyProfileController extends Controller
{
    protected function tenantId(): ?string
    {
        return tenant('id');
    }

    public function show()
    {
        $tid = $this->tenantId();
        if ($tid === null || $tid === '') {
            return response()->json([
                'company_legal_name' => '',
                'company_address' => '',
                'company_phone' => '',
                'company_email' => '',
                'pay_stub_cc_emails' => '',
                'adjustments_email' => '',
                'clearance_email' => '',
            ]);
        }

        $tenant = Tenant::query()->find($tid);
        if ($tenant === null) {
            return response()->json([
                'company_legal_name' => '',
                'company_address' => '',
                'company_phone' => '',
                'company_email' => '',
                'pay_stub_cc_emails' => '',
                'adjustments_email' => '',
                'clearance_email' => '',
            ]);
        }

        // Stancl Tenant uses VirtualColumn: values live as model attributes, not $tenant->data[...]
        return response()->json([
            'company_legal_name' => (string) ($tenant->company_legal_name ?? ''),
            'company_address' => (string) ($tenant->company_address ?? ''),
            'company_phone' => (string) ($tenant->company_phone ?? ''),
            'company_email' => (string) ($tenant->company_email ?? ''),
            'pay_stub_cc_emails' => (string) ($tenant->pay_stub_cc_emails ?? ''),
            'adjustments_email' => (string) ($tenant->adjustments_email ?? ''),
            'clearance_email' => (string) ($tenant->clearance_email ?? ''),
        ]);
    }

    public function update(Request $request)
    {
        $tid = $this->tenantId();
        if ($tid === null || $tid === '') {
            abort(422, 'Tenant context is required to save company profile.');
        }

        $validated = $request->validate([
            'company_legal_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string|max:4000',
            'company_phone' => 'nullable|string|max:64',
            'company_email' => 'nullable|email|max:255',
            'pay_stub_cc_emails' => 'nullable|string|max:4000',
            'adjustments_email' => 'nullable|email|max:255',
            'clearance_email' => 'nullable|email|max:255',
        ]);

        $tenant = Tenant::query()->findOrFail($tid);
        $tenant->company_legal_name = (string) ($validated['company_legal_name'] ?? '');
        $tenant->company_address = (string) ($validated['company_address'] ?? '');
        $tenant->company_phone = (string) ($validated['company_phone'] ?? '');
        $tenant->company_email = (string) ($validated['company_email'] ?? '');
        $tenant->pay_stub_cc_emails = (string) ($validated['pay_stub_cc_emails'] ?? '');
        $tenant->adjustments_email = (string) ($validated['adjustments_email'] ?? '');
        $tenant->clearance_email = (string) ($validated['clearance_email'] ?? '');
        $tenant->save();

        return $this->show();
    }
}
