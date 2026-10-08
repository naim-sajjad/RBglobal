<?php

namespace App\Support;

use Carbon\Carbon;

class FormSubmissionTimestamps
{
    public static function serialize(object $row): object
    {
        $result = clone $row;
        // Query-builder results bypass Eloquent's timezone-aware date serialization.
        foreach (['submitted_at', 'deleted_at'] as $field) {
            if (isset($result->{$field}) && $result->{$field} !== '') {
                $result->{$field} = Carbon::parse($result->{$field}, config('app.timezone', 'UTC'))->toISOString();
            }
        }
        return $result;
    }
}
