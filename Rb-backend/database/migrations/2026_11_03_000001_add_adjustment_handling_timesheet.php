<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->foreignId('handling_timesheet_id')
                ->nullable()
                ->after('timesheet_id')
                ->constrained('timesheets')
                ->nullOnDelete();
        });

        Schema::table('timesheets', function (Blueprint $table) {
            $table->foreignId('adjustment_review_id')
                ->nullable()
                ->after('notes')
                ->constrained('timesheet_document_reviews')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('adjustment_review_id');
        });

        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('handling_timesheet_id');
        });
    }
};
