{{-- Employee-facing: tax lines only (no client/agency billing framing). Expects $record = DriverCalculation --}}
@php
    $rawLines = $record->billing_tax_lines ?? null;
    $billLines = is_array($rawLines) ? $rawLines : [];
    if ($billLines === [] && is_string($rawLines) && $rawLines !== '') {
        $decoded = json_decode($rawLines, true);
        $billLines = is_array($decoded) ? $decoded : [];
    }
    $billTaxAmt = (float) ($record->billing_tax_amount ?? 0);
    $billTaxFromPct = (float) ($record->billing_tax_from_percent ?? 0);
    $billTaxFixedOnly = (float) ($record->billing_tax_fixed ?? 0);
    $billTaxRate = (float) ($record->billing_tax_rate ?? 0);
    $showTax = count($billLines) > 0 || $billTaxAmt > 0.0001 || $billTaxFromPct > 0.0001 || $billTaxFixedOnly > 0.0001;
    $taxTotalForGrand = $billTaxAmt;
    if ($taxTotalForGrand < 0.0001 && count($billLines) > 0) {
        foreach ($billLines as $tl) {
            $taxTotalForGrand += (float) ($tl['amount'] ?? 0);
        }
    }
    if ($taxTotalForGrand < 0.0001 && ($billTaxFromPct > 0.0001 || $billTaxFixedOnly > 0.0001)) {
        $taxTotalForGrand = $billTaxFromPct + $billTaxFixedOnly;
    }
    $totalInclTax = round((float) ($record->net_pay ?? 0) + $taxTotalForGrand, 2);
@endphp
@if($showTax)
    @if(count($billLines))
        @foreach($billLines as $tl)
            @php
                $tname = $tl['name'] ?? 'Tax';
                $ttype = $tl['type'] ?? '';
                $tval = (float) ($tl['value'] ?? 0);
                $tamt = (float) ($tl['amount'] ?? 0);
            @endphp
            <tr>
                <td>
                    {{ $tname }}
                    @if($ttype === 'percentage')
                        ({{ number_format($tval, 2) }}%)
                    @elseif($ttype === 'fixed')
                        (fixed)
                    @endif
                </td>
                <td class="right">${{ number_format($tamt, 2) }}</td>
            </tr>
        @endforeach
        @if(count($billLines) > 1 && $billTaxAmt > 0.0001)
            <tr>
                <td>Total tax</td>
                <td class="right">${{ number_format($billTaxAmt, 2) }}</td>
            </tr>
        @endif
    @elseif($billTaxFromPct > 0.0001 || $billTaxFixedOnly > 0.0001)
        @if($billTaxFromPct > 0.0001)
            <tr>
                <td>Tax on subtotal @if($billTaxRate > 0.00001)({{ number_format($billTaxRate * 100, 2) }}%)@endif</td>
                <td class="right">${{ number_format($billTaxFromPct, 2) }}</td>
            </tr>
        @endif
        @if($billTaxFixedOnly > 0.0001)
            <tr>
                <td>Tax (fixed amount)</td>
                <td class="right">${{ number_format($billTaxFixedOnly, 2) }}</td>
            </tr>
        @endif
    @elseif($billTaxAmt > 0.0001)
        <tr>
            <td>Tax</td>
            <td class="right">${{ number_format($billTaxAmt, 2) }}</td>
        </tr>
    @endif
    <tr>
        <td>Total including tax</td>
        <td class="right"><strong>${{ number_format($totalInclTax, 2) }}</strong></td>
    </tr>
@endif
