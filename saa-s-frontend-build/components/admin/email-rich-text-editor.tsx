'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Link2,
  List,
  ListOrdered,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function EmailRichTextEditor({ value, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastExternal.current) {
      ref.current.innerHTML = value || '';
      lastExternal.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current && !ref.current.innerHTML && value) {
      ref.current.innerHTML = value;
      lastExternal.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount seed only
  }, []);

  const emit = useCallback(() => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastExternal.current = html;
    onChange(html);
  }, [onChange]);

  const wrap = (command: string, value?: string) => {
    ref.current?.focus();
    runCommand(command, value);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL', 'https://');
    if (!url) return;
    wrap('createLink', url);
  };

  const highlight = () => {
    wrap('hiliteColor', '#fff59d');
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-slate-600 bg-white',
        className,
      )}
    >
      <div className='flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5'>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrap('bold')}
          title='Bold'
        >
          <Bold className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrap('italic')}
          title='Italic'
        >
          <Italic className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrap('underline')}
          title='Underline'
        >
          <Underline className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={highlight}
          title='Highlight'
        >
          <Highlighter className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          title='Link'
        >
          <Link2 className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrap('insertUnorderedList')}
          title='Bullet list'
        >
          <List className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-7 w-7 p-0 text-slate-700'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrap('insertOrderedList')}
          title='Numbered list'
        >
          <ListOrdered className='h-3.5 w-3.5' />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className='min-h-[280px] px-3 py-3 text-[13px] leading-relaxed text-zinc-900 outline-none [&_a]:text-blue-600 [&_a]:underline'
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
