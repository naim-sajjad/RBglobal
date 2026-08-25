@extends('pdf.layouts.minimal')

@section('content')
<style>
    .ts-title { font-size: 14px; font-weight: bold; margin: 0 0 4px 0; text-align: center; }
    .ts-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 8px; }
    .ts-table th, .ts-table td { border: 1px solid #222; padding: 4px 5px; vertical-align: top; }
    .ts-table th { background: #1e4490; color: #fff; font-weight: bold; text-align: left; }
    .ts-table th.right, .ts-table td.right { text-align: right; }
    .ts-table tbody tr:nth-child(even) { background: #f7f7f7; }
    .ts-table tfoot td { font-weight: bold; background: #eee; }
    .ts-table tfoot td.right { text-align: right; }
</style>

<p class="ts-title">{{ $headline }}</p>

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
        <tfoot>
            <tr>
                <td colspan="8">{{ $driverRef }} {{ $driverName }} Subtotal</td>
                <td class="right">${{ number_format((float) $subtotal, 2) }}</td>
            </tr>
            @foreach($taxRows as $tr)
                <tr>
                    <td colspan="8">{{ $tr['label'] }}</td>
                    <td class="right">${{ number_format((float) $tr['amount'], 2) }}</td>
                </tr>
            @endforeach
            <tr>
                <td colspan="8">{{ $driverRef }} {{ $driverName }} Total</td>
                <td class="right">${{ number_format((float) $grandTotal, 2) }}</td>
            </tr>
        </tfoot>
    </table>
@else
    <p style="font-size: 9px; color: #555;">No trips or line items on this timesheet.</p>
@endif
@endsection
