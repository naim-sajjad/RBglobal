<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->json('custom_pay_lines')->nullable()->after('additional_quantities');
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->dropColumn('custom_pay_lines');
        });
    }
};
