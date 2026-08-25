<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->json('rate_overrides')->nullable()->after('custom_pay_lines');
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->dropColumn('rate_overrides');
        });
    }
};
