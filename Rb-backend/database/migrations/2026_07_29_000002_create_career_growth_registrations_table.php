<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('career_growth_registrations', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name', 150);
            $table->string('last_name', 150);
            $table->string('email');
            $table->string('phone', 50);
            $table->string('current_status', 100);
            $table->string('course', 150);
            $table->string('status', 30)->default('new');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('course');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_growth_registrations');
    }
};
