<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'contact_submissions',
        'newsletter_subscribers',
        'career_growth_registrations',
        'job_applications',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->softDeletes();
                $table->unsignedBigInteger('deleted_by')->nullable()->index();
                $table->unsignedBigInteger('restored_by')->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropIndex(['deleted_by']);
                $table->dropIndex(['restored_by']);
                $table->dropColumn(['deleted_at', 'deleted_by', 'restored_by']);
            });
        }
    }
};
