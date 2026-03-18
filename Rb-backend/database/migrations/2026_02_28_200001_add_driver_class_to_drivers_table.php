<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->foreignId('driver_class_id')->nullable()->after('tenant_id')->constrained('driver_classes')->nullOnDelete();
            $table->date('driver_class_effective_date')->nullable()->after('driver_class_id');
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropForeign(['driver_class_id']);
            $table->dropColumn(['driver_class_id', 'driver_class_effective_date']);
        });
    }
};
