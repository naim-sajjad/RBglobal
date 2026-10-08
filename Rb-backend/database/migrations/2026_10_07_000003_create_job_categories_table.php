<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });
        $names = DB::table('job_posts')->distinct()->pluck('category')
            ->merge(['Trucking', 'Warehousing', 'General Labour', 'Office & Accounting'])->unique();
        foreach ($names as $name) {
            if (trim($name) !== '') DB::table('job_categories')->insertOrIgnore(['name' => trim($name), 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_categories');
    }
};
