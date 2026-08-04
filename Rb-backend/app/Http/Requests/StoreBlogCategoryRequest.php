<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBlogCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('blog_categories', 'name')],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('blog_categories', 'slug')],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
