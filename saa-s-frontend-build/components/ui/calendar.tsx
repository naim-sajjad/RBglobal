'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarVariant = 'default' | 'dark-elegant';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: CalendarVariant;
};

function isCaptionDropdown(
  layout: React.ComponentProps<typeof DayPicker>['captionLayout'],
) {
  return (
    layout === 'dropdown' ||
    layout === 'dropdown-months' ||
    layout === 'dropdown-years'
  );
}

/** Nav chevrons only; month/year dropdowns use no trailing icon (Airbnb-style). */
function CalendarChevron({
  orientation,
  className,
  variant,
}: {
  orientation?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  variant: CalendarVariant;
}) {
  if (orientation === 'down') return null;
  const muted =
    variant === 'dark-elegant' ? 'text-[#94A3B8]' : 'text-muted-foreground';
  if (orientation === 'left')
    return (
      <ChevronLeft
        className={cn(
          'h-3.5 w-3.5',
          variant === 'dark-elegant' ? 'text-[#E2E8F0]' : muted,
          className,
        )}
        strokeWidth={2}
      />
    );
  if (orientation === 'right')
    return (
      <ChevronRight
        className={cn(
          'h-3.5 w-3.5',
          variant === 'dark-elegant' ? 'text-[#E2E8F0]' : muted,
          className,
        )}
        strokeWidth={2}
      />
    );
  return <span className={className} />;
}

/**
 * react-day-picker v9. Default variant ≈ Airbnb: white card, soft shadow, dark
 * circular selection. Month/year via `captionLayout="dropdown"` (no chevron).
 */
function Calendar({
  className,
  classNames,
  modifiersClassNames,
  showOutsideDays = true,
  variant = 'default',
  captionLayout = 'dropdown',
  navLayout = 'around',
  startMonth: startMonthProp,
  endMonth: endMonthProp,
  hideNavigation: hideNavigationProp,
  ...props
}: CalendarProps) {
  const now = React.useMemo(() => new Date(), []);
  const dropdownNav = isCaptionDropdown(captionLayout);

  const startMonth =
    startMonthProp ??
    (dropdownNav ? new Date(now.getFullYear() - 120, 0) : undefined);
  const endMonth =
    endMonthProp ??
    (dropdownNav ? new Date(now.getFullYear() + 50, 11) : undefined);

  const hideNavigation =
    hideNavigationProp ?? (dropdownNav ? true : undefined);
  const effectiveNavLayout = hideNavigation ? undefined : navLayout;

  if (variant === 'dark-elegant') {
    return (
      <DayPicker
        showOutsideDays={showOutsideDays}
        captionLayout={captionLayout}
        navLayout={effectiveNavLayout}
        hideNavigation={hideNavigation}
        startMonth={startMonth}
        endMonth={endMonth}
        className={cn(
          'w-[min(100%,18rem)] select-none rounded-2xl border border-white/10 p-4 font-sans text-sm',
          'bg-[linear-gradient(145deg,#1E293B,#19212f)] text-[#E2E8F0]',
          'shadow-[0_8px_28px_rgba(0,0,0,0.35)]',
          className,
        )}
        classNames={{
          root: 'rounded-2xl outline-none',
          months: 'flex flex-col gap-3',
          month: 'space-y-0',
          month_caption:
            'relative flex min-h-9 items-center justify-center border-b border-white/10 px-2 pb-3 pt-0',
          caption_label: 'text-center text-sm font-semibold text-[#E2E8F0]',
          dropdowns:
            'relative z-10 flex flex-wrap items-center justify-center gap-2',
          dropdown_root:
            'relative inline-flex min-w-[5rem] items-center rounded-lg border border-white/15 bg-[#273449] px-3 py-1.5 sm:min-w-[5.5rem]',
          dropdown: '',
          nav: '',
          button_previous: cn(
            buttonVariants({ variant: 'ghost' }),
            'h-8 w-8 shrink-0 rounded-full border border-white/10 bg-[#273449] text-[#E2E8F0] transition-colors hover:bg-[#324466]',
          ),
          button_next: cn(
            buttonVariants({ variant: 'ghost' }),
            'h-8 w-8 shrink-0 rounded-full border border-white/10 bg-[#273449] text-[#E2E8F0] transition-colors hover:bg-[#324466]',
          ),
          chevron: '',
          month_grid: 'w-full border-collapse',
          weekdays: 'grid grid-cols-7 gap-0.5 px-0.5 pt-3',
          weekday:
            'py-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-[#94A3B8]',
          weeks: 'grid gap-1 px-0.5 pb-0.5 pt-2',
          week: 'grid grid-cols-7 gap-1',
          day: 'relative flex aspect-square items-center justify-center p-0',
          day_button: cn(
            buttonVariants({ variant: 'ghost' }),
            'flex h-8 w-8 max-h-8 max-w-8 items-center justify-center rounded-full border border-transparent bg-transparent p-0 text-[0.8125rem] font-medium text-[#E2E8F0] transition-colors duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B]',
            'aria-selected:!bg-[#FF385C] aria-selected:!text-white aria-selected:!shadow-none aria-selected:hover:!bg-[#E31C5F]',
          ),
          caption_after_enter:
            'animate-in fade-in slide-in-from-right-1 duration-200',
          caption_after_exit:
            'animate-out fade-out slide-out-to-left-1 duration-150',
          caption_before_enter:
            'animate-in fade-in slide-in-from-left-1 duration-200',
          caption_before_exit:
            'animate-out fade-out slide-out-to-right-1 duration-150',
          weeks_after_enter:
            'animate-in fade-in slide-in-from-right-1 duration-200',
          weeks_after_exit:
            'animate-out fade-out slide-out-to-left-1 duration-150',
          weeks_before_enter:
            'animate-in fade-in slide-in-from-left-1 duration-200',
          weeks_before_exit:
            'animate-out fade-out slide-out-to-right-1 duration-150',
          ...classNames,
        }}
        modifiersClassNames={{
          today:
            '[&_.rdp-day_button]:!border [&_.rdp-day_button]:!border-[#FF385C]/70 [&_.rdp-day_button]:!bg-transparent [&_.rdp-day_button]:!text-[#FF385C]',
          outside:
            '[&_.rdp-day_button]:pointer-events-none [&_.rdp-day_button]:!text-[#64748B] [&_.rdp-day_button]:!opacity-40 [&_.rdp-day_button]:hover:!bg-transparent',
          disabled:
            '[&_.rdp-day_button]:cursor-not-allowed [&_.rdp-day_button]:!opacity-25 [&_.rdp-day_button]:hover:!bg-transparent',
          range_start:
            '[&_.rdp-day_button]:!rounded-full [&_.rdp-day_button]:!bg-[#FF385C] [&_.rdp-day_button]:!text-white',
          range_end:
            '[&_.rdp-day_button]:!rounded-full [&_.rdp-day_button]:!bg-[#FF385C] [&_.rdp-day_button]:!text-white',
          range_middle:
            '[&_.rdp-day_button]:!rounded-lg [&_.rdp-day_button]:!bg-white/10 [&_.rdp-day_button]:!text-[#E2E8F0]',
          ...modifiersClassNames,
        }}
        components={{
          Chevron: (p) => <CalendarChevron {...p} variant="dark-elegant" />,
        }}
        {...props}
      />
    );
  }

  /* Airbnb-style light calendar */
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout={effectiveNavLayout}
      hideNavigation={hideNavigation}
      startMonth={startMonth}
      endMonth={endMonth}
      className={cn(
        'w-[min(100%,20rem)] select-none rounded-2xl border border-neutral-200/90 bg-white p-4 font-sans text-sm text-neutral-900',
        'shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
        className,
      )}
      classNames={{
        root: 'rounded-2xl outline-none',
        months: 'flex flex-col gap-3',
        month: 'space-y-0',
        month_caption:
          'relative flex min-h-9 items-center justify-center border-b border-neutral-200/80 px-2 pb-3 pt-0',
        caption_label: 'text-center text-sm font-semibold text-neutral-900',
        dropdowns:
          'relative z-10 flex flex-wrap items-center justify-center gap-2',
        dropdown_root:
          'relative inline-flex min-w-[5rem] items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 shadow-sm sm:min-w-[5.5rem]',
        dropdown: '',
        nav: '',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 shrink-0 rounded-full text-neutral-600 transition-colors hover:bg-neutral-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 shrink-0 rounded-full text-neutral-600 transition-colors hover:bg-neutral-100',
        ),
        chevron: '',
        month_grid: 'w-full border-collapse',
        weekdays: 'grid grid-cols-7 gap-0.5 px-0.5 pt-3',
        weekday:
          'py-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500',
        weeks: 'grid gap-1 px-0.5 pb-0.5 pt-2',
        week: 'grid grid-cols-7 gap-1',
        day: 'relative flex aspect-square items-center justify-center p-0',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'flex h-9 w-9 max-h-9 max-w-9 items-center justify-center rounded-full border border-transparent bg-transparent p-0 text-[0.8125rem] font-medium text-neutral-900 transition-colors duration-150 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
          'aria-selected:!bg-neutral-900 aria-selected:!text-white aria-selected:!shadow-[0_2px_8px_rgba(0,0,0,0.12)] aria-selected:hover:!bg-neutral-800',
        ),
        caption_after_enter:
          'animate-in fade-in slide-in-from-right-1 duration-200',
        caption_after_exit:
          'animate-out fade-out slide-out-to-left-1 duration-150',
        caption_before_enter:
          'animate-in fade-in slide-in-from-left-1 duration-200',
        caption_before_exit:
          'animate-out fade-out slide-out-to-right-1 duration-150',
        weeks_after_enter:
          'animate-in fade-in slide-in-from-right-1 duration-200',
        weeks_after_exit:
          'animate-out fade-out slide-out-to-left-1 duration-150',
        weeks_before_enter:
          'animate-in fade-in slide-in-from-left-1 duration-200',
        weeks_before_exit:
          'animate-out fade-out slide-out-to-right-1 duration-150',
        ...classNames,
      }}
      modifiersClassNames={{
        today:
          '[&_.rdp-day_button]:!border [&_.rdp-day_button]:!border-neutral-900/25 [&_.rdp-day_button]:!bg-white [&_.rdp-day_button]:!font-semibold',
        outside:
          '[&_.rdp-day_button]:!text-neutral-400 [&_.rdp-day_button]:!opacity-80',
        disabled:
          '[&_.rdp-day_button]:cursor-not-allowed [&_.rdp-day_button]:!text-neutral-300 [&_.rdp-day_button]:!line-through [&_.rdp-day_button]:hover:!bg-transparent',
        range_start:
          '[&_.rdp-day_button]:!rounded-full [&_.rdp-day_button]:!bg-neutral-900 [&_.rdp-day_button]:!text-white',
        range_end:
          '[&_.rdp-day_button]:!rounded-full [&_.rdp-day_button]:!bg-neutral-900 [&_.rdp-day_button]:!text-white',
        range_middle:
          '[&_.rdp-day_button]:!rounded-lg [&_.rdp-day_button]:!bg-neutral-100 [&_.rdp-day_button]:!text-neutral-900',
        ...modifiersClassNames,
      }}
      components={{
        Chevron: (p) => <CalendarChevron {...p} variant="default" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
