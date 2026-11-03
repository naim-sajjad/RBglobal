<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheet_documents', function (Blueprint $table) {
            $table->json('parsed_payload')->nullable()->after('file_size');
            $table->string('mime_type', 128)->nullable()->after('parsed_payload');
        });

        DB::statement("ALTER TABLE timesheet_documents MODIFY document_type ENUM('invoice', 'calculation_sheet', 'timesheet') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE timesheet_documents MODIFY document_type ENUM('invoice', 'calculation_sheet') NOT NULL");

        Schema::table('timesheet_documents', function (Blueprint $table) {
            $table->dropColumn(['parsed_payload', 'mime_type']);
        });
    }
};
