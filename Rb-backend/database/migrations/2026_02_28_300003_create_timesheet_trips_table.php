<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timesheet_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_id')->constrained()->onDelete('cascade');
            $table->foreignId('employer_id')->constrained()->onDelete('cascade');

            $table->date('trip_date');
            $table->string('trip_number', 50)->nullable();
            $table->decimal('trip_total', 14, 2)->default(0);
            $table->boolean('minimum_applied')->default(false);

            $table->timestamps();

            $table->index(['timesheet_id', 'trip_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_trips');
    }
};
