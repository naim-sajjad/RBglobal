'use client';

import { Badge } from '@/components/ui/badge';
import { TimesheetStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
  Circle,
  PencilLine,
} from 'lucide-react';

export function formatTimesheetStatusLabel(status: TimesheetStatus) {
  return status.replace('_', ' ');
}

type TimesheetStatusBadgeProps = {
  status: TimesheetStatus;
  adjusted?: boolean;
  driverReviewStatus?: string | null;
  driverReviewLabel?: string | null;
  className?: string;
};

/**
 * Primary timesheet workflow status + optional Adjusted / document-review hints.
 * Shared by admin and driver timesheet lists.
 */
export function TimesheetStatusBadge({
  status,
  adjusted,
  driverReviewStatus,
  driverReviewLabel,
  className,
}: TimesheetStatusBadgeProps) {
  const styles: Record<TimesheetStatus, string> = {
    draft: 'bg-slate-600 text-slate-100',
    submitted: 'bg-blue-600 text-white',
    under_review: 'bg-amber-600 text-white',
    approved: 'bg-green-600 text-white',
    rejected: 'bg-red-600 text-white',
    paid: 'bg-emerald-700 text-white',
  };

  const icon =
    status === 'approved' ? (
      <Check className='h-3 w-3' aria-hidden />
    ) : status === 'rejected' ? (
      <AlertTriangle className='h-3 w-3' aria-hidden />
    ) : (
      <Circle className='h-2.5 w-2.5 fill-current' aria-hidden />
    );

  const reviewHint =
    driverReviewStatus === 'approved'
      ? {
          text: driverReviewLabel || 'Confirmed',
          className: 'text-emerald-300',
        }
      : driverReviewStatus === 'adjustment_requested'
        ? {
            text: driverReviewLabel || 'Adjustment Requested',
            className: 'text-amber-300',
          }
        : driverReviewStatus === 'pending'
          ? {
              text: driverReviewLabel || 'Pending Review',
              className: 'text-sky-300',
            }
          : null;

  return (
    <div className={cn('flex flex-col items-start gap-0.5', className)}>
      <Badge className={cn('gap-1 font-medium capitalize', styles[status])}>
        {icon}
        <span>{formatTimesheetStatusLabel(status)}</span>
      </Badge>
      {adjusted ? (
        <span className='inline-flex items-center gap-1 text-xs text-violet-300'>
          <PencilLine className='h-3 w-3' aria-hidden />
          Adjusted
        </span>
      ) : null}
      {reviewHint ? (
        <span
          className={cn('text-xs', reviewHint.className)}
          title='Invoice / calculation sheet review'
        >
          {reviewHint.text}
        </span>
      ) : null}
    </div>
  );
}
