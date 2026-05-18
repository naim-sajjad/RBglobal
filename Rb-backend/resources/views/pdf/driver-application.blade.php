@extends('pdf.layouts.minimal')

@php
    $p = $c['personal'] ?? [];
    $addr = $c['address'] ?? [];
    $lic = $c['license'] ?? [];
    $q = $c['questions'] ?? [];
    $dx = $c['driving_experience'] ?? [];
    $acc = $dx['accident_history'] ?? [];
    $emp = $c['employment_history'] ?? [];
    $curEmp = array_merge([
        'company' => '',
        'supervisor' => '',
        'address' => '',
        'phone' => '',
        'position' => '',
        'start_date' => '',
        'end_date' => '',
        'reasons_for_leaving' => '',
    ], is_array($emp['current_employer'] ?? null) ? $emp['current_employer'] : []);
    $prevAddrs = is_array($addr['previous_addresses'] ?? null) ? $addr['previous_addresses'] : [];
    $equipment = is_array($dx['equipment_used'] ?? null) ? $dx['equipment_used'] : [];
    $violations = is_array($dx['traffic_violations'] ?? null) ? $dx['traffic_violations'] : [];
    $prevEmployers = is_array($emp['previous_employers'] ?? null) ? $emp['previous_employers'] : [];

    $nameParts = preg_split('/\s+/', trim((string) ($driver->user->name ?? '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $firstName = $nameParts[0] ?? 'N/A';
    $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : 'N/A';

    $expiryFmt = '';
    try {
        if ($driver->license_expiry_date) {
            $expiryFmt = $driver->license_expiry_date instanceof \Carbon\Carbon
                ? $driver->license_expiry_date->format('Y-m-d')
                : (string) $driver->license_expiry_date;
        }
    } catch (\Throwable) {
        $expiryFmt = (string) ($driver->license_expiry_date ?? '');
    }

    $issueFmt = '';
    try {
        if ($driver->license_issue_date) {
            $issueFmt = $driver->license_issue_date instanceof \Carbon\Carbon
                ? $driver->license_issue_date->format('Y-m-d')
                : (string) $driver->license_issue_date;
        }
    } catch (\Throwable) {
        $issueFmt = (string) ($driver->license_issue_date ?? '');
    }

    $dobFmt = '';
    if (! empty($p['date_of_birth'])) {
        try {
            $dobFmt = \Carbon\Carbon::parse($p['date_of_birth'])->format('j M Y');
        } catch (\Throwable) {
            $dobFmt = (string) $p['date_of_birth'];
        }
    }

    $vehicleTypesLabel = '';
    if (is_array($driver->vehicle_types ?? null)) {
        $vehicleTypesLabel = implode(', ', $driver->vehicle_types);
    }
@endphp

@section('content')
<style>
    .banner {
        background: #1e3a8a;
        color: #fff;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 12px;
    }
    .row { margin-bottom: 6px; }
    .label { font-weight: bold; display: inline-block; min-width: 160px; }
    .muted { color: #555; font-size: 9px; }
    .chk { margin-right: 12px; }
    .section-break { page-break-before: always; }
    .section { margin-bottom: 16px; }
    .subtitle { font-size: 13px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 12px; }
    table.doc-grid { margin-top: 8px; }
    table.license-images { width: 100%; margin-top: 8px; }
    table.license-images td { vertical-align: top; width: 50%; text-align: center; border: 1px dashed #bbb; padding: 8px; }
    img.lic-photo { max-width: 240px; max-height: 200px; }
    hr.soft { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
</style>

<div style="margin-bottom: 8px;">
    <div class="banner">EMPLOYMENT APPLICATION FOR A TRUCK DRIVER</div>
    <table class="meta" style="width:100%;">
        <tr>
            <td class="muted">Generated</td>
            <td>{{ $generatedAt->format('j M Y, H:i') }}</td>
            <td class="right muted">Applicant Email</td>
            <td class="right">{{ $driver->user->email ?? 'N/A' }}</td>
        </tr>
    </table>
</div>

<h2>Applicant name</h2>
<div class="section">
    <div class="row"><span class="label">First</span>{{ $firstName }}</div>
    <div class="row"><span class="label">Last</span>{{ $lastName }}</div>
    <div class="row"><span class="label">Middle initial</span>{{ $p['middle_initial'] ?: 'N/A' }}</div>
</div>

<h2>Current address</h2>
<div class="section">
    <div class="row"><span class="label">Street / unit</span>{{ $addr['current_address'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Living since</span>{{ $addr['current_address_living_since'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">City</span>{{ $addr['city'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Province</span>{{ $addr['province'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Postal code</span>{{ $addr['postal_code'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Cell #</span>{{ $addr['cell_phone'] ?: 'N/A' }}</div>
</div>

@if (count($prevAddrs))
    <h2 class="section-break">Previous address (past 3 years)</h2>
    <div class="section">
        @foreach ($prevAddrs as $i => $a)
            @if (is_array($a))
                <p style="margin: 8px 0 4px 0;"><strong>Address {{ $i + 1 }}</strong></p>
                <div class="row"><span class="label">Address</span>{{ ($a['address'] ?? '') ?: 'N/A' }}</div>
                @php
                    $period = '';
                    if (! empty($a['from_date']) && ! empty($a['to_date'])) {
                        $period = trim($a['from_date'].' to '.$a['to_date']);
                    } elseif (! empty($a['duration'] ?? '')) {
                        $period = (string) $a['duration'];
                    }
                @endphp
                <div class="row"><span class="label">Dates lived there</span>{{ $period ?: 'N/A' }}</div>
                <hr class="soft" />
            @endif
        @endforeach
    </div>
@endif

<h2 class="{{ count($prevAddrs) ? 'section-break' : '' }}">Personal information</h2>
<div class="section">
    <div class="row">
        <span class="label">Legally entitled to work in Canada</span>
        <span class="chk">YES @if(strtolower(trim((string)($p['work_eligibility_canada'] ?? ''))) === 'yes') ✓ @endif</span>
        <span class="chk">NO @if(strtolower(trim((string)($p['work_eligibility_canada'] ?? ''))) === 'no') ✓ @endif</span>
    </div>
    <div class="row"><span class="label">Gender</span>{{ $p['gender'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Date of birth</span>{{ $dobFmt ?: 'N/A' }}</div>
    <div class="row"><span class="label">Education / certifications</span>{{ $p['education'] ?: 'N/A' }}</div>
    <p style="margin-top:10px;"><strong>Medical limitation question</strong> — Physical difficulties affecting ability to drive:</p>
    <div class="row">
        <span class="label">Answer</span>
        <span class="chk">YES @if(strtolower(trim((string)($p['medical_limitations'] ?? ''))) === 'yes') ✓ @endif</span>
        <span class="chk">NO @if(strtolower(trim((string)($p['medical_limitations'] ?? ''))) === 'no') ✓ @endif</span>
    </div>
    @if (strtolower(trim((string)($p['medical_limitations'] ?? ''))) === 'yes' && ! empty($p['medical_limitations_explanation']))
        <p>{{ $p['medical_limitations_explanation'] }}</p>
    @endif
</div>

<h2 class="section-break">Driver's licence information</h2>
<div class="section">
    <div class="row"><span class="label">Licence number (record)</span>{{ $driver->license_number ?: 'N/A' }}</div>
    <div class="row"><span class="label">Licence type (record)</span>{{ $driver->license_type ?: 'N/A' }}</div>
    @if ($driver->license_type === 'Other' && ($driver->license_other ?? '') !== '')
        <div class="row"><span class="label">Other type</span>{{ $driver->license_other }}</div>
    @endif
    <div class="row"><span class="label">Province (form)</span>{{ $lic['license_province'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Class (form)</span>{{ $lic['license_class'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Issue date</span>{{ $issueFmt ?: 'N/A' }}</div>
    <div class="row"><span class="label">Expiry</span>{{ $expiryFmt ?: 'N/A' }}</div>
    <div class="row"><span class="label">Issuing authority</span>{{ $driver->issuing_authority ?: 'N/A' }}</div>
    <div class="row"><span class="label">Endorsements</span>{{ $lic['license_endorsements'] ?: 'N/A' }}</div>
    <div class="row"><span class="label">Conditions</span>{{ $lic['license_conditions'] ?: 'N/A' }}</div>
    <hr class="soft" />
    <div class="row">
        <span class="label">Ever denied licence or permit?</span>
        YES @if(strtolower(trim((string)($q['license_denied'] ?? ''))) === 'yes') ✓ @else &nbsp;&nbsp; @endif
        / NO @if(strtolower(trim((string)($q['license_denied'] ?? ''))) === 'no') ✓ @endif
    </div>
    <div class="row">
        <span class="label">Privileges revoked / suspended?</span>
        YES @if(strtolower(trim((string)($q['privileges_revoked'] ?? ''))) === 'yes') ✓ @else &nbsp;&nbsp; @endif
        / NO @if(strtolower(trim((string)($q['privileges_revoked'] ?? ''))) === 'no') ✓ @endif
    </div>
    <div class="row">
        <span class="label">Dangerous goods certificate?</span>
        YES @if(strtolower(trim((string)($q['dangerous_goods_certificate'] ?? ''))) === 'yes') ✓ @else &nbsp;&nbsp; @endif
        / NO @if(strtolower(trim((string)($q['dangerous_goods_certificate'] ?? ''))) === 'no') ✓ @endif
    </div>
</div>

<h2 style="margin-top:16px;">Driver licence photographs</h2>
<p class="muted">Stored files (URLs also available for online viewing; embedded below for archival).</p>
<table class="license-images">
    <tr>
        <td>
            <strong>Front</strong><br />
            @if ($licenseFrontEmbedded)
                <img class="lic-photo" src="{{ $licenseFrontEmbedded }}" alt="Licence front" />
            @else
                <span class="muted">Not on file</span><br/>
                @if ($licenseFrontUrl)<span class="muted">{{ $licenseFrontUrl }}</span>@endif
            @endif
        </td>
        <td>
            <strong>Back</strong><br />
            @if ($licenseBackEmbedded)
                <img class="lic-photo" src="{{ $licenseBackEmbedded }}" alt="Licence back" />
            @else
                <span class="muted">Not on file</span><br/>
                @if ($licenseBackUrl)<span class="muted">{{ $licenseBackUrl }}</span>@endif
            @endif
        </td>
    </tr>
</table>

<h2 class="section-break">Driving experience</h2>
<div class="section">
    <div class="row"><span class="label">Years of experience (record)</span>{{ $driver->years_of_experience !== null ? (string) $driver->years_of_experience : 'N/A' }}</div>
    <div class="row"><span class="label">Driving history summary</span>{{ ($driver->driving_history ?? '') !== '' ? $driver->driving_history : 'N/A' }}</div>
    <div class="row"><span class="label">Vehicle types (record)</span>{{ ($vehicleTypesLabel !== '') ? $vehicleTypesLabel : 'N/A' }}</div>
    <div class="row"><span class="label">Route type</span>{{ $driver->route_type ?: 'N/A' }}</div>
    <div class="row"><span class="label">Pay type</span>{{ $driver->pay_type ?: 'N/A' }}</div>
</div>

@if (count($equipment))
    <h3>Equipment used (last five years)</h3>
    <table>
        <thead>
            <tr>
                <th>Make</th>
                <th>Tractor</th>
                <th>Transmissions</th>
                <th>Trailer</th>
                <th>Areas operated</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($equipment as $row)
                @if (is_array($row))
                    <tr>
                        <td>{{ ($row['make'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($row['tractor_type'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($row['transmissions'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($row['trailer_type'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($row['areas_operated'] ?? '') ?: 'N/A' }}</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>
@endif

<h3>Accidents</h3>
<div class="section">
    <div class="row">
        Ever had accidents:
        YES @if(strtolower(trim((string)($acc['ever_had_accidents'] ?? ''))) === 'yes') ✓ @else &nbsp;&nbsp; @endif
        / NO @if(strtolower(trim((string)($acc['ever_had_accidents'] ?? ''))) === 'no') ✓ @endif
    </div>
    @if (strtolower(trim((string)($acc['ever_had_accidents'] ?? ''))) === 'yes')
        <div class="row"><span class="label"># Incidents</span>{{ ($acc['number_of_incidents'] ?? '') ?: 'N/A' }}</div>
        <div class="row"><span class="label">Explanation</span>{{ ($acc['accident_explanation'] ?? '') ?: 'N/A' }}</div>
    @endif
</div>

@if (count($violations))
    <h3>Traffic violations (approx. last 3 years)</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Charge</th>
                <th>Penalty</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($violations as $v)
                @if (is_array($v))
                    <tr>
                        <td>{{ ($v['date'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($v['location'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($v['violation_charge'] ?? '') ?: 'N/A' }}</td>
                        <td>{{ ($v['penalty'] ?? '') ?: 'N/A' }}</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>
@endif

<h2 class="section-break">Employment history (approx. last 10 years)</h2>
<h3>Current / most recent employer</h3>
<table class="meta">
    @foreach (['company' => 'Company', 'supervisor' => 'Supervisor', 'address' => 'Address', 'phone' => 'Phone', 'position' => 'Position', 'start_date' => 'Start', 'end_date' => 'End'] as $fk => $fl)
        <tr><td>{{ $fl }}</td><td>{{ ($curEmp[$fk] ?? '') ?: 'N/A' }}</td></tr>
    @endforeach
    <tr><td>Reason for leaving</td><td>{{ ($curEmp['reasons_for_leaving'] ?? '') ?: 'N/A' }}</td></tr>
</table>

@if (count($prevEmployers))
    @foreach ($prevEmployers as $pe)
        @if (is_array($pe))
            <h3>Previous employer</h3>
            <table class="meta">
                @foreach (['company' => 'Company', 'supervisor' => 'Supervisor', 'address' => 'Address', 'phone' => 'Phone', 'position' => 'Position', 'start_date' => 'Start', 'end_date' => 'End'] as $fk => $fl)
                    <tr><td>{{ $fl }}</td><td>{{ ($pe[$fk] ?? '') ?: 'N/A' }}</td></tr>
                @endforeach
                <tr><td>Reason for leaving</td><td>{{ ($pe['reasons_for_leaving'] ?? '') ?: 'N/A' }}</td></tr>
            </table>
        @endif
    @endforeach
@endif

<h2 class="section-break">Certifications &amp; uploaded documents (on record)</h2>
<table>
    <thead>
        <tr>
            <th>Document</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>PCC / background</td>
            <td>{{ $driver->pcc_document_path ? 'File on record' : 'N/A' }}</td>
        </tr>
        <tr>
            <td>Legacy licence document</td>
            <td>{{ $driver->license_document_path ? 'File on record' : 'N/A' }}</td>
        </tr>
        <tr>
            <td>Abstract</td>
            <td>{{ $driver->abstract_document_path ? 'File on record' : 'N/A' }}</td>
        </tr>
        <tr>
            <td>CVOR</td>
            <td>{{ $driver->cvor_document_path ? 'File on record' : 'N/A' }}</td>
        </tr>
        <tr>
            <td>Safety certificate</td>
            <td>{{ $driver->safety_certificate_path ? 'File on record' : 'N/A' }}</td>
        </tr>
    </tbody>
</table>

<div class="section" style="margin-top:12px;">
    <div class="row"><span class="label">Background check</span>{{ ucfirst(str_replace('_', ' ', $driver->background_check_status ?? 'N/A')) }}</div>
    <div class="row"><span class="label">Drug / alcohol acknowledgement</span>{{ $driver->drug_alcohol_test ? 'Yes (record)' : 'N/A / No' }}</div>
</div>

@if (($c['existing_notes'] ?? '') !== '')
    <h3>Notes (documents step)</h3>
    <p>{{ $c['existing_notes'] }}</p>
@endif

<h3>Payroll / payee identifiers (when provided)</h3>
<table class="meta">
    <tr><td>Driver status</td><td>{{ ucfirst(str_replace('_', ' ', $driver->status ?? 'N/A')) }}</td></tr>
    <tr><td>Pay tier / class</td><td>{{ optional($driver->driverClass)->name ?? optional($driver->driverClass)->code ?? 'N/A' }}</td></tr>
    <tr><td>Payee business name</td><td>{{ ($driver->payee_business_name ?? '') ?: 'N/A' }}</td></tr>
    <tr><td>Payee address</td><td>{{ ($driver->payee_address ?? '') ?: 'N/A' }}</td></tr>
</table>

@if ($referenceChecks->isNotEmpty())
    @foreach ($referenceChecks as $idx => $refCheck)
        <div class="section-break"></div>
        @include('pdf.partials.driver-application-reference-check', [
            'refCheck' => $refCheck,
            'heading' => 'Pre-employment reference check '.($idx + 1),
        ])
    @endforeach
@endif

<h2 class="section-break">Applicant acknowledgement</h2>
<p style="margin-top:10px;">
    By submitting this application, the applicant authorizes the employer to verify background, reputation, employment, and references;
    agrees to abide by employer rules and regulations; and certifies that the information provided is complete and accurate to the best of their knowledge.
</p>

<table style="margin-top: 24px; width:100%;">
    <tr>
        <td style="vertical-align: bottom; border-bottom:1px solid #111; padding:6px;">
            {{ $driver->user->name ?? 'N/A' }}
        </td>
        <td style="width: 40px;"></td>
        <td style="vertical-align: bottom; border-bottom:1px solid #111; padding:6px;">
            {{ $generatedAt->format('j M Y') }}
        </td>
    </tr>
    <tr>
        <td class="muted">Print name</td>
        <td></td>
        <td class="muted">Date (generated)</td>
    </tr>
</table>

<p style="margin-top: 24px;"><strong>Signature of applicant</strong></p>
<div style="border-bottom: 1px solid #111; min-height: 28px;"></div>
<p class="muted">Electronic application — applicant attestation referenced by submitted record.</p>

@php
    $applyingRole = trim((string) (optional($driver->driverClass)->name ?? ''));
    if ($applyingRole === '') {
        $applyingRole = trim((string) (optional($driver->driverClass)->code ?? ''));
    }
    if ($applyingRole === '') {
        $applyingRole = 'truck driver';
    }
    $refPriorRole = trim((string) ($curEmp['position'] ?? ''));
@endphp

<div class="section-break"></div>
<p style="text-align:center; margin-bottom:14px;"><strong style="text-decoration:underline;">Reference Check</strong></p>
<p>We appreciate your time in completing, in confidence, the information below.</p>
<p style="margin-top:12px;">
    <strong>{{ $driver->user->name ?? '____________________' }}</strong>, driver's license number
    <strong>{{ ($driver->license_number ?? '') !== '' ? $driver->license_number : '______________________' }}</strong>,
    has completed an application to this company for a position as a <strong>{{ $applyingRole }}</strong>
    and states that he/she was employed by you as @if ($refPriorRole !== '')<strong>{{ $refPriorRole }}</strong>@else<span style="border-bottom:1px solid #111; display:inline-block; min-width:180px;">&nbsp;</span>@endif.
</p>
<p style="margin-top:12px;">
    Please reply to this inquiry below regarding this applicant. Your reply will be held in strictest confidence and will in no way involve you in any responsibility.
</p>
@if ($refPriorRole === '')
    <p style="margin-top:20px;"><strong>For completion by referee</strong></p>
    <p class="muted" style="margin-top:8px;">(blank lines for handwritten reply)</p>
    <div style="border-bottom:1px solid #bbb; min-height:22px; margin-top:16px;"></div>
    <div style="border-bottom:1px solid #bbb; min-height:22px; margin-top:14px;"></div>
    <div style="border-bottom:1px solid #bbb; min-height:22px; margin-top:14px;"></div>
@endif

<p style="margin-top:24px;">Kind regards,</p>
<p><strong>R &amp; B Services Inc.</strong></p>
@endsection
