<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('license_document_path')->nullable()->after('medical_certificate_path');
            $table->string('abstract_document_path')->nullable()->after('license_document_path');
            $table->string('cvor_document_path')->nullable()->after('abstract_document_path');
            $table->string('safety_certificate_path')->nullable()->after('cvor_document_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn([
                'license_document_path',
                'abstract_document_path',
                'cvor_document_path',
                'safety_certificate_path',
            ]);
        });
    }
};

