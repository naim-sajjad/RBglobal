<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $category = $this->route('blogCategory');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('blog_categories', 'name')->ignore($category)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('blog_categories', 'slug')->ignore($category)],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
