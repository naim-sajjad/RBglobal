<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBlogCategoryRequest;
use App\Http\Requests\UpdateBlogCategoryRequest;
use App\Models\BlogCategory;
use App\Support\UniqueSlug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogCategoryController extends Controller
{
    public function publicIndex(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => BlogCategory::query()->orderBy('name')->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $categories = BlogCategory::query()
            ->withCount('posts')
            ->search(trim((string) $request->query('search', '')) ?: null)
            ->orderBy('name')
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => $categories->items(),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ]);
    }

    public function store(StoreBlogCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = ($validated['slug'] ?? null) ?: UniqueSlug::make(BlogCategory::class, $validated['name']);

        $category = BlogCategory::create($validated);

        return response()->json(['success' => true, 'data' => $category], 201);
    }

    public function show(BlogCategory $blogCategory): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $blogCategory->loadCount('posts')]);
    }

    public function update(UpdateBlogCategoryRequest $request, BlogCategory $blogCategory): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = ($validated['slug'] ?? null) ?: UniqueSlug::make(BlogCategory::class, $validated['name'], $blogCategory->id);
        $blogCategory->update($validated);

        return response()->json(['success' => true, 'data' => $blogCategory->fresh()]);
    }

    public function destroy(BlogCategory $blogCategory): JsonResponse
    {
        if ($blogCategory->posts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This category is assigned to blog posts and cannot be deleted.',
            ], 422);
        }

        $blogCategory->delete();

        return response()->json(['success' => true, 'message' => 'Blog category deleted successfully.']);
    }
}
