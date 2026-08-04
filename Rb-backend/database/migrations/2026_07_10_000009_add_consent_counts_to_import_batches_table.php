<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_batches', function (Blueprint $table): void {
            $table->unsignedInteger('active_rows')->default(0)->after('duplicate_rows');
            $table->unsignedInteger('non_consented_rows')->default(0)->after('active_rows');
        });
    }

    public function down(): void
    {
        Schema::table('import_batches', function (Blueprint $table): void {
            $table->dropColumn(['active_rows', 'non_consented_rows']);
        });
    }
};
