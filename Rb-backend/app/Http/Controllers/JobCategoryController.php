<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class JobCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => DB::table('job_categories')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('job_categories', 'name')]]);
        $id = DB::table('job_categories')->insertGetId(['name' => trim($data['name']), 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true, 'data' => DB::table('job_categories')->find($id)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = DB::table('job_categories')->find($id);
        abort_unless($category, 404);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('job_categories', 'name')->ignore($id)]]);
        DB::transaction(function () use ($category, $data, $id): void {
            DB::table('job_categories')->where('id', $id)->update(['name' => trim($data['name']), 'updated_at' => now()]);
            DB::table('job_posts')->where('category', $category->name)->update(['category' => trim($data['name']), 'updated_at' => now()]);
        });
        return response()->json(['success' => true, 'data' => DB::table('job_categories')->find($id)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = DB::table('job_categories')->find($id);
        abort_unless($category, 404);
        if (DB::table('job_posts')->where('category', $category->name)->exists()) {
            return response()->json(['message' => 'This category is assigned to jobs. Move those jobs to another category before deleting it.'], 422);
        }
        DB::table('job_categories')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
