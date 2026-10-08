<?php

use App\Support\JobApplicationFormMapper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $jobs = json_decode(file_get_contents(database_path('seeders/legacy-jobs.json')), true, 512, JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($jobs): void {
            foreach ($jobs as $job) {
                $slug = Str::slug($job['title']);
                // Preserve records already edited, closed, archived, or deleted.
                if (DB::table('job_posts')->where('slug', $slug)->exists()) continue;
                $mapping = JobApplicationFormMapper::forTitle($job['title']);
                DB::table('job_posts')->insert([
                    'title' => $job['title'], 'slug' => $slug,
                    'location' => $job['location'], 'category' => $job['category'],
                    'image' => $job['image'], 'bullets' => json_encode($job['bullets'], JSON_THROW_ON_ERROR),
                    'note' => $job['note'] ?? null,
                    'job_type' => $mapping['job_type'], 'application_form_key' => $mapping['form_key'],
                    'application_form_name' => $mapping['form_name'],
                    'status' => 'published', 'published_at' => now(),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        // Retain imported jobs because administrators may have edited them.
    }
};
