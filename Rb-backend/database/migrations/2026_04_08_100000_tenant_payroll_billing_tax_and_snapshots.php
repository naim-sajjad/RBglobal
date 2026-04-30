<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_payroll_billing_tax_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->decimal('client_billing_tax_rate', 8, 4)->default(0);
            $table->decimal('client_billing_tax_fixed', 14, 2)->default(0);
            $table->timestamps();

            $table->unique('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });

        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->decimal('billing_tax_from_percent', 14, 2)->default(0)->after('billing_tax_rate');
            $table->decimal('billing_tax_fixed', 14, 2)->default(0)->after('billing_tax_from_percent');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('billing_tax_from_percent', 14, 2)->default(0)->after('billing_tax_rate');
            $table->decimal('billing_tax_fixed', 14, 2)->default(0)->after('billing_tax_from_percent');
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['billing_tax_from_percent', 'billing_tax_fixed']);
        });

        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->dropColumn(['billing_tax_from_percent', 'billing_tax_fixed']);
        });

        Schema::dropIfExists('tenant_payroll_billing_tax_settings');
    }
};
