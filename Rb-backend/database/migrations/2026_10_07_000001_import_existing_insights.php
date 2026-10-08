<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $insights = json_decode(file_get_contents(database_path('seeders/legacy-insights.json')), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($insights): void {
            foreach ($insights as $insight) {
                // Preserve existing edits, including archived or deleted records.
                if (DB::table('blog_posts')->where('slug', $insight['slug'])->exists()) {
                    continue;
                }
                $categorySlug = Str::slug($insight['category']);
                DB::table('blog_categories')->insertOrIgnore([
                    'name' => $insight['category'], 'slug' => $categorySlug,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $content = $insight['content'];
                $parts = [$content['intro']];
                foreach ($content['sections'] as $section) {
                    $parts[] = '## '.$section['title'];
                    $parts[] = $section['body'];
                }
                $parts[] = '## '.$content['conclusionTitle'];
                $parts[] = $content['conclusion'];
                DB::table('blog_posts')->insert([
                    'category_id' => DB::table('blog_categories')->where('slug', $categorySlug)->value('id'),
                    'title' => $insight['title'], 'slug' => $insight['slug'],
                    'excerpt' => $insight['excerpt'], 'content' => implode("\n\n", $parts),
                    'featured_image' => $insight['image'], 'status' => 'published',
                    'published_at' => date('Y-m-d H:i:s', strtotime($insight['date'])),
                    'reading_time' => (int) $insight['readTime'], 'content_format' => 'markdown',
                    'seo_title' => $insight['title'], 'meta_description' => $insight['excerpt'],
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        // Imported articles may have been edited; retain their content on rollback.
    }
};
