<?php

namespace App\Http\Requests;

use App\Models\BlogPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBlogPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('blog_posts', 'slug')],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'category_id' => ['nullable', 'integer', 'exists:blog_categories,id'],
            'status' => ['required', Rule::in([BlogPost::STATUS_DRAFT, BlogPost::STATUS_PUBLISHED, BlogPost::STATUS_ARCHIVED])],
            'published_at' => ['nullable', 'date'],
            'reading_time' => ['nullable', 'integer', 'min:1', 'max:999'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'cta_title' => ['nullable', 'string', 'max:255'],
            'cta_description' => ['nullable', 'string', 'max:1000'],
            'cta_button_label' => ['nullable', 'string', 'max:255'],
            'cta_button_url' => ['nullable', 'string', 'max:255'],
            'content_format' => ['nullable', Rule::in(['markdown'])],
        ];
    }
}
