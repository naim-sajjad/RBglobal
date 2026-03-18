<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'name',
        'effective_from',
        'effective_to',
        'status',
        'rates',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
        'rates' => 'array',
    ];

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public static function updateStatus(RateCard $card): void
    {
        $today = now()->startOfDay();
        if ($card->effective_to < $today) {
            $card->update(['status' => 'expired']);
        } elseif ($card->effective_from <= $today && $card->effective_to >= $today) {
            $card->update(['status' => 'active']);
        } else {
            $card->update(['status' => 'scheduled']);
        }
    }
}
