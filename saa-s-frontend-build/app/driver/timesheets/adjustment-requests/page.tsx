'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  TimesheetAdjustmentHandlingStatus,
  TimesheetDocumentReview,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const HANDLING_LABELS: Record<TimesheetAdjustmentHandlingStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const HANDLING_STYLES: Record<TimesheetAdjustmentHandlingStatus, string> = {
  open: 'bg-amber-600 text-white',
  in_progress: 'bg-sky-600 text-white',
  resolved: 'bg-emerald-600 text-white',
  dismissed: 'bg-slate-600 text-slate-100',
};

function weekLabel(review: TimesheetDocumentReview): string {
  if (!review.timesheet?.week_start_date || !review.timesheet?.week_end_date) {
    return '—';
  }
  return `${formatApiDate(review.timesheet.week_start_date)} – ${formatApiDate(review.timesheet.week_end_date)}`;
}

function statusBadge(review: TimesheetDocumentReview) {
  if (review.status === 'pending') {
    return (
      <Badge className='bg-sky-600 text-white font-medium'>Ready to request</Badge>
    );
  }
  const handling = (review.adjustment_status ||
    'open') as TimesheetAdjustmentHandlingStatus;
  return (
    <Badge className={cn('font-medium', HANDLING_STYLES[handling])}>
      {HANDLING_LABELS[handling]}
    </Badge>
  );
}

export default function DriverAdjustmentRequestsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<TimesheetDocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<TimesheetDocumentReview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getMyDocumentAdjustmentRequests({
        adjustment_status: filter,
        per_page: 100,
      });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to load adjustment requests'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void load();
  }, [authLoading, isAuthenticated, load]);

  if (authLoading) {
    return (
      <div className='flex justify-center py-16'>
        <Spinner className='h-8 w-8 text-white' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <ClipboardList className='h-6 w-6' />
            Adjustment requests
          </h1>
          <p className='text-slate-400 mt-0.5 text-sm'>
            Track requests you sent and whether admin has opened, resolved, or
            dismissed them.
          </p>
        </div>
        <div className='space-y-1.5 w-full sm:w-56'>
          <Label className='text-slate-400 text-xs'>Filter</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className='bg-slate-800 border-slate-700 text-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-slate-800 border-slate-700 text-white'>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='pending'>Ready to request</SelectItem>
              <SelectItem value='all_open'>Open + In progress</SelectItem>
              <SelectItem value='open'>Open</SelectItem>
              <SelectItem value='in_progress'>In progress</SelectItem>
              <SelectItem value='resolved'>Resolved</SelectItem>
              <SelectItem value='dismissed'>Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='pb-3 pt-4'>
          <p className='text-sm text-slate-400'>
            {loading
              ? 'Loading…'
              : `${total} request${total === 1 ? '' : 's'}`}
          </p>
        </CardHeader>
        <CardContent className='pt-0'>
          {loading ? (
            <div className='flex justify-center py-10'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : items.length === 0 ? (
            <p className='text-sm text-slate-400 py-10 text-center border border-dashed border-slate-600 rounded-md'>
              No adjustment requests in this filter. After admin sends your
              invoice and calculation sheet, you can request a correction from
              the timesheet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-slate-800'>
                  <TableHead className='text-slate-300'>Week</TableHead>
                  <TableHead className='text-slate-300'>Customer</TableHead>
                  <TableHead className='text-slate-300'>Requested</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='w-28' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((review) => (
                  <TableRow
                    key={review.id}
                    className='border-slate-700 hover:bg-slate-700/60 cursor-pointer'
                    onClick={() => setDetail(review)}
                  >
                    <TableCell className='text-slate-300 whitespace-nowrap'>
                      {weekLabel(review)}
                    </TableCell>
                    <TableCell className='text-white text-sm'>
                      {review.timesheet?.employer?.name || '—'}
                    </TableCell>
                    <TableCell className='text-slate-400 text-sm whitespace-nowrap'>
                      {review.reviewed_at
                        ? formatApiDate(review.reviewed_at)
                        : review.status === 'pending'
                          ? 'Not sent yet'
                          : '—'}
                    </TableCell>
                    <TableCell>{statusBadge(review)}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='h-8 border-slate-600 text-slate-200'
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail(review);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className='bg-slate-800 border-slate-700 text-white'>
          <DialogHeader>
            <DialogTitle>Adjustment request</DialogTitle>
            <DialogDescription className='text-slate-400'>
              {detail ? weekLabel(detail) : ''}
              {detail?.timesheet?.employer?.name
                ? ` · ${detail.timesheet.employer.name}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-slate-400'>Status</span>
                {statusBadge(detail)}
              </div>
              {detail.status === 'pending' ? (
                <p className='text-sm text-slate-300'>
                  Admin sent documents for review. Open the timesheet to send an
                  adjustment request.
                </p>
              ) : (
                <>
                  {detail.adjustment_comment ? (
                    <div>
                      <p className='text-xs uppercase tracking-wide text-slate-500 mb-1'>
                        Your request
                      </p>
                      <p className='text-sm text-slate-200 whitespace-pre-wrap'>
                        {detail.adjustment_comment}
                      </p>
                    </div>
                  ) : null}
                  {detail.admin_notes ? (
                    <div>
                      <p className='text-xs uppercase tracking-wide text-slate-500 mb-1'>
                        Admin notes
                      </p>
                      <p className='text-sm text-slate-200 whitespace-pre-wrap'>
                        {detail.admin_notes}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          <DialogFooter className='gap-2 sm:justify-between'>
            {detail ? (
              <Button
                asChild
                className='bg-emerald-600 hover:bg-emerald-500 text-white'
              >
                <Link href={`/driver/timesheets/${detail.timesheet_id}`}>
                  Open timesheet
                </Link>
              </Button>
            ) : null}
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-200'
              onClick={() => setDetail(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
