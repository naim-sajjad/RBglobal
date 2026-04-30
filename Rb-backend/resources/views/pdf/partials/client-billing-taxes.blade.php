{{-- $record: Payslip or DriverCalculation. Optional $billingPdfStyle: 'minimal' | 'timesheet' --}}
@php
    $billSub = (float) ($record->agency_billing_subtotal ?? 0);
    $rawLines = $record->billing_tax_lines ?? null;
    $billLines = is_array($rawLines) ? $rawLines : [];
    if ($billLines === [] && is_string($rawLines) && $rawLines !== '') {
        $decoded = json_decode($rawLines, true);
        $billLines = is_array($decoded) ? $decoded : [];
    }
    $billTaxAmt = (float) ($record->billing_tax_amount ?? 0);
    $billTotal = (float) ($record->agency_billing_total ?? 0);
    $billTaxFromPct = (float) ($record->billing_tax_from_percent ?? 0);
    $billTaxFixedOnly = (float) ($record->billing_tax_fixed ?? 0);
    $billTaxRate = (float) ($record->billing_tax_rate ?? 0);
    $style = $billingPdfStyle ?? 'minimal';
    $isTs = $style === 'timesheet';
    $showBilling = $billSub > 0.0001 || $billTaxAmt > 0.0001 || $billTotal > 0.0001 || count($billLines) > 0;
@endphp
@if($showBilling)
    @if($isTs)
        <div class="ts-section">Client billing &amp; taxes</div>
    @else
        <h2>Client billing &amp; taxes</h2>
    @endif
    <p class="muted">Agency (client) trip billing for this period — separate from driver pay.</p>
    <table @if($isTs) class="ts-summary" @endif>
        <tbody>
            <tr>
                <td>@if($isTs)Subtotal — client billing@else<strong>Subtotal — client billing</strong>@endif</td>
                <td class="right">${{ number_format($billSub, 2) }}</td>
            </tr>
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
                <td>@if($isTs)Total incl. tax@else<strong>Total incl. tax</strong>@endif</td>
                <td class="right"><strong>${{ number_format($billTotal, 2) }}</strong></td>
            </tr>
        </tbody>
    </table>
@endif
