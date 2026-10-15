'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ClipboardList } from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  TimesheetAdjustmentHandlingStatus,
  TimesheetDocumentReview,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, getApiErrorMessage } from '@/lib/utils';

const HANDLING_STYLES: Record<TimesheetAdjustmentHandlingStatus, string> = {
  open: 'bg-amber-600 text-white',
  in_progress: 'bg-sky-600 text-white',
  resolved: 'bg-emerald-600 text-white',
  dismissed: 'bg-slate-600 text-slate-100',
};

const HANDLING_LABELS: Record<TimesheetAdjustmentHandlingStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

function handlingOf(
  review: TimesheetDocumentReview,
): TimesheetAdjustmentHandlingStatus {
  return review.adjustment_status || 'open';
}

type Props = {
  timesheetId: string | number;
  review: TimesheetDocumentReview | null | undefined;
  onUpdated: () => Promise<void> | void;
};

export function DriverTimesheetAdjustmentCard({
  timesheetId,
  review,
  onUpdated,
}: Props) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requested = review?.status === 'adjustment_requested';
  const handling = requested ? handlingOf(review) : null;
  const openRequest =
    requested &&
    (handling === 'open' || handling === 'in_progress');
  const canRequest = !openRequest;

  const handleSubmit = async () => {
    if (comment.trim().length < 3) {
      toast.error('Describe what needs to be corrected (at least 3 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.requestTimesheetAdjustment(
        timesheetId,
        comment.trim(),
      );
      toast.success(res.message);
      setComment('');
      await onUpdated();
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err, 'Could not submit adjustment request'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card id='driver-adjustment' className='bg-slate-800 border-slate-700 scroll-mt-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-white text-base'>
          <ClipboardList className='h-5 w-5' />
          Adjustment request
        </CardTitle>
        <CardDescription className='text-slate-400'>
          Describe what needs to be corrected on this timesheet. Admin will see
          it in Adjustment requests.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {requested && handling ? (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm text-slate-400'>Status</span>
              <Badge className={cn('font-medium', HANDLING_STYLES[handling])}>
                {HANDLING_LABELS[handling]}
              </Badge>
              {review.status_label ? (
                <span className='text-xs text-slate-400'>
                  {review.status_label}
                </span>
              ) : null}
            </div>
            {review.adjustment_comment ? (
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500 mb-1'>
                  Your request
                </p>
                <p className='text-sm text-slate-200 whitespace-pre-wrap'>
                  {review.adjustment_comment}
                </p>
              </div>
            ) : null}
            {review.admin_notes ? (
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500 mb-1'>
                  Admin notes
                </p>
                <p className='text-sm text-slate-200 whitespace-pre-wrap'>
                  {review.admin_notes}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {canRequest ? (
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='adjustment-comment' className='text-slate-300'>
                What needs to be corrected?
              </Label>
              <Textarea
                id='adjustment-comment'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='Example: trip on Tuesday used the wrong mileage…'
                className='min-h-[100px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
              />
            </div>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className='bg-amber-600 hover:bg-amber-500 text-white'
            >
              {submitting ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : null}
              Send adjustment request
            </Button>
          </div>
        ) : (
          <p className='text-sm text-slate-400'>
            This request is with admin. You can send another after it is
            resolved or dismissed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
