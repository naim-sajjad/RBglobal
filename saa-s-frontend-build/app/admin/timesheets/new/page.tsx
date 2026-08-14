'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, FileSpreadsheet } from 'lucide-react';
import {
  SearchableFilterCombobox,
  SearchableFilterOption,
} from '@/components/admin/searchable-filter-combobox';
import { apiClient } from '@/lib/api';
import { DriverWithDetails } from '@/lib/types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';

function currentWeekBounds() {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

export default function AdminNewTimesheetPage() {
  const router = useRouter();
  const week = currentWeekBounds();
  const [driverId, setDriverId] = useState('');
  const [driverLabel, setDriverLabel] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(week.start);
  const [weekEndDate, setWeekEndDate] = useState(week.end);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchDrivers = useCallback(
    async (query: string, signal: AbortSignal) => {
      const data = await apiClient.getDrivers({ search: query });
      if (signal.aborted) return [];
      const list = Array.isArray(data) ? (data as DriverWithDetails[]) : [];
      return list.map((driver) => ({
        value: String(driver.id),
        label: driver.user?.name ?? `Driver #${driver.id}`,
        sublabel: driver.user?.email ?? undefined,
      }));
    },
    [],
  );

  const handleWeekStartChange = (val: string) => {
    setWeekStartDate(val);
    if (!val) return;
    const start = new Date(`${val}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setWeekEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !weekStartDate || !weekEndDate) {
      setError('Select a driver and week dates.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const created = await apiClient.createTimesheet({
        driver_id: parseInt(driverId, 10),
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
      });
      toast.success('Timesheet created');
      router.push(`/admin/timesheets/${created.id}`);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to create timesheet');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='max-w-lg mx-auto space-y-6'>
      <Button variant='ghost' asChild className='text-slate-300 hover:text-white -ml-2'>
        <Link href='/admin/timesheets' className='flex items-center gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to timesheets
        </Link>
      </Button>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <FileSpreadsheet className='h-6 w-6' />
            Create timesheet
          </CardTitle>
          <CardDescription className='text-slate-400'>
            Create a weekly timesheet for a driver. You can add trips, adjust rates,
            approve, and generate client invoices from the detail screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='create-timesheet-driver' className='text-slate-300'>
                Driver
              </Label>
              <SearchableFilterCombobox
                id='create-timesheet-driver'
                allLabel='Select driver'
                searchPlaceholder='Search drivers…'
                loadingMessage='Searching drivers…'
                emptyMessage='No drivers found'
                value={driverId || 'all'}
                selectedLabel={driverLabel}
                onValueChange={(value, option?: SearchableFilterOption) => {
                  setDriverId(value === 'all' ? '' : value);
                  setDriverLabel(value === 'all' ? '' : option?.label ?? '');
                }}
                onSearch={searchDrivers}
                className='w-full'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='week_start_date' className='text-slate-300'>
                  Week start
                </Label>
                <Input
                  id='week_start_date'
                  type='date'
                  value={weekStartDate}
                  onChange={(e) => handleWeekStartChange(e.target.value)}
                  required
                  className='bg-slate-700 border-slate-600 text-white scheme-dark'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='week_end_date' className='text-slate-300'>
                  Week end
                </Label>
                <Input
                  id='week_end_date'
                  type='date'
                  value={weekEndDate}
                  onChange={(e) => setWeekEndDate(e.target.value)}
                  min={weekStartDate}
                  required
                  className='bg-slate-700 border-slate-600 text-white scheme-dark'
                />
              </div>
            </div>

            <div className='flex justify-between gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                asChild
                className='border-slate-600 text-slate-300'
              >
                <Link href='/admin/timesheets'>Cancel</Link>
              </Button>
              <Button type='submit' disabled={isSubmitting || !driverId}>
                {isSubmitting ? <Spinner className='h-4 w-4' /> : 'Create timesheet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
