<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->string('application_email')->nullable()->after('note');
            $table->string('application_url')->nullable()->after('application_email');
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->dropColumn(['application_email', 'application_url']);
        });
    }
};
