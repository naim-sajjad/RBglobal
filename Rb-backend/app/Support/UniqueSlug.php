<?php

namespace App\Support;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class UniqueSlug
{
    public static function make(string $model, string $title, int|string|null $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'post';
        $base = substr($base, 0, 240);
        $slug = $base;
        $suffix = 2;
        do {
            $query = $model::query();
            if (in_array(SoftDeletes::class, class_uses_recursive($model), true)) {
                $query->withTrashed();
            }
            $exists = $query->where('slug', $slug)
                ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))->exists();
            if (! $exists) {
                return $slug;
            }
            $slug = $base.'-'.$suffix++;
        } while (true);
    }
}
