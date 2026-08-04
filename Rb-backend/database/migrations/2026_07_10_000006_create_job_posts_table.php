<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_posts', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('location');
            $table->string('category');
            $table->string('image')->nullable();
            $table->json('bullets')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posts');
    }
};
