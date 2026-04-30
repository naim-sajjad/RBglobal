'use client';

import * as React from 'react';
import {
  format,
  isValid,
  parseISO,
  startOfDay,
  isAfter,
  isBefore,
} from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const today = () => startOfDay(new Date());

type IsoDatePopoverFieldProps = {
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
  id?: string;
  /** Inclusive: disable before this (local) day */
  minDate?: Date;
  /** Inclusive: disable after this (local) day */
  maxDate?: Date;
  className?: string;
};

export function IsoDatePopoverField({
  value,
  onChange,
  placeholder,
  id,
  minDate,
  maxDate,
  className,
}: IsoDatePopoverFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          id={id}
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4 shrink-0 opacity-70' />
          <span className='truncate'>
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='min-w-[280px] w-auto border-0 bg-transparent p-0 shadow-none'
        align='start'
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className='overflow-hidden rounded-xl'>
          <Calendar
            mode='single'
            defaultMonth={selected ?? new Date()}
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, 'yyyy-MM-dd'));
                setOpen(false);
              } else {
                onChange('');
              }
            }}
            disabled={(date) => {
              const d0 = startOfDay(date);
              if (isAfter(d0, today())) return true;
              if (minDate && isBefore(d0, startOfDay(minDate))) return true;
              if (maxDate && isAfter(d0, startOfDay(maxDate))) return true;
              return false;
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
