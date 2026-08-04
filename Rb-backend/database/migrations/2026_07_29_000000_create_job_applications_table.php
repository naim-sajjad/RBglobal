<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name', 150);
            $table->string('last_name', 150);
            $table->string('email');
            $table->string('phone', 50);
            $table->string('city', 150);
            $table->string('availability', 150);
            $table->string('immigration_status', 150);
            $table->string('az_license_age', 150);
            $table->string('experience', 255);
            $table->string('referred_by', 255)->nullable();
            $table->string('resume_path')->nullable();
            $table->string('resume_original_name')->nullable();
            $table->text('message');
            $table->string('status', 30)->default('new');
            $table->string('source', 100)->default('website_apply_form');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
