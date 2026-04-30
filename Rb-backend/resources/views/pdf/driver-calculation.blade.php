@extends('pdf.layouts.minimal')

@section('content')
<style>
    .ts-title { font-size: 14px; font-weight: bold; margin: 0 0 4px 0; text-align: center; }
    .ts-sub { font-size: 10px; color: #333; text-align: center; margin-bottom: 12px; }
    .ts-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 8px; }
    .ts-table th, .ts-table td { border: 1px solid #222; padding: 4px 5px; vertical-align: top; }
    .ts-table th { background: #1e4490; color: #fff; font-weight: bold; text-align: left; }
    .ts-table th.right, .ts-table td.right { text-align: right; }
    .ts-table tbody tr:nth-child(even) { background: #f7f7f7; }
    .ts-section { margin-top: 18px; font-size: 10px; font-weight: bold; }
    .ts-summary { width: 42%; margin-top: 8px; font-size: 9px; border-collapse: collapse; }
    .ts-summary td { border: 1px solid #222; padding: 5px 8px; }
    .ts-summary td:first-child { font-weight: bold; background: #eee; width: 55%; }
    .ts-summary td.right { text-align: right; }
    .muted { color: #555; font-size: 9px; margin-top: 10px; }
</style>

@php
    $org = $tenantLabel ?? config('app.name', 'Organization');
    $headline = 'TIMESHEET';
    if ($periodLabel !== '') {
        $headline .= ' — '.$periodLabel;
    }
    if ($org) {
        $headline .= ' — '.$org;
    }
@endphp

<p class="ts-title">{{ $headline }}</p>
<p class="ts-sub">Driver calculation #{{ $calculation->id }} · Generated {{ now()->format('Y-m-d H:i') }} · Stored snapshot</p>

@if(count($payrollRows ?? []))
    <table class="ts-table">
        <thead>
            <tr>
                <th>Driver #</th>
                <th>Driver name</th>
                <th>Customer</th>
                <th>Trip #</th>
                <th>Trip date</th>
                <th>Pay item</th>
                <th class="right">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Pay</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payrollRows as $r)
                <tr>
                    <td>{{ $r['driver_ref'] }}</td>
                    <td>{{ $r['driver_name'] }}</td>
                    <td>{{ $r['employer'] }}</td>
                    <td>{{ $r['trip_number'] }}</td>
                    <td>{{ $r['trip_date'] }}</td>
                    <td>{{ $r['pay_item'] }}</td>
                    <td class="right">@if(array_key_exists('qty', $r) && $r['qty'] !== null){{ number_format((float) $r['qty'], 2) }}@else—@endif</td>
                    <td class="right">@if(array_key_exists('rate', $r) && $r['rate'] !== null)${{ number_format((float) $r['rate'], 2) }}@else—@endif</td>
                    <td class="right">@if(($r['pay'] ?? 0) == 0)—@else${{ number_format((float) $r['pay'], 2) }}@endif</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="ts-section">Payroll summary</div>
    <table class="ts-summary">
        <tr>
            <td>Subtotal — payroll</td>
            <td class="right">${{ number_format((float) $payrollSubtotal, 2) }}</td>
        </tr>
        <tr>
            <td>Vacation pay</td>
            <td class="right">${{ number_format((float) $calculation->vacation_pay, 2) }}</td>
        </tr>
        <tr>
            <td>Deductions</td>
            <td class="right">${{ number_format((float) $calculation->deductions, 2) }}</td>
        </tr>
        <tr>
            <td>Net pay</td>
            <td class="right"><strong>${{ number_format((float) $calculation->net_pay, 2) }}</strong></td>
        </tr>
        @include('pdf.partials.driver-calculation-summary-tax-rows', ['record' => $calculation])
    </table>
@else
    <p class="muted">No line items or breakdown available for this calculation.</p>
    <table class="ts-summary">
        <tr>
            <td>Gross pay</td>
            <td class="right">${{ number_format((float) $calculation->gross_pay, 2) }}</td>
        </tr>
        <tr>
            <td>Vacation pay</td>
            <td class="right">${{ number_format((float) $calculation->vacation_pay, 2) }}</td>
        </tr>
        <tr>
            <td>Deductions</td>
            <td class="right">${{ number_format((float) $calculation->deductions, 2) }}</td>
        </tr>
        <tr>
            <td>Net pay</td>
            <td class="right"><strong>${{ number_format((float) $calculation->net_pay, 2) }}</strong></td>
        </tr>
        @include('pdf.partials.driver-calculation-summary-tax-rows', ['record' => $calculation])
    </table>
@endif
@endsection
