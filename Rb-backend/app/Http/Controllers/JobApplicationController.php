<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobApplicationRequest;
use App\Models\ContactSubmission;
use App\Models\JobApplication;
use App\Support\JobApplicationFormMapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class JobApplicationController extends Controller
{
    public function store(StoreJobApplicationRequest $request): JsonResponse
    {
        $validated = $request->safe()->except('resume');
        $job = JobApplicationFormMapper::resolve(
            isset($validated['job_id']) ? (int) $validated['job_id'] : null,
            $validated['job_slug'] ?? null,
            $validated['job_title'],
        );
        $validated = [...$validated, ...$job];
        $validated['az_license_age'] = $validated['license_age'] ?? null;
        unset($validated['license_age']);
        $resume = $request->file('resume');

        if ($resume) {
            $validated['resume_path'] = $resume->store('job-application-resumes', 'local');
            $validated['resume_original_name'] = $resume->getClientOriginalName();
        }

        [$application] = DB::transaction(function () use ($validated, $request): array {
            $application = JobApplication::create([
                ...$validated,
                'status' => 'new',
                'source' => 'website_apply_form',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $submittedAt = now();
            $name = trim($validated['first_name'].' '.$validated['last_name']);
            $details = [
                "Position: {$validated['job_title']}",
                "Availability: {$validated['availability']}",
                "Immigration status: {$validated['immigration_status']}",
                $validated['license_type']
                    ? "{$validated['license_type']} license age: {$validated['az_license_age']}"
                    : 'Licence requirement: Not applicable',
                "Experience: {$validated['experience']}",
                'Referred by: '.($validated['referred_by'] ?? 'Not provided'),
                'Resume: '.($validated['resume_original_name'] ?? 'Not uploaded'),
                '',
                'Applicant message:',
                $validated['message'],
            ];

            ContactSubmission::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'name' => $name,
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'],
                'location' => $validated['city'],
                'role' => 'seeker',
                'form_key' => $validated['application_form_key'],
                'form_name' => $validated['application_form_name'],
                'subject' => "[{$validated['job_title']}] Application from {$name}",
                'message' => implode("\n", $details),
                'status' => ContactSubmission::STATUS_UNREAD,
                'original_created_at' => $submittedAt,
                'email_subscriber_status' => 'Never subscribed',
                'sms_subscriber_status' => 'Never subscribed',
                'last_activity' => "Applied for {$validated['job_title']}",
                'last_activity_at' => $submittedAt,
                'source' => "Apply Form - {$validated['job_title']}",
                'language' => substr(str_replace('_', '-', (string) $request->getPreferredLanguage()), 0, 20) ?: null,
            ]);

            return [$application];
        });

        return response()->json([
            'success' => true,
            'message' => 'Your application has been submitted successfully.',
            'data' => ['id' => $application->id],
        ], 201);
    }
}
