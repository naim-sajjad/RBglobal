<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Remittance Slip</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #111;
            margin: 28px 36px;
        }
        .issuer-block { font-size: 9.5pt; line-height: 1.45; color: #222; margin-bottom: 14px; }
        .issuer-name { font-weight: bold; font-size: 11pt; }
        .issuer-line { margin: 0; padding: 0; }
        .title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            color: #4a2c7a;
            margin: 10px 0 16px 0;
        }
        .mid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .mid td { vertical-align: top; }
        .payto-label { font-weight: bold; font-size: 10.5pt; margin-bottom: 6px; }
        .payto-name { font-weight: bold; font-size: 10.5pt; }
        .payto-sub { font-size: 10pt; margin-top: 2px; line-height: 1.35; white-space: pre-wrap; }
        .meta-r { text-align: right; font-size: 10pt; }
        .meta-r div { margin-bottom: 6px; }
        .tbl { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .tbl th {
            background: #4a2c7a;
            color: #fff;
            font-size: 8.5pt;
            text-transform: uppercase;
            padding: 8px 5px;
            text-align: left;
            font-weight: bold;
        }
        .tbl th.num { text-align: right; }
        .tbl td { border-bottom: 1px solid #ddd; padding: 8px 5px; font-size: 9.5pt; }
        .tbl td.num { text-align: right; white-space: nowrap; }
        .tbl tbody tr:nth-child(odd) { background: #f3f4fb; }
        .memo { margin-top: 18px; font-size: 10pt; font-weight: bold; }
        .sig { margin-top: 28px; font-size: 10pt; }
    </style>
</head>
<body>

<div class="issuer-block">
    @if($issuerName !== '')
        <div class="issuer-name">{{ $issuerName }}</div>
    @endif
    @if($issuerAddress !== '')
        <div class="issuer-line" style="white-space: pre-wrap;">{{ $issuerAddress }}</div>
    @endif
    @if($issuerPhone !== '')
        <div class="issuer-line">{{ $issuerPhone }}</div>
    @endif
    @if($issuerEmail !== '')
        <div class="issuer-line">{{ $issuerEmail }}</div>
    @endif
</div>

<div class="title">Remittance Slip</div>

<table class="mid">
    <tr>
        <td style="width: 58%;">
            <div class="payto-label">Payment To</div>
            <div class="payto-name">{{ $payToName }}</div>
            @if($payToBusiness !== '')
                <div class="payto-name" style="margin-top: 4px;">{{ $payToBusiness }}</div>
            @endif
            @if($payToAddress !== '')
                <div class="payto-sub">{{ $payToAddress }}</div>
            @endif
        </td>
        <td class="meta-r" style="width: 42%;">
            <div><strong>Date:</strong> {{ $documentDate }}</div>
            <div><strong>Reference No:</strong> {{ $referenceNo }}</div>
        </td>
    </tr>
</table>

<table class="tbl">
    <thead>
        <tr>
            <th>Bill Number</th>
            <th>Bill Date</th>
            <th>Due Date</th>
            <th class="num">Original Amount</th>
            <th class="num">Balance</th>
            <th class="num">Payment</th>
        </tr>
    </thead>
    <tbody>
        @foreach($tableRows as $row)
            <tr>
                <td>{{ $row['bill_number'] }}</td>
                <td>{{ $row['bill_date'] }}</td>
                <td>{{ $row['due_date'] }}</td>
                <td class="num">${{ number_format($row['original'], 2) }}</td>
                <td class="num">${{ number_format($row['balance'], 2) }}</td>
                <td class="num">${{ number_format($row['payment'], 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="memo">{{ $memoLine }}</div>

<div class="sig">Signature: __________________________</div>

</body>
</html>
