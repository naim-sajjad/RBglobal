<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BlogManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        Schema::create('users', fn ($table) => $table->id());
        foreach ([
            '2026_07_10_000002_create_blog_categories_table.php',
            '2026_07_10_000003_create_blog_posts_table.php',
            '2026_07_10_000010_add_public_design_fields_to_blog_posts_table.php',
            '2026_10_07_000001_import_existing_insights.php',
        ] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);
    }

    public function test_existing_articles_can_be_edited_without_being_overwritten_by_import(): void
    {
        $this->getJson('/api/admin/blog-posts')->assertOk()->assertJsonPath('meta.total', 5);
        $post = BlogPost::where('slug', 'job-search-as-an-immigrant')->firstOrFail();
        $this->getJson('/api/admin/blog-posts/'.$post->id)->assertOk()->assertJsonPath('data.title', 'Job Search as an Immigrant');
        $this->postJson('/api/admin/blog-posts/'.$post->id, [
            '_method' => 'PUT', 'title' => 'Updated immigrant article', 'slug' => $post->slug,
            'content' => '## Updated content', 'status' => 'published',
        ])->assertOk();
        (require database_path('migrations/2026_10_07_000001_import_existing_insights.php'))->up();
        $this->getJson('/api/blog-posts/'.$post->slug)->assertOk()
            ->assertJsonPath('data.title', 'Updated immigrant article')
            ->assertJsonPath('data.featured_image_url', '/insights/job-search-as-an-immigrant.png');
        $this->patchJson('/api/admin/blog-posts/'.$post->id.'/status', ['status' => 'draft'])->assertOk();
        $this->getJson('/api/blog-posts/'.$post->slug)->assertNotFound();
    }

    public function test_new_blog_can_be_created_published_and_removed(): void
    {
        $response = $this->postJson('/api/admin/blog-posts', [
            'title' => 'Blog creation test', 'content' => 'Test article content.', 'status' => 'draft',
        ])->assertCreated()->assertJsonPath('data.status', 'draft');
        $id = $response->json('data.id');
        $slug = $response->json('data.slug');
        $this->getJson('/api/blog-posts/'.$slug)->assertNotFound();
        $this->patchJson('/api/admin/blog-posts/'.$id.'/status', ['status' => 'published'])->assertOk();
        $this->getJson('/api/blog-posts/'.$slug)->assertOk()->assertJsonPath('data.content', 'Test article content.');
        $this->getJson('/api/blog-posts')->assertOk()->assertJsonPath('meta.total', 6);
        $this->deleteJson('/api/admin/blog-posts/'.$id)->assertOk();
        $this->getJson('/api/blog-posts/'.$slug)->assertNotFound();
    }

    public function test_visual_editor_formatting_is_preserved_and_unsafe_html_is_removed(): void
    {
        $response = $this->postJson('/api/admin/blog-posts', [
            'title' => 'Visual editor test', 'status' => 'published', 'content_format' => 'html',
            'content' => '<h2>Heading</h2><p style="text-align:center;color:#ff0000;position:fixed" onclick="alert(1)"><strong>Bold</strong><em>Italic</em><u>Underline</u></p><ul><li>Item</li></ul><a href="javascript:alert(1)">Unsafe</a><img src="/insights/test.png" onerror="alert(1)"><script>alert(1)</script><iframe src="https://example.com"></iframe>',
        ])->assertCreated()->assertJsonPath('data.content_format', 'html');
        $content = $response->json('data.content');
        $this->assertStringContainsString('<strong>Bold</strong>', $content);
        $this->assertStringContainsString('<u>Underline</u>', $content);
        $this->assertStringContainsString('text-align:center;color:#ff0000', $content);
        $this->assertStringContainsString('<ul><li>Item</li></ul>', $content);
        foreach (['onclick', 'onerror', 'javascript:', '<script', '<iframe', 'position:fixed'] as $unsafe) {
            $this->assertStringNotContainsString($unsafe, $content);
        }
        $this->getJson('/api/blog-posts/'.$response->json('data.slug'))->assertOk()->assertJsonPath('data.content', $content);
    }

    public function test_blog_publication_can_be_scheduled_and_changed_to_immediate(): void
    {
        $fields = ['title' => 'Scheduled article', 'content' => 'Article text', 'status' => 'published', 'published_at' => now()->addDay()->toISOString()];
        $post = $this->postJson('/api/admin/blog-posts', $fields)->assertCreated();
        $slug = $post->json('data.slug');
        $this->getJson('/api/blog-posts/'.$slug)->assertNotFound();
        $fields['slug'] = $slug;
        $fields['published_at'] = null;
        $this->putJson('/api/admin/blog-posts/'.$post->json('data.id'), $fields)->assertOk();
        $this->getJson('/api/blog-posts/'.$slug)->assertOk();
    }
}
