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
            $table->date('license_issue_date')->nullable()->after('issuing_authority');
            $table->string('license_front_image_path')->nullable()->after('license_document_path');
            $table->string('license_back_image_path')->nullable()->after('license_front_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn([
                'license_issue_date',
                'license_front_image_path',
                'license_back_image_path',
            ]);
        });
    }
};

