@extends('pdf.layouts.minimal')

@section('content')
<h1>{{ $title }}</h1>
<p class="muted">Generated {{ now()->format('Y-m-d H:i') }}</p>

<table class="meta">
    <tr><td><strong>Employer</strong></td><td>{{ $invoice->employer->name ?? '—' }}</td></tr>
    <tr><td><strong>Invoice #</strong></td><td>{{ $invoice->invoice_number ?: $invoice->id }}</td></tr>
    <tr><td><strong>Status</strong></td><td>{{ $invoice->status }}</td></tr>
    <tr><td><strong>Period</strong></td><td>{{ $invoice->start_date?->format('Y-m-d') }} → {{ $invoice->end_date?->format('Y-m-d') }}</td></tr>
</table>

@if($invoice->notes)
<p><strong>Notes:</strong> {{ $invoice->notes }}</p>
@endif

<h2>Line items</h2>
<table>
    <thead>
        <tr>
            <th>Date</th>
            <th>Driver</th>
            <th>Item</th>
            <th class="right">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $row)
        <tr>
            <td>{{ $row->trip_date?->format('Y-m-d') }}</td>
            <td>{{ $row->driver?->user?->name ?? ('Driver #'.$row->driver_id) }}</td>
            <td>{{ $row->pay_item_type }}</td>
            <td class="right">{{ number_format((float)$row->quantity, 4) }} {{ $row->unit ?? '' }}</td>
            <td class="right">${{ number_format((float)$row->rate, 4) }}</td>
            <td class="right">${{ number_format((float)$row->amount, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<h2>Totals</h2>
<table class="meta">
    <tr><td><strong>Subtotal</strong></td><td class="right">${{ number_format((float)$invoice->subtotal, 2) }}</td></tr>
    <tr><td><strong>Tax ({{ number_format((float)$invoice->tax_rate * 100, 2) }}%)</strong></td><td class="right">${{ number_format((float)$invoice->tax_amount, 2) }}</td></tr>
    <tr><td><strong>Total</strong></td><td class="right"><strong>${{ number_format((float)$invoice->total, 2) }}</strong></td></tr>
</table>

@if($invoice->payments->isNotEmpty())
<h2>Payments</h2>
<table>
    <thead>
        <tr><th>Date</th><th>Reference</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
        @foreach($invoice->payments as $p)
        <tr>
            <td>{{ $p->payment_date?->format('Y-m-d') }}</td>
            <td>{{ $p->reference ?? '—' }}</td>
            <td class="right">${{ number_format((float)$p->amount, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif
@endsection
