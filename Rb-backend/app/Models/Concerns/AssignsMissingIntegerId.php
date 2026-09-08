<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

trait AssignsMissingIntegerId
{
    protected static function bootAssignsMissingIntegerId(): void
    {
        static::creating(function (Model $model): void {
            if ($model->getKey() !== null) {
                return;
            }

            $next = (int) DB::table($model->getTable())->max($model->getKeyName()) + 1;
            $model->setAttribute($model->getKeyName(), max($next, 1));
        });
    }
}
