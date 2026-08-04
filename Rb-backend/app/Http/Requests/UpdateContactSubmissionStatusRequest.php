<?php

namespace App\Http\Requests;

use App\Models\ContactSubmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactSubmissionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    ContactSubmission::STATUS_UNREAD,
                    ContactSubmission::STATUS_READ,
                    ContactSubmission::STATUS_ARCHIVED,
                ]),
            ],
        ];
    }
}
