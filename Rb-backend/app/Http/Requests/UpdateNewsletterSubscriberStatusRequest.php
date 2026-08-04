<?php

namespace App\Http\Requests;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNewsletterSubscriberStatusRequest extends FormRequest
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
                    NewsletterSubscriber::STATUS_ACTIVE,
                    NewsletterSubscriber::STATUS_UNSUBSCRIBED,
                    NewsletterSubscriber::STATUS_BLOCKED,
                ]),
            ],
        ];
    }
}
