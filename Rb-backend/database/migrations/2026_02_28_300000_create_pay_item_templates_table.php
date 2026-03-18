<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pay_item_templates', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();

            $table->string('code', 50); // e.g. distance_km, delay, stops, handbomb
            $table->string('name'); // Display name
            $table->string('unit', 30)->default('flat'); // per_km, per_hour, flat, per_stop
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('tenant_id');
            $table->unique(['tenant_id', 'code']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_item_templates');
    }
};
