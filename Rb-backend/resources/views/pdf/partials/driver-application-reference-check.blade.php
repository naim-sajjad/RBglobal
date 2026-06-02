@php
    $req = $refCheck->reference_request ?? [];
    if (! is_array($req)) { $req = []; }
    $formData = $refCheck->form_data ?? null;
@endphp

<h2>{{ $heading }}</h2>
<p class="muted">
    Status: {{ $refCheck->status ?? 'N/A' }} | Filled by: {{ $refCheck->filled_by ?? 'N/A' }}
</p>

<h3 style="margin-top: 12px;">Request for Information from Previous Employer</h3>
<table class="meta field-table">
    <tr><td>Applicant</td><td>{{ $req['applicant_name'] ?? 'N/A' }}</td></tr>
    <tr><td>Driver's License #</td><td>{{ $req['drivers_license_number'] ?? 'N/A' }}</td></tr>
    <tr><td>Previous Company</td><td>{{ $req['previous_company_name'] ?? 'N/A' }}</td></tr>
    <tr><td>Phone</td><td>{{ $req['previous_company_phone'] ?? 'N/A' }}</td></tr>
    <tr><td>Supervisor/Employer</td><td>{{ $req['supervisor_employer_name'] ?? 'N/A' }}</td></tr>
</table>

@if (is_array($formData))
    <h3 style="margin-top: 12px;">Reference check form details</h3>
    <table class="meta field-table">
        <tr><td>Date of Reference Check</td><td>{{ $formData['date_of_reference_check'] ?? 'N/A' }}</td></tr>
        <tr><td>Relationship</td><td>{{ ($formData['relationship_to_applicant'] ?? '') === 'other'
            ? ('Other: '.($formData['relationship_other_specify'] ?? 'N/A'))
            : 'Supervisor / as selected' }}</td></tr>
        <tr><td>Employment from</td><td>{{ $formData['date_of_employment_from'] ?? 'N/A' }}</td></tr>
        <tr><td>Employment to</td><td>{{ $formData['date_of_employment_to'] ?? 'N/A' }}</td></tr>
        <tr><td>Position(s) Held</td><td>{{ $formData['positions_held'] ?? 'N/A' }}</td></tr>
        <tr><td>Nature of Job</td><td>{{ $formData['nature_of_job'] ?? 'N/A' }}</td></tr>
        <tr><td>Driver off (illness/injury)</td><td>{{ $formData['driver_off_illness_injury'] ?? 'N/A' }}</td></tr>
        <tr><td>Involved in accidents</td><td>{{ $formData['involved_in_accidents'] ?? 'N/A' }}</td></tr>
        <tr><td>Reason for leaving</td><td>{{ str_replace('_', ' ', $formData['reason_for_leaving'] ?? '') ?: 'N/A' }}</td></tr>
        <tr><td>Attendance</td><td>{{ $formData['attendance_rating'] ?? 'N/A' }}</td></tr>
        <tr><td>Dependability</td><td>{{ $formData['dependability_rating'] ?? 'N/A' }}</td></tr>
        <tr><td>Willingness</td><td>{{ $formData['willingness_rating'] ?? 'N/A' }}</td></tr>
        <tr><td>Follow Instructions</td><td>{{ $formData['ability_to_follow_instructions_rating'] ?? 'N/A' }}</td></tr>
        <tr><td>Quality of Work</td><td>{{ $formData['quality_of_work_rating'] ?? 'N/A' }}</td></tr>
        <tr><td>Name of person supplying info</td><td>{{ $formData['name_of_person_supplying_info'] ?? 'N/A' }}</td></tr>
        <tr><td>Referee signature date</td><td>{{ $formData['referee_signature_date'] ?? 'N/A' }}</td></tr>
    </table>
    @if (! empty($formData['additional_comments']))
        <p><strong>Additional comments</strong></p>
        <p>{{ $formData['additional_comments'] }}</p>
    @endif
@else
    <p class="muted">(Form not yet completed)</p>
@endif
