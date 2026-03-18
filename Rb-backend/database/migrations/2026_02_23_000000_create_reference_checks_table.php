<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reference_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
            $table->string('tenant_id')->nullable();
            $table->string('token', 64)->unique();
            $table->enum('status', ['pending', 'sent', 'completed', 'admin_filled'])->default('pending');
            $table->string('referee_email')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('filled_by', ['referee', 'admin'])->nullable();

            // Applicant consent (To be read and signed by the applicant)
            $table->json('applicant_consent')->nullable();

            // Request for Information from Previous Employer
            $table->json('reference_request')->nullable();

            // Pre-Employment Reference Check Form data
            $table->json('form_data')->nullable();

            $table->timestamps();

            $table->index(['driver_id', 'status']);
            $table->index('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reference_checks');
    }
};
