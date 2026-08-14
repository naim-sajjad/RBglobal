'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SearchableFilterCombobox,
  SearchableFilterOption,
} from '@/components/admin/searchable-filter-combobox';
import {
  Calendar,
  AlertCircle,
  ChevronRight,
  PencilLine,
  Plus,
  X,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  Timesheet,
  TimesheetStatus,
  DriverWithDetails,
  Employer,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, formatApiDate, getApiErrorMessage } from '@/lib/utils';

const STATUS_OPTIONS: TimesheetStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid',
];

const STATUS_SORT_ORDER: Record<TimesheetStatus, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  approved: 3,
  rejected: 4,
  paid: 5,
};

const APPROVABLE_STATUSES: TimesheetStatus[] = [
  'draft',
  'submitted',
  'under_review',
];

type SortKey = 'driver' | 'week' | 'status' | 'total';
type SortDir = 'asc' | 'desc';

function formatStatusLabel(status: TimesheetStatus) {
  return status.replace('_', ' ');
}

function parseYmd(value: string): Date | null {
  const ymd = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10)),
  );
}

function toYmd(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function formatCompactWeek(start: string, end: string) {
  const s = parseYmd(start);
  const e = parseYmd(end);
  if (!s || !e) return `${formatApiDate(start)} – ${formatApiDate(end)}`;
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  }
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

function timesheetEmployerNames(ts: Timesheet) {
  const names = [
    ...new Set(
      (ts.trips ?? [])
        .map((trip) => trip.employer?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  return names.join(', ');
}

function driverName(ts: Timesheet) {
  return ts.driver?.user?.name ?? `Driver #${ts.driver_id}`;
}

function driverToOption(driver: DriverWithDetails): SearchableFilterOption {
  return {
    value: String(driver.id),
    label: driver.user?.name ?? `Driver #${driver.id}`,
    sublabel: driver.user?.email ?? undefined,
  };
}

function employerToOption(employer: Employer): SearchableFilterOption {
  return {
    value: String(employer.id),
    label: employer.name,
    sublabel: employer.company_code ?? employer.service_location ?? undefined,
  };
}

function StatusBadge({
  status,
  adjusted,
}: {
  status: TimesheetStatus;
  adjusted?: boolean;
}) {
  const styles: Record<TimesheetStatus, string> = {
    draft: 'bg-slate-600 text-slate-100',
    submitted: 'bg-blue-600 text-white',
    under_review: 'bg-amber-600 text-white',
    approved: 'bg-green-600 text-white',
    rejected: 'bg-red-600 text-white',
    paid: 'bg-emerald-700 text-white',
  };
  const icon =
    status === 'approved' ? (
      <Check className='h-3 w-3' aria-hidden />
    ) : status === 'rejected' ? (
      <AlertTriangle className='h-3 w-3' aria-hidden />
    ) : (
      <Circle className='h-2.5 w-2.5 fill-current' aria-hidden />
    );

  return (
    <div className='flex flex-col items-start gap-0.5'>
      <Badge className={cn('gap-1 font-medium capitalize', styles[status])}>
        {icon}
        <span>{formatStatusLabel(status)}</span>
      </Badge>
      {adjusted ? (
        <span className='inline-flex items-center gap-1 text-xs text-violet-300'>
          <PencilLine className='h-3 w-3' aria-hidden />
          Adjusted
        </span>
      ) : null}
    </div>
  );
}

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant='secondary'
      className='gap-1.5 bg-slate-700 text-slate-200 border border-slate-600 pr-1'
    >
      <span>{label}</span>
      <button
        type='button'
        onClick={onRemove}
        className='rounded p-0.5 hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
        aria-label={`Remove ${label} filter`}
      >
        <X className='h-3 w-3' />
      </button>
    </Badge>
  );
}

function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    from || to
      ? from && to
        ? formatCompactWeek(from, to)
        : from
          ? `From ${formatApiDate(from)}`
          : `Until ${formatApiDate(to)}`
      : 'Date range';

  const applyPreset = (nextFrom: Date, nextTo: Date) => {
    onChange({ from: toYmd(nextFrom), to: toYmd(nextTo) });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          aria-expanded={open}
          className='h-10 w-full sm:w-56 justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white font-normal'
        >
          <span className='flex min-w-0 items-center gap-2'>
            <Calendar className='h-4 w-4 shrink-0 text-slate-400' />
            <span className='truncate'>{label}</span>
          </span>
          <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-60' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[min(100vw-2rem,20rem)] space-y-3 bg-slate-800 border-slate-700 p-3'
      >
        <p className='text-xs font-medium text-slate-400'>Quick ranges</p>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            className='bg-slate-700 text-slate-200 hover:bg-slate-600'
            onClick={() => {
              const now = new Date();
              applyPreset(
                startOfWeek(now, { weekStartsOn: 1 }),
                endOfWeek(now, { weekStartsOn: 1 }),
              );
            }}
          >
            This week
          </Button>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            className='bg-slate-700 text-slate-200 hover:bg-slate-600'
            onClick={() => {
              const last = subWeeks(new Date(), 1);
              applyPreset(
                startOfWeek(last, { weekStartsOn: 1 }),
                endOfWeek(last, { weekStartsOn: 1 }),
              );
            }}
          >
            Last week
          </Button>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            className='col-span-2 bg-slate-700 text-slate-200 hover:bg-slate-600'
            onClick={() => {
              const now = new Date();
              applyPreset(startOfMonth(now), endOfMonth(now));
            }}
          >
            This month
          </Button>
        </div>
        <div className='space-y-2 border-t border-slate-700 pt-3'>
          <p className='text-xs font-medium text-slate-400'>Custom</p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label htmlFor='week-start-from' className='text-slate-400 text-xs'>
                From
              </Label>
              <Input
                id='week-start-from'
                type='date'
                value={from}
                max={to || undefined}
                onChange={(e) => onChange({ from: e.target.value, to })}
                className='h-9 bg-slate-700 border-slate-600 text-white scheme-dark'
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='week-start-to' className='text-slate-400 text-xs'>
                To
              </Label>
              <Input
                id='week-start-to'
                type='date'
                value={to}
                min={from || undefined}
                onChange={(e) => onChange({ from, to: e.target.value })}
                className='h-9 bg-slate-700 border-slate-600 text-white scheme-dark'
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (column: SortKey) => void;
  className?: string;
  align?: 'left' | 'right';
}) {
  const active = sortKey === column;
  return (
    <TableHead className={cn('text-slate-300', className)}>
      <button
        type='button'
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
          align === 'right' && 'ml-auto w-full justify-end',
        )}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className='h-3.5 w-3.5' />
          ) : (
            <ArrowDown className='h-3.5 w-3.5' />
          )
        ) : (
          <ChevronsUpDown className='h-3.5 w-3.5 opacity-40' />
        )}
      </button>
    </TableHead>
  );
}

export default function AdminTimesheetsPage() {
  const router = useRouter();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driverId, setDriverId] = useState<string>('all');
  const [driverLabel, setDriverLabel] = useState<string>('');
  const [employerId, setEmployerId] = useState<string>('all');
  const [employerLabel, setEmployerLabel] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weekStartFrom, setWeekStartFrom] = useState<string>('');
  const [weekStartTo, setWeekStartTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('week');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const hasActiveFilters =
    driverId !== 'all' ||
    employerId !== 'all' ||
    statusFilter !== 'all' ||
    weekStartFrom !== '' ||
    weekStartTo !== '';

  const dateRangeLabel = useMemo(() => {
    if (weekStartFrom && weekStartTo) {
      return formatCompactWeek(weekStartFrom, weekStartTo);
    }
    if (weekStartFrom) return `From ${formatApiDate(weekStartFrom)}`;
    if (weekStartTo) return `Until ${formatApiDate(weekStartTo)}`;
    return '';
  }, [weekStartFrom, weekStartTo]);

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: {
        driver_id?: number;
        employer_id?: number;
        status?: string;
        week_start_from?: string;
        week_start_to?: string;
        per_page?: number;
      } = { per_page: 100 };
      if (driverId !== 'all') params.driver_id = parseInt(driverId, 10);
      if (employerId !== 'all') params.employer_id = parseInt(employerId, 10);
      if (statusFilter !== 'all') params.status = statusFilter;
      if (weekStartFrom) params.week_start_from = weekStartFrom;
      if (weekStartTo) params.week_start_to = weekStartTo;
      const response = await apiClient.getTimesheets(params);
      const data = response?.data ?? response;
      setTimesheets(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load timesheets'));
      toast.error('Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  }, [driverId, employerId, statusFilter, weekStartFrom, weekStartTo]);

  useEffect(() => {
    void fetchTimesheets();
  }, [fetchTimesheets]);

  const searchDrivers = useCallback(
    async (query: string, signal: AbortSignal) => {
      const data = await apiClient.getDrivers({ search: query });
      if (signal.aborted) return [];
      const list = Array.isArray(data) ? (data as DriverWithDetails[]) : [];
      return list.map(driverToOption);
    },
    [],
  );

  const searchEmployers = useCallback(
    async (query: string, signal: AbortSignal) => {
      const data = await apiClient.getEmployers({ search: query });
      if (signal.aborted) return [];
      const list = Array.isArray(data) ? (data as Employer[]) : [];
      return list.map(employerToOption);
    },
    [],
  );

  const handleDriverChange = (value: string, option?: SearchableFilterOption) => {
    setDriverId(value);
    setDriverLabel(value === 'all' ? '' : option?.label ?? '');
  };

  const handleEmployerChange = (
    value: string,
    option?: SearchableFilterOption,
  ) => {
    setEmployerId(value);
    setEmployerLabel(value === 'all' ? '' : option?.label ?? '');
  };

  const clearAllFilters = () => {
    setDriverId('all');
    setDriverLabel('');
    setEmployerId('all');
    setEmployerLabel('');
    setStatusFilter('all');
    setWeekStartFrom('');
    setWeekStartTo('');
  };

  const handleSort = (column: SortKey) => {
    if (sortKey === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(column);
    setSortDir(column === 'week' || column === 'total' ? 'desc' : 'asc');
  };

  const sortedTimesheets = useMemo(() => {
    const rows = [...timesheets];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'driver') {
        cmp = driverName(a).localeCompare(driverName(b), undefined, {
          sensitivity: 'base',
        });
      } else if (sortKey === 'week') {
        cmp = a.week_start_date.localeCompare(b.week_start_date);
      } else if (sortKey === 'status') {
        cmp = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
      } else {
        cmp = Number(a.weekly_total || 0) - Number(b.weekly_total || 0);
      }
      return cmp * dir;
    });
    return rows;
  }, [timesheets, sortKey, sortDir]);

  const counts = useMemo(
    () => ({
      total: timesheets.length,
      draft: timesheets.filter((ts) => ts.status === 'draft').length,
      submitted: timesheets.filter((ts) => ts.status === 'submitted').length,
      approved: timesheets.filter((ts) => ts.status === 'approved').length,
    }),
    [timesheets],
  );

  const allVisibleSelected =
    sortedTimesheets.length > 0 &&
    sortedTimesheets.every((ts) => selectedIds.includes(ts.id));
  const selectedRows = timesheets.filter((ts) => selectedIds.includes(ts.id));
  const approvableSelected = selectedRows.filter((ts) =>
    APPROVABLE_STATUSES.includes(ts.status),
  );

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? sortedTimesheets.map((ts) => ts.id) : []);
  };

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleBulkApprove = async () => {
    if (approvableSelected.length === 0) {
      toast.error('None of the selected timesheets can be approved');
      return;
    }
    setBulkLoading(true);
    let ok = 0;
    let failed = 0;
    for (const ts of approvableSelected) {
      try {
        await apiClient.approveTimesheet(ts.id);
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkLoading(false);
    if (ok) toast.success(`Approved ${ok} timesheet${ok === 1 ? '' : 's'}`);
    if (failed) toast.error(`${failed} could not be approved`);
    setSelectedIds([]);
    await fetchTimesheets();
  };

  const handleRowNavigate = (timesheetId: number) => {
    router.push(`/admin/timesheets/${timesheetId}`);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <Calendar className='h-6 w-6' />
            Timesheets
          </h1>
          <p className='text-slate-400 mt-0.5 text-sm'>
            Create, adjust, and approve driver timesheets
          </p>
          <dl className='mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400'>
            <div className='flex items-baseline gap-1.5'>
              <dt className='sr-only'>Total timesheets</dt>
              <dd className='font-semibold text-white tabular-nums'>{counts.total}</dd>
              <span>Total</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dt className='sr-only'>Draft</dt>
              <dd className='font-semibold text-slate-200 tabular-nums'>{counts.draft}</dd>
              <span>Draft</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dt className='sr-only'>Submitted</dt>
              <dd className='font-semibold text-blue-300 tabular-nums'>
                {counts.submitted}
              </dd>
              <span>Submitted</span>
            </div>
            <div className='flex items-baseline gap-1.5'>
              <dt className='sr-only'>Approved</dt>
              <dd className='font-semibold text-green-300 tabular-nums'>
                {counts.approved}
              </dd>
              <span>Approved</span>
            </div>
          </dl>
        </div>
        <Button asChild className='bg-emerald-600 hover:bg-emerald-500 shrink-0'>
          <Link href='/admin/timesheets/new'>
            <Plus className='h-4 w-4 mr-2' />
            Create timesheet
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='space-y-3 pb-3 pt-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='w-full sm:w-48'>
              <Label htmlFor='timesheet-driver-filter' className='sr-only'>
                Driver
              </Label>
              <SearchableFilterCombobox
                id='timesheet-driver-filter'
                allLabel='All drivers'
                searchPlaceholder='Search drivers…'
                loadingMessage='Searching drivers…'
                emptyMessage='No drivers found'
                value={driverId}
                selectedLabel={driverLabel}
                onValueChange={handleDriverChange}
                onSearch={searchDrivers}
                className='w-full'
              />
            </div>

            <div className='w-full sm:w-48'>
              <Label htmlFor='timesheet-employer-filter' className='sr-only'>
                Employer
              </Label>
              <SearchableFilterCombobox
                id='timesheet-employer-filter'
                allLabel='All employers'
                searchPlaceholder='Search employers…'
                loadingMessage='Searching employers…'
                emptyMessage='No employers found'
                value={employerId}
                selectedLabel={employerLabel}
                onValueChange={handleEmployerChange}
                onSearch={searchEmployers}
                className='w-full'
              />
            </div>

            <div className='w-full sm:w-40'>
              <Label htmlFor='timesheet-status-filter' className='sr-only'>
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  id='timesheet-status-filter'
                  className='w-full h-10 bg-slate-700 border-slate-600 text-white'
                >
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent className='text-white bg-slate-800 border-slate-700'>
                  <SelectItem value='all'>All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='w-full sm:w-auto'>
              <Label className='sr-only'>Date range</Label>
              <DateRangeFilter
                from={weekStartFrom}
                to={weekStartTo}
                onChange={({ from, to }) => {
                  setWeekStartFrom(from);
                  setWeekStartTo(to);
                }}
              />
            </div>

            {hasActiveFilters && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-10 shrink-0 text-slate-300 hover:text-white'
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs text-slate-500 mr-1'>Active:</span>
              {driverId !== 'all' && (
                <ActiveFilterChip
                  label={driverLabel || `Driver #${driverId}`}
                  onRemove={() => handleDriverChange('all')}
                />
              )}
              {employerId !== 'all' && (
                <ActiveFilterChip
                  label={employerLabel || `Employer #${employerId}`}
                  onRemove={() => handleEmployerChange('all')}
                />
              )}
              {statusFilter !== 'all' && (
                <ActiveFilterChip
                  label={formatStatusLabel(statusFilter as TimesheetStatus)}
                  onRemove={() => setStatusFilter('all')}
                />
              )}
              {dateRangeLabel && (
                <ActiveFilterChip
                  label={dateRangeLabel}
                  onRemove={() => {
                    setWeekStartFrom('');
                    setWeekStartTo('');
                  }}
                />
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className='pt-0'>
          {selectedIds.length > 0 && (
            <div className='mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2'>
              <p className='text-sm text-slate-300'>
                {selectedIds.length} selected
              </p>
              <Button
                type='button'
                size='sm'
                className='bg-green-600 hover:bg-green-700'
                disabled={bulkLoading || approvableSelected.length === 0}
                onClick={() => void handleBulkApprove()}
              >
                {bulkLoading ? (
                  <Spinner className='h-4 w-4' />
                ) : (
                  `Approve${approvableSelected.length ? ` (${approvableSelected.length})` : ''}`
                )}
              </Button>
            </div>
          )}

          {loading ? (
            <div className='flex flex-col items-center justify-center gap-3 py-10'>
              <Spinner className='h-8 w-8 text-white' />
              <p className='text-slate-400 text-sm'>Loading timesheets…</p>
            </div>
          ) : sortedTimesheets.length === 0 ? (
            <div className='py-10 text-center space-y-1'>
              <p className='text-white font-medium'>No timesheets found</p>
              <p className='text-slate-400 text-sm'>
                {hasActiveFilters
                  ? 'Try changing your filters or date range.'
                  : 'Create a timesheet to get started.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-slate-800'>
                  <TableHead className='w-10'>
                    <Checkbox
                      aria-label='Select all timesheets'
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) =>
                        toggleSelectAll(checked === true)
                      }
                      className='border-slate-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                    />
                  </TableHead>
                  <SortableHead
                    label='Driver'
                    column='driver'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label='Week'
                    column='week'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label='Status'
                    column='status'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label='Weekly total'
                    column='total'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    align='right'
                    className='text-right'
                  />
                  <TableHead className='w-12' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTimesheets.map((ts) => {
                  const employers = timesheetEmployerNames(ts);
                  return (
                    <TableRow
                      key={ts.id}
                      tabIndex={0}
                      role='link'
                      aria-label={`Open timesheet for ${driverName(ts)}`}
                      className='border-slate-700 hover:bg-slate-700/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-inset'
                      onClick={() => handleRowNavigate(ts.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowNavigate(ts.id);
                        }
                      }}
                    >
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          aria-label={`Select timesheet for ${driverName(ts)}`}
                          checked={selectedIds.includes(ts.id)}
                          onCheckedChange={(checked) =>
                            toggleSelect(ts.id, checked === true)
                          }
                          className='border-slate-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                        />
                      </TableCell>
                      <TableCell>
                        <div className='min-w-0'>
                          <p className='text-white font-medium leading-tight'>
                            {driverName(ts)}
                          </p>
                          {employers ? (
                            <p className='text-xs text-slate-400 mt-0.5 truncate'>
                              {employers}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className='text-slate-300 whitespace-nowrap'>
                        {formatCompactWeek(
                          ts.week_start_date,
                          ts.week_end_date,
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={ts.status}
                          adjusted={Boolean(ts.adjusted_at)}
                        />
                      </TableCell>
                      <TableCell className='text-right text-white font-semibold tabular-nums'>
                        {Number.isFinite(Number(ts.weekly_total))
                          ? `$${Number(ts.weekly_total).toFixed(2)}`
                          : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className='flex items-center justify-end gap-0.5'>
                          <Button
                            variant='ghost'
                            size='icon'
                            asChild
                            title='Open timesheet (adjust)'
                          >
                            <Link href={`/admin/timesheets/${ts.id}?adjust=1`}>
                              <PencilLine className='h-4 w-4 text-slate-400' />
                            </Link>
                          </Button>
                          <ChevronRight
                            className='h-4 w-4 text-slate-500'
                            aria-hidden
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
