'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, ClipboardList, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  TimesheetAdjustmentHandlingStatus,
  TimesheetDocumentReview,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';

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

function handlingStatus(
  review: TimesheetDocumentReview,
): TimesheetAdjustmentHandlingStatus {
  return review.adjustment_status || 'open';
}

function driverLabel(review: TimesheetDocumentReview): string {
  return (
    review.driver_name ||
    review.driver?.user?.name ||
    `Driver #${review.driver_id}`
  );
}

function weekLabel(review: TimesheetDocumentReview): string {
  if (!review.timesheet?.week_start_date || !review.timesheet?.week_end_date) {
    return '—';
  }
  return `${formatApiDate(review.timesheet.week_start_date)} – ${formatApiDate(review.timesheet.week_end_date)}`;
}

export default function AdjustmentRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');

  const [filter, setFilter] = useState<string>('all_open');
  const [items, setItems] = useState<TimesheetDocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<TimesheetDocumentReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editStatus, setEditStatus] =
    useState<TimesheetAdjustmentHandlingStatus>('open');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  /** Prevents URL sync from reopening the dialog while Close is in flight. */
  const closingRef = useRef(false);
  const loadedDetailIdRef = useRef<string | null>(null);

  const clearDetailParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('id')) return;
    params.delete('id');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const applyDetail = useCallback((review: TimesheetDocumentReview) => {
    setEditing(review);
    setEditStatus(handlingStatus(review));
    setEditNotes(review.admin_notes || '');
    setDetailOpen(true);
    setDetailLoading(false);
    loadedDetailIdRef.current = String(review.id);
  }, []);

  const openDetail = useCallback(
    (review: TimesheetDocumentReview) => {
      closingRef.current = false;
      applyDetail(review);
      router.replace(`${pathname}?id=${review.id}`);
    },
    [applyDetail, pathname, router],
  );

  const closeDetail = useCallback(() => {
    closingRef.current = true;
    loadedDetailIdRef.current = null;
    setDetailOpen(false);
    setDetailLoading(false);
    setEditing(null);
    clearDetailParam();
  }, [clearDetailParam]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDocumentAdjustmentRequests({
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
    void load();
  }, [load]);

  useEffect(() => {
    if (!detailId) {
      closingRef.current = false;
      if (detailOpen) {
        setDetailOpen(false);
        setDetailLoading(false);
        setEditing(null);
        loadedDetailIdRef.current = null;
      }
      return;
    }

    // User clicked Close — ignore stale ?id= until the URL catches up.
    if (closingRef.current) {
      return;
    }

    // Already showing this request.
    if (loadedDetailIdRef.current === detailId && detailOpen) {
      return;
    }

    const fromList = items.find((item) => String(item.id) === detailId);
    if (fromList) {
      applyDetail(fromList);
      return;
    }

    // List still loading — wait; don't open a stuck loading dialog yet
    // unless this is a deep link and the list finished empty of this id.
    if (loading) {
      return;
    }

    let cancelled = false;
    setDetailOpen(true);
    setDetailLoading(true);
    void apiClient
      .getDocumentAdjustmentRequest(detailId)
      .then((review) => {
        if (cancelled || closingRef.current) return;
        applyDetail(review);
      })
      .catch((err: unknown) => {
        if (cancelled || closingRef.current) return;
        toast.error(getApiErrorMessage(err, 'Adjustment request not found'));
        closeDetail();
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailId, items, loading, detailOpen, applyDetail, closeDetail]);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.updateDocumentAdjustmentRequest(editing.id, {
        adjustment_status: editStatus,
        admin_notes: editNotes.trim() || null,
      });
      toast.success('Adjustment request updated');
      closeDetail();
      await load();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update request'));
    } finally {
      setSaving(false);
    }
  };

  const timesheetHref = editing
    ? `/admin/timesheets/${editing.timesheet_id}`
    : '#';

  return (
    <div className='space-y-6'>
      <Button variant='ghost' asChild className='text-slate-300 -ml-2'>
        <Link href='/admin/timesheets'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Timesheets
        </Link>
      </Button>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white flex items-center gap-2'>
            <ClipboardList className='h-8 w-8' />
            Adjustment requests
          </h1>
          <p className='text-slate-400 mt-1'>
            Driver-submitted correction requests from document review. Click a
            row to view details, open the timesheet to fix trips, then mark
            resolved and resend documents.
          </p>
        </div>
        <div className='space-y-1.5 w-full sm:w-56'>
          <Label className='text-slate-400 text-xs'>Filter</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className='bg-slate-800 border-slate-700 text-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-slate-800 border-slate-700 text-white'>
              <SelectItem value='all_open'>Open + In progress</SelectItem>
              <SelectItem value='open'>Open</SelectItem>
              <SelectItem value='in_progress'>In progress</SelectItem>
              <SelectItem value='resolved'>Resolved</SelectItem>
              <SelectItem value='dismissed'>Dismissed</SelectItem>
              <SelectItem value='all'>All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='pb-2'>
          <p className='text-sm text-slate-400'>
            {loading ? 'Loading…' : `${total} request${total === 1 ? '' : 's'}`}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center py-16'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : items.length === 0 ? (
            <p className='text-sm text-slate-400 py-10 text-center border border-dashed border-slate-600 rounded-md'>
              No adjustment requests in this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-transparent'>
                  <TableHead className='text-slate-400'>Driver</TableHead>
                  <TableHead className='text-slate-400'>Week</TableHead>
                  <TableHead className='text-slate-400'>Requested</TableHead>
                  <TableHead className='text-slate-400'>Comment</TableHead>
                  <TableHead className='text-slate-400'>Status</TableHead>
                  <TableHead className='text-slate-400 text-right'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((review) => {
                  const handling = handlingStatus(review);
                  return (
                    <TableRow
                      key={review.id}
                      className='border-slate-700 hover:bg-slate-700/40 cursor-pointer'
                      onClick={() => openDetail(review)}
                    >
                      <TableCell>
                        <div className='min-w-0'>
                          <p className='text-sm text-white font-medium truncate'>
                            {driverLabel(review)}
                          </p>
                          <p className='text-xs text-slate-400 truncate'>
                            {review.timesheet?.employer?.name ||
                              review.driver_email ||
                              ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='text-slate-300 text-sm whitespace-nowrap'>
                        {weekLabel(review)}
                      </TableCell>
                      <TableCell className='text-slate-400 text-xs whitespace-nowrap'>
                        {review.reviewed_at
                          ? formatApiDate(review.reviewed_at)
                          : '—'}
                      </TableCell>
                      <TableCell className='max-w-xs'>
                        <p className='text-sm text-slate-200 line-clamp-3 whitespace-pre-wrap'>
                          {review.adjustment_comment || '—'}
                        </p>
                        {review.admin_notes ? (
                          <p className='text-xs text-slate-500 mt-1 line-clamp-2'>
                            Admin: {review.admin_notes}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'font-medium',
                            HANDLING_STYLES[handling],
                          )}
                        >
                          {HANDLING_LABELS[handling]}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div
                          className='flex items-center justify-end gap-1'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            className='border-slate-600 text-slate-200 h-8'
                            onClick={() => openDetail(review)}
                          >
                            View
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant='ghost'
                            className='text-slate-300 h-8'
                            asChild
                          >
                            <Link
                              href={`/admin/timesheets/${review.timesheet_id}`}
                            >
                              <ExternalLink className='h-3.5 w-3.5' />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-white flex items-center gap-2 flex-wrap'>
              Adjustment request
              {editing ? (
                <Badge
                  className={cn(
                    'font-medium',
                    HANDLING_STYLES[handlingStatus(editing)],
                  )}
                >
                  {HANDLING_LABELS[handlingStatus(editing)]}
                </Badge>
              ) : null}
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              Review the driver&apos;s comment, open the timesheet to make
              changes, then update status when done.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && !editing ? (
            <div className='flex justify-center py-10'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : editing ? (
            <div className='space-y-4 py-1'>
              <div className='grid gap-3 sm:grid-cols-2 text-sm'>
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide'>
                    Driver
                  </p>
                  <p className='text-slate-200 font-medium'>
                    {driverLabel(editing)}
                  </p>
                  {editing.driver_email ? (
                    <p className='text-xs text-slate-400'>
                      {editing.driver_email}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide'>
                    Customer
                  </p>
                  <p className='text-slate-200'>
                    {editing.timesheet?.employer?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide'>
                    Pay week
                  </p>
                  <p className='text-slate-200'>{weekLabel(editing)}</p>
                </div>
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide'>
                    Requested
                  </p>
                  <p className='text-slate-200'>
                    {editing.reviewed_at
                      ? formatApiDate(editing.reviewed_at)
                      : '—'}
                  </p>
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-slate-300'>Driver comment</Label>
                <div className='rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 whitespace-pre-wrap min-h-[4rem]'>
                  {editing.adjustment_comment || '—'}
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-slate-300'>Handling status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) =>
                    setEditStatus(v as TimesheetAdjustmentHandlingStatus)
                  }
                >
                  <SelectTrigger className='bg-slate-700 border-slate-600 text-white'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='bg-slate-800 border-slate-700 text-white'>
                    <SelectItem value='open'>Open</SelectItem>
                    <SelectItem value='in_progress'>In progress</SelectItem>
                    <SelectItem value='resolved'>Resolved</SelectItem>
                    <SelectItem value='dismissed'>Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className='text-slate-300'>Admin notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder='What was changed / why dismissed…'
                  className='bg-slate-700 border-slate-600 text-white'
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className='gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-between'>
            <Button
              type='button'
              variant='outline'
              className='border-slate-600 text-slate-200 w-full sm:w-auto'
              disabled={!editing}
              asChild={!!editing}
            >
              {editing ? (
                <Link href={timesheetHref}>
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Open timesheet
                </Link>
              ) : (
                <span>Open timesheet</span>
              )}
            </Button>
            <div className='flex gap-2 w-full sm:w-auto'>
              <Button
                type='button'
                variant='outline'
                className='border-slate-600 text-slate-300 flex-1 sm:flex-none'
                disabled={saving}
                onClick={closeDetail}
              >
                Close
              </Button>
              <Button
                type='button'
                className='bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none'
                disabled={saving || !editing}
                onClick={() => void saveEdit()}
              >
                {saving ? <Spinner className='h-4 w-4' /> : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
