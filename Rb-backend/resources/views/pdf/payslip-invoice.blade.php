<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 8.5pt;
            color: #111;
            margin: 24px 32px;
            line-height: 1.15;
        }
        .inv-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #4a2c7a;
            margin: 0 0 8px 0;
            letter-spacing: 0.02em;
            line-height: 1.1;
        }
        .meta-top { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        .meta-top td { vertical-align: top; padding: 0; line-height: 1.15; }
        .issuer-name { font-size: 9.5pt; font-weight: bold; color: #111; line-height: 1.15; }
        .issuer-addr {
            margin-top: 1px;
            font-size: 8pt;
            color: #333;
            line-height: 1.15;
            white-space: pre-wrap;
        }
        .meta-right { text-align: right; font-size: 8.5pt; color: #111; line-height: 1.15; }
        .meta-right strong { font-weight: bold; }
        .meta-right-row { margin-bottom: 1px; line-height: 1.15; }
        .hrule {
            border: none;
            border-top: 2px solid #d4d4d8;
            margin: 6px 0;
        }
        .row-driver { width: 100%; border-collapse: collapse; }
        .row-driver td { vertical-align: top; padding: 0; line-height: 1.15; }
        .driver-name { font-weight: bold; font-size: 9pt; line-height: 1.15; }
        .driver-id { text-align: right; white-space: nowrap; font-size: 8.5pt; line-height: 1.15; }
        .client-name { font-weight: bold; font-size: 9pt; margin-bottom: 1px; line-height: 1.15; }
        .client-addr { font-size: 8pt; color: #333; line-height: 1.15; white-space: pre-wrap; }
        .lines { width: 100%; border-collapse: collapse; margin-top: 2px; }
        .lines thead th {
            background: #4a2c7a;
            color: #fff;
            font-weight: bold;
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            padding: 4px 8px;
            text-align: left;
            line-height: 1.1;
            border-left: 1px solid rgba(255, 255, 255, 0.35);
        }
        .lines thead th:first-child { border-left: none; }
        .lines thead th.hours { text-align: center; width: 22%; }
        .lines thead th.amount { text-align: right; width: 24%; }
        .lines tbody td {
            padding: 4px 8px;
            font-size: 8pt;
            line-height: 1.15;
            border-bottom: 1px solid #e4e4e7;
            border-left: 1px solid #fff;
            vertical-align: middle;
        }
        .lines tbody td:first-child { border-left: none; }
        .lines tbody tr:nth-child(odd) { background: #eef2ff; }
        .lines tbody tr:nth-child(even) { background: #fff; }
        .lines tbody td.hours { text-align: center; font-weight: normal; }
        .lines tbody td.amount { text-align: right; white-space: nowrap; font-weight: normal; }
        .pay-period-label { font-weight: bold; font-size: 8pt; }
        .totals-wrap { width: 100%; margin-top: 10px; border-collapse: collapse; }
        .totals-wrap td { vertical-align: top; }
        .totals-inner { width: 100%; max-width: 260px; margin-left: auto; border-collapse: collapse; }
        .totals-inner td {
            padding: 2px 3px;
            font-size: 8.5pt;
            line-height: 1.15;
            border-bottom: 1px solid #e4e4e7;
        }
        .totals-inner td.lbl { text-align: right; padding-right: 12px; color: #333; }
        .totals-inner td.val { text-align: right; white-space: nowrap; font-weight: bold; }
        .totals-inner tr.grand td {
            border-bottom: 2px solid #4a2c7a;
            padding-top: 6px;
            font-size: 9.5pt;
            line-height: 1.15;
            color: #111;
        }
    </style>
</head>
<body>

<div class="inv-title">Invoice</div>

<table class="meta-top">
    <tr>
        <td style="width: 55%;">
            @php
                $headerName = trim((string) ($customerName ?? $issuerName ?? ''));
                $headerUnder = trim((string) ($websiteName ?? ''));
            @endphp
            <div class="issuer-name">{{ $headerName }}</div>
            @if($headerUnder !== '')
                <div class="issuer-addr">{{ $headerUnder }}</div>
            @elseif(!empty($issuerAddress))
                <div class="issuer-addr">{{ $issuerAddress }}</div>
            @endif
        </td>
        <td class="meta-right" style="width: 45%;">
            <div class="meta-right-row"><strong>Date:</strong> {{ $invoiceDate }}</div>
            <div class="meta-right-row"><strong>Invoice No.:</strong> {{ $invoiceNumber }}</div>
            <div><strong>Driver ID:</strong> {{ $driverRef }}</div>
        </td>
    </tr>
</table>

<hr class="hrule"/>

<table class="row-driver">
    <tr>
        <td class="driver-name">{{ $driverName }}</td>
        <td class="driver-id"></td>
    </tr>
</table>

<hr class="hrule"/>

@php
    $showBillToName = trim((string) ($billToName ?? '')) !== ''
        && trim((string) ($billToName ?? '')) !== $headerName;
    $showBillToAddr = trim((string) ($billToAddress ?? '')) !== '';
@endphp
@if($showBillToName || $showBillToAddr)
    @if($showBillToName)
        <div class="client-name">{{ $billToName }}</div>
    @endif
    @if($showBillToAddr)
        <div class="client-addr">{{ $billToAddress }}</div>
    @endif
    <hr class="hrule"/>
@endif

<table class="lines">
    <thead>
        <tr>
            <th>Description</th>
            <th class="hours">Hours</th>
            <th class="amount">Amount</th>
        </tr>
    </thead>
    <tbody>
        @forelse($hourRows as $idx => $row)
            <tr>
                <td>
                    @if($idx === 0)
                        <span class="pay-period-label">Pay period:</span> {{ $payPeriodLabel }}
                    @else
                        &nbsp;
                    @endif
                </td>
                <td class="hours">{{ $row['description'] }}</td>
                <td class="amount">$ {{ number_format($row['amount'], 2) }}</td>
            </tr>
        @empty
            <tr>
                <td><span class="pay-period-label">Pay period:</span> {{ $payPeriodLabel }}</td>
                <td class="hours">—</td>
                <td class="amount">$ {{ number_format(0, 2) }}</td>
            </tr>
        @endforelse
    </tbody>
</table>

<table class="totals-wrap">
    <tr>
        <td></td>
        <td style="width: 320px;">
            <table class="totals-inner">
                <tr>
                    <td class="lbl">Subtotal</td>
                    <td class="val">$ {{ number_format($subtotal, 2) }}</td>
                </tr>
                @foreach($taxRows as $tr)
                    <tr>
                        <td class="lbl">{{ $tr['label'] }}</td>
                        <td class="val">$ {{ number_format($tr['amount'], 2) }}</td>
                    </tr>
                @endforeach
                <tr class="grand">
                    <td class="lbl" style="text-transform: uppercase;">Total</td>
                    <td class="val">$ {{ number_format($grandTotal, 2) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
