<?php

namespace App\Support;

use App\Models\JobPost;

final class JobApplicationFormMapper
{
    public const JOBS = [
        'AZ Driver | London, ON' => ['slug' => 'az-driver-london-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
        'AZ Driver | Ajax, ON' => ['slug' => 'az-driver-ajax-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
        'AZ Driver | Cambridge, ON' => ['slug' => 'az-driver-cambridge-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
        'AZ Driver | Whitby, ON' => ['slug' => 'az-driver-whitby-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
        'Deep Reach Operator | Mississauga, ON' => ['slug' => 'deep-reach-operator-mississauga-on', 'job_type' => 'deep_reach_operator', 'form_key' => 'forklift_application', 'form_name' => 'Forklift Application'],
        'General Labour | Mississauga, ON' => ['slug' => 'general-labour-mississauga-on', 'job_type' => 'general_labour', 'form_key' => 'general_labour_application', 'form_name' => 'General Labour Application'],
        'Experienced Accountant | Mississauga, ON' => ['slug' => 'experienced-accountant-mississauga-on', 'job_type' => 'accountant', 'form_key' => null, 'form_name' => null],
    ];

    public static function resolve(?int $jobId, ?string $jobSlug, string $jobTitle): array
    {
        $job = $jobId
            ? JobPost::query()->find($jobId)
            : ($jobSlug ? JobPost::query()->where('slug', $jobSlug)->first() : null);

        if ($job) {
            abort_unless($job->status === JobPost::STATUS_PUBLISHED && (! $job->published_at || $job->published_at->isPast()), 422, 'The selected job is not currently accepting applications.');
            abort_unless($job->title === $jobTitle, 422, 'The selected job does not match the submitted position.');

            return [
                'job_id' => $job->id,
                'job_title' => $job->title,
                'job_slug' => $job->slug,
                'job_type' => $job->job_type,
                'application_form_key' => $job->application_form_key,
                'application_form_name' => $job->application_form_name,
                'location' => $job->location,
            ];
        }

        abort_if($jobId, 422, 'The selected job is not available.');

        $mapping = self::JOBS[$jobTitle] ?? null;
        abort_unless($mapping && (! $jobSlug || $mapping['slug'] === $jobSlug), 422, 'The selected position is not available.');

        return [
            'job_id' => null,
            'job_title' => $jobTitle,
            'job_slug' => $mapping['slug'],
            'job_type' => $mapping['job_type'],
            'application_form_key' => $mapping['form_key'],
            'application_form_name' => $mapping['form_name'],
            'location' => str_contains($jobTitle, ' | ') ? explode(' | ', $jobTitle, 2)[1] : null,
        ];
    }

    public static function forTitle(string $title): array
    {
        return self::JOBS[$title] ?? ['job_type' => null, 'form_key' => null, 'form_name' => null];
    }
}
