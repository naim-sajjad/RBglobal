<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_submissions', function (Blueprint $table): void {
            $table->string('first_name', 150)->nullable()->change();
            $table->string('last_name', 150)->nullable()->change();
            $table->string('name', 301)->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->string('phone', 50)->nullable()->change();
            $table->string('location', 255)->nullable()->change();
            $table->string('role', 50)->nullable()->change();
            $table->text('message')->nullable()->change();

            $table->string('secondary_email')->nullable()->after('email');
            $table->string('secondary_phone', 50)->nullable()->after('phone');
            $table->timestamp('original_created_at')->nullable()->after('read_at');
            $table->string('email_subscriber_status', 100)->nullable()->after('original_created_at');
            $table->string('sms_subscriber_status', 100)->nullable()->after('email_subscriber_status');
            $table->string('last_activity', 500)->nullable()->after('sms_subscriber_status');
            $table->timestamp('last_activity_at')->nullable()->after('last_activity');
            $table->string('source', 150)->nullable()->after('last_activity_at');
            $table->string('language', 20)->nullable()->after('source');
            $table->foreignId('import_batch_id')->nullable()->after('language')->constrained('import_batches')->nullOnDelete();
            $table->timestamp('imported_at')->nullable()->after('import_batch_id');
            $table->foreignId('imported_by')->nullable()->after('imported_at')->constrained('users')->nullOnDelete();
            $table->string('import_source_file')->nullable()->after('imported_by');

            $table->index('phone');
            $table->index('source');
            $table->index('imported_at');
            $table->index('import_batch_id');
            $table->index('original_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('contact_submissions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('import_batch_id');
            $table->dropConstrainedForeignId('imported_by');
            $table->dropIndex(['phone']);
            $table->dropIndex(['source']);
            $table->dropIndex(['imported_at']);
            $table->dropIndex(['original_created_at']);
            $table->dropColumn([
                'secondary_email',
                'secondary_phone',
                'original_created_at',
                'email_subscriber_status',
                'sms_subscriber_status',
                'last_activity',
                'last_activity_at',
                'source',
                'language',
                'imported_at',
                'import_source_file',
            ]);
        });
    }
};
