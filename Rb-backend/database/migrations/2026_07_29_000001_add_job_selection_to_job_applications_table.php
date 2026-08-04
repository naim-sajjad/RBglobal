<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->string('job_title')->nullable()->after('id')->index();
            $table->string('license_type', 20)->nullable()->after('immigration_status');
            $table->string('az_license_age', 150)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->dropIndex(['job_title']);
            $table->dropColumn(['job_title', 'license_type']);
            $table->string('az_license_age', 150)->nullable(false)->change();
        });
    }
};
