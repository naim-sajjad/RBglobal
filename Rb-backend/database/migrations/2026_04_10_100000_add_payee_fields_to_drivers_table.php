<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('payee_business_name')->nullable()->after('compliance_notes');
            $table->text('payee_address')->nullable()->after('payee_business_name');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['payee_business_name', 'payee_address']);
        });
    }
};
