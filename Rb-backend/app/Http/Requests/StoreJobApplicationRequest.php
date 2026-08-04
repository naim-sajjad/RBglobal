<?php

namespace App\Http\Requests;

use App\Support\JobApplicationFormMapper;
use Illuminate\Foundation\Http\FormRequest;

class StoreJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id' => ['nullable', 'integer', 'exists:job_posts,id'],
            'job_slug' => ['nullable', 'string', 'max:255'],
            'job_title' => ['required', 'string', \Illuminate\Validation\Rule::in(array_keys(JobApplicationFormMapper::JOBS))],
            'first_name' => ['required', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'city' => ['required', 'string', 'max:150'],
            'availability' => ['required', 'string', 'max:150'],
            'immigration_status' => ['required', 'string', 'max:150'],
            'license_age' => ['nullable', 'required_if:license_type,AZ,FL', 'string', 'max:150'],
            'license_type' => ['nullable', \Illuminate\Validation\Rule::in(['AZ', 'FL'])],
            'experience' => ['required', 'string', 'max:255'],
            'referred_by' => ['nullable', 'string', 'max:255'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $jobTitle = (string) $this->input('job_title');
        $licenseType = str_starts_with($jobTitle, 'AZ Driver')
            ? 'AZ'
            : ($jobTitle === 'Deep Reach Operator | Mississauga, ON' ? 'FL' : null);

        $this->merge(['license_type' => $licenseType]);
    }
}
