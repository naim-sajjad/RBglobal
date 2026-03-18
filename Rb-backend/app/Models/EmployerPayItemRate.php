<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerPayItemRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'pay_item_template_id',
        'rate',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
    ];

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function payItemTemplate(): BelongsTo
    {
        return $this->belongsTo(PayItemTemplate::class);
    }
}
