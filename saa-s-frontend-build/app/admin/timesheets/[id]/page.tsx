'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Calculator,
  CheckCircle,
  XCircle,
  Banknote,
  Loader2,
  PencilLine,
  PlusCircle,
  Send,
  Receipt,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  Timesheet,
  TimesheetTrip,
  Employer,
  TimesheetStatus,
  RateCard,
  RateCardRatesConfig,
  TimesheetTripRateSnapshot,
  TimesheetTripRateSnapshotLine,
} from '@/lib/types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';

const STATUS_COLORS: Record<TimesheetStatus, string> = {
  draft: 'bg-slate-500',
  submitted: 'bg-blue-500',
  under_review: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  paid: 'bg-emerald-600',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

type EditableAdjustmentLine = {
  id: string;
  line_type: string;
  label: string;
  quantity: string;
  unit: string;
  rate: string;
  agency_rate: string;
  driver_amount: string;
  agency_amount: string;
  is_payable: boolean;
  is_billable: boolean;
};

function createAdjustmentLine(
  line?: TimesheetTripRateSnapshotLine,
): EditableAdjustmentLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    line_type: line?.line_type ?? 'manual',
    label: line?.label ?? '',
    quantity: String(line?.quantity ?? 1),
    unit: line?.unit ?? '',
    rate: String(line?.rate ?? 0),
    agency_rate: String(line?.agency_rate ?? line?.rate ?? 0),
    driver_amount: String(line?.driver_amount ?? 0),
    agency_amount: String(line?.agency_amount ?? 0),
    is_payable: line?.is_payable ?? true,
    is_billable: line?.is_billable ?? true,
  };
}

function buildAdjustmentDraft(
  snapshot?: TimesheetTripRateSnapshot | null,
): {
  rate_card_id?: number;
  driver_class_code?: string | null;
  lines: EditableAdjustmentLine[];
} {
  return {
    rate_card_id: snapshot?.rate_card_id,
    driver_class_code: snapshot?.driver_class_code ?? null,
    lines:
      snapshot?.lines && snapshot.lines.length > 0
        ? snapshot.lines.map((line) => createAdjustmentLine(line))
        : [createAdjustmentLine()],
  };
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function computeLineAmounts(line: EditableAdjustmentLine) {
  const quantity = toNumber(line.quantity, 0);
  const rate = toNumber(line.rate, 0);
  const agencyRate = toNumber(line.agency_rate, rate);
  const driverAmount = roundMoney(quantity * rate);
  const agencyAmount = roundMoney(quantity * agencyRate);

  return {
    quantity,
    rate,
    agencyRate,
    driverAmount,
    agencyAmount,
  };
}

export default function AdminTimesheetDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addTripOpen, setAddTripOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingTripId, setUpdatingTripId] = useState<number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<
    'approve' | 'reject' | 'paid' | 'submit' | null
  >(null);

  const [newTripEmployerId, setNewTripEmployerId] = useState('');
  const [newTripDate, setNewTripDate] = useState('');
  const [newTripNumber, setNewTripNumber] = useState('');
  const [newTripDistance, setNewTripDistance] = useState('');
  const [newTripNotes, setNewTripNotes] = useState('');
  const [employerRateCards, setEmployerRateCards] = useState<
    Record<number, RateCard[]>
  >({});
  const [activeRateConfig, setActiveRateConfig] =
    useState<RateCardRatesConfig | null>(null);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [additionalQuantities, setAdditionalQuantities] = useState<
    Record<string, string>
  >({});

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTrip, setAdjustTrip] = useState<TimesheetTrip | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotifyDriver, setAdjustNotifyDriver] = useState(true);
  const [adjustEmailDriver, setAdjustEmailDriver] = useState(false);
  const [adjustmentDraft, setAdjustmentDraft] = useState<{
    rate_card_id?: number;
    driver_class_code?: string | null;
    lines: EditableAdjustmentLine[];
  }>({ lines: [createAdjustmentLine()] });

  const fetchTimesheet = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiClient.getTimesheet(id);
      setTimesheet(data);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to load timesheet'));
      setTimesheet(null);
    }
  }, [id]);

  const openAdjustDialog = (trip: TimesheetTrip) => {
    setAdjustTrip(trip);
    setAdjustReason('');
    setAdjustNotifyDriver(true);
    setAdjustEmailDriver(false);
    const snap = trip.manual_rate_snapshot || trip.rate_snapshot || {};
    setAdjustmentDraft(buildAdjustmentDraft(snap));
    setAdjustOpen(true);
  };

  const submitAdjustment = async () => {
    if (!timesheet || !adjustTrip) return;
    const hasBlankLabel = adjustmentDraft.lines.some(
      (line) => !line.label.trim(),
    );
    if (hasBlankLabel) {
      toast.error('Each adjustment line needs a label');
      return;
    }
    if (adjustmentDraft.lines.length === 0) {
      toast.error('Add at least one adjustment line');
      return;
    }

    const lines = adjustmentDraft.lines.map((line) => {
      const amounts = computeLineAmounts(line);
      return {
        line_type: line.line_type.trim() || 'manual',
        label: line.label.trim(),
        quantity: amounts.quantity,
        unit: line.unit.trim() || undefined,
        rate: amounts.rate,
        agency_rate: amounts.agencyRate,
        driver_amount: amounts.driverAmount,
        agency_amount: amounts.agencyAmount,
        is_payable: line.is_payable,
        is_billable: line.is_billable,
      };
    });

    const parsed: TimesheetTripRateSnapshot = {
      rate_card_id: adjustmentDraft.rate_card_id,
      driver_class_code: adjustmentDraft.driver_class_code ?? null,
      lines,
      total_driver_pay: roundMoney(
        lines.reduce((sum, line) => sum + Number(line.driver_amount || 0), 0),
      ),
      total_agency_billing: roundMoney(
        lines.reduce((sum, line) => sum + Number(line.agency_amount || 0), 0),
      ),
    };

    setSaving(true);
    try {
      const res = await apiClient.adjustTimesheetTrip(timesheet.id, adjustTrip.id, {
        reason: adjustReason.trim() || undefined,
        manual_rate_snapshot: parsed,
        notify_driver: adjustNotifyDriver,
        email_driver: adjustEmailDriver,
      });
      toast.success(res?.message || 'Trip adjusted');
      setAdjustOpen(false);
      await fetchTimesheet();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, 'Failed to apply adjustment'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchTimesheet().finally(() => setLoading(false));
    }
  }, [id, fetchTimesheet]);

  useEffect(() => {
    if (!timesheet || adjustOpen || searchParams.get('adjust') !== '1') return;
    const firstTrip = timesheet.trips?.[0];
    if (firstTrip) {
      openAdjustDialog(firstTrip);
    }
  }, [timesheet, adjustOpen, searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const empRes = await apiClient.getEmployers();
        setEmployers(Array.isArray(empRes) ? empRes : []);
      } catch {
        setEmployers([]);
      }
    };
    load();
  }, []);

  // Load employer rate cards and determine active card for selected date
  useEffect(() => {
    const employerNumeric = newTripEmployerId
      ? Number(newTripEmployerId)
      : null;
    if (!employerNumeric || !newTripDate) {
      setActiveRateConfig(null);
      return;
    }

    const load = async () => {
      setLoadingCharges(true);
      try {
        let cards = employerRateCards[employerNumeric];
        if (!cards) {
          const data = await apiClient.getRateCards(employerNumeric);
          cards = Array.isArray(data) ? data : (data?.data ?? []);
          setEmployerRateCards((prev) => ({
            ...prev,
            [employerNumeric]: cards,
          }));
        }
        const date = new Date(newTripDate);
        const active = cards.find((c) => {
          if (c.status !== 'active') return false;
          const from = c.effective_from ? new Date(c.effective_from) : null;
          const to = c.effective_to ? new Date(c.effective_to) : null;
          const inRange = (!from || date >= from) && (!to || date <= to);
          return inRange;
        });
        setActiveRateConfig((active?.rates as RateCardRatesConfig) || null);
      } catch {
        setActiveRateConfig(null);
      } finally {
        setLoadingCharges(false);
      }
    };

    load();
  }, [newTripEmployerId, newTripDate, employerRateCards]);

  const status = timesheet?.status;
  const canManageTrips =
    status === 'draft' ||
    status === 'submitted' ||
    status === 'under_review';
  const canAdjust =
    status === 'draft' ||
    status === 'submitted' ||
    status === 'under_review' ||
    status === 'approved' ||
    status === 'paid';
  const canSubmit = status === 'draft';
  const canApprove =
    status === 'submitted' ||
    status === 'under_review' ||
    status === 'draft';
  const canReject =
    status === 'submitted' || status === 'under_review';
  const canMarkPaid = status === 'approved';
  const canRecalculate = canManageTrips;
  const canCreateInvoice = status === 'approved' || status === 'paid';

  const invoicePrefillHref = timesheet
    ? `/admin/billing/invoices/new?driver_id=${timesheet.driver_id}&start_date=${timesheet.week_start_date}&end_date=${timesheet.week_end_date}`
    : '/admin/billing/invoices/new';

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const distance = parseFloat(newTripDistance);
    if (
      !id ||
      !newTripEmployerId ||
      !newTripDate ||
      isNaN(distance) ||
      distance < 0
    )
      return;
    setSaving(true);
    try {
      const additional_quantities = Object.fromEntries(
        Object.entries(additionalQuantities)
          .map(([key, val]) => [key, Number(val)] as const)
          .filter(([, num]) => Number.isFinite(num) && num > 0),
      ) as Record<string, number>;

      await apiClient.createTimesheetTrip(id, {
        employer_id: parseInt(newTripEmployerId, 10),
        trip_date: newTripDate,
        trip_number: newTripNumber || undefined,
        distance,
        notes: newTripNotes || undefined,
        additional_quantities,
      });
      await fetchTimesheet();
      setAddTripOpen(false);
      setNewTripEmployerId('');
      setNewTripDate('');
      setNewTripNumber('');
      setNewTripDistance('');
      setNewTripNotes('');
      setAdditionalQuantities({});
      toast.success('Trip added');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to add trip'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTrip = async (
    tripId: number,
    data: Partial<{
      distance: number;
      notes: string;
    }>,
  ) => {
    if (!id) return;
    setUpdatingTripId(tripId);
    try {
      await apiClient.updateTimesheetTrip(id, tripId, data);
      await fetchTimesheet();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to update trip'));
    } finally {
      setUpdatingTripId(null);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!id || !confirm('Remove this trip?')) return;
    setSaving(true);
    try {
      await apiClient.deleteTimesheetTrip(id, tripId);
      await fetchTimesheet();
      toast.success('Trip removed');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to remove trip'));
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await apiClient.recalculateTimesheet(id);
      await fetchTimesheet();
      toast.success('Totals recalculated');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to recalculate'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!id) return;
    setActionLoading('submit');
    try {
      await apiClient.submitTimesheet(id);
      await fetchTimesheet();
      toast.success('Timesheet submitted');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to submit'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading('approve');
    try {
      await apiClient.approveTimesheet(id);
      await fetchTimesheet();
      toast.success('Timesheet approved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading('reject');
    try {
      await apiClient.rejectTimesheet(id, rejectReason);
      await fetchTimesheet();
      setRejectOpen(false);
      setRejectReason('');
      toast.success('Timesheet rejected');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to reject'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading('paid');
    try {
      await apiClient.markTimesheetPaid(id);
      await fetchTimesheet();
      toast.success('Marked as paid');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to mark as paid'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !timesheet) {
    return (
      <div className='flex justify-center items-center min-h-[200px]'>
        {loading ? (
          <Spinner className='h-8 w-8 text-white' />
        ) : (
          <p className='text-slate-400'>{error || 'Not found'}</p>
        )}
      </div>
    );
  }

  const trips = timesheet.trips ?? [];
  const tripsByDate = trips.reduce<Record<string, TimesheetTrip[]>>(
    (acc, t) => {
      const d = t.trip_date;
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    },
    {},
  );
  const sortedDates = Object.keys(tripsByDate).sort();
  const dailyTotals = sortedDates.map((d) => ({
    date: d,
    total: tripsByDate[d].reduce(
      (sum, t) => sum + Number(t.trip_total || 0),
      0,
    ),
  }));
  const weeklyTotal =
    typeof timesheet.weekly_total === 'number'
      ? timesheet.weekly_total
      : dailyTotals.reduce((s, d) => s + d.total, 0);
  const adjustmentPreviewLines = adjustmentDraft.lines.map((line) => ({
    ...line,
    ...computeLineAmounts(line),
  }));
  const adjustmentDriverTotal = roundMoney(
    adjustmentPreviewLines.reduce((sum, line) => sum + line.driverAmount, 0),
  );
  const adjustmentAgencyTotal = roundMoney(
    adjustmentPreviewLines.reduce((sum, line) => sum + line.agencyAmount, 0),
  );

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <Button
          variant='ghost'
          asChild
          className='text-slate-300 hover:text-white'
        >
          <Link href='/admin/timesheets' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to timesheets
          </Link>
        </Button>
        <div className='flex items-center gap-2 flex-wrap'>
          <Badge className={STATUS_COLORS[timesheet.status]}>
            {timesheet.status.replace('_', ' ')}
          </Badge>
          {canRecalculate && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleRecalculate}
              disabled={saving}
              className='bg-slate-700 border-slate-600 text-white'
            >
              {saving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Calculator className='h-4 w-4 mr-1' />
              )}
              Recalculate
            </Button>
          )}
          {canSubmit && (
            <Button
              size='sm'
              variant='outline'
              onClick={handleSubmitTimesheet}
              disabled={!!actionLoading}
              className='border-slate-600 bg-slate-700 text-white'
            >
              {actionLoading === 'submit' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4 mr-1' />
              )}
              Submit
            </Button>
          )}
          {canApprove && (
            <Button
              size='sm'
              onClick={handleApprove}
              disabled={!!actionLoading}
              className='bg-green-600 hover:bg-green-700'
            >
              {actionLoading === 'approve' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle className='h-4 w-4 mr-1' />
              )}
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setRejectOpen(true)}
              disabled={!!actionLoading}
              className='text-white'
            >
              {actionLoading === 'reject' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <XCircle className='h-4 w-4 mr-1' />
              )}
              Reject
            </Button>
          )}
          {canMarkPaid && (
            <Button
              size='sm'
              onClick={handleMarkPaid}
              disabled={!!actionLoading}
              className='bg-emerald-600 hover:bg-emerald-700'
            >
              {actionLoading === 'paid' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Banknote className='h-4 w-4 mr-1' />
              )}
              Mark as paid
            </Button>
          )}
          {canCreateInvoice && (
            <Button
              size='sm'
              variant='outline'
              asChild
              className='border-emerald-700 bg-emerald-950/40 text-emerald-200 hover:text-white'
            >
              <Link href={invoicePrefillHref}>
                <Receipt className='h-4 w-4 mr-1' />
                Create invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <FileSpreadsheet className='h-6 w-6' />
            {formatDate(timesheet.week_start_date)} –{' '}
            {formatDate(timesheet.week_end_date)}
          </CardTitle>
          <CardDescription className='text-slate-400'>
            Driver: {timesheet.driver?.user?.name ?? `#${timesheet.driver_id}`}{' '}
            — Weekly total:{' '}
            <span className='font-semibold text-white'>
              ${Number(weeklyTotal).toFixed(2)}
            </span>
          </CardDescription>
          {timesheet.reject_reason && (
            <Alert variant='destructive' className='mt-2'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Rejection reason: {timesheet.reject_reason}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {canManageTrips && (
            <div className='flex gap-2'>
              <Button
                onClick={() => setAddTripOpen(true)}
                size='sm'
                className='bg-slate-700 hover:bg-slate-600'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add trip
              </Button>
            </div>
          )}

          {trips.length === 0 ? (
            <p className='text-slate-400 py-8 text-center'>No trips.</p>
          ) : (
            <div className='space-y-6'>
              {sortedDates.map((dateStr) => (
                <div key={dateStr}>
                  <h3 className='text-sm font-medium text-slate-400 mb-2'>
                    {formatDate(dateStr)} — Daily total: $
                    {dailyTotals
                      .find((d) => d.date === dateStr)
                      ?.total.toFixed(2) ?? '0.00'}
                  </h3>
                  <div className='space-y-4'>
                    {(tripsByDate[dateStr] ?? []).map((trip) => (
                      <AdminTripCard
                        key={trip.id}
                        trip={trip}
                        canManageTrips={canManageTrips}
                        canAdjust={canAdjust}
                        timesheetId={id}
                        updatingTripId={updatingTripId}
                        onUpdateTrip={handleUpdateTrip}
                        onDeleteTrip={handleDeleteTrip}
                        onOpenAdjust={openAdjustDialog}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className='border-t border-slate-700 pt-4 flex justify-end'>
                <p className='text-lg font-semibold text-white'>
                  Weekly total: ${Number(weeklyTotal).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addTripOpen} onOpenChange={setAddTripOpen}>
        <DialogContent className='flex min-h-0 max-h-[min(90vh,900px)] flex-col gap-4 overflow-hidden bg-slate-800 border-slate-700'>
          <DialogHeader className='shrink-0'>
            <DialogTitle className='text-white'>Add trip</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Rates are calculated from the employer Rate Card. Enter trip
              details.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleAddTrip}
            className='flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'
          >
            <div className='min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-1'>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Employer</Label>
              <Select
                value={newTripEmployerId}
                onValueChange={setNewTripEmployerId}
                required
              >
                <SelectTrigger className='bg-slate-700 border-slate-600 text-white'>
                  <SelectValue placeholder='Select employer' />
                </SelectTrigger>
                <SelectContent className='bg-slate-800 border-slate-700'>
                  {employers.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Trip date</Label>
              <Input
                type='date'
                value={newTripDate}
                onChange={(e) => setNewTripDate(e.target.value)}
                min={timesheet?.week_start_date}
                max={timesheet?.week_end_date}
                required
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Trip number (optional)</Label>
              <Input
                value={newTripNumber}
                onChange={(e) => setNewTripNumber(e.target.value)}
                placeholder='e.g. 101'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Distance *</Label>
              <Input
                type='number'
                min={0}
                step='0.01'
                value={newTripDistance}
                onChange={(e) => setNewTripDistance(e.target.value)}
                required
                placeholder='0'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-3'>
              <p className='text-slate-400 text-sm'>
                Additional charges for this employer come from the active Rate
                Card. Enter quantities for each pay item.
              </p>
              {loadingCharges ? (
                <div className='flex items-center gap-2 text-slate-300 text-sm'>
                  <Spinner className='h-4 w-4' />
                  Loading additional charges...
                </div>
              ) : activeRateConfig &&
                activeRateConfig.additional_charges &&
                activeRateConfig.additional_charges.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  {activeRateConfig.additional_charges
                    .filter((c) => c.active)
                    .map((c) => (
                      <div key={c.key ?? c.charge_type} className='space-y-2'>
                        <Label className='text-slate-300'>
                          {c.charge_type || 'Pay item'}{' '}
                          {c.unit ? `(${c.unit})` : ''}
                        </Label>
                        <Input
                          type='number'
                          min={0}
                          step='0.01'
                          value={
                            additionalQuantities[c.key ?? c.charge_type] ?? ''
                          }
                          onChange={(e) =>
                            setAdditionalQuantities((prev) => ({
                              ...prev,
                              [c.key ?? c.charge_type]: e.target.value,
                            }))
                          }
                          className='bg-slate-700 border-slate-600 text-white'
                        />
                      </div>
                    ))}
                </div>
              ) : newTripEmployerId && newTripDate ? (
                <p className='text-slate-500 text-sm'>
                  No additional charges defined on the active Rate Card for this
                  date.
                </p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Notes (optional)</Label>
              <Input
                value={newTripNotes}
                onChange={(e) => setNewTripNotes(e.target.value)}
                placeholder='Notes'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            </div>
            <DialogFooter className='shrink-0 border-t border-slate-700/80 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setAddTripOpen(false)}
                className='border-slate-600 text-slate-300'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Add trip'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className='flex min-h-0 max-h-[min(90vh,900px)] max-w-3xl flex-col gap-4 overflow-hidden bg-slate-800 border-slate-700'>
          <DialogHeader className='shrink-0'>
            <DialogTitle className='text-white flex items-center gap-2'>
              <PencilLine className='h-5 w-5' />
              Manual adjustment
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              Override this trip’s rate snapshot to match the employer invoice. This will be used instead of Rate Card
              recalculation until you force recalculation.
            </DialogDescription>
          </DialogHeader>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-1'>
            {adjustTrip && (
              <div className='rounded-md border border-slate-700 bg-slate-900/60 p-3 text-sm'>
                <p className='text-white font-medium'>
                  Trip #{adjustTrip.trip_number || adjustTrip.id}
                </p>
                <p className='text-slate-400'>
                  {adjustTrip.employer?.name ?? `Employer #${adjustTrip.employer_id}`}{' '}
                  · {formatDate(adjustTrip.trip_date)}
                </p>
              </div>
            )}
            <div className='space-y-2'>
              <Label className='text-slate-300'>Adjustment reason</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder='e.g. Invoice mismatch, correction'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <Label className='text-slate-300'>Adjustment lines</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='border-slate-600 bg-slate-900 text-slate-200'
                  onClick={() =>
                    setAdjustmentDraft((prev) => ({
                      ...prev,
                      lines: [...prev.lines, createAdjustmentLine()],
                    }))
                  }
                >
                  <PlusCircle className='h-4 w-4' />
                  Add line
                </Button>
              </div>
              <div className='space-y-3'>
                {adjustmentDraft.lines.map((line) => {
                  const amounts = computeLineAmounts(line);
                  return (
                    <div
                      key={line.id}
                      className='rounded-lg border border-slate-700 bg-slate-900/70 p-4 space-y-4'
                    >
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Label</Label>
                          <Input
                            value={line.label}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, label: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            placeholder='e.g. Distance pay'
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Line type</Label>
                          <Input
                            value={line.line_type}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, line_type: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            placeholder='manual'
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                      </div>
                      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Quantity</Label>
                          <Input
                            type='number'
                            min={0}
                            step='0.01'
                            value={line.quantity}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, quantity: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Unit</Label>
                          <Input
                            value={line.unit}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, unit: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            placeholder='trip, km, hr'
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Driver rate</Label>
                          <Input
                            type='number'
                            step='0.01'
                            value={line.rate}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, rate: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>Agency rate</Label>
                          <Input
                            type='number'
                            step='0.01'
                            value={line.agency_rate}
                            onChange={(e) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, agency_rate: e.target.value }
                                    : current,
                                ),
                              }))
                            }
                            className='bg-slate-800 border-slate-600 text-white'
                          />
                        </div>
                      </div>
                      <div className='flex flex-wrap gap-5'>
                        <label className='flex items-center gap-2 text-sm text-slate-300'>
                          <Checkbox
                            checked={line.is_payable}
                            onCheckedChange={(checked) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, is_payable: checked === true }
                                    : current,
                                ),
                              }))
                            }
                            className='border-slate-500 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600'
                          />
                          Include in driver pay
                        </label>
                        <label className='flex items-center gap-2 text-sm text-slate-300'>
                          <Checkbox
                            checked={line.is_billable}
                            onCheckedChange={(checked) =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines: prev.lines.map((current) =>
                                  current.id === line.id
                                    ? { ...current, is_billable: checked === true }
                                    : current,
                                ),
                              }))
                            }
                            className='border-slate-500 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600'
                          />
                          Include in agency billing
                        </label>
                      </div>
                      <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-3'>
                        <div className='text-sm text-slate-400'>
                          Driver amount: <span className='text-white'>{formatMoney(amounts.driverAmount)}</span>{' '}
                          · Agency amount: <span className='text-white'>{formatMoney(amounts.agencyAmount)}</span>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() =>
                            setAdjustmentDraft((prev) => ({
                              ...prev,
                              lines:
                                prev.lines.length > 1
                                  ? prev.lines.filter((current) => current.id !== line.id)
                                  : [createAdjustmentLine()],
                            }))
                          }
                        >
                          <Trash2 className='h-4 w-4' />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className='rounded-md border border-violet-700/50 bg-violet-950/20 p-4'>
                <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
                  <div className='text-slate-300'>
                    Driver total:{' '}
                    <span className='font-semibold text-white'>
                      {formatMoney(adjustmentDriverTotal)}
                    </span>
                  </div>
                  <div className='text-slate-300'>
                    Agency total:{' '}
                    <span className='font-semibold text-white'>
                      {formatMoney(adjustmentAgencyTotal)}
                    </span>
                  </div>
                </div>
                <p className='mt-2 text-xs text-slate-400'>
                  Totals are calculated automatically from quantity multiplied by
                  rate on each line.
                </p>
              </div>
            </div>
            <div className='flex flex-wrap gap-4'>
              <label className='flex items-center gap-2 text-slate-300 text-sm'>
                <Checkbox
                  checked={adjustNotifyDriver}
                  onCheckedChange={(checked) =>
                    setAdjustNotifyDriver(checked === true)
                  }
                  className='border-slate-500 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600'
                />
                Notify driver (in-app)
              </label>
              <label className='flex items-center gap-2 text-slate-300 text-sm'>
                <Checkbox
                  checked={adjustEmailDriver}
                  onCheckedChange={(checked) =>
                    setAdjustEmailDriver(checked === true)
                  }
                  className='border-slate-500 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600'
                />
                Email driver (optional)
              </label>
            </div>
          </div>
          <DialogFooter className='shrink-0 border-t border-slate-700/80 pt-4'>
            <Button
              type='button'
              variant='secondary'
              className='cursor-pointer'
              onClick={() => setAdjustOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type='button'
              className='bg-violet-700 hover:bg-violet-600 text-white'
              onClick={() => void submitAdjustment()}
              disabled={saving || !adjustTrip}
            >
              {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Apply adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='flex min-h-0 max-h-[min(90vh,900px)] flex-col gap-4 overflow-hidden bg-slate-800 border-slate-700'>
          <DialogHeader className='shrink-0'>
            <DialogTitle className='text-white'>Reject timesheet</DialogTitle>
            <DialogDescription className='text-slate-400'>
              Optionally provide a reason for the driver.
            </DialogDescription>
          </DialogHeader>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-1'>
            <Label className='text-slate-300'>Reason (optional)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='e.g. Missing trip details'
              className='bg-slate-700 border-slate-600 text-white min-h-[80px]'
            />
          </div>
          <DialogFooter className='shrink-0 border-t border-slate-700/80 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setRejectOpen(false)}
              className='border-slate-600 text-slate-300'
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleReject}
              disabled={actionLoading === 'reject'}
              className='text-white'
            >
              {actionLoading === 'reject' ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTripCard({
  trip,
  canManageTrips,
  canAdjust,
  timesheetId,
  updatingTripId,
  onUpdateTrip,
  onDeleteTrip,
  onOpenAdjust,
}: {
  trip: TimesheetTrip;
  canManageTrips: boolean;
  canAdjust: boolean;
  timesheetId: string;
  updatingTripId: number | null;
  onUpdateTrip: (
    tripId: number,
    data: Partial<{
      distance: number;
      notes: string;
    }>,
  ) => void;
  onDeleteTrip: (tripId: number) => void;
  onOpenAdjust: (trip: TimesheetTrip) => void;
}) {
  const [localDistance, setLocalDistance] = useState(
    String(trip.distance ?? 0),
  );
  const [localNotes, setLocalNotes] = useState(trip.notes ?? '');

  const snapshot = trip.rate_snapshot;
  const lines = snapshot?.lines ?? [];
  const isUpdating = updatingTripId === trip.id;

  const handleBlur = () => {
    const distance = parseFloat(localDistance);
    if (isNaN(distance) || distance < 0) return;
    if (
      distance !== (trip.distance ?? 0) ||
      localNotes !== (trip.notes ?? '')
    ) {
      onUpdateTrip(trip.id, {
        distance,
        notes: localNotes || undefined,
      });
    }
  };

  return (
    <Card className='border-l-4 border-l-slate-500 bg-slate-800 border-slate-700'>
      <CardHeader className='py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-medium text-white'>
              Trip #{trip.trip_number || trip.id}
            </span>
            <span className='text-slate-400'>
              — {trip.employer?.name ?? `Employer #${trip.employer_id}`}
            </span>
            {trip.is_adjusted && (
              <Badge className='bg-violet-700 text-xs'>adjusted</Badge>
            )}
            {trip.minimum_applied && (
              <Badge variant='secondary' className='text-xs'>
                Min pay applied
              </Badge>
            )}
          </div>
          {(canManageTrips || canAdjust) && (
            <div className='flex items-center gap-1'>
              {canAdjust && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-slate-300 hover:text-white'
                  title='Manual adjust (invoice override)'
                  onClick={() => onOpenAdjust(trip)}
                >
                  <PencilLine className='h-4 w-4' />
                </Button>
              )}
              {canManageTrips && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-destructive hover:text-destructive'
                  onClick={() => onDeleteTrip(trip.id)}
                  title='Delete trip'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0 space-y-4'>
        <div className='grid grid-cols-2 sm:grid-cols-2 gap-2 text-sm'>
          <div>
            <span className='text-slate-400'>Distance</span>
            {canManageTrips ? (
              <Input
                type='number'
                min={0}
                step='0.01'
                value={localDistance}
                onChange={(e) => setLocalDistance(e.target.value)}
                onBlur={handleBlur}
                className='mt-1 h-8 bg-slate-700 border-slate-600 text-white'
              />
            ) : (
              <p className='text-white font-medium'>{trip.distance ?? 0}</p>
            )}
          </div>
        </div>
        {canManageTrips && (
          <div>
            <span className='text-slate-400 text-sm'>Notes</span>
            <Input
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder='Optional'
              className='mt-1 bg-slate-700 border-slate-600 text-white'
            />
          </div>
        )}
        {snapshot?.error && (
          <p className='text-amber-400 text-sm'>{snapshot.error}</p>
        )}
        {lines.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className='border-slate-700'>
                <TableHead className='text-slate-300'>Item</TableHead>
                <TableHead className='text-slate-300'>Qty</TableHead>
                <TableHead className='text-slate-300'>Rate</TableHead>
                <TableHead className='text-slate-300 text-right'>
                  Driver pay
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx} className='border-slate-700'>
                  <TableCell className='text-white'>{line.label}</TableCell>
                  <TableCell className='text-white'>{line.quantity}</TableCell>
                  <TableCell className='text-white'>
                    ${Number(line.rate).toFixed(2)}
                  </TableCell>
                  <TableCell className='text-white text-right'>
                    ${Number(line.driver_amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className='flex justify-between items-center pt-2 border-t border-slate-700'>
          <span className='text-slate-400 text-sm'>
            Rates from Rate Card (read-only)
          </span>
          {isUpdating ? (
            <Spinner className='h-4 w-4' />
          ) : (
            <p className='font-medium text-white'>
              Trip total: ${Number(trip.trip_total ?? 0).toFixed(2)}
              {trip.total_agency_billing != null &&
                trip.total_agency_billing > 0 && (
                  <span className='text-slate-400 ml-2'>
                    Agency: ${Number(trip.total_agency_billing).toFixed(2)}
                  </span>
                )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
