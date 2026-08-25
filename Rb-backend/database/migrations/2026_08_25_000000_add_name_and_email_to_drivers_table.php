<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('name')->nullable()->after('tenant_id');
            $table->string('email')->nullable()->after('name');
            $table->index('email');
        });

        // Backfill from linked user accounts
        DB::table('drivers')
            ->join('users', 'drivers.user_id', '=', 'users.id')
            ->update([
                'drivers.name' => DB::raw('users.name'),
                'drivers.email' => DB::raw('users.email'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn(['name', 'email']);
        });
    }
};
