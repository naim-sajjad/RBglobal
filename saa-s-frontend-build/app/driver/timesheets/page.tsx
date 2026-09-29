'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  AlertCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverWithDetails, Timesheet } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { TimesheetStatusBadge } from '@/components/timesheet-status-badge';

function formatCompactWeek(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `${s.toLocaleDateString('en-CA', opts)} – ${e.toLocaleDateString('en-CA', opts)}`;
}

function extractTimesheets(response: unknown): Timesheet[] {
  if (Array.isArray(response)) return response as Timesheet[];
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data: unknown }).data;
    if (Array.isArray(data)) return data as Timesheet[];
  }
  return [];
}

export default function DriverTimesheetsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimesheets = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let driverId: number | undefined;
      try {
        const profile =
          (await apiClient.getMyDriverProfile()) as DriverWithDetails;
        if (profile?.id) driverId = Number(profile.id);
      } catch {
        // Backend also scopes by the authenticated driver.
      }

      const response = await apiClient.getTimesheets({
        ...(driverId ? { driver_id: driverId } : {}),
        per_page: 100,
      });
      setTimesheets(extractTimesheets(response));
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to load timesheets');
      setError(msg);
      toast.error(msg);
      setTimesheets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchTimesheets();
  }, [authLoading, isAuthenticated, fetchTimesheets]);

  const counts = useMemo(() => {
    const draft = timesheets.filter((t) => t.status === 'draft').length;
    const submitted = timesheets.filter((t) => t.status === 'submitted').length;
    const approved = timesheets.filter((t) => t.status === 'approved').length;
    return { total: timesheets.length, draft, submitted, approved };
  }, [timesheets]);

  if (authLoading) {
    return (
      <div className='flex justify-center py-16'>
        <Spinner className='h-8 w-8 text-white' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <Calendar className='h-6 w-6' />
            My Timesheets
          </h1>
          <p className='text-slate-400 mt-0.5 text-sm'>
            Create, review, and submit your weekly timesheets
          </p>
          <dl className='mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400'>
            <div className='flex items-baseline gap-1.5'>
              <dd className='font-semibold text-white tabular-nums'>
                {counts.total}
              </dd>
              <span>Total</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dd className='font-semibold text-slate-200 tabular-nums'>
                {counts.draft}
              </dd>
              <span>Draft</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dd className='font-semibold text-blue-300 tabular-nums'>
                {counts.submitted}
              </dd>
              <span>Submitted</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dd className='font-semibold text-green-300 tabular-nums'>
                {counts.approved}
              </dd>
              <span>Approved</span>
            </div>
          </dl>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <Button asChild className='bg-emerald-600 hover:bg-emerald-500 text-white'>
            <Link href='/driver/timesheets/new'>
              <Plus className='h-4 w-4 mr-2' />
              New timesheet
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='pb-3 pt-4'>
          <p className='text-sm text-slate-400'>
            {isLoading
              ? 'Loading…'
              : `${timesheets.length} timesheet${timesheets.length === 1 ? '' : 's'}`}
          </p>
        </CardHeader>
        <CardContent className='pt-0'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-10'>
              <Spinner className='h-8 w-8 text-white' />
              <p className='text-slate-400 text-sm'>Loading timesheets…</p>
            </div>
          ) : timesheets.length === 0 ? (
            <div className='py-10 text-center space-y-3'>
              <Calendar className='h-10 w-10 mx-auto text-slate-500 opacity-60' />
              <p className='text-white font-medium'>No timesheets yet</p>
              <p className='text-slate-400 text-sm'>
                Create a timesheet to start logging trips for the week.
              </p>
              <Button
                asChild
                className='bg-emerald-600 hover:bg-emerald-500 text-white'
              >
                <Link href='/driver/timesheets/new'>
                  <Plus className='h-4 w-4 mr-2' />
                  Create timesheet
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-slate-800'>
                  <TableHead className='text-slate-300'>Week</TableHead>
                  <TableHead className='text-slate-300'>Customer</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300 text-right'>
                    Weekly total
                  </TableHead>
                  <TableHead className='w-12' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((ts) => {
                  const employer =
                    ts.employer?.name ||
                    ts.trips?.[0]?.employer?.name ||
                    '—';
                  return (
                    <TableRow
                      key={ts.id}
                      tabIndex={0}
                      role='link'
                      aria-label={`Open timesheet ${formatCompactWeek(ts.week_start_date, ts.week_end_date)}`}
                      className='border-slate-700 hover:bg-slate-700/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-inset'
                      onClick={() =>
                        router.push(`/driver/timesheets/${ts.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/driver/timesheets/${ts.id}`);
                        }
                      }}
                    >
                      <TableCell className='text-slate-300 whitespace-nowrap'>
                        {formatCompactWeek(
                          ts.week_start_date,
                          ts.week_end_date,
                        )}
                      </TableCell>
                      <TableCell className='text-white text-sm'>
                        {employer}
                      </TableCell>
                      <TableCell>
                        <TimesheetStatusBadge
                          status={ts.status}
                          adjusted={Boolean(ts.adjusted_at)}
                          driverReviewStatus={
                            ts.latest_document_review?.status ?? null
                          }
                          driverReviewLabel={
                            ts.latest_document_review?.status_label ?? null
                          }
                        />
                      </TableCell>
                      <TableCell className='text-right text-white font-semibold tabular-nums'>
                        {Number.isFinite(Number(ts.weekly_total))
                          ? `$${Number(ts.weekly_total).toFixed(2)}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className='h-4 w-4 text-slate-500'
                          aria-hidden
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
