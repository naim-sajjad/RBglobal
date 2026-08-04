<?php

namespace App\Http\Requests;

use App\Models\JobPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('job_posts', 'slug')->ignore($this->route('jobPost'))],
            'location' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
            'bullets' => ['nullable'],
            'bullets.*' => ['string', 'max:500'],
            'note' => ['nullable', 'string', 'max:1000'],
            'application_email' => ['nullable', 'email', 'max:255'],
            'application_url' => ['nullable', 'url', 'max:255'],
            'status' => ['required', Rule::in([JobPost::STATUS_DRAFT, JobPost::STATUS_PUBLISHED, JobPost::STATUS_CLOSED, JobPost::STATUS_ARCHIVED])],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
