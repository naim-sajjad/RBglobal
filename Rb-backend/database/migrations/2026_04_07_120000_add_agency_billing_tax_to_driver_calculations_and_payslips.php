<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->decimal('agency_billing_subtotal', 14, 2)->default(0)->after('net_pay');
            $table->decimal('billing_tax_rate', 8, 4)->default(0)->after('agency_billing_subtotal');
            $table->decimal('billing_tax_amount', 14, 2)->default(0)->after('billing_tax_rate');
            $table->decimal('agency_billing_total', 14, 2)->default(0)->after('billing_tax_amount');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('agency_billing_subtotal', 14, 2)->default(0)->after('net_pay');
            $table->decimal('billing_tax_rate', 8, 4)->default(0)->after('agency_billing_subtotal');
            $table->decimal('billing_tax_amount', 14, 2)->default(0)->after('billing_tax_rate');
            $table->decimal('agency_billing_total', 14, 2)->default(0)->after('billing_tax_amount');
        });
    }

    public function down(): void
    {
        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->dropColumn([
                'agency_billing_subtotal',
                'billing_tax_rate',
                'billing_tax_amount',
                'agency_billing_total',
            ]);
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn([
                'agency_billing_subtotal',
                'billing_tax_rate',
                'billing_tax_amount',
                'agency_billing_total',
            ]);
        });
    }
};
