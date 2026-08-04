<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CareerGrowthRegistration extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'current_status',
        'course',
        'form_key',
        'form_name',
        'status',
        'ip_address',
        'user_agent',
        'deleted_by',
        'restored_by',
    ];
}
