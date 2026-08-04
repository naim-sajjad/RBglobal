<?php

namespace App\Http\Requests;

use App\Models\JobPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobPostStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([JobPost::STATUS_DRAFT, JobPost::STATUS_PUBLISHED, JobPost::STATUS_CLOSED, JobPost::STATUS_ARCHIVED])],
        ];
    }
}
