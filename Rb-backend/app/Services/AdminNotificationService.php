<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\Timesheet;
use App\Models\TimesheetDocumentReview;
use App\Models\User;

class AdminNotificationService
{
    /**
     * Notify tenant staff when a driver submits a document adjustment request.
     */
    public static function notifyAdjustmentRequested(TimesheetDocumentReview $review): void
    {
        $review->loadMissing(['timesheet.employer', 'driver.user']);
        $timesheet = $review->timesheet;
        $tenantId = $review->tenant_id ?? $timesheet?->tenant_id;
        if (! $tenantId) {
            return;
        }

        $driverName = trim((string) ($review->driver_name ?: $review->driver?->user?->name ?: 'Driver'));
        $period = self::periodLabel($timesheet);
        $employer = $timesheet?->employer?->name;
        $commentPreview = trim((string) ($review->adjustment_comment ?? ''));
        if (strlen($commentPreview) > 200) {
            $commentPreview = substr($commentPreview, 0, 197).'...';
        }

        $title = 'Driver adjustment request';
        $message = "{$driverName} requested an adjustment";
        if ($period !== '') {
            $message .= " for {$period}";
        }
        if ($employer) {
            $message .= " ({$employer})";
        }
        $message .= '.';
        if ($commentPreview !== '') {
            $message .= " \"{$commentPreview}\"";
        }

        $meta = [
            'timesheet_id' => $review->timesheet_id,
            'review_id' => $review->id,
            'driver_id' => $review->driver_id,
            'driver_name' => $driverName,
            'adjustment_comment' => $review->adjustment_comment,
            'href' => '/admin/timesheets/adjustment-requests?id='.$review->id,
        ];

        foreach (self::staffRecipients($tenantId) as $user) {
            AdminNotification::create([
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
                'type' => AdminNotification::TYPE_ADJUSTMENT_REQUESTED,
                'title' => $title,
                'message' => $message,
                'meta' => $meta,
            ]);
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    public static function staffRecipients(string $tenantId)
    {
        return User::query()
            ->where(function ($q) use ($tenantId) {
                $q->whereHas('tenants', fn ($t) => $t->where('tenants.id', $tenantId))
                    ->orWhere('is_global_admin', true);
            })
            ->get()
            ->filter(function (User $user) {
                if ($user->driver()->exists()) {
                    return false;
                }

                return $user->hasPermissionTo('drivers.view');
            })
            ->unique('id')
            ->values();
    }

    private static function periodLabel(?Timesheet $timesheet): string
    {
        if (! $timesheet) {
            return '';
        }
        $start = $timesheet->week_start_date?->format('M j, Y') ?? '';
        $end = $timesheet->week_end_date?->format('M j, Y') ?? '';

        return trim("{$start} – {$end}", ' –');
    }
}
