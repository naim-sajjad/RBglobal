'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { DriverWithDetails, Employer } from '@/lib/types';
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
  const { user } = useAuth();
  const week = currentWeekBounds();
  const [driverId, setDriverId] = useState('');
  const [driverLabel, setDriverLabel] = useState('');
  const [driverLocked, setDriverLocked] = useState(false);
  const [resolvingDriver, setResolvingDriver] = useState(true);
  const [employerId, setEmployerId] = useState('');
  const [employerLabel, setEmployerLabel] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(week.start);
  const [weekEndDate, setWeekEndDate] = useState(week.end);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isDriverRole = Boolean(
    user?.roles?.some((role) => role.name?.toLowerCase() === 'driver'),
  );

  // Pure drivers should use the driver create flow (no driver picker).
  useEffect(() => {
    if (isDriverRole) {
      router.replace('/driver/timesheets/new');
    }
  }, [isDriverRole, router]);

  // If the logged-in staff user also has a driver profile, lock them in as the driver.
  useEffect(() => {
    if (isDriverRole) return;

    let cancelled = false;
    const resolve = async () => {
      setResolvingDriver(true);
      try {
        const profile = (await apiClient.getMyDriverProfile()) as DriverWithDetails;
        if (cancelled || !profile?.id) return;
        setDriverId(String(profile.id));
        setDriverLabel(
          profile.name ?? profile.user?.name ?? `Driver #${profile.id}`,
        );
        setDriverLocked(true);
      } catch {
        // Not a driver profile — keep the picker for staff.
      } finally {
        if (!cancelled) setResolvingDriver(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [isDriverRole]);

  const searchDrivers = useCallback(
    async (query: string, signal: AbortSignal) => {
      const data = await apiClient.getDrivers({ search: query });
      if (signal.aborted) return [];
      const list = Array.isArray(data) ? (data as DriverWithDetails[]) : [];
      return list.map((driver) => ({
        value: String(driver.id),
        label: driver.name ?? driver.user?.name ?? `Driver #${driver.id}`,
        sublabel: driver.email ?? driver.user?.email ?? undefined,
      }));
    },
    [],
  );

  const searchEmployers = useCallback(
    async (query: string, signal: AbortSignal) => {
      const data = await apiClient.getEmployers({ search: query });
      if (signal.aborted) return [];
      const list = Array.isArray(data) ? (data as Employer[]) : [];
      return list.map((employer) => ({
        value: String(employer.id),
        label: employer.name,
        sublabel: employer.company_code ?? employer.service_location ?? undefined,
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
    if (!driverId || !employerId || !weekStartDate || !weekEndDate) {
      setError('Select a driver, customer, and week dates.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const created = await apiClient.createTimesheet({
        driver_id: parseInt(driverId, 10),
        employer_id: parseInt(employerId, 10),
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

  if (isDriverRole) {
    return (
      <div className='flex justify-center py-16'>
        <Spinner className='h-8 w-8 text-white' />
      </div>
    );
  }

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
            Create a weekly timesheet for a driver and customer. You can add trips,
            adjust rates, approve, and generate client invoices from the detail
            screen.
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
              {resolvingDriver ? (
                <div className='flex h-10 items-center gap-2 rounded-md border border-slate-600 bg-slate-700 px-3 text-sm text-slate-400'>
                  <Spinner className='h-4 w-4' />
                  Checking profile…
                </div>
              ) : driverLocked ? (
                <Input
                  id='create-timesheet-driver'
                  value={driverLabel}
                  readOnly
                  className='bg-slate-700 border-slate-600 text-white'
                />
              ) : (
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
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='create-timesheet-employer' className='text-slate-300'>
                Customer
              </Label>
              <SearchableFilterCombobox
                id='create-timesheet-employer'
                allLabel='Select customer'
                searchPlaceholder='Search customers…'
                loadingMessage='Searching customers…'
                emptyMessage='No customers found'
                value={employerId || 'all'}
                selectedLabel={employerLabel}
                onValueChange={(value, option?: SearchableFilterOption) => {
                  setEmployerId(value === 'all' ? '' : value);
                  setEmployerLabel(value === 'all' ? '' : option?.label ?? '');
                }}
                onSearch={searchEmployers}
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
              <Button
                type='submit'
                disabled={
                  isSubmitting ||
                  resolvingDriver ||
                  !driverId ||
                  !employerId
                }
                className='bg-emerald-600 hover:bg-emerald-500 text-white'
              >
                {isSubmitting ? (
                  <>
                    <Spinner className='h-4 w-4' />
                    Creating…
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
