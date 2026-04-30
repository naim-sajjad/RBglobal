<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Employer;
use App\Models\Invoice;
use App\Services\Financial\FinancialPdfService;
use App\Services\Financial\InvoiceBillingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceFinancialController extends Controller
{
    protected function tenantId(): ?string
    {
        return tenant('id');
    }

    public function index(Request $request)
    {
        $query = Invoice::query()
            ->with(['employer'])
            ->withSum('payments as paid_total', 'amount')
            ->orderByDesc('created_at');

        if ($this->tenantId()) {
            $query->where('tenant_id', $this->tenantId());
        }

        if ($request->filled('employer_id')) {
            $query->where('employer_id', $request->employer_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate($request->input('per_page', 20)))
            ->header('Cache-Control', 'private, no-store, must-revalidate');
    }

    public function show(Invoice $invoice)
    {
        $this->authorizeTenantInvoice($invoice);

        $invoice->load(['employer', 'items.driver.user', 'payments']);

        return response()->json($invoice);
    }

    public function downloadPdf(Invoice $invoice)
    {
        $this->authorizeTenantInvoice($invoice);

        return FinancialPdfService::invoice($invoice);
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'employer_id' => 'required|integer|exists:employers,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'driver_id' => 'nullable|integer|exists:drivers,id',
        ]);

        $this->assertEmployerInTenant((int) $validated['employer_id']);
        $driverId = isset($validated['driver_id']) ? (int) $validated['driver_id'] : null;
        if ($driverId !== null) {
            $this->assertDriverInTenant($driverId);
        }

        $preview = InvoiceBillingService::preview(
            $this->tenantId(),
            (int) $validated['employer_id'],
            $validated['start_date'],
            $validated['end_date'],
            $driverId
        );

        return response()->json($preview);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employer_id' => 'required|integer|exists:employers,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'tax_rate' => 'required|numeric|min:0|max:1',
            'notes' => 'nullable|string|max:2000',
            'driver_id' => 'nullable|integer|exists:drivers,id',
        ]);

        $this->assertEmployerInTenant((int) $validated['employer_id']);
        $driverId = isset($validated['driver_id']) ? (int) $validated['driver_id'] : null;
        if ($driverId !== null) {
            $this->assertDriverInTenant($driverId);
        }

        $invoice = InvoiceBillingService::create(
            $this->tenantId(),
            (int) $validated['employer_id'],
            $validated['start_date'],
            $validated['end_date'],
            (float) $validated['tax_rate'],
            $validated['notes'] ?? null,
            $driverId
        );

        return response()->json($invoice, 201);
    }

    public function updateStatus(Request $request, Invoice $invoice)
    {
        $this->authorizeTenantInvoice($invoice);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'sent', 'paid', 'partially_paid', 'overdue'])],
        ]);

        $invoice->update(['status' => $validated['status']]);

        return response()->json($invoice->fresh());
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorizeTenantInvoice($invoice);

        $validated = $request->validate([
            'invoice_number' => 'nullable|string|max:64',
            'notes' => 'nullable|string|max:2000',
        ]);

        $invoice->update(array_filter($validated, fn ($v) => $v !== null));

        return response()->json($invoice->fresh());
    }

    public function storePayment(Request $request, Invoice $invoice)
    {
        $this->authorizeTenantInvoice($invoice);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'reference' => 'nullable|string|max:255',
        ]);

        $payment = InvoiceBillingService::recordPayment(
            $invoice,
            (float) $validated['amount'],
            $validated['payment_date'],
            $validated['reference'] ?? null
        );

        return response()->json([
            'payment' => $payment,
            'invoice' => $invoice->fresh()->load('payments'),
        ], 201);
    }

    protected function assertEmployerInTenant(int $employerId): void
    {
        $q = Employer::query()->where('id', $employerId);
        if ($this->tenantId()) {
            $q->where('tenant_id', $this->tenantId());
        }
        if (! $q->exists()) {
            abort(404, 'Employer not found.');
        }
    }

    protected function assertDriverInTenant(int $driverId): void
    {
        $q = Driver::query()->where('id', $driverId);
        if ($this->tenantId()) {
            $q->where('tenant_id', $this->tenantId());
        }
        if (! $q->exists()) {
            abort(404, 'Driver not found.');
        }
    }

    protected function authorizeTenantInvoice(Invoice $invoice): void
    {
        if ($this->tenantId() && $invoice->tenant_id !== $this->tenantId()) {
            abort(404);
        }
    }
}
