<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasFactory;

    public const KEY_PAY_STUB = 'pay_stub';

    public const KEY_TIMESHEET_DOCUMENT_REVIEW = 'timesheet_document_review';

    protected $fillable = [
        'tenant_id',
        'key',
        'name',
        'subject',
        'body_html',
        'body_text',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
