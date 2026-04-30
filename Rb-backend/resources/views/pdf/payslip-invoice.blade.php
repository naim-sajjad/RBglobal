<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #111;
            margin: 28px 36px;
        }
        .inv-title {
            text-align: center;
            font-size: 22pt;
            font-weight: bold;
            color: #4a2c7a;
            margin: 0 0 18px 0;
            letter-spacing: 0.02em;
        }
        .meta-top { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        .meta-top td { vertical-align: top; padding: 0; }
        .issuer-name { font-size: 11pt; font-weight: bold; color: #111; }
        .issuer-addr {
            margin-top: 4px;
            font-size: 9.5pt;
            color: #333;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        .meta-right { text-align: right; font-size: 10pt; color: #111; }
        .meta-right strong { font-weight: bold; }
        .meta-right-row { margin-bottom: 6px; }
        .hrule {
            border: none;
            border-top: 3px solid #d4d4d8;
            margin: 14px 0;
        }
        .row-driver { width: 100%; border-collapse: collapse; }
        .row-driver td { vertical-align: top; padding: 2px 0; }
        .driver-name { font-weight: bold; font-size: 10.5pt; }
        .driver-id { text-align: right; white-space: nowrap; font-size: 10.5pt; }
        .client-name { font-weight: bold; font-size: 10.5pt; margin-bottom: 4px; }
        .client-addr { font-size: 9.5pt; color: #333; line-height: 1.4; white-space: pre-wrap; }
        .lines { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .lines thead th {
            background: #4a2c7a;
            color: #fff;
            font-weight: bold;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 10px 10px;
            text-align: left;
            border-left: 1px solid rgba(255, 255, 255, 0.35);
        }
        .lines thead th:first-child { border-left: none; }
        .lines thead th.hours { text-align: center; width: 22%; }
        .lines thead th.amount { text-align: right; width: 24%; }
        .lines tbody td {
            padding: 10px 10px;
            border-bottom: 1px solid #e4e4e7;
            border-left: 1px solid #fff;
            vertical-align: top;
        }
        .lines tbody td:first-child { border-left: none; }
        .lines tbody tr:nth-child(odd) { background: #eef2ff; }
        .lines tbody tr:nth-child(even) { background: #fff; }
        .lines tbody td.hours { text-align: center; font-weight: bold; }
        .lines tbody td.amount { text-align: right; white-space: nowrap; font-weight: bold; }
        .pay-period-label { font-weight: bold; }
        .totals-wrap { width: 100%; margin-top: 18px; border-collapse: collapse; }
        .totals-wrap td { vertical-align: top; }
        .totals-inner { width: 100%; max-width: 280px; margin-left: auto; border-collapse: collapse; }
        .totals-inner td { padding: 6px 4px; font-size: 10pt; border-bottom: 1px solid #e4e4e7; }
        .totals-inner td.lbl { text-align: right; padding-right: 16px; color: #333; }
        .totals-inner td.val { text-align: right; white-space: nowrap; font-weight: bold; }
        .totals-inner tr.grand td { border-bottom: 2px solid #4a2c7a; padding-top: 10px; font-size: 11pt; color: #111; }
    </style>
</head>
<body>

<div class="inv-title">Invoice</div>

<table class="meta-top">
    <tr>
        <td style="width: 55%;">
            <div class="issuer-name">{{ $issuerName }}</div>
            @if($issuerAddress !== '')
                <div class="issuer-addr">{{ $issuerAddress }}</div>
            @endif
        </td>
        <td class="meta-right" style="width: 45%;">
            <div class="meta-right-row"><strong>Date:</strong> {{ $invoiceDate }}</div>
            <div><strong>Invoice No.:</strong> {{ $invoiceNumber }}</div>
        </td>
    </tr>
</table>

<hr class="hrule"/>

<table class="row-driver">
    <tr>
        <td class="driver-name">{{ $driverName }}</td>
        <td class="driver-id">Driver ID: {{ $driverRef }}</td>
    </tr>
</table>

<hr class="hrule"/>

@if($billToName !== '' || $billToAddress !== '')
    @if($billToName !== '')
        <div class="client-name">{{ $billToName }}</div>
    @endif
    @if($billToAddress !== '')
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
