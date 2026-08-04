<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlogCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class, 'category_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn (Builder $query) => $query->where('name', 'like', "%{$search}%"));
    }
}
