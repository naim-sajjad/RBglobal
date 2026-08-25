'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  CheckCircle,
  XCircle,
  Banknote,
  Loader2,
  PencilLine,
  PlusCircle,
  Send,
  Receipt,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
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
import { cn, getApiErrorMessage } from '@/lib/utils';
import {
  TimesheetDocumentActions,
  TimesheetDocumentsCard,
} from '@/components/admin/timesheet-documents-card';
import { TimesheetLineItemsTable } from '@/components/admin/timesheet-line-items-table';
import {
  effectiveTripSnapshot,
  suggestNextTripDate,
  resolveClassDriverRate,
  resolveDistanceBandRates,
  createCustomPayLineDraft,
  DISTANCE_RATE_OVERRIDE_KEY,
  type CustomPayLineDraft,
  type PayRateDraft,
} from '@/lib/timesheet-lines';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TOOLBAR_BTN =
  'h-8 shrink-0 gap-1 px-2.5 text-xs font-medium';
const TOOLBAR_SECONDARY =
  'h-8 shrink-0 gap-1 px-2.5 text-xs font-medium border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white';

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
  const router = useRouter();
  const id = params?.id as string;
  const adjustAutoOpenedRef = useRef(false);
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
  const [showDocuments, setShowDocuments] = useState(false);
  const [tripsView, setTripsView] = useState<'lines' | 'trips'>('lines');
  const [taxRules, setTaxRules] = useState<
    Array<{ name: string; type: 'percentage' | 'fixed'; value: number }>
  >([]);

  const [newTripEmployerId, setNewTripEmployerId] = useState('');
  const [newTripDate, setNewTripDate] = useState('');
  const [newTripNumber, setNewTripNumber] = useState('');
  const [newTripDistance, setNewTripDistance] = useState('0');
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
  const [customPayLines, setCustomPayLines] = useState<CustomPayLineDraft[]>(
    [],
  );
  const [payRates, setPayRates] = useState<Record<string, PayRateDraft>>({});
  const [payRateDirty, setPayRateDirty] = useState<Record<string, boolean>>(
    {},
  );

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTrip, setAdjustTrip] = useState<TimesheetTrip | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustShowErrors, setAdjustShowErrors] = useState(false);
  const [adjustmentDraft, setAdjustmentDraft] = useState<{
    rate_card_id?: number;
    driver_class_code?: string | null;
    lines: EditableAdjustmentLine[];
  }>({ lines: [createAdjustmentLine()] });

  const updateAdjustmentLine = (
    lineId: string,
    patch: Partial<EditableAdjustmentLine>,
  ) => {
    setAdjustmentDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((current) =>
        current.id === lineId ? { ...current, ...patch } : current,
      ),
    }));
  };

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
    setAdjustShowErrors(false);
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
      setAdjustShowErrors(true);
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
    adjustAutoOpenedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (
      !timesheet ||
      searchParams.get('adjust') !== '1' ||
      adjustAutoOpenedRef.current
    ) {
      return;
    }
    const firstTrip = timesheet.trips?.[0];
    if (firstTrip) {
      adjustAutoOpenedRef.current = true;
      openAdjustDialog(firstTrip);
      router.replace(`/admin/timesheets/${id}`, { scroll: false });
    }
  }, [timesheet, searchParams, id, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const empRes = await apiClient.getEmployers();
        setEmployers(Array.isArray(empRes) ? empRes : []);
      } catch {
        setEmployers([]);
      }
      try {
        const taxRes = await apiClient.getPayrollBillingTaxSettings();
        const taxes = Array.isArray(taxRes?.taxes)
          ? taxRes.taxes
          : Array.isArray(taxRes)
            ? taxRes
            : [];
        setTaxRules(
          taxes.map(
            (t: { name?: string; type?: string; value?: number }) => ({
              name: String(t.name ?? 'Tax'),
              type: t.type === 'fixed' ? 'fixed' : 'percentage',
              value: Number(t.value ?? 0),
            }),
          ),
        );
      } catch {
        setTaxRules([]);
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
          if (c.status !== 'active' && c.status !== 'scheduled') return false;
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

  // Seed editable rates from Rate Card (preserve rows the user already edited).
  useEffect(() => {
    if (!activeRateConfig) return;
    const classCode = timesheet?.driver?.driver_class?.code ?? null;
    const distanceQty = Number(newTripDistance) || 0;
    const distanceRates = resolveDistanceBandRates(
      activeRateConfig.distance_bands,
      distanceQty,
      classCode,
    );
    setPayRates((prev) => {
      const next = { ...prev };
      if (!payRateDirty[DISTANCE_RATE_OVERRIDE_KEY]) {
        next[DISTANCE_RATE_OVERRIDE_KEY] = {
          driver_rate: String(distanceRates.driverRate),
          agency_rate: String(distanceRates.agencyRate),
        };
      }
      for (const c of activeRateConfig.additional_charges ?? []) {
        if (!c.active) continue;
        const key = c.key ?? c.charge_type;
        if (!key || payRateDirty[key]) continue;
        next[key] = {
          driver_rate: String(
            resolveClassDriverRate(
              c.driver_rate,
              c.driver_rates_by_class,
              classCode,
            ),
          ),
          agency_rate: String(Number(c.agency_rate ?? 0) || 0),
        };
      }
      return next;
    });
  }, [
    activeRateConfig,
    newTripDistance,
    timesheet?.driver?.driver_class?.code,
    payRateDirty,
  ]);

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
  const canCreateInvoice = status === 'approved' || status === 'paid';

  const invoicePrefillHref = timesheet
    ? `/admin/billing/invoices/new?driver_id=${timesheet.driver_id}&start_date=${timesheet.week_start_date}&end_date=${timesheet.week_end_date}${
        timesheet.employer_id ? `&employer_id=${timesheet.employer_id}` : ''
      }`
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
    const blankCustom = customPayLines.some(
      (line) => Number(line.quantity) > 0 && !line.label.trim(),
    );
    if (blankCustom) {
      toast.error('Each custom pay item needs a label');
      return;
    }
    setSaving(true);
    try {
      const additional_quantities = Object.fromEntries(
        Object.entries(additionalQuantities)
          .map(([key, val]) => [key, Number(val)] as const)
          .filter(([, num]) => Number.isFinite(num) && num > 0),
      ) as Record<string, number>;

      const custom_pay_lines = customPayLines
        .map((line) => ({
          label: line.label.trim(),
          quantity: Number(line.quantity),
          unit: line.unit.trim() || undefined,
          rate: Number(line.driver_rate) || 0,
          agency_rate: Number(line.agency_rate) || 0,
        }))
        .filter(
          (line) =>
            line.label &&
            Number.isFinite(line.quantity) &&
            line.quantity > 0,
        );

      const rate_overrides: Record<
        string,
        { rate: number; agency_rate: number }
      > = {};
      const distanceRate = payRates[DISTANCE_RATE_OVERRIDE_KEY];
      if (distanceRate) {
        rate_overrides[DISTANCE_RATE_OVERRIDE_KEY] = {
          rate: Number(distanceRate.driver_rate) || 0,
          agency_rate: Number(distanceRate.agency_rate) || 0,
        };
      }
      for (const key of Object.keys(additional_quantities)) {
        const rates = payRates[key];
        if (!rates) continue;
        rate_overrides[key] = {
          rate: Number(rates.driver_rate) || 0,
          agency_rate: Number(rates.agency_rate) || 0,
        };
      }

      await apiClient.createTimesheetTrip(id, {
        employer_id: parseInt(newTripEmployerId, 10),
        trip_date: newTripDate,
        trip_number: newTripNumber || undefined,
        distance,
        notes: newTripNotes || undefined,
        additional_quantities,
        custom_pay_lines:
          custom_pay_lines.length > 0 ? custom_pay_lines : undefined,
        rate_overrides:
          Object.keys(rate_overrides).length > 0 ? rate_overrides : undefined,
      });
      await fetchTimesheet();
      setAddTripOpen(false);
      setNewTripEmployerId(
        timesheet.employer_id ? String(timesheet.employer_id) : '',
      );
      setNewTripDate('');
      setNewTripNumber('');
      setNewTripDistance('0');
      setNewTripNotes('');
      setAdditionalQuantities({});
      setCustomPayLines([]);
      setPayRates({});
      setPayRateDirty({});
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
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Button
          variant='ghost'
          asChild
          className='h-8 -ml-2 w-fit px-2 text-xs text-slate-300 hover:text-white'
        >
          <Link href='/admin/timesheets' className='flex items-center gap-1.5'>
            <ArrowLeft className='h-3.5 w-3.5' />
            Back to timesheets
          </Link>
        </Button>

        <div className='flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5'>
          <Badge
            className={cn(
              'h-8 shrink-0 px-2.5 text-xs capitalize',
              STATUS_COLORS[timesheet.status],
            )}
          >
            {timesheet.status.replace('_', ' ')}
          </Badge>

          {canSubmit && (
            <Button
              size='sm'
              variant='outline'
              onClick={handleSubmitTimesheet}
              disabled={!!actionLoading}
              className={cn(TOOLBAR_SECONDARY, 'hidden md:inline-flex')}
            >
              {actionLoading === 'submit' ? (
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <Send className='h-3.5 w-3.5' />
              )}
              Submit
            </Button>
          )}
          {(canApprove || canReject) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size='sm'
                  disabled={!!actionLoading}
                  className={cn(
                    TOOLBAR_BTN,
                    'bg-green-600 hover:bg-green-700 text-white',
                  )}
                >
                  {actionLoading === 'approve' ||
                  actionLoading === 'reject' ? (
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <CheckCircle className='h-3.5 w-3.5' />
                  )}
                  Review
                  <ChevronDown className='h-3.5 w-3.5 opacity-80' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='bg-slate-800 border-slate-700 text-white min-w-44'
              >
                {canApprove && (
                  <DropdownMenuItem
                    className='focus:bg-slate-700 focus:text-white cursor-pointer'
                    disabled={!!actionLoading}
                    onClick={() => void handleApprove()}
                  >
                    <CheckCircle className='h-4 w-4 mr-2 text-green-400' />
                    Approve
                  </DropdownMenuItem>
                )}
                {canReject && (
                  <DropdownMenuItem
                    className='focus:bg-slate-700 focus:text-white cursor-pointer text-red-300'
                    disabled={!!actionLoading}
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle className='h-4 w-4 mr-2' />
                    Reject
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
            <TimesheetDocumentActions
              timesheetId={id}
              documents={timesheet.documents ?? []}
              reviews={timesheet.document_reviews ?? []}
              onDocumentsChange={fetchTimesheet}
              onDocumentCreated={() => setShowDocuments(true)}
              compact
            />
            <Button
              type='button'
              size='sm'
              variant='outline'
              className={cn(TOOLBAR_SECONDARY, 'hidden md:inline-flex')}
              onClick={() => {
                setShowDocuments((open) => {
                  const next = !open;
                  if (next) {
                    window.requestAnimationFrame(() => {
                      document
                        .getElementById('timesheet-documents')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }
                  return next;
                });
              }}
            >
            {showDocuments ? (
              <ChevronUp className='h-3.5 w-3.5' />
            ) : (
              <FolderOpen className='h-3.5 w-3.5' />
            )}
            Documents
            {(timesheet.documents?.length ?? 0) > 0 ? (
              <span className='rounded-full bg-slate-600 px-1.5 py-0.5 text-[10px] font-medium tabular-nums leading-none'>
                {timesheet.documents?.length}
              </span>
            ) : null}
          </Button>
          {canMarkPaid && (
            <Button
              size='sm'
              onClick={handleMarkPaid}
              disabled={!!actionLoading}
              className={cn(
                TOOLBAR_BTN,
                'hidden bg-emerald-600 text-white hover:bg-emerald-700 md:inline-flex',
              )}
            >
              {actionLoading === 'paid' ? (
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <Banknote className='h-3.5 w-3.5' />
              )}
              Mark paid
            </Button>
          )}
          {canCreateInvoice && (
            <Button
              size='sm'
              variant='outline'
              asChild
              className={cn(
                TOOLBAR_BTN,
                'hidden border-emerald-700 bg-emerald-950/40 text-emerald-200 hover:text-white md:inline-flex',
              )}
            >
              <Link href={invoicePrefillHref}>
                <Receipt className='h-3.5 w-3.5' />
                Invoice
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className={cn(TOOLBAR_SECONDARY, 'md:hidden')}
              >
                <MoreHorizontal className='h-3.5 w-3.5' />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='bg-slate-800 border-slate-700 text-white min-w-48'
            >
              {canSubmit && (
                <DropdownMenuItem
                  className='focus:bg-slate-700 focus:text-white cursor-pointer'
                  disabled={!!actionLoading}
                  onClick={() => void handleSubmitTimesheet()}
                >
                  <Send className='h-4 w-4 mr-2' />
                  Submit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className='focus:bg-slate-700 focus:text-white cursor-pointer'
                onClick={() => {
                  setShowDocuments((open) => {
                    const next = !open;
                    if (next) {
                      window.requestAnimationFrame(() => {
                        document
                          .getElementById('timesheet-documents')
                          ?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                      });
                    }
                    return next;
                  });
                }}
              >
                {showDocuments ? (
                  <ChevronUp className='h-4 w-4 mr-2' />
                ) : (
                  <FolderOpen className='h-4 w-4 mr-2' />
                )}
                {showDocuments ? 'Hide documents' : 'Documents'}
              </DropdownMenuItem>
              {(canMarkPaid || canCreateInvoice) && (
                <DropdownMenuSeparator className='bg-slate-700' />
              )}
              {canMarkPaid && (
                <DropdownMenuItem
                  className='focus:bg-slate-700 focus:text-white cursor-pointer'
                  disabled={!!actionLoading}
                  onClick={() => void handleMarkPaid()}
                >
                  <Banknote className='h-4 w-4 mr-2' />
                  Mark paid
                </DropdownMenuItem>
              )}
              {canCreateInvoice && (
                <DropdownMenuItem
                  className='focus:bg-slate-700 focus:text-white cursor-pointer'
                  asChild
                >
                  <Link href={invoicePrefillHref}>
                    <Receipt className='h-4 w-4 mr-2' />
                    Invoice
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showDocuments ? (
        <TimesheetDocumentsCard
          timesheetId={id}
          documents={timesheet.documents ?? []}
          reviews={timesheet.document_reviews ?? []}
          onDocumentsChange={fetchTimesheet}
        />
      ) : null}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <FileSpreadsheet className='h-6 w-6' />
            {formatDate(timesheet.week_start_date)} –{' '}
            {formatDate(timesheet.week_end_date)}
          </CardTitle>
          <CardDescription className='text-slate-400'>
            Driver: {timesheet.driver?.user?.name ?? `#${timesheet.driver_id}`}
            {timesheet.employer?.name
              ? ` — Employer: ${timesheet.employer.name}`
              : ''}{' '}
            — Weekly total:{' '}
            <span className='font-semibold text-white'>
              ${Number(weeklyTotal).toFixed(2)}
            </span>
            {timesheet.document_reviews?.[0] ? (
              <>
                {' '}
                — Driver docs:{' '}
                <span
                  className={cn(
                    'font-medium',
                    timesheet.document_reviews[0].status === 'approved'
                      ? 'text-emerald-300'
                      : timesheet.document_reviews[0].status ===
                          'adjustment_requested'
                        ? 'text-amber-300'
                        : timesheet.document_reviews[0].status === 'pending'
                          ? 'text-sky-300'
                          : 'text-slate-300',
                  )}
                >
                  {timesheet.document_reviews[0].status_label ||
                    timesheet.document_reviews[0].status}
                </span>
              </>
            ) : null}
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
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='inline-flex rounded-md border border-slate-600 bg-slate-900/50 p-0.5'>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className={cn(
                    'h-8 px-3 text-xs',
                    tripsView === 'lines'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white',
                  )}
                  onClick={() => setTripsView('lines')}
                >
                  Line items
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className={cn(
                    'h-8 px-3 text-xs',
                    tripsView === 'trips'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white',
                  )}
                  onClick={() => setTripsView('trips')}
                >
                  Trips
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (timesheet.employer_id) {
                    setNewTripEmployerId(String(timesheet.employer_id));
                  }
                  setNewTripDate(
                    suggestNextTripDate(
                      timesheet.trips,
                      timesheet.week_start_date,
                      timesheet.week_end_date,
                    ),
                  );
                  setNewTripDistance('0');
                  setAdditionalQuantities({});
                  setCustomPayLines([]);
                  setPayRates({});
                  setPayRateDirty({});
                  setAddTripOpen(true);
                }}
                size='sm'
                className='bg-slate-700 hover:bg-slate-600'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add trip
              </Button>
            </div>
          )}

          {!canManageTrips && (
            <div className='inline-flex rounded-md border border-slate-600 bg-slate-900/50 p-0.5'>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className={cn(
                  'h-8 px-3 text-xs',
                  tripsView === 'lines'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white',
                )}
                onClick={() => setTripsView('lines')}
              >
                Line items
              </Button>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className={cn(
                  'h-8 px-3 text-xs',
                  tripsView === 'trips'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white',
                )}
                onClick={() => setTripsView('trips')}
              >
                Trips
              </Button>
            </div>
          )}

          {tripsView === 'lines' ? (
            <TimesheetLineItemsTable
              timesheet={timesheet}
              taxRules={taxRules}
              canAdjust={canAdjust}
              canManageTrips={canManageTrips}
              onOpenAdjust={openAdjustDialog}
              onDeleteTrip={handleDeleteTrip}
              onFocusTrip={() => setTripsView('trips')}
            />
          ) : trips.length === 0 ? (
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
        <DialogContent className='flex min-h-0 max-h-[min(90vh,880px)] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-slate-800 border-slate-700 p-0 sm:max-w-5xl'>
          <form
            onSubmit={handleAddTrip}
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
          >
            <DialogHeader className='shrink-0 space-y-3 border-b border-slate-700 px-6 py-4 pr-12 text-left'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <DialogTitle className='flex items-center gap-2 text-white'>
                  <Plus className='h-5 w-5' />
                  Add trip
                </DialogTitle>
                <DialogDescription className='max-w-md text-right text-xs text-slate-400'>
                  Rates come from the employer Rate Card.
                </DialogDescription>
              </div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <div className='space-y-1.5 sm:col-span-1'>
                  <Label className='text-slate-300'>Employer</Label>
                  <Select
                    value={newTripEmployerId}
                    onValueChange={setNewTripEmployerId}
                    required
                  >
                    <SelectTrigger className='h-9 bg-slate-700 border-slate-600 text-white'>
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
                <div className='space-y-1.5'>
                  <Label className='text-slate-300'>Trip date</Label>
                  <Input
                    type='date'
                    value={newTripDate}
                    onChange={(e) => setNewTripDate(e.target.value)}
                    min={timesheet?.week_start_date}
                    max={timesheet?.week_end_date}
                    required
                    className='h-9 bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-slate-300'>Trip #</Label>
                  <Input
                    value={newTripNumber}
                    onChange={(e) => setNewTripNumber(e.target.value)}
                    placeholder='Optional'
                    className='h-9 bg-slate-700 border-slate-600 text-white'
                  />
                </div>
              </div>
            </DialogHeader>

            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-6 py-3'>
              <div className='overflow-x-auto rounded-md border border-slate-700'>
                <table className='w-full min-w-[640px] table-fixed border-collapse text-sm'>
                  <thead>
                    <tr className='border-b border-slate-700 bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400'>
                      <th className='w-[28%] px-2 py-2 font-medium'>Pay Item</th>
                      <th className='w-[14%] px-2 py-2 font-medium'>Unit</th>
                      <th className='w-[14%] px-2 py-2 font-medium'>Driver $</th>
                      <th className='w-[14%] px-2 py-2 font-medium'>Agency $</th>
                      <th className='w-[16%] px-2 py-2 font-medium'>Qty</th>
                      <th className='w-10 px-1 py-2' />
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const driverClassCode =
                        timesheet.driver?.driver_class?.code ?? null;
                      const distanceUnit =
                        activeRateConfig?.measurement_unit ?? 'km';
                      const rateCardCharges =
                        activeRateConfig?.additional_charges?.filter(
                          (c) => c.active,
                        ) ?? [];
                      const distanceRateDraft = payRates[
                        DISTANCE_RATE_OVERRIDE_KEY
                      ] ?? { driver_rate: '0', agency_rate: '0' };

                      const updatePayRate = (
                        key: string,
                        patch: Partial<PayRateDraft>,
                      ) => {
                        setPayRateDirty((prev) => ({ ...prev, [key]: true }));
                        setPayRates((prev) => ({
                          ...prev,
                          [key]: {
                            driver_rate: prev[key]?.driver_rate ?? '0',
                            agency_rate: prev[key]?.agency_rate ?? '0',
                            ...patch,
                          },
                        }));
                      };

                      return (
                        <>
                          <tr className='border-b border-slate-700/80'>
                            <td className='px-2 py-1.5 align-middle font-medium text-white'>
                              Distance Pay
                            </td>
                            <td className='px-2 py-1.5 align-middle text-slate-300'>
                              {distanceUnit}
                            </td>
                            <td className='px-2 py-1.5 align-middle'>
                              <Input
                                type='number'
                                step='0.01'
                                value={distanceRateDraft.driver_rate}
                                onChange={(e) =>
                                  updatePayRate(DISTANCE_RATE_OVERRIDE_KEY, {
                                    driver_rate: e.target.value,
                                  })
                                }
                                className='h-8 bg-slate-900 border-slate-600 text-white'
                              />
                            </td>
                            <td className='px-2 py-1.5 align-middle'>
                              <Input
                                type='number'
                                step='0.01'
                                value={distanceRateDraft.agency_rate}
                                onChange={(e) =>
                                  updatePayRate(DISTANCE_RATE_OVERRIDE_KEY, {
                                    agency_rate: e.target.value,
                                  })
                                }
                                className='h-8 bg-slate-900 border-slate-600 text-white'
                              />
                            </td>
                            <td className='px-2 py-1.5 align-middle'>
                              <Input
                                type='number'
                                min={0}
                                step='0.01'
                                value={newTripDistance}
                                onChange={(e) =>
                                  setNewTripDistance(e.target.value)
                                }
                                required
                                placeholder='0'
                                className='h-8 bg-slate-900 border-slate-600 text-white'
                              />
                            </td>
                            <td className='px-1 py-1.5' />
                          </tr>

                          {loadingCharges ? (
                            <tr>
                              <td
                                colSpan={6}
                                className='px-2 py-4 text-center text-sm text-slate-400'
                              >
                                <span className='inline-flex items-center gap-2'>
                                  <Spinner className='h-4 w-4' />
                                  Loading Rate Card items…
                                </span>
                              </td>
                            </tr>
                          ) : (
                            rateCardCharges.map((c) => {
                              const key = c.key ?? c.charge_type;
                              const rateDraft = payRates[key] ?? {
                                driver_rate: String(
                                  resolveClassDriverRate(
                                    c.driver_rate,
                                    c.driver_rates_by_class,
                                    driverClassCode,
                                  ),
                                ),
                                agency_rate: String(
                                  Number(c.agency_rate ?? 0) || 0,
                                ),
                              };
                              return (
                                <tr
                                  key={key}
                                  className='border-b border-slate-700/80'
                                >
                                  <td className='px-2 py-1.5 align-middle text-white'>
                                    {c.charge_type || 'Pay item'}
                                  </td>
                                  <td className='px-2 py-1.5 align-middle text-slate-300'>
                                    {c.unit || '—'}
                                  </td>
                                  <td className='px-2 py-1.5 align-middle'>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      value={rateDraft.driver_rate}
                                      onChange={(e) =>
                                        updatePayRate(key, {
                                          driver_rate: e.target.value,
                                        })
                                      }
                                      className='h-8 bg-slate-900 border-slate-600 text-white'
                                    />
                                  </td>
                                  <td className='px-2 py-1.5 align-middle'>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      value={rateDraft.agency_rate}
                                      onChange={(e) =>
                                        updatePayRate(key, {
                                          agency_rate: e.target.value,
                                        })
                                      }
                                      className='h-8 bg-slate-900 border-slate-600 text-white'
                                    />
                                  </td>
                                  <td className='px-2 py-1.5 align-middle'>
                                    <Input
                                      type='number'
                                      min={0}
                                      step='0.01'
                                      value={additionalQuantities[key] ?? ''}
                                      onChange={(e) =>
                                        setAdditionalQuantities((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                      placeholder='0'
                                      className='h-8 bg-slate-900 border-slate-600 text-white'
                                    />
                                  </td>
                                  <td className='px-1 py-1.5' />
                                </tr>
                              );
                            })
                          )}

                          {customPayLines.map((line) => (
                            <tr
                              key={line.id}
                              className='border-b border-slate-700/80 last:border-0'
                            >
                              <td className='px-2 py-1.5 align-middle'>
                                <Input
                                  value={line.label}
                                  onChange={(e) =>
                                    setCustomPayLines((prev) =>
                                      prev.map((row) =>
                                        row.id === line.id
                                          ? { ...row, label: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                  placeholder='Pay item'
                                  className='h-8 bg-slate-900 border-slate-600 text-white'
                                />
                              </td>
                              <td className='px-2 py-1.5 align-middle'>
                                <Input
                                  value={line.unit}
                                  onChange={(e) =>
                                    setCustomPayLines((prev) =>
                                      prev.map((row) =>
                                        row.id === line.id
                                          ? { ...row, unit: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                  placeholder='ea'
                                  className='h-8 bg-slate-900 border-slate-600 text-white'
                                />
                              </td>
                              <td className='px-2 py-1.5 align-middle'>
                                <Input
                                  type='number'
                                  step='0.01'
                                  value={line.driver_rate}
                                  onChange={(e) =>
                                    setCustomPayLines((prev) =>
                                      prev.map((row) =>
                                        row.id === line.id
                                          ? {
                                              ...row,
                                              driver_rate: e.target.value,
                                            }
                                          : row,
                                      ),
                                    )
                                  }
                                  className='h-8 bg-slate-900 border-slate-600 text-white'
                                />
                              </td>
                              <td className='px-2 py-1.5 align-middle'>
                                <Input
                                  type='number'
                                  step='0.01'
                                  value={line.agency_rate}
                                  onChange={(e) =>
                                    setCustomPayLines((prev) =>
                                      prev.map((row) =>
                                        row.id === line.id
                                          ? {
                                              ...row,
                                              agency_rate: e.target.value,
                                            }
                                          : row,
                                      ),
                                    )
                                  }
                                  className='h-8 bg-slate-900 border-slate-600 text-white'
                                />
                              </td>
                              <td className='px-2 py-1.5 align-middle'>
                                <Input
                                  type='number'
                                  min={0}
                                  step='0.01'
                                  value={line.quantity}
                                  onChange={(e) =>
                                    setCustomPayLines((prev) =>
                                      prev.map((row) =>
                                        row.id === line.id
                                          ? {
                                              ...row,
                                              quantity: e.target.value,
                                            }
                                          : row,
                                      ),
                                    )
                                  }
                                  className='h-8 bg-slate-900 border-slate-600 text-white'
                                />
                              </td>
                              <td className='px-1 py-1.5 align-middle'>
                                <Button
                                  type='button'
                                  size='icon'
                                  variant='ghost'
                                  title='Remove'
                                  className='h-7 w-7 text-slate-400 hover:text-destructive'
                                  onClick={() =>
                                    setCustomPayLines((prev) =>
                                      prev.filter((row) => row.id !== line.id),
                                    )
                                  }
                                >
                                  <Trash2 className='h-3.5 w-3.5' />
                                </Button>
                              </td>
                            </tr>
                          ))}

                          {!loadingCharges &&
                          rateCardCharges.length === 0 &&
                          customPayLines.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className='px-2 py-3 text-center text-xs text-slate-500'
                              >
                                {newTripEmployerId && newTripDate
                                  ? 'No Rate Card add-ons for this date. Use Add pay item for extras.'
                                  : 'Select employer and date to load Rate Card items.'}
                              </td>
                            </tr>
                          ) : null}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 text-slate-300 hover:text-white'
                onClick={() =>
                  setCustomPayLines((prev) => [
                    ...prev,
                    createCustomPayLineDraft(),
                  ])
                }
              >
                <PlusCircle className='h-4 w-4' />
                Add pay item
              </Button>
              <div className='space-y-1.5'>
                <Label className='text-slate-300'>Notes</Label>
                <Input
                  value={newTripNotes}
                  onChange={(e) => setNewTripNotes(e.target.value)}
                  placeholder='Optional'
                  className='h-9 bg-slate-700 border-slate-600 text-white'
                />
              </div>
            </div>

            <DialogFooter className='shrink-0 gap-2 border-t border-slate-700 px-6 py-4 sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setAddTripOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={saving}
                className='bg-emerald-600 text-white hover:bg-emerald-500'
              >
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
        <DialogContent className='flex min-h-0 max-h-[min(90vh,880px)] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-slate-800 border-slate-700 p-0 sm:max-w-5xl'>
          <DialogHeader className='shrink-0 space-y-3 border-b border-slate-700 px-6 py-4 pr-12 text-left'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <DialogTitle className='flex items-center gap-2 text-white'>
                <PencilLine className='h-5 w-5' />
                Manual adjustment
              </DialogTitle>
              <DialogDescription
                className='max-w-md text-right text-xs text-slate-400'
                title='Overrides Rate Card pricing until the trip is adjusted again.'
              >
                Match the employer invoice. Protected from rate-card overwrite.
              </DialogDescription>
            </div>
            {adjustTrip && (
              <div className='flex flex-wrap items-center gap-2 text-sm text-slate-300'>
                <span className='font-medium text-white'>
                  Trip #{adjustTrip.trip_number || adjustTrip.id}
                </span>
                <span className='text-slate-600'>·</span>
                <span>
                  {adjustTrip.employer?.name ??
                    `Employer #${adjustTrip.employer_id}`}
                </span>
                <span className='text-slate-600'>·</span>
                <span>{formatDate(adjustTrip.trip_date)}</span>
                {adjustTrip.is_adjusted ? (
                  <Badge
                    variant='outline'
                    className='border-amber-600/60 bg-amber-950/40 text-amber-200'
                  >
                    Adjusted
                  </Badge>
                ) : null}
              </div>
            )}
            <div className='space-y-1.5'>
              <Label htmlFor='adjust-reason' className='text-slate-300'>
                Reason
              </Label>
              <Input
                id='adjust-reason'
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder='e.g. Invoice mismatch, correction'
                className='h-9 bg-slate-700 border-slate-600 text-white'
              />
            </div>
          </DialogHeader>

          <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-3'>
            <div className='overflow-x-auto rounded-md border border-slate-700'>
              <table className='w-full min-w-[640px] table-fixed border-collapse text-sm'>
                <thead>
                  <tr className='border-b border-slate-700 bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400'>
                    <th className='w-[26%] px-2 py-2 font-medium'>Pay Item</th>
                    <th className='w-[10%] px-2 py-2 font-medium'>Qty</th>
                    <th className='w-[16%] px-2 py-2 font-medium'>Unit</th>
                    <th className='w-[14%] px-2 py-2 font-medium'>Driver $</th>
                    <th className='w-[14%] px-2 py-2 font-medium'>Agency $</th>
                    <th className='w-[14%] px-2 py-2 text-right font-medium'>Pay</th>
                    <th className='w-10 px-1 py-2' />
                  </tr>
                </thead>
                <tbody>
                  {adjustmentDraft.lines.map((line) => {
                    const amounts = computeLineAmounts(line);
                    const labelInvalid =
                      adjustShowErrors && !line.label.trim();
                    return (
                      <tr
                        key={line.id}
                        className='border-b border-slate-700/80 last:border-0'
                      >
                        <td className='px-2 py-1.5 align-middle'>
                          <Input
                            value={line.label}
                            onChange={(e) =>
                              updateAdjustmentLine(line.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder='Pay item'
                            className={cn(
                              'h-8 bg-slate-900 border-slate-600 text-white',
                              labelInvalid &&
                                'border-destructive focus-visible:ring-destructive',
                            )}
                            aria-invalid={labelInvalid}
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle'>
                          <Input
                            type='number'
                            min={0}
                            step='0.01'
                            value={line.quantity}
                            onChange={(e) =>
                              updateAdjustmentLine(line.id, {
                                quantity: e.target.value,
                              })
                            }
                            className='h-8 bg-slate-900 border-slate-600 text-white'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle'>
                          <Input
                            value={line.unit}
                            onChange={(e) =>
                              updateAdjustmentLine(line.id, {
                                unit: e.target.value,
                              })
                            }
                            placeholder='km'
                            className='h-8 bg-slate-900 border-slate-600 text-white'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle'>
                          <Input
                            type='number'
                            step='0.01'
                            value={line.rate}
                            onChange={(e) =>
                              updateAdjustmentLine(line.id, {
                                rate: e.target.value,
                              })
                            }
                            className='h-8 bg-slate-900 border-slate-600 text-white'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle'>
                          <Input
                            type='number'
                            step='0.01'
                            value={line.agency_rate}
                            onChange={(e) =>
                              updateAdjustmentLine(line.id, {
                                agency_rate: e.target.value,
                              })
                            }
                            className='h-8 bg-slate-900 border-slate-600 text-white'
                          />
                        </td>
                        <td className='px-2 py-1.5 align-middle text-right tabular-nums text-white'>
                          {formatMoney(amounts.driverAmount)}
                        </td>
                        <td className='px-1 py-1.5 align-middle'>
                          <Button
                            type='button'
                            size='icon'
                            variant='ghost'
                            title='Remove line'
                            className='h-7 w-7 text-slate-400 hover:text-destructive'
                            onClick={() =>
                              setAdjustmentDraft((prev) => ({
                                ...prev,
                                lines:
                                  prev.lines.length > 1
                                    ? prev.lines.filter(
                                        (current) => current.id !== line.id,
                                      )
                                    : [createAdjustmentLine()],
                              }))
                            }
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='mt-2 h-8 text-slate-300 hover:text-white'
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

          <DialogFooter className='shrink-0 flex-col gap-3 border-t border-slate-700 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300'>
              <span>
                Driver{' '}
                <span className='font-semibold tabular-nums text-white'>
                  {formatMoney(adjustmentDriverTotal)}
                </span>
              </span>
              <span>
                Agency{' '}
                <span className='font-semibold tabular-nums text-white'>
                  {formatMoney(adjustmentAgencyTotal)}
                </span>
              </span>
            </div>
            <div className='flex w-full gap-2 sm:w-auto'>
              <Button
                type='button'
                variant='outline'
                className='flex-1 cursor-pointer sm:flex-none'
                onClick={() => setAdjustOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type='button'
                className='flex-1 bg-emerald-600 text-white hover:bg-emerald-500 sm:flex-none'
                onClick={() => void submitAdjustment()}
                disabled={saving || !adjustTrip}
              >
                {saving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
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

  const snapshot = effectiveTripSnapshot(trip);
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
