<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE rate_cards MODIFY COLUMN status ENUM('active','scheduled','expired','draft') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("UPDATE rate_cards SET status = 'scheduled' WHERE status = 'draft'");
        DB::statement("ALTER TABLE rate_cards MODIFY COLUMN status ENUM('active','scheduled','expired') NOT NULL DEFAULT 'scheduled'");
    }
};
