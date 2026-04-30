<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            if (! Schema::hasColumn('timesheets', 'adjusted_at')) {
                $table->timestamp('adjusted_at')->nullable()->after('weekly_total');
            }
            if (! Schema::hasColumn('timesheets', 'adjusted_by')) {
                $table->foreignId('adjusted_by')->nullable()->after('adjusted_at')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('timesheet_trips', function (Blueprint $table) {
            if (! Schema::hasColumn('timesheet_trips', 'is_adjusted')) {
                $table->boolean('is_adjusted')->default(false)->after('total_agency_billing');
            }
            if (! Schema::hasColumn('timesheet_trips', 'adjusted_at')) {
                $table->timestamp('adjusted_at')->nullable()->after('is_adjusted');
            }
            if (! Schema::hasColumn('timesheet_trips', 'adjusted_reason')) {
                $table->string('adjusted_reason', 255)->nullable()->after('adjusted_at');
            }
            if (! Schema::hasColumn('timesheet_trips', 'manual_rate_snapshot')) {
                $table->json('manual_rate_snapshot')->nullable()->after('rate_snapshot');
            }
        });

        Schema::create('timesheet_adjustment_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable()->index();
            $table->foreignId('timesheet_id')->constrained('timesheets')->cascadeOnDelete();
            $table->foreignId('timesheet_trip_id')->nullable()->constrained('timesheet_trips')->nullOnDelete();
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 255)->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('invoice_file_path', 2048)->nullable();
            $table->timestamps();

            $table->index(['timesheet_id', 'created_at']);
        });

        Schema::create('driver_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable()->index();
            $table->foreignId('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->string('type', 80)->default('timesheet_updated');
            $table->string('title', 200)->nullable();
            $table->text('message');
            $table->json('meta')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['driver_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_notifications');
        Schema::dropIfExists('timesheet_adjustment_logs');

        Schema::table('timesheet_trips', function (Blueprint $table) {
            $cols = [];
            foreach (['is_adjusted', 'adjusted_at', 'adjusted_reason', 'manual_rate_snapshot'] as $c) {
                if (Schema::hasColumn('timesheet_trips', $c)) {
                    $cols[] = $c;
                }
            }
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('timesheets', function (Blueprint $table) {
            if (Schema::hasColumn('timesheets', 'adjusted_by')) {
                $table->dropConstrainedForeignId('adjusted_by');
            }
            if (Schema::hasColumn('timesheets', 'adjusted_at')) {
                $table->dropColumn('adjusted_at');
            }
        });
    }
};

