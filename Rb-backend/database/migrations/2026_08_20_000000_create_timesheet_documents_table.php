<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timesheet_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_id')->constrained()->onDelete('cascade');
            $table->string('tenant_id')->nullable();
            $table->enum('document_type', ['invoice', 'calculation_sheet']);
            $table->enum('source', ['generated', 'uploaded']);
            $table->string('file_path', 2048);
            $table->string('original_filename', 512);
            $table->unsignedBigInteger('file_size')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['timesheet_id', 'document_type', 'source']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_documents');
    }
};
