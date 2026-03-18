<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rate_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->onDelete('cascade');

            $table->string('name');
            $table->date('effective_from');
            $table->date('effective_to');
            $table->enum('status', ['active', 'scheduled', 'expired'])->default('scheduled');

            // Optional: store rate structure as JSON for future use
            $table->json('rates')->nullable();

            $table->timestamps();

            $table->index(['employer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_cards');
    }
};
