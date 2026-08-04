<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCareerGrowthRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:150'],
            'last_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'current_status' => ['required', Rule::in([
                'Job Seeker',
                'Employed',
                'Student',
                'Career Change',
                'Other',
            ])],
            'course' => ['required', Rule::in([
                'Complete Career Growth Course',
                'Resume Building',
                'Interview Preparation',
                'Workplace Success & Career Transitions',
            ])],
        ];
    }
}
