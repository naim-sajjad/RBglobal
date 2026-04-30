<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverCalculation;
use App\Models\Payslip;
use App\Models\TenantPayrollBillingTax;
use App\Services\Financial\FinancialPdfService;
use App\Services\Financial\PayrollFinancialService;
use App\Services\Financial\PayStubEmailService;
use Illuminate\Http\Request;

class PayrollFinancialController extends Controller
{
    protected function tenantId(): ?string
    {
        return tenant('id');
    }

    public function previewCalculations(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'vacation_percent' => 'nullable|numeric|min:0|max:100',
            'default_deductions' => 'nullable|numeric|min:0',
        ]);

        $vacation = (float) ($validated['vacation_percent'] ?? 4);
        $ded = (float) ($validated['default_deductions'] ?? 0);
        $rules = PayrollFinancialService::resolveBillingTaxRules($this->tenantId());

        $preview = PayrollFinancialService::preview(
            $this->tenantId(),
            $validated['period_start'],
            $validated['period_end'],
            $vacation,
            $ded,
            $rules
        );

        return response()->json($preview);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'vacation_percent' => 'nullable|numeric|min:0|max:100',
            'default_deductions' => 'nullable|numeric|min:0',
        ]);

        $vacation = (float) ($validated['vacation_percent'] ?? 4);
        $ded = (float) ($validated['default_deductions'] ?? 0);
        $rules = PayrollFinancialService::resolveBillingTaxRules($this->tenantId());

        $created = PayrollFinancialService::generate(
            $this->tenantId(),
            $validated['period_start'],
            $validated['period_end'],
            $vacation,
            $ded,
            $rules
        );

        return response()->json(['payslips' => $created], 201);
    }

    public function getBillingTaxSettings()
    {
        $tid = $this->tenantId();
        if ($tid === null || $tid === '') {
            return response()->json(['taxes' => []]);
        }

        $taxes = TenantPayrollBillingTax::query()
            ->where('tenant_id', $tid)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (TenantPayrollBillingTax $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'type' => $t->type,
                'value' => (float) $t->value,
                'sort_order' => (int) $t->sort_order,
            ])
            ->values()
            ->all();

        return response()->json(['taxes' => $taxes]);
    }

    public function putBillingTaxSettings(Request $request)
    {
        $tid = $this->tenantId();
        if ($tid === null || $tid === '') {
            abort(422, 'Tenant context is required to save billing tax settings.');
        }

        $validated = $request->validate([
            'taxes' => 'present|array',
            'taxes.*.name' => 'required|string|max:120',
            'taxes.*.type' => 'required|string|in:percentage,fixed',
            'taxes.*.value' => 'required|numeric|min:0',
        ]);

        foreach ($validated['taxes'] as $row) {
            if ($row['type'] === 'percentage' && (float) $row['value'] > 100) {
                abort(422, 'Percentage tax value cannot exceed 100.');
            }
        }

        TenantPayrollBillingTax::query()->where('tenant_id', $tid)->delete();

        foreach ($validated['taxes'] as $index => $row) {
            TenantPayrollBillingTax::query()->create([
                'tenant_id' => $tid,
                'name' => $row['name'],
                'type' => $row['type'],
                'value' => round((float) $row['value'], 4),
                'sort_order' => $index,
            ]);
        }

        return $this->getBillingTaxSettings();
    }

    public function payslipsIndex(Request $request)
    {
        $query = Payslip::query()
            ->with(['driver.user', 'driverCalculation'])
            ->orderByDesc('created_at');

        if ($this->tenantId()) {
            $query->where('tenant_id', $this->tenantId());
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate($request->input('per_page', 20)))
            ->header('Cache-Control', 'private, no-store, must-revalidate');
    }

    public function payslipShow(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);
        $payslip->load(['driver.user', 'driverCalculation', 'remittances']);

        return response()->json($payslip);
    }

    public function payslipDestroy(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);
        PayrollFinancialService::deletePayslip($payslip);

        return response()->json([
            'message' => 'Payslip deleted. Trips are unlinked; you can run Generate payslips again for this period.',
        ]);
    }

    public function payslipPdf(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);

        return FinancialPdfService::payslip($payslip);
    }

    public function emailPayStub(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);

        try {
            PayStubEmailService::send($payslip);
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            abort(500, 'Could not send email. Check mail configuration.');
        }

        return response()->json([
            'message' => 'Pay stub email sent to the driver.',
        ]);
    }

    public function payslipInvoicePdf(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);

        return FinancialPdfService::payslipInvoice($payslip);
    }

    public function remittancePdf(Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);

        return FinancialPdfService::remittanceSummary($payslip);
    }

    public function calculationPdf(DriverCalculation $driverCalculation)
    {
        $this->authorizeTenantDriverCalculation($driverCalculation);

        return FinancialPdfService::driverCalculation($driverCalculation);
    }

    public function storeRemittance(Request $request, Payslip $payslip)
    {
        $this->authorizeTenantPayslip($payslip);

        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'reference' => 'nullable|string|max:255',
        ]);

        $remittance = PayrollFinancialService::recordRemittance(
            $payslip,
            (float) $validated['amount_paid'],
            $validated['payment_date'],
            $validated['reference'] ?? null
        );

        return response()->json([
            'remittance' => $remittance,
            'payslip' => $payslip->fresh()->load('remittances'),
        ], 201);
    }

    protected function authorizeTenantPayslip(Payslip $payslip): void
    {
        if ($this->tenantId() && $payslip->tenant_id !== $this->tenantId()) {
            abort(404);
        }
    }

    protected function authorizeTenantDriverCalculation(DriverCalculation $calculation): void
    {
        if ($this->tenantId() && $calculation->tenant_id !== $this->tenantId()) {
            abort(404);
        }
    }
}
