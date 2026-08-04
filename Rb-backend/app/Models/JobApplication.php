<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobApplication extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'job_title',
        'job_id',
        'job_slug',
        'job_type',
        'application_form_key',
        'application_form_name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'city',
        'availability',
        'immigration_status',
        'license_type',
        'az_license_age',
        'experience',
        'referred_by',
        'resume_path',
        'resume_original_name',
        'message',
        'status',
        'source',
        'ip_address',
        'user_agent',
        'deleted_by',
        'restored_by',
    ];
}
