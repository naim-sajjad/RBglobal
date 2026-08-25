<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('timesheet_document_review_events');
        Schema::dropIfExists('timesheet_document_reviews');

        Schema::create('timesheet_document_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable()->index();
            $table->foreignId('timesheet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_document_id')->constrained('timesheet_documents')->cascadeOnDelete();
            $table->foreignId('calculation_document_id')->constrained('timesheet_documents')->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->enum('status', [
                'pending',
                'approved',
                'adjustment_requested',
                'superseded',
                'expired',
            ])->default('pending')->index();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedBigInteger('sent_by')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_email')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('adjustment_comment')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamps();

            $table->index(['timesheet_id', 'status']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            $table->foreign('sent_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('timesheet_document_review_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('timesheet_document_review_id');
            $table->string('event_type', 64);
            $table->string('actor_type', 32)->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['timesheet_document_review_id', 'event_type'], 'tdre_review_event_idx');
            $table->foreign('timesheet_document_review_id', 'tdre_review_fk')
                ->references('id')
                ->on('timesheet_document_reviews')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_document_review_events');
        Schema::dropIfExists('timesheet_document_reviews');
    }
};
