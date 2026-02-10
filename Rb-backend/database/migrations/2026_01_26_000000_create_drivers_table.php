<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('tenant_id')->nullable();

            // Section A: License Information
            $table->string('license_number')->nullable();
            $table->string('license_type')->nullable(); // AZ, DZ, G-Class, G1/G2, Other
            $table->string('license_other')->nullable(); // If license_type is "Other"
            $table->string('issuing_authority')->nullable();
            $table->date('license_expiry_date')->nullable();

            // Section B: Driving Experience
            $table->integer('years_of_experience')->default(0);
            $table->text('driving_history')->nullable(); // Accidents, violations, endorsements

            // Section C: Vehicle Information
            $table->json('vehicle_types')->nullable(); // Array: Truck, Van, Trailer, Reefer, Flatbed
            $table->enum('vehicle_ownership', ['company-owned', 'self-owned'])->nullable();
            $table->string('vehicle_capacity')->nullable();

            // Section D: Route & Shift Details
            $table->enum('route_type', ['local', 'regional', 'long-haul', 'intercity'])->nullable();
            $table->text('route_details')->nullable(); // Preferred routes, regions, cities
            $table->enum('shift_timing', ['day', 'night', 'rotational'])->nullable();
            $table->enum('pay_type', ['hourly', 'per_mile', 'per_trip', 'fixed_salary'])->nullable();

            // Section E: Compliance Requirements & Documents
            $table->string('medical_certificate_path')->nullable();
            $table->string('license_document_path')->nullable(); // License image/document
            $table->string('abstract_document_path')->nullable(); // Abstract document
            $table->string('cvor_document_path')->nullable(); // CVOR document
            $table->string('safety_certificate_path')->nullable(); // Safety Certificate
            $table->enum('background_check_status', ['pending', 'completed'])->default('pending');
            $table->boolean('drug_alcohol_test')->default(false);
            $table->text('compliance_notes')->nullable();

            // Driver Status
            $table->enum('status', ['pending_approval', 'active', 'inactive', 'suspended'])->default('pending_approval');

            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('tenant_id');
            $table->index('status');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};

