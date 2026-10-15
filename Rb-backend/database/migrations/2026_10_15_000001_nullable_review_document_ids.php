<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->dropForeign(['invoice_document_id']);
            $table->dropForeign(['calculation_document_id']);
        });

        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('invoice_document_id')->nullable()->change();
            $table->unsignedBigInteger('calculation_document_id')->nullable()->change();

            $table->foreign('invoice_document_id')
                ->references('id')
                ->on('timesheet_documents')
                ->nullOnDelete();
            $table->foreign('calculation_document_id')
                ->references('id')
                ->on('timesheet_documents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->dropForeign(['invoice_document_id']);
            $table->dropForeign(['calculation_document_id']);
        });

        Schema::table('timesheet_document_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('invoice_document_id')->nullable(false)->change();
            $table->unsignedBigInteger('calculation_document_id')->nullable(false)->change();

            $table->foreign('invoice_document_id')
                ->references('id')
                ->on('timesheet_documents')
                ->cascadeOnDelete();
            $table->foreign('calculation_document_id')
                ->references('id')
                ->on('timesheet_documents')
                ->cascadeOnDelete();
        });
    }
};
