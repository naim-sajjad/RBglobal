<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing tenant_id relationships to pivot table
        DB::table('users')
            ->whereNotNull('tenant_id')
            ->where('is_global_admin', false)
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    // Check if relationship already exists
                    $exists = DB::table('tenant_user')
                        ->where('tenant_id', $user->tenant_id)
                        ->where('user_id', $user->id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('tenant_user')->insert([
                            'tenant_id' => $user->tenant_id,
                            'user_id' => $user->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });
        
        // Remove foreign key constraint and index, but keep column for backward compatibility
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
        });
        
        // Make tenant_id nullable (super admins don't have tenant_id)
        Schema::table('users', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore foreign key and index
        Schema::table('users', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->change();
            $table->index('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
        
        // Migrate pivot table data back to tenant_id
        DB::table('tenant_user')
            ->orderBy('user_id')
            ->orderBy('created_at')
            ->chunk(100, function ($pivotRecords) {
                foreach ($pivotRecords as $pivot) {
                    // Set the first tenant as the primary tenant_id
                    DB::table('users')
                        ->where('id', $pivot->user_id)
                        ->whereNull('tenant_id')
                        ->update(['tenant_id' => $pivot->tenant_id]);
                }
            });
    }
};

