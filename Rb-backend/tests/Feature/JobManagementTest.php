<?php

namespace Tests\Feature;

use App\Models\JobPost;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class JobManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        foreach (['2026_07_10_000006_create_job_posts_table.php', '2026_07_10_000011_add_application_fields_to_job_posts_table.php'] as $file) {
            (require database_path('migrations/'.$file))->up();
        }
        Schema::table('job_posts', function ($table) {
            $table->string('job_type', 100)->nullable();
            $table->string('application_form_key', 100)->nullable();
            $table->string('application_form_name', 150)->nullable();
        });
        (require database_path('migrations/2026_10_07_000002_import_existing_website_jobs.php'))->up();
        (require database_path('migrations/2026_10_07_000003_create_job_categories_table.php'))->up();
        (require database_path('migrations/2026_10_07_000004_add_description_to_job_posts_table.php'))->up();
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);
    }

    public function test_existing_website_jobs_are_listed_editable_and_can_be_closed(): void
    {
        $this->getJson('/api/admin/job-posts')->assertOk()->assertJsonPath('meta.total', 7);
        $this->getJson('/api/job-posts')->assertOk()->assertJsonPath('meta.total', 7);
        $job = JobPost::where('slug', 'az-driver-london-on')->firstOrFail();
        $this->getJson('/api/admin/job-posts/'.$job->id)->assertOk()
            ->assertJsonPath('data.image_url', '/jobs/az-driver-london.png')
            ->assertJsonPath('data.application_form_key', 'az_driver_application');
        $this->post('/api/admin/job-posts/'.$job->id, [
            '_method' => 'PUT', 'title' => $job->title, 'slug' => $job->slug,
            'location' => $job->location, 'category' => $job->category,
            'bullets' => ['Updated job requirement'], 'status' => 'published',
        ], ['Accept' => 'application/json'])->assertOk();
        (require database_path('migrations/2026_10_07_000002_import_existing_website_jobs.php'))->up();
        $this->getJson('/api/job-posts/'.$job->slug)->assertOk()->assertJsonPath('data.bullets.0', 'Updated job requirement');
        $this->patchJson('/api/admin/job-posts/'.$job->id.'/status', ['status' => 'closed'])->assertOk();
        $this->getJson('/api/job-posts/'.$job->slug)->assertNotFound();
        $this->getJson('/api/job-posts')->assertOk()->assertJsonPath('meta.total', 6);
    }

    public function test_new_job_can_be_added_published_found_and_deleted(): void
    {
        $response = $this->post('/api/admin/job-posts', [
            'title' => 'Test Warehouse Associate', 'location' => 'Toronto, ON',
            'category' => 'Warehousing', 'bullets' => ['Full time availability'], 'status' => 'draft',
        ], ['Accept' => 'application/json'])->assertCreated();
        $id = $response->json('data.id');
        $slug = $response->json('data.slug');
        $this->assertNotEmpty($slug);
        $this->getJson('/api/admin/job-posts?search=Test%20Warehouse')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/job-posts/'.$slug)->assertNotFound();
        $this->patchJson('/api/admin/job-posts/'.$id.'/status', ['status' => 'published'])->assertOk();
        $this->getJson('/api/job-posts/'.$slug)->assertOk()->assertJsonPath('data.title', 'Test Warehouse Associate');
        $this->getJson('/api/job-posts')->assertOk()->assertJsonPath('meta.total', 8);
        $this->deleteJson('/api/admin/job-posts/'.$id)->assertOk();
        $this->getJson('/api/job-posts/'.$slug)->assertNotFound();
    }

    public function test_categories_can_be_created_selected_renamed_and_safely_deleted(): void
    {
        $this->getJson('/api/job-categories')->assertOk()->assertJsonCount(4, 'data');
        $response = $this->postJson('/api/admin/job-categories', ['name' => 'Hospitality'])->assertCreated();
        $id = $response->json('data.id');
        $this->postJson('/api/admin/job-categories', ['name' => 'Hospitality'])->assertUnprocessable();
        $job = $this->postJson('/api/admin/job-posts', [
            'title' => 'Receptionist', 'location' => 'Toronto', 'category' => 'Hospitality', 'status' => 'published',
        ])->assertCreated();
        $this->deleteJson('/api/admin/job-categories/'.$id)->assertUnprocessable();
        $this->putJson('/api/admin/job-categories/'.$id, ['name' => 'Hotels'])->assertOk();
        $this->getJson('/api/job-posts?category=Hotels')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/admin/job-posts/'.$job->json('data.id'))->assertOk()->assertJsonPath('data.category', 'Hotels');
        $unused = $this->postJson('/api/admin/job-categories', ['name' => 'Unused'])->assertCreated();
        $this->deleteJson('/api/admin/job-categories/'.$unused->json('data.id'))->assertOk();
    }

    public function test_job_card_and_detail_fields_are_saved_and_publication_can_be_scheduled(): void
    {
        $fields = [
            'title' => 'New Warehouse Role', 'location' => 'Toronto, ON', 'category' => 'Warehousing',
            'bullets' => ['**Experience required**', 'Weekend availability'], 'note' => 'Hiring two people',
            'description' => '<h2>Responsibilities</h2><p><strong>Full-time role</strong></p><script>alert(1)</script>',
            'application_email' => 'careers@example.com', 'application_url' => 'https://example.com/apply',
            'status' => 'published', 'published_at' => now()->addDay()->toISOString(),
        ];
        $response = $this->postJson('/api/admin/job-posts', $fields)->assertCreated();
        $id = $response->json('data.id');
        $slug = $response->json('data.slug');
        $this->getJson('/api/job-posts/'.$slug)->assertNotFound();
        $fields['slug'] = $slug;
        $fields['published_at'] = null;
        $this->putJson('/api/admin/job-posts/'.$id, $fields)->assertOk();
        $this->getJson('/api/job-posts/'.$slug)->assertOk()
            ->assertJsonPath('data.description', '<h2>Responsibilities</h2><p><strong>Full-time role</strong></p>')
            ->assertJsonPath('data.note', 'Hiring two people')
            ->assertJsonPath('data.bullets.0', '**Experience required**')
            ->assertJsonPath('data.application_url', 'https://example.com/apply')
            ->assertJsonPath('data.application_email', 'careers@example.com');
    }
}
