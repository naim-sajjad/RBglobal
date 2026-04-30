<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_payroll_billing_taxes', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name', 120);
            $table->string('type', 16);
            $table->decimal('value', 14, 4)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });

        if (Schema::hasTable('tenant_payroll_billing_tax_settings')) {
            $oldRows = DB::table('tenant_payroll_billing_tax_settings')->get();
            foreach ($oldRows as $row) {
                $sort = 0;
                $rate = (float) ($row->client_billing_tax_rate ?? 0);
                $fixed = (float) ($row->client_billing_tax_fixed ?? 0);
                if ($rate > 0) {
                    DB::table('tenant_payroll_billing_taxes')->insert([
                        'tenant_id' => $row->tenant_id,
                        'name' => 'HST',
                        'type' => 'percentage',
                        'value' => round($rate * 100, 4),
                        'sort_order' => $sort++,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                if ($fixed > 0) {
                    DB::table('tenant_payroll_billing_taxes')->insert([
                        'tenant_id' => $row->tenant_id,
                        'name' => 'Fixed tax',
                        'type' => 'fixed',
                        'value' => round($fixed, 2),
                        'sort_order' => $sort++,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            Schema::drop('tenant_payroll_billing_tax_settings');
        }

        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->json('billing_tax_lines')->nullable();
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->json('billing_tax_lines')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn('billing_tax_lines');
        });

        Schema::table('driver_calculations', function (Blueprint $table) {
            $table->dropColumn('billing_tax_lines');
        });

        Schema::dropIfExists('tenant_payroll_billing_taxes');

        Schema::create('tenant_payroll_billing_tax_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->decimal('client_billing_tax_rate', 8, 4)->default(0);
            $table->decimal('client_billing_tax_fixed', 14, 2)->default(0);
            $table->timestamps();
            $table->unique('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }
};
