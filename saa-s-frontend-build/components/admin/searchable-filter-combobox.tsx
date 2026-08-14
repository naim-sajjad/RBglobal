'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type SearchableFilterOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type SearchableFilterComboboxProps = {
  id?: string;
  allLabel: string;
  searchPlaceholder: string;
  loadingMessage: string;
  emptyMessage: string;
  emptySearchMessage?: string;
  value: string;
  selectedLabel?: string;
  onValueChange: (value: string, option?: SearchableFilterOption) => void;
  onSearch: (query: string, signal: AbortSignal) => Promise<SearchableFilterOption[]>;
  className?: string;
  minSearchLength?: number;
};

export function SearchableFilterCombobox({
  id: idProp,
  allLabel,
  searchPlaceholder,
  loadingMessage,
  emptyMessage,
  emptySearchMessage = 'Start typing to search…',
  value,
  selectedLabel,
  onValueChange,
  onSearch,
  className,
  minSearchLength = 1,
}: SearchableFilterComboboxProps) {
  const generatedId = useId();
  const controlId = idProp ?? generatedId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchableFilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await onSearch(searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          setOptions(results);
        }
      } catch {
        if (!controller.signal.aborted) {
          setOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [onSearch],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setOptions([]);
      abortRef.current?.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      return;
    }

    if (query.trim().length < minSearchLength) {
      setOptions([]);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query.trim());
    }, 280);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, query, minSearchLength, runSearch]);

  const triggerLabel = value === 'all' ? allLabel : selectedLabel ?? allLabel;

  const handleSelect = (nextValue: string, option?: SearchableFilterOption) => {
    onValueChange(nextValue, option);
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onValueChange('all');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={controlId}
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-controls={`${controlId}-listbox`}
          className={cn(
            'h-10 justify-between gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white font-normal',
            className,
          )}
        >
          <span className='truncate'>{triggerLabel}</span>
          <span className='flex shrink-0 items-center gap-1'>
            {value !== 'all' && (
              <span
                role='button'
                tabIndex={0}
                aria-label={`Clear ${allLabel.toLowerCase()}`}
                className='rounded p-0.5 text-slate-400 hover:bg-slate-600 hover:text-white'
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className='h-3.5 w-3.5' />
              </span>
            )}
            <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-60' />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={`${controlId}-listbox`}
        align='start'
        className='w-[var(--radix-popover-trigger-width)] min-w-[240px] max-w-[min(100vw-2rem,320px)] p-0 bg-slate-800 border-slate-700 text-white'
      >
        <Command
          shouldFilter={false}
          className='bg-slate-800 text-white'
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            className='text-white placeholder:text-slate-400'
          />
          <CommandList className='max-h-[min(280px,50vh)]'>
            <CommandGroup>
              <CommandItem
                value='all'
                onSelect={() => handleSelect('all')}
                className='text-white aria-selected:bg-slate-700'
              >
                {allLabel}
              </CommandItem>
            </CommandGroup>
            {loading ? (
              <div className='flex items-center gap-2 px-3 py-4 text-sm text-slate-400'>
                <Spinner className='h-4 w-4' />
                {loadingMessage}
              </div>
            ) : query.trim().length < minSearchLength ? (
              <p className='px-3 py-4 text-sm text-slate-400'>{emptySearchMessage}</p>
            ) : options.length === 0 ? (
              <CommandEmpty className='text-slate-400'>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value, option)}
                    className='flex flex-col items-start gap-0.5 text-white aria-selected:bg-slate-700'
                  >
                    <span>{option.label}</span>
                    {option.sublabel ? (
                      <span className='text-xs text-slate-400'>{option.sublabel}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
