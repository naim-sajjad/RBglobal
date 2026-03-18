<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timesheet_trip_pay_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_trip_id')->constrained()->onDelete('cascade');
            $table->foreignId('pay_item_template_id')->constrained()->onDelete('cascade');

            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('rate', 12, 2)->default(0);
            $table->decimal('amount', 14, 2)->default(0); // quantity * rate

            $table->timestamps();

            $table->index('timesheet_trip_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_trip_pay_items');
    }
};
