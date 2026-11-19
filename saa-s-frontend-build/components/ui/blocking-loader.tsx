'use client';

import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type BlockingLoaderProps = {
  open: boolean;
  label?: string;
  className?: string;
};

/** Full-screen overlay for slow API work (invoice generate/view, imports, list loads). */
export function BlockingLoader({
  open,
  label = 'Loading…',
  className,
}: BlockingLoaderProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-[1px]',
        className,
      )}
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div className='flex min-w-[220px] flex-col items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-8 py-6 shadow-xl'>
        <Spinner className='h-8 w-8 text-white' />
        <p className='text-sm font-medium text-slate-100'>{label}</p>
      </div>
    </div>
  );
}

export function TimesheetTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className='space-y-2 py-2' aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='flex animate-pulse gap-3'>
          <div className='h-11 w-[28%] rounded bg-slate-700/70' />
          <div className='h-11 w-[22%] rounded bg-slate-700/70' />
          <div className='h-11 w-[18%] rounded bg-slate-700/70' />
          <div className='h-11 flex-1 rounded bg-slate-700/70' />
        </div>
      ))}
    </div>
  );
}
