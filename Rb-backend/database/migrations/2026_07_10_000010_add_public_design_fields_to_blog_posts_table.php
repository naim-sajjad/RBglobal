<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->unsignedInteger('reading_time')->nullable()->after('published_at');
            $table->string('cta_title')->nullable()->after('meta_description');
            $table->text('cta_description')->nullable()->after('cta_title');
            $table->string('cta_button_label')->nullable()->after('cta_description');
            $table->string('cta_button_url')->nullable()->after('cta_button_label');
            $table->string('content_format')->nullable()->default('markdown')->after('cta_button_url');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->dropColumn([
                'reading_time',
                'cta_title',
                'cta_description',
                'cta_button_label',
                'cta_button_url',
                'content_format',
            ]);
        });
    }
};
