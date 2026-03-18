'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileSpreadsheet, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Timesheet, TimesheetStatus } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
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
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DriverTimesheetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.getTimesheets();
      const data = response?.data ?? response;
      setTimesheets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timesheets');
      toast.error('Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <FileSpreadsheet className="h-7 w-7" />
            My Timesheets
          </h1>
          <p className="text-slate-400 mt-1">Create and submit weekly timesheets</p>
        </div>
        <Button asChild>
          <Link href="/driver/timesheets/new">
            <Plus className="h-4 w-4 mr-2" />
            New Timesheet
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Weekly timesheets</CardTitle>
          <p className="text-sm text-slate-400">Select a timesheet to view or edit</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8 text-white" />
            </div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No timesheets yet.</p>
              <Button asChild variant="outline" className="mt-4 border-slate-600 text-slate-200">
                <Link href="/driver/timesheets/new">Create your first timesheet</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800">
                  <TableHead className="text-slate-300">Week</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300 text-right">Weekly total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((ts) => (
                  <TableRow key={ts.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white">
                      <span className="font-medium">
                        {formatDate(ts.week_start_date)} – {formatDate(ts.week_end_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ts.status]}>
                        {ts.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {typeof ts.weekly_total === 'number'
                        ? `$${Number(ts.weekly_total).toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild className="text-slate-400">
                        <Link href={`/driver/timesheets/${ts.id}`}>
                          <ChevronRight className="h-4 w-4" />
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
