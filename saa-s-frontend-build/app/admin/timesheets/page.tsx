'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  Timesheet,
  TimesheetStatus,
  DriverWithDetails,
  Employer,
} from '@/lib/types';
import { toast } from 'sonner';

const STATUS_COLORS: Record<TimesheetStatus, string> = {
  draft: 'bg-slate-500',
  submitted: 'bg-blue-500',
  under_review: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  paid: 'bg-emerald-600',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driverId, setDriverId] = useState<string>('all');
  const [employerId, setEmployerId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weekStartFrom, setWeekStartFrom] = useState<string>('');
  const [weekStartTo, setWeekStartTo] = useState<string>('');

  useEffect(() => {
    fetchDrivers();
    fetchEmployers();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [driverId, employerId, statusFilter, weekStartFrom, weekStartTo]);

  const fetchTimesheets = async () => {
    setLoading(true);
    setError('');
    try {
      const params: {
        driver_id?: number;
        employer_id?: number;
        status?: string;
        week_start_from?: string;
        week_start_to?: string;
      } = {};
      if (driverId !== 'all') params.driver_id = parseInt(driverId, 10);
      if (employerId !== 'all') params.employer_id = parseInt(employerId, 10);
      if (statusFilter !== 'all') params.status = statusFilter;
      if (weekStartFrom) params.week_start_from = weekStartFrom;
      if (weekStartTo) params.week_start_to = weekStartTo;
      const response = await apiClient.getTimesheets(params);
      const data = response?.data ?? response;
      setTimesheets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timesheets');
      toast.error('Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await apiClient.getDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    }
  };

  const fetchEmployers = async () => {
    try {
      const data = await apiClient.getEmployers();
      setEmployers(Array.isArray(data) ? data : []);
    } catch {
      setEmployers([]);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white flex items-center gap-2'>
          <Calendar className='h-8 w-8' />
          Timesheets
        </h1>
        <p className='text-slate-400 mt-1'>
          View and manage driver timesheets; approve, reject, or mark as paid
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className='w-[180px] bg-slate-700 border-slate-600 text-white'>
                <SelectValue placeholder='Driver' />
              </SelectTrigger>
              <SelectContent className='bg-slate-800 border-slate-700 text-white'>
                <SelectItem value='all'>All drivers</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.user?.name ?? d.name ?? `Driver #${d.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={employerId} onValueChange={setEmployerId}>
              <SelectTrigger className='w-[180px] bg-slate-700 border-slate-600 text-white'>
                <SelectValue placeholder='Employer' />
              </SelectTrigger>
              <SelectContent className='text-white bg-slate-800 border-slate-700'>
                <SelectItem value='all'>All employers</SelectItem>
                {employers.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[140px] bg-slate-700 border-slate-600 text-white'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent className='text-white bg-slate-800 border-slate-700'>
                <SelectItem value='all'>All</SelectItem>
                {(
                  [
                    'draft',
                    'submitted',
                    'under_review',
                    'approved',
                    'rejected',
                    'paid',
                  ] as TimesheetStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='hidden sm:block h-6 w-px shrink-0 bg-slate-600 self-center' aria-hidden />
            <div className='flex items-center gap-2'>
              <span className='text-slate-400 text-sm whitespace-nowrap'>Week from</span>
              <Input
                type='date'
                title='Timesheets whose week starts on or after this date'
                value={weekStartFrom}
                max={weekStartTo || undefined}
                onChange={(e) => setWeekStartFrom(e.target.value)}
                className='w-[150px] h-10 shrink-0 bg-slate-700 border-slate-600 text-white scheme-dark'
              />
            </div>
            <span className='text-slate-500 text-sm shrink-0'>–</span>
            <div className='flex items-center gap-2'>
              <span className='text-slate-400 text-sm whitespace-nowrap'>to</span>
              <Input
                type='date'
                title='Timesheets whose week starts on or before this date'
                value={weekStartTo}
                min={weekStartFrom || undefined}
                onChange={(e) => setWeekStartTo(e.target.value)}
                className='w-[150px] h-10 shrink-0 bg-slate-700 border-slate-600 text-white scheme-dark'
              />
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-10 shrink-0 text-slate-300'
              onClick={() => {
                setWeekStartFrom('');
                setWeekStartTo('');
              }}
            >
              Clear range
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : timesheets.length === 0 ? (
            <p className='text-slate-400 py-12 text-center'>
              No timesheets match the filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-slate-800'>
                  <TableHead className='text-slate-300'>Driver</TableHead>
                  <TableHead className='text-slate-300'>Week</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300 text-right'>
                    Weekly total
                  </TableHead>
                  <TableHead className='w-10' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((ts) => (
                  <TableRow
                    key={ts.id}
                    className='border-slate-700 hover:bg-slate-700/50'
                  >
                    <TableCell className='text-white'>
                      {ts.driver?.user?.name ??
                        ts.driver?.name ??
                        `Driver #${ts.driver_id}`}
                    </TableCell>
                    <TableCell className='text-slate-300'>
                      {formatDate(ts.week_start_date)} –{' '}
                      {formatDate(ts.week_end_date)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ts.status]}>
                        {ts.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right text-white'>
                      {typeof ts.weekly_total === 'number'
                        ? `$${Number(ts.weekly_total).toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant='ghost' size='icon' asChild>
                        <Link href={`/admin/timesheets/${ts.id}`}>
                          <ChevronRight className='h-4 w-4 text-slate-400' />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
