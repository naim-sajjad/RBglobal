'use client';

import React, { useState } from 'react';
import { FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileDropzoneProps = {
  file: File | null;
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  selectedHint?: string;
  inputRef?: React.Ref<HTMLInputElement>;
};

function firstDroppedFile(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  if (dt.files?.[0]) return dt.files[0];
  const item = Array.from(dt.items ?? []).find((entry) => entry.kind === 'file');
  return item?.getAsFile() ?? null;
}

export function FileDropzone({
  file,
  onFile,
  accept,
  disabled = false,
  emptyTitle = 'Drag and drop a file, or click to browse',
  emptyHint,
  selectedHint = 'Drop a new file or click to replace',
  inputRef,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const markDragging = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    e.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  const clearDragging = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;
    const dropped = firstDroppedFile(e.dataTransfer);
    if (dropped) onFile(dropped);
  };

  return (
    <label
      onDragEnter={markDragging}
      onDragOver={markDragging}
      onDragLeave={clearDragging}
      onDrop={handleDrop}
      className={cn(
        'flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors',
        disabled && 'pointer-events-none opacity-60',
        dragging
          ? 'border-emerald-400 bg-emerald-950/40'
          : file
            ? 'border-emerald-600/60 bg-emerald-950/20'
            : 'border-slate-600 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60',
      )}
    >
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        disabled={disabled}
        className='sr-only'
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onFile(selected);
        }}
      />
      <FileUp
        className={cn(
          'h-8 w-8 shrink-0',
          dragging || file ? 'text-emerald-400' : 'text-slate-400',
        )}
      />
      {file ? (
        <>
          <span
            className='w-full max-w-full break-all text-sm font-medium text-white'
            title={file.name}
          >
            {file.name}
          </span>
          <span className='text-xs text-slate-400'>{selectedHint}</span>
        </>
      ) : (
        <>
          <span className='text-sm font-medium text-slate-200'>{emptyTitle}</span>
          {emptyHint ? (
            <span className='text-xs text-slate-500'>{emptyHint}</span>
          ) : null}
        </>
      )}
    </label>
  );
}
