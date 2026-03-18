<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employers', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();

            // Basic Information
            $table->string('name');
            $table->string('company_code')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('billing_address')->nullable();
            $table->string('service_location')->nullable(); // Depot Name
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();

            // Operational Settings
            $table->enum('measurement_unit', ['miles', 'km'])->default('km');
            $table->string('default_currency', 3)->default('CAD');
            $table->decimal('minimum_trip_guarantee', 12, 2)->nullable();
            $table->boolean('requires_driver_rate_tracking')->default(false);

            $table->timestamps();

            $table->index('tenant_id');
            $table->index('status');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employers');
    }
};
