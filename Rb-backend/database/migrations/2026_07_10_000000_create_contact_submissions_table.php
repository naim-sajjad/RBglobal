<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_submissions', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name', 150);
            $table->string('last_name', 150);
            $table->string('name', 301);
            $table->string('email');
            $table->string('phone', 50);
            $table->string('location', 255);
            $table->string('role', 50);
            $table->string('subject')->nullable();
            $table->text('message');
            $table->string('status', 20)->default('unread');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_submissions');
    }
};
