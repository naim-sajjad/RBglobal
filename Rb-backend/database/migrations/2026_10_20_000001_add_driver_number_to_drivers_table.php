<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('driver_number', 32)->nullable()->after('email');
            $table->unique(['tenant_id', 'driver_number'], 'drivers_tenant_driver_number_unique');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropUnique('drivers_tenant_driver_number_unique');
            $table->dropColumn('driver_number');
        });
    }
};
