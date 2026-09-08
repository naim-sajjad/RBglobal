<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'contact_submissions',
        'newsletter_subscribers',
        'career_growth_registrations',
        'job_applications',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            $this->ensureAutoIncrementId($table);
        }
    }

    public function down(): void
    {
        // Restoring a missing AUTO_INCREMENT would break new website form inserts.
    }

    private function ensureAutoIncrementId(string $table): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'id')) {
            return;
        }

        $database = Schema::getConnection()->getDatabaseName();
        $column = DB::selectOne(
            'SELECT COLUMN_TYPE, EXTRA, COLUMN_KEY
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$database, $table, 'id']
        );

        if (! $column || str_contains(strtolower((string) $column->EXTRA), 'auto_increment')) {
            return;
        }

        $type = filled($column->COLUMN_TYPE) ? $column->COLUMN_TYPE : 'bigint unsigned';

        if (strtoupper((string) $column->COLUMN_KEY) !== 'PRI') {
            $hasPrimary = DB::selectOne(
                'SELECT CONSTRAINT_NAME
                 FROM information_schema.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = ?',
                [$database, $table, 'PRIMARY KEY']
            );
            if (! $hasPrimary) {
                DB::statement("ALTER TABLE `{$table}` ADD PRIMARY KEY (`id`)");
            }
        }

        DB::statement("ALTER TABLE `{$table}` MODIFY `id` {$type} NOT NULL AUTO_INCREMENT");

        $max = (int) DB::table($table)->max('id');
        if ($max > 0) {
            DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = ".($max + 1));
        }
    }
};
