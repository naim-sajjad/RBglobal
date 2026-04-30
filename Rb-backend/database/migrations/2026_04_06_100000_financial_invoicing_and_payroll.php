<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->foreignId('employer_id')->constrained()->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 32)->default('draft'); // draft, sent, paid, partially_paid, overdue
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0); // e.g. 0.13 for 13%
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->string('invoice_number', 64)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'employer_id', 'status']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->foreignId('timesheet_trip_id')->constrained('timesheet_trips')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            $table->date('trip_date');
            $table->string('pay_item_type', 255); // label / line category
            $table->string('line_type', 64)->nullable();
            $table->decimal('quantity', 14, 4)->default(0);
            $table->string('unit', 32)->nullable();
            $table->decimal('rate', 14, 4)->default(0); // agency billing rate snapshot
            $table->decimal('amount', 14, 2)->default(0);
            $table->unsignedSmallInteger('line_index')->default(0);
            $table->timestamps();

            $table->index(['invoice_id', 'driver_id']);
        });

        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 14, 2);
            $table->date('payment_date');
            $table->string('reference', 255)->nullable();
            $table->timestamps();

            $table->index('invoice_id');
        });

        Schema::create('driver_calculations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_pay', 14, 2)->default(0);
            $table->decimal('vacation_pay', 14, 2)->default(0);
            $table->decimal('deductions', 14, 2)->default(0);
            $table->decimal('net_pay', 14, 2)->default(0);
            $table->json('breakdown')->nullable(); // pay_item_type totals snapshot
            $table->string('status', 32)->default('pending'); // pending, finalized
            $table->timestamps();

            $table->unique(['tenant_id', 'driver_id', 'period_start', 'period_end'], 'driver_calc_period_unique');
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });

        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->foreignId('driver_calculation_id')->unique()->constrained('driver_calculations')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_pay', 14, 2)->default(0);
            $table->decimal('vacation_pay', 14, 2)->default(0);
            $table->decimal('deductions', 14, 2)->default(0);
            $table->decimal('net_pay', 14, 2)->default(0);
            $table->json('breakdown')->nullable();
            $table->string('status', 32)->default('pending'); // pending, paid
            $table->timestamps();

            $table->index(['tenant_id', 'driver_id', 'status']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });

        Schema::create('remittances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payslip_id')->constrained()->onDelete('cascade');
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_paid', 14, 2);
            $table->date('payment_date');
            $table->string('reference', 255)->nullable();
            $table->timestamps();

            $table->index('payslip_id');
        });

        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('payslip_id')->nullable()->constrained('payslips')->nullOnDelete();
            $table->index(['invoice_id']);
            $table->index(['payslip_id']);
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_trips', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
            $table->dropForeign(['payslip_id']);
            $table->dropColumn(['invoice_id', 'payslip_id']);
        });

        Schema::dropIfExists('remittances');
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('driver_calculations');
        Schema::dropIfExists('invoice_payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
