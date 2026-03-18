<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timesheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            $table->string('tenant_id')->nullable();

            $table->date('week_start_date');
            $table->date('week_end_date');
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'])->default('draft');

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('paid_by')->nullable();
            $table->text('reject_reason')->nullable();
            $table->text('notes')->nullable();

            $table->decimal('weekly_total', 14, 2)->default(0);

            $table->timestamps();

            $table->index(['driver_id', 'week_start_date']);
            $table->index(['tenant_id', 'status']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheets');
    }
};
