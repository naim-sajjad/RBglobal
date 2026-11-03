'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

type UnmatchedRow = {
  row: number;
  driver_number?: string | null;
  driver_name?: string | null;
  customer?: string | null;
  trip_number?: string | null;
  trip_date?: string | null;
  reason: string;
};

type ImportResult = {
  timesheets: Array<{ id: number; week_start_date: string; week_end_date?: string }>;
  trips_created: number;
  lines_imported: number;
  warnings?: string[];
  unmatched?: UnmatchedRow[];
};

type TimesheetImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
};

export function TimesheetImportDialog({
  open,
  onOpenChange,
  onImported,
}: TimesheetImportDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setErrors([]);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Select a calculation sheet (.xlsx or .csv)');
      return;
    }
    setUploading(true);
    setErrors([]);
    setResult(null);
    try {
      const data = await apiClient.importTimesheets(file);
      const unmatched = data.unmatched ?? [];
      const count = data.timesheets?.length ?? 0;
      setResult({
        timesheets: data.timesheets ?? [],
        trips_created: data.trips_created ?? 0,
        lines_imported: data.lines_imported ?? 0,
        warnings: data.warnings ?? [],
        unmatched,
      });
      if (count > 0) {
        toast.success(
          `Created ${data.trips_created} trip(s) across ${count} timesheet(s)`,
        );
        onImported?.();
      } else {
        toast.error('No timesheets were generated. Review unmatched rows.');
      }
      if (unmatched.length > 0) {
        toast.message(`${unmatched.length} row(s) need manual review`);
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Import failed');
      const response = (err as {
        response?: { data?: { errors?: string[]; message?: string } };
      })?.response;
      const list = response?.data?.errors;
      if (Array.isArray(list) && list.length > 0) {
        setErrors(list.filter((e) => typeof e === 'string' && e.trim()));
      } else {
        setErrors(msg.split('\n').filter(Boolean));
      }
      toast.error(msg.split('\n')[0] || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const firstTimesheetId = result?.timesheets?.[0]?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-white'>
            Upload calculation sheet
          </DialogTitle>
          <DialogDescription className='text-slate-400'>
            Upload an Excel or CSV calculation sheet. Drivers are matched by
            Driver ID first, then by name. Unmatched rows are listed for manual
            review. Trips are added to weekly timesheets using each trip start
            and end date.
          </DialogDescription>
        </DialogHeader>

        <div className='min-w-0 space-y-3 py-1'>
          <input
            ref={inputRef}
            type='file'
            accept='.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            className='hidden'
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErrors([]);
              setResult(null);
            }}
          />
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 transition-colors',
              file
                ? 'border-emerald-600/60 bg-emerald-950/20'
                : 'border-slate-600 bg-slate-900/40 hover:border-slate-500',
            )}
          >
            <FileUp
              className={cn('h-8 w-8', file ? 'text-emerald-400' : 'text-slate-400')}
            />
            {file ? (
              <span className='w-full break-all text-center text-sm font-medium text-white'>
                {file.name}
              </span>
            ) : (
              <span className='text-sm text-slate-300'>
                Click to choose a calculation sheet
              </span>
            )}
          </button>

          {errors.length > 0 ? (
            <Alert variant='destructive' className='max-h-40 overflow-y-auto'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <ul className='list-disc space-y-0.5 pl-4 text-xs'>
                  {errors.slice(0, 25).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {result ? (
            <div className='space-y-3 rounded-md border border-slate-700 bg-slate-900/40 p-3'>
              <div className='flex items-start gap-2 text-sm text-emerald-200'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0' />
                <p>
                  {result.lines_imported} line(s) imported · {result.trips_created}{' '}
                  trip(s) · {result.timesheets.length} timesheet(s)
                </p>
              </div>
              {result.warnings && result.warnings.length > 0 ? (
                <p className='text-xs text-amber-200'>
                  {result.warnings.slice(0, 5).join(' ')}
                </p>
              ) : null}
              {result.unmatched && result.unmatched.length > 0 ? (
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-amber-200'>
                    Needs review ({result.unmatched.length})
                  </p>
                  <ul className='max-h-48 space-y-1 overflow-y-auto text-xs text-slate-300'>
                    {result.unmatched.map((row) => (
                      <li
                        key={`${row.row}-${row.trip_number ?? ''}-${row.reason}`}
                        className='rounded border border-amber-800/50 bg-amber-950/20 px-2 py-1.5'
                      >
                        <span className='font-medium text-amber-100'>
                          Row {row.row}
                        </span>
                        {row.driver_number ? ` · ${row.driver_number}` : ''}
                        {row.driver_name ? ` · ${row.driver_name}` : ''}
                        {row.trip_number ? ` · ${row.trip_number}` : ''}
                        <div className='text-slate-400'>{row.reason}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className='text-xs text-slate-400'>
                  All trip rows were matched to a driver.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            className='border-slate-600 text-slate-300'
            disabled={uploading}
            onClick={() => onOpenChange(false)}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {result && firstTimesheetId ? (
            <Button
              type='button'
              className='bg-slate-700 text-white hover:bg-slate-600'
              onClick={() => {
                onOpenChange(false);
                router.push(`/admin/timesheets/${firstTimesheetId}`);
              }}
            >
              Open timesheet
            </Button>
          ) : null}
          {!result ? (
            <Button
              type='button'
              className='bg-emerald-600 hover:bg-emerald-500 text-white'
              disabled={uploading || !file}
              onClick={() => void handleSubmit()}
            >
              {uploading ? (
                <Spinner className='h-4 w-4' />
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-1' />
                  Generate timesheets
                </>
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
