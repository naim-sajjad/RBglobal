<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->foreignId('employer_id')
                ->nullable()
                ->after('driver_id')
                ->constrained()
                ->nullOnDelete();
            $table->index(['driver_id', 'employer_id', 'week_start_date']);
        });
    }

    public function down(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->dropIndex(['driver_id', 'employer_id', 'week_start_date']);
            $table->dropConstrainedForeignId('employer_id');
        });
    }
};
