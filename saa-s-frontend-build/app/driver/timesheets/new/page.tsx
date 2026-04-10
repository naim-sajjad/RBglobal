'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function NewTimesheetPage() {
  const router = useRouter();
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleWeekStartChange = (val: string) => {
    setWeekStartDate(val);
    if (val && !weekEndDate) {
      const start = new Date(val);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      setWeekEndDate(end.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStartDate || !weekEndDate) {
      setError('Please select week start and end dates.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const created = await apiClient.createTimesheet({
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
      });
      toast.success('Timesheet created');
      router.push(`/driver/timesheets/${created.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create timesheet';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='p-6 max-w-lg mx-auto'>
      <Button
        variant='ghost'
        asChild
        className='mb-4 text-slate-300 hover:text-white'
      >
        <Link href='/driver/timesheets' className='flex items-center gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to timesheets
        </Link>
      </Button>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <FileSpreadsheet className='h-6 w-6' />
            New timesheet
          </CardTitle>
          <CardDescription className='text-slate-400'>
            Choose the week for this timesheet. You can add trips and pay items
            after creating it.
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
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='week_start_date' className='text-slate-300'>
                  Week start date
                </Label>
                <Input
                  id='week_start_date'
                  type='date'
                  value={weekStartDate}
                  onChange={(e) => handleWeekStartChange(e.target.value)}
                  required
                  className='text-white bg-slate-700 border-slate-600 text-white'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='week_end_date' className='text-slate-300'>
                  Week end date
                </Label>
                <Input
                  id='week_end_date'
                  type='date'
                  value={weekEndDate}
                  onChange={(e) => setWeekEndDate(e.target.value)}
                  min={weekStartDate}
                  required
                  className='text-white bg-slate-700 border-slate-600 text-white'
                />
              </div>
            </div>
            <div className='flex gap-2 pt-2'>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <Spinner className='h-4 w-4' />
                ) : (
                  'Create timesheet'
                )}
              </Button>
              <Button
                type='button'
                variant='outline'
                asChild
                className='border-slate-600 text-slate-300'
              >
                <Link href='/driver/timesheets'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
