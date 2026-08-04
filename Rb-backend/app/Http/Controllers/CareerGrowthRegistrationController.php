<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCareerGrowthRegistrationRequest;
use App\Models\CareerGrowthRegistration;
use App\Models\ContactSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CareerGrowthRegistrationController extends Controller
{
    public function store(StoreCareerGrowthRegistrationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $registration = DB::transaction(function () use ($validated, $request): CareerGrowthRegistration {
            $registration = CareerGrowthRegistration::create([
                ...$validated,
                'form_key' => 'career_growth_course_application',
                'form_name' => 'Career Growth Course Application',
                'status' => 'new',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $submittedAt = now();
            $name = trim($validated['first_name'].' '.$validated['last_name']);
            ContactSubmission::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'name' => $name,
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'],
                'location' => null,
                'role' => 'seeker',
                'form_key' => 'career_growth_course_application',
                'form_name' => 'Career Growth Course Application',
                'subject' => "[Career Growth: {$validated['course']}] Registration from {$name}",
                'message' => "Current status: {$validated['current_status']}\nCourse: {$validated['course']}",
                'status' => ContactSubmission::STATUS_UNREAD,
                'original_created_at' => $submittedAt,
                'email_subscriber_status' => 'Never subscribed',
                'sms_subscriber_status' => 'Never subscribed',
                'last_activity' => "Registered for {$validated['course']}",
                'last_activity_at' => $submittedAt,
                'source' => "Career Growth - {$validated['course']}",
                'language' => substr(str_replace('_', '-', (string) $request->getPreferredLanguage()), 0, 20) ?: null,
            ]);

            return $registration;
        });

        return response()->json([
            'success' => true,
            'message' => 'Your Career Growth registration has been submitted successfully.',
            'data' => ['id' => $registration->id],
        ], 201);
    }
}
