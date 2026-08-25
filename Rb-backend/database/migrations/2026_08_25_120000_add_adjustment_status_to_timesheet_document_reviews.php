<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->string('adjustment_status', 32)->nullable()->after('adjustment_comment')->index();
        });

        // Backfill open handling status for existing driver adjustment requests.
        DB::table('timesheet_document_reviews')
            ->where('status', 'adjustment_requested')
            ->whereNull('adjustment_status')
            ->update(['adjustment_status' => 'open']);
    }

    public function down(): void
    {
        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->dropColumn('adjustment_status');
        });
    }
};
