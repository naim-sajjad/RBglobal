<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Payroll</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9.5pt;
            color: #111;
            margin: 22px 32px 36px 32px;
        }
        .issuer-block { font-size: 9.5pt; line-height: 1.45; color: #222; margin-bottom: 10px; }
        .issuer-name { font-weight: bold; font-size: 11pt; }
        .issuer-line { margin: 0; padding: 0; }
        .title {
            text-align: center;
            font-size: 17pt;
            font-weight: bold;
            color: #4a2c7a;
            margin: 6px 0 14px 0;
            letter-spacing: 0.02em;
        }
        .mid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .mid td { vertical-align: top; }
        .section-label {
            font-weight: bold;
            font-size: 8.5pt;
            text-transform: uppercase;
            color: #4a2c7a;
            margin-bottom: 4px;
        }
        .emp-name { font-weight: bold; font-size: 10.5pt; }
        .emp-sub { font-size: 9.5pt; margin-top: 3px; line-height: 1.35; white-space: pre-wrap; }
        .meta-r { text-align: right; font-size: 9.5pt; }
        .meta-r div { margin-bottom: 5px; }
        .band {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 10px 0;
            border: 1px solid #c8c4d4;
        }
        .band th {
            background: #4a2c7a;
            color: #fff;
            font-size: 8pt;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            font-weight: bold;
            width: 50%;
        }
        .band td {
            padding: 8px 10px;
            vertical-align: top;
            font-size: 9.5pt;
            border-bottom: 1px solid #e8e6ef;
        }
        .band tr:last-child td { border-bottom: none; }
        .subhead {
            font-weight: bold;
            font-size: 8.5pt;
            text-transform: uppercase;
            color: #333;
            margin: 14px 0 6px 0;
            padding-bottom: 2px;
            border-bottom: 2px solid #4a2c7a;
        }
        .tbl { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        .tbl th {
            background: #edeaf5;
            color: #2d1f45;
            font-size: 8pt;
            text-transform: uppercase;
            padding: 6px 5px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid #c8c4d4;
        }
        .tbl th.num { text-align: right; }
        .tbl td { border-bottom: 1px solid #e0dde8; padding: 6px 5px; font-size: 9.5pt; }
        .tbl td.num { text-align: right; white-space: nowrap; }
        .tbl tbody tr:nth-child(odd) { background: #faf9fc; }
        .tbl .section-row td {
            font-weight: bold;
            background: #f3f1f8;
            font-size: 8.5pt;
            text-transform: uppercase;
            color: #4a2c7a;
            border-bottom: 1px solid #c8c4d4;
            padding-top: 8px;
        }
        .net-wrap {
            margin: 16px 0 14px 0;
            padding: 12px 14px;
            border: 2px solid #4a2c7a;
            background: #f6f4fa;
            text-align: center;
        }
        .net-label { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #4a2c7a; }
        .net-amt { font-size: 16pt; font-weight: bold; color: #111; margin-top: 4px; }
        .memo { margin-top: 12px; font-size: 9.5pt; }
        .memo strong { color: #333; }
        .benefits-head { margin-top: 14px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; color: #666; }
        .benefits-body { font-size: 9pt; color: #555; margin-top: 4px; }
        .page-foot { text-align: center; font-size: 8pt; color: #888; margin-top: 22px; }
        .vac-mini { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
        .vac-mini th { background: #edeaf5; padding: 5px; text-align: center; font-size: 8pt; text-transform: uppercase; border: 1px solid #ddd; }
        .vac-mini td { padding: 6px; text-align: center; border: 1px solid #e8e6ef; }
        .muted { color: #666; }
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

<div class="title">Payroll</div>

<table class="mid">
    <tr>
        <td style="width: 52%;">
            <div class="section-label">Employee</div>
            <div class="emp-name">{{ $employeeLine }}</div>
            @if($employeeAddress !== '')
                <div class="emp-sub">{{ $employeeAddress }}</div>
            @endif
        </td>
        <td class="meta-r" style="width: 48%;">
            <div><strong>Pay period</strong></div>
            <div><strong>Period beginning:</strong> {{ $periodBeginning }}</div>
            <div><strong>Period ending:</strong> {{ $periodEnding }}</div>
            <div><strong>Pay date:</strong> {{ $payDate }}</div>
            <div><strong>Total hours:</strong> {{ $totalHoursLabel }}</div>
        </td>
    </tr>
</table>

<table class="band">
    <tr>
        <th>Employee</th>
        <th>Employer</th>
    </tr>
    <tr>
        <td>
            <div class="emp-name">{{ $employeeLine }}</div>
            @if($employeeAddress !== '')
                <div class="emp-sub">{{ $employeeAddress }}</div>
            @endif
        </td>
        <td>
            @if($issuerName !== '')
                <div class="emp-name">{{ $issuerName }}</div>
            @endif
            @if($issuerAddress !== '')
                <div class="emp-sub">{{ $issuerAddress }}</div>
            @endif
        </td>
    </tr>
</table>

<div class="subhead">Pay</div>
<table class="tbl">
    <thead>
        <tr>
            <th style="width: 36%;">Pay type</th>
            <th class="num" style="width: 12%;">Hours</th>
            <th class="num" style="width: 14%;">Rate</th>
            <th class="num" style="width: 19%;">Current</th>
            <th class="num" style="width: 19%;">YTD</th>
        </tr>
    </thead>
    <tbody>
        @foreach($payRows as $row)
        <tr>
            <td>{{ $row['label'] }}</td>
            <td class="num">{{ $row['hours'] }}</td>
            <td class="num">{{ $row['rate'] }}</td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="subhead">Taxes</div>
<table class="tbl">
    <thead>
        <tr>
            <th style="width: 64%;">Description</th>
            <th class="num" style="width: 18%;">Current</th>
            <th class="num" style="width: 18%;">YTD</th>
        </tr>
    </thead>
    <tbody>
        @forelse($taxRows as $row)
        <tr>
            <td>{{ $row['label'] }}</td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @empty
        <tr>
            <td class="muted">No itemized taxes on file</td>
            <td class="num">$0.00</td>
            <td class="num">{{ $ytdPlaceholder }}</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="subhead">Deductions</div>
<table class="tbl">
    <thead>
        <tr>
            <th style="width: 64%;">Description</th>
            <th class="num" style="width: 18%;">Current</th>
            <th class="num" style="width: 18%;">YTD</th>
        </tr>
    </thead>
    <tbody>
        @foreach($deductionRows as $row)
        <tr>
            <td>{{ $row['label'] }}</td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="subhead">Summary</div>
<table class="tbl">
    <thead>
        <tr>
            <th style="width: 64%;"></th>
            <th class="num" style="width: 18%;">Current</th>
            <th class="num" style="width: 18%;">YTD</th>
        </tr>
    </thead>
    <tbody>
        @foreach($summaryRows as $row)
        <tr>
            <td><strong>{{ $row['label'] }}</strong></td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="net-wrap">
    <div class="net-label">Net pay</div>
    <div class="net-amt">${{ number_format((float) $payslip->net_pay, 2) }}</div>
</div>

<div class="subhead">Pay stub detail</div>
<table class="tbl">
    <thead>
        <tr>
            <th style="width: 52%;">Description</th>
            <th class="num" style="width: 24%;">Current</th>
            <th class="num" style="width: 24%;">YTD</th>
        </tr>
    </thead>
    <tbody>
        @foreach($detailEarningRows as $row)
        <tr>
            <td>{{ $row['label'] }}</td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @endforeach
        @foreach($detailDeductionRows as $row)
        <tr>
            <td>{{ $row['label'] }}</td>
            <td class="num">${{ number_format($row['current'], 2) }}</td>
            <td class="num">{{ $row['ytd'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="subhead">Vacation</div>
<table class="vac-mini">
    <thead>
        <tr>
            <th>Accrued</th>
            <th>Used</th>
            <th>Available</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{{ $vacationAccrued }}</td>
            <td>{{ $vacationUsed }}</td>
            <td>{{ $vacationAvailable }}</td>
        </tr>
    </tbody>
</table>
@if((float) $payslip->vacation_pay > 0.0001)
<p class="muted" style="margin-top:6px;font-size:9pt;">Vacation pay (this period): ${{ number_format((float) $payslip->vacation_pay, 2) }}</p>
@endif

<div class="benefits-head">Benefits</div>
<div class="benefits-body">{{ $benefitsNote }}</div>

<div class="memo"><strong>Memo:</strong> {{ $memoText }}</div>

<div class="page-foot">— 1 of 1 —</div>

</body>
</html>
