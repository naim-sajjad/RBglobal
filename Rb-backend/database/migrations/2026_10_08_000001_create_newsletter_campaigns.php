<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_campaigns', function (Blueprint $table): void {
            $table->id();
            $table->string('subject');
            $table->longText('body');
            $table->string('audience', 30)->default('all');
            $table->string('status', 30)->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
        Schema::create('newsletter_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('campaign_id')->constrained('newsletter_campaigns')->cascadeOnDelete();
            $table->unsignedBigInteger('subscriber_id');
            $table->string('status', 30)->default('queued');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['campaign_id', 'subscriber_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_deliveries');
        Schema::dropIfExists('newsletter_campaigns');
    }
};
