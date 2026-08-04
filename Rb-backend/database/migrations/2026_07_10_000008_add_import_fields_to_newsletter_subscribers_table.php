<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table): void {
            $table->timestamp('subscribed_at')->nullable()->change();
            $table->string('subscriber_type', 100)->nullable()->after('role')->index();
            $table->boolean('consent')->default(true)->after('subscriber_type')->index();
            $table->timestamp('consent_at')->nullable()->after('consent');
            $table->timestamp('original_submitted_at')->nullable()->after('source')->index();
            $table->foreignId('import_batch_id')->nullable()->after('unsubscribed_at')->constrained('import_batches')->nullOnDelete();
            $table->timestamp('imported_at')->nullable()->after('import_batch_id')->index();
            $table->foreignId('imported_by')->nullable()->after('imported_at')->constrained('users')->nullOnDelete();
            $table->string('import_source_file')->nullable()->after('imported_by');
        });
    }

    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('import_batch_id');
            $table->dropConstrainedForeignId('imported_by');
            $table->dropColumn([
                'subscriber_type',
                'consent',
                'consent_at',
                'original_submitted_at',
                'imported_at',
                'import_source_file',
            ]);
        });
    }
};
