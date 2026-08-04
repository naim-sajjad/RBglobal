<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobPostRequest;
use App\Http\Requests\UpdateJobPostRequest;
use App\Http\Requests\UpdateJobPostStatusRequest;
use App\Models\JobPost;
use App\Support\JobApplicationFormMapper;
use App\Support\UniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JobPostController extends Controller
{
    public function publicIndex(Request $request): JsonResponse
    {
        $jobs = $this->filteredQuery($request, JobPost::query()->published())
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($jobs->items())->map(fn (JobPost $job) => $this->transform($job))->values(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    public function publicShow(string $slug): JsonResponse
    {
        $job = JobPost::query()
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $this->transform($job),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $jobs = $this->filteredQuery($request, JobPost::query())
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($jobs->items())->map(fn (JobPost $job) => $this->transform($job))->values(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    public function store(StoreJobPostRequest $request): JsonResponse
    {
        $data = $this->payload($request->validated());
        $data['slug'] = $data['slug'] ?: UniqueSlug::make(JobPost::class, "{$data['title']} {$data['location']}");

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('jobs', 'public');
        }

        $job = JobPost::create($data);

        return response()->json(['success' => true, 'data' => $this->transform($job)], 201);
    }

    public function show(JobPost $jobPost): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->transform($jobPost)]);
    }

    public function update(UpdateJobPostRequest $request, JobPost $jobPost): JsonResponse
    {
        $data = $this->payload($request->validated(), $jobPost);
        $data['slug'] = $data['slug'] ?: UniqueSlug::make(JobPost::class, "{$data['title']} {$data['location']}", $jobPost->id);

        if ($request->boolean('remove_image') && $jobPost->image) {
            Storage::disk('public')->delete($jobPost->image);
            $data['image'] = null;
        }

        if ($request->hasFile('image')) {
            if ($jobPost->image) {
                Storage::disk('public')->delete($jobPost->image);
            }
            $data['image'] = $request->file('image')->store('jobs', 'public');
        }

        $jobPost->update($data);

        return response()->json(['success' => true, 'data' => $this->transform($jobPost->fresh())]);
    }

    public function updateStatus(UpdateJobPostStatusRequest $request, JobPost $jobPost): JsonResponse
    {
        $status = $request->validated('status');
        $jobPost->forceFill([
            'status' => $status,
            'published_at' => $status === JobPost::STATUS_PUBLISHED
                ? ($jobPost->published_at ?? now())
                : $jobPost->published_at,
        ])->save();

        return response()->json(['success' => true, 'data' => $this->transform($jobPost->fresh())]);
    }

    public function destroy(JobPost $jobPost): JsonResponse
    {
        $jobPost->delete();

        return response()->json(['success' => true, 'message' => 'Job deleted successfully.']);
    }

    private function payload(array $validated, ?JobPost $job = null): array
    {
        $status = $validated['status'];
        $publishedAt = $validated['published_at'] ?? $job?->published_at;

        if ($status === JobPost::STATUS_PUBLISHED && ! $publishedAt) {
            $publishedAt = now();
        }

        $mapping = JobApplicationFormMapper::forTitle($validated['title']);

        return [
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? null,
            'location' => $validated['location'],
            'category' => $validated['category'],
            'job_type' => $mapping['job_type'],
            'application_form_key' => $mapping['form_key'],
            'application_form_name' => $mapping['form_name'],
            'bullets' => $this->normalizeBullets($validated['bullets'] ?? []),
            'note' => $validated['note'] ?? null,
            'application_email' => $validated['application_email'] ?? null,
            'application_url' => $validated['application_url'] ?? null,
            'status' => $status,
            'published_at' => $publishedAt,
        ];
    }

    private function normalizeBullets(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : preg_split('/\r\n|\r|\n/', $value);
        }

        if (! is_array($value)) {
            return [];
        }

        return collect($value)
            ->map(fn ($bullet) => trim((string) $bullet))
            ->filter()
            ->values()
            ->all();
    }

    private function filteredQuery(Request $request, Builder $query): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');
        $category = $request->query('category');

        $query
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('note', 'like', "%{$search}%")
                        ->orWhere('application_email', 'like', "%{$search}%")
                        ->orWhere('application_url', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, [JobPost::STATUS_DRAFT, JobPost::STATUS_PUBLISHED, JobPost::STATUS_CLOSED, JobPost::STATUS_ARCHIVED], true), fn ($query) => $query->where('status', $status))
            ->when($category, fn (Builder $query) => $query->where('category', $category));

        return match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest('created_at'),
            'title' => $query->orderBy('title'),
            'published' => $query->latest('published_at'),
            default => $query->latest('created_at'),
        };
    }

    private function transform(JobPost $job): array
    {
        return [
            'id' => $job->id,
            'title' => $job->title,
            'slug' => $job->slug,
            'location' => $job->location,
            'category' => $job->category,
            'job_type' => $job->job_type,
            'application_form_key' => $job->application_form_key,
            'application_form_name' => $job->application_form_name,
            'image' => $job->image,
            'image_url' => $job->image ? url(Storage::disk('public')->url($job->image)) : null,
            'bullets' => $job->bullets ?? [],
            'note' => $job->note,
            'application_email' => $job->application_email,
            'application_url' => $job->application_url,
            'status' => $job->status,
            'published_at' => optional($job->published_at)->toISOString(),
            'created_at' => optional($job->created_at)->toISOString(),
            'updated_at' => optional($job->updated_at)->toISOString(),
        ];
    }
}
