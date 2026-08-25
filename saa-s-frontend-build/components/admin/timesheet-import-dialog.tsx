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
import { FileUp, Upload, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

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

  const reset = () => {
    setFile(null);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Select a CSV or Excel file');
      return;
    }
    setUploading(true);
    setErrors([]);
    try {
      const result = await apiClient.importTimesheets(file);
      const count = result.timesheets?.length ?? 0;
      toast.success(
        `Imported ${result.lines_imported} line(s) across ${count} timesheet(s)`,
      );
      if (result.warnings?.length) {
        toast.message(`${result.warnings.length} warning(s)`, {
          description: result.warnings.slice(0, 3).join(' '),
        });
      }
      onOpenChange(false);
      reset();
      onImported?.();
      const firstId = result.timesheets?.[0]?.id;
      if (firstId) {
        router.push(`/admin/timesheets/${firstId}`);
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className='bg-slate-800 border-slate-700 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-white'>Import customer timesheet</DialogTitle>
          <DialogDescription className='text-slate-400'>
            Upload a CSV or Excel (.xlsx) file with columns: Driver No, Driver Name,
            Customer, Trip #, Trip Date, Pay Item, Qty, Rate, Pay. Multiple pay-item
            rows for the same trip are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-1'>
          <input
            ref={inputRef}
            type='file'
            accept='.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            className='hidden'
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErrors([]);
            }}
          />
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 transition-colors',
              file
                ? 'border-emerald-600/60 bg-emerald-950/20'
                : 'border-slate-600 bg-slate-900/40 hover:border-slate-500',
            )}
          >
            <FileUp
              className={cn('h-8 w-8', file ? 'text-emerald-400' : 'text-slate-400')}
            />
            {file ? (
              <span className='text-sm font-medium text-white break-all text-center'>
                {file.name}
              </span>
            ) : (
              <span className='text-sm text-slate-300'>Click to choose file</span>
            )}
          </button>

          {errors.length > 0 && (
            <Alert variant='destructive' className='max-h-40 overflow-y-auto'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <ul className='list-disc pl-4 space-y-0.5 text-xs'>
                  {errors.slice(0, 25).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            className='border-slate-600 text-slate-300'
            disabled={uploading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
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
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
