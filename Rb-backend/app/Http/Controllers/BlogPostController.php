<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBlogPostRequest;
use App\Http\Requests\UpdateBlogPostRequest;
use App\Http\Requests\UpdateBlogPostStatusRequest;
use App\Models\BlogPost;
use App\Support\UniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BlogPostController extends Controller
{
    public function publicIndex(Request $request): JsonResponse
    {
        $posts = $this->filteredQuery($request, BlogPost::query()->published())
            ->with('category')
            ->paginate(min(max((int) $request->integer('per_page', 9), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($posts->items())->map(fn (BlogPost $post) => $this->transform($post, false))->values(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function publicShow(string $slug): JsonResponse
    {
        $post = BlogPost::query()
            ->published()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        $related = BlogPost::query()
            ->published()
            ->with('category')
            ->whereKeyNot($post->id)
            ->when($post->category_id, fn ($query) => $query->where('category_id', $post->category_id))
            ->latest('published_at')
            ->limit(3)
            ->get()
            ->map(fn (BlogPost $relatedPost) => $this->transform($relatedPost, false))
            ->values();

        return response()->json([
            'success' => true,
            'data' => array_merge($this->transform($post, true), ['related_posts' => $related]),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $posts = $this->filteredQuery($request, BlogPost::query())
            ->with('category')
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => collect($posts->items())->map(fn (BlogPost $post) => $this->transform($post, true))->values(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function store(StoreBlogPostRequest $request): JsonResponse
    {
        $data = $this->payload($request->validated());
        $data['slug'] = $data['slug'] ?: UniqueSlug::make(BlogPost::class, $data['title']);
        $data['created_by'] = $request->user()?->id;

        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('blog', 'public');
        }

        $post = BlogPost::create($data);

        return response()->json(['success' => true, 'data' => $this->transform($post->load('category'), true)], 201);
    }

    public function show(BlogPost $blogPost): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->transform($blogPost->load('category'), true)]);
    }

    public function update(UpdateBlogPostRequest $request, BlogPost $blogPost): JsonResponse
    {
        $data = $this->payload($request->validated(), $blogPost);
        $data['slug'] = $data['slug'] ?: UniqueSlug::make(BlogPost::class, $data['title'], $blogPost->id);

        if ($request->boolean('remove_featured_image') && $blogPost->featured_image) {
            Storage::disk('public')->delete($blogPost->featured_image);
            $data['featured_image'] = null;
        }

        if ($request->hasFile('featured_image')) {
            if ($blogPost->featured_image) {
                Storage::disk('public')->delete($blogPost->featured_image);
            }
            $data['featured_image'] = $request->file('featured_image')->store('blog', 'public');
        }

        $blogPost->update($data);

        return response()->json(['success' => true, 'data' => $this->transform($blogPost->fresh('category'), true)]);
    }

    public function updateStatus(UpdateBlogPostStatusRequest $request, BlogPost $blogPost): JsonResponse
    {
        $status = $request->validated('status');
        $blogPost->forceFill([
            'status' => $status,
            'published_at' => $status === BlogPost::STATUS_PUBLISHED
                ? ($blogPost->published_at ?? now())
                : $blogPost->published_at,
        ])->save();

        return response()->json(['success' => true, 'data' => $this->transform($blogPost->fresh('category'), true)]);
    }

    public function destroy(BlogPost $blogPost): JsonResponse
    {
        $blogPost->delete();

        return response()->json(['success' => true, 'message' => 'Blog post deleted successfully.']);
    }

    private function payload(array $validated, ?BlogPost $post = null): array
    {
        $status = $validated['status'];
        $publishedAt = $validated['published_at'] ?? $post?->published_at;
        $content = $this->cleanMarkdownContent($validated['content']);
        $readingTime = $validated['reading_time'] ?? null;

        if ($status === BlogPost::STATUS_PUBLISHED && ! $publishedAt) {
            $publishedAt = now();
        }

        return [
            'category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? null,
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $content,
            'status' => $status,
            'published_at' => $publishedAt,
            'reading_time' => $readingTime ?: $this->calculateReadingTime($content),
            'seo_title' => $validated['seo_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'cta_title' => $validated['cta_title'] ?? null,
            'cta_description' => $validated['cta_description'] ?? null,
            'cta_button_label' => $validated['cta_button_label'] ?? null,
            'cta_button_url' => $validated['cta_button_url'] ?? null,
            'content_format' => $validated['content_format'] ?? 'markdown',
        ];
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
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, [BlogPost::STATUS_DRAFT, BlogPost::STATUS_PUBLISHED, BlogPost::STATUS_ARCHIVED], true), fn ($query) => $query->where('status', $status))
            ->when($category, function (Builder $query) use ($category): void {
                $query->whereHas('category', fn (Builder $query) => $query->where('slug', $category)->orWhereKey($category));
            });

        return match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest('created_at'),
            'title' => $query->orderBy('title'),
            'published' => $query->latest('published_at'),
            default => $query->latestPosts(),
        };
    }

    private function transform(BlogPost $post, bool $includeContent): array
    {
        $data = [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image,
            'featured_image_url' => $post->featured_image ? url(Storage::disk('public')->url($post->featured_image)) : null,
            'status' => $post->status,
            'published_at' => optional($post->published_at)->toISOString(),
            'reading_time' => $post->reading_time ?: $this->calculateReadingTime($post->content),
            'seo_title' => $post->seo_title,
            'meta_description' => $post->meta_description,
            'cta_title' => $post->cta_title,
            'cta_description' => $post->cta_description,
            'cta_button_label' => $post->cta_button_label,
            'cta_button_url' => $post->cta_button_url,
            'content_format' => $post->content_format ?: 'markdown',
            'read_time' => ($post->reading_time ?: $this->calculateReadingTime($post->content)).' min read',
            'category_id' => $post->category_id,
            'category' => $post->category,
            'created_at' => optional($post->created_at)->toISOString(),
            'updated_at' => optional($post->updated_at)->toISOString(),
        ];

        if ($includeContent) {
            $data['content'] = $post->content;
        }

        return $data;
    }

    private function cleanMarkdownContent(string $content): string
    {
        $content = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $content) ?? $content;
        $content = preg_replace('/\son\w+\s*=\s*("|\').*?\1/is', '', $content) ?? $content;

        return trim($content);
    }

    private function calculateReadingTime(string $content): int
    {
        $plainText = strip_tags($content);
        $plainText = preg_replace('/[#>*_\[\]\(\)`-]+/', ' ', $plainText) ?? $plainText;

        return max(1, (int) ceil(str_word_count($plainText) / 200));
    }
}
