<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->decimal('distance', 12, 2)->default(0)->after('trip_number');
            $table->unsignedInteger('stops_count')->default(0)->after('distance');
            $table->decimal('delay_hours', 8, 2)->default(0)->after('stops_count');
            $table->unsignedInteger('handbomb_count')->default(0)->after('delay_hours');
            $table->text('notes')->nullable()->after('handbomb_count');
            $table->json('rate_snapshot')->nullable()->after('minimum_applied');
            $table->decimal('total_agency_billing', 14, 2)->default(0)->after('rate_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->dropColumn([
                'distance',
                'stops_count',
                'delay_hours',
                'handbomb_count',
                'notes',
                'rate_snapshot',
                'total_agency_billing',
            ]);
        });
    }
};
