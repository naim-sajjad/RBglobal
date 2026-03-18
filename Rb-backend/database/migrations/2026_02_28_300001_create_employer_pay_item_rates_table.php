<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employer_pay_item_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->onDelete('cascade');
            $table->foreignId('pay_item_template_id')->constrained()->onDelete('cascade');
            $table->decimal('rate', 12, 2)->default(0);

            $table->timestamps();

            $table->unique(['employer_id', 'pay_item_template_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_pay_item_rates');
    }
};
