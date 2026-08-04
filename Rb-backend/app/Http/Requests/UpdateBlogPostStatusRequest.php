<?php

namespace App\Http\Requests;

use App\Models\BlogPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogPostStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([BlogPost::STATUS_DRAFT, BlogPost::STATUS_PUBLISHED, BlogPost::STATUS_ARCHIVED])],
        ];
    }
}
