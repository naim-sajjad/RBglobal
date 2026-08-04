<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_submissions', function (Blueprint $table): void {
            $table->string('form_key', 100)->nullable()->after('role')->index();
            $table->string('form_name', 150)->nullable()->after('form_key');
        });
        Schema::table('newsletter_subscribers', function (Blueprint $table): void {
            $table->string('form_key', 100)->nullable()->after('subscriber_type')->index();
            $table->string('form_name', 150)->nullable()->after('form_key');
        });
        Schema::table('career_growth_registrations', function (Blueprint $table): void {
            $table->string('form_key', 100)->nullable()->after('course')->index();
            $table->string('form_name', 150)->nullable()->after('form_key');
        });
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->string('job_type', 100)->nullable()->after('category')->index();
            $table->string('application_form_key', 100)->nullable()->after('job_type')->index();
            $table->string('application_form_name', 150)->nullable()->after('application_form_key');
        });
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->foreignId('job_id')->nullable()->after('id')->index();
            $table->string('job_slug')->nullable()->after('job_title')->index();
            $table->string('job_type', 100)->nullable()->after('job_slug')->index();
            $table->string('application_form_key', 100)->nullable()->after('job_type')->index();
            $table->string('application_form_name', 150)->nullable()->after('application_form_key');
        });

        DB::table('contact_submissions')->whereNull('form_key')->where('role', 'seeker')->update([
            'form_key' => 'job_seeker_contact',
            'form_name' => 'Job Seeker Contact Us Form',
        ]);
        DB::table('contact_submissions')->whereNull('form_key')->where('role', 'employer')->update([
            'form_key' => 'employer_contact',
            'form_name' => 'Employer Contact Form',
        ]);
        DB::table('newsletter_subscribers')->whereNull('form_key')->update([
            'form_key' => 'subscribe',
            'form_name' => 'Subscribe Form',
        ]);
        DB::table('career_growth_registrations')->whereNull('form_key')->update([
            'form_key' => 'career_growth_course_application',
            'form_name' => 'Career Growth Course Application',
        ]);

        foreach ($this->jobMappings() as $mapping) {
            DB::table('job_posts')->where('slug', $mapping['slug'])->update([
                'title' => $mapping['title'],
                'job_type' => $mapping['job_type'],
                'application_form_key' => $mapping['form_key'],
                'application_form_name' => $mapping['form_name'],
            ]);

            DB::table('job_applications')
                ->whereNull('application_form_key')
                ->where('job_title', $mapping['title'])
                ->update([
                    'job_slug' => $mapping['slug'],
                    'job_type' => $mapping['job_type'],
                    'application_form_key' => $mapping['form_key'],
                    'application_form_name' => $mapping['form_name'],
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->dropIndex(['job_id']);
            $table->dropIndex(['job_slug']);
            $table->dropIndex(['job_type']);
            $table->dropIndex(['application_form_key']);
            $table->dropColumn(['job_id', 'job_slug', 'job_type', 'application_form_key', 'application_form_name']);
        });
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->dropIndex(['job_type']);
            $table->dropIndex(['application_form_key']);
            $table->dropColumn(['job_type', 'application_form_key', 'application_form_name']);
        });
        Schema::table('career_growth_registrations', function (Blueprint $table): void {
            $table->dropIndex(['form_key']);
            $table->dropColumn(['form_key', 'form_name']);
        });
        Schema::table('newsletter_subscribers', function (Blueprint $table): void {
            $table->dropIndex(['form_key']);
            $table->dropColumn(['form_key', 'form_name']);
        });
        Schema::table('contact_submissions', function (Blueprint $table): void {
            $table->dropIndex(['form_key']);
            $table->dropColumn(['form_key', 'form_name']);
        });
    }

    private function jobMappings(): array
    {
        return [
            ['title' => 'AZ Driver | London, ON', 'slug' => 'az-driver-london-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
            ['title' => 'AZ Driver | Ajax, ON', 'slug' => 'az-driver-ajax-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
            ['title' => 'AZ Driver | Cambridge, ON', 'slug' => 'az-driver-cambridge-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
            ['title' => 'AZ Driver | Whitby, ON', 'slug' => 'az-driver-whitby-on', 'job_type' => 'az_driver', 'form_key' => 'az_driver_application', 'form_name' => 'AZ Driver Application'],
            ['title' => 'Deep Reach Operator | Mississauga, ON', 'slug' => 'deep-reach-operator-mississauga-on', 'job_type' => 'deep_reach_operator', 'form_key' => 'forklift_application', 'form_name' => 'Forklift Application'],
            ['title' => 'General Labour | Mississauga, ON', 'slug' => 'general-labour-mississauga-on', 'job_type' => 'general_labour', 'form_key' => 'general_labour_application', 'form_name' => 'General Labour Application'],
        ];
    }
};
