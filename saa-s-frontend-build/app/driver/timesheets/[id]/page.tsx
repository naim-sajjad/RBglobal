'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  PlusCircle,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Send,
  Save,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  Timesheet,
  TimesheetTrip,
  Employer,
  TimesheetStatus,
  RateCard,
  RateCardRatesConfig,
} from '@/lib/types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import {
  suggestNextTripDate,
  resolveClassDriverRate,
  resolveDistanceBandRates,
  createCustomPayLineDraft,
  DISTANCE_RATE_OVERRIDE_KEY,
  type CustomPayLineDraft,
  type PayRateDraft,
} from '@/lib/timesheet-lines';

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

export default function DriverTimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addTripOpen, setAddTripOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTripId, setUpdatingTripId] = useState<number | null>(null);

  // Add trip form (contract-driven: distance + per-pay-item quantities from Rate Card)
  const [newTripEmployerId, setNewTripEmployerId] = useState<string>('');
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

  const fetchEmployers = async () => {
    try {
      const data = await apiClient.getEmployers({ status: 'active' });
      setEmployers(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setEmployers([]);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchTimesheet(), fetchEmployers()]).finally(() =>
        setLoading(false),
      );
    }
  }, [id, fetchTimesheet]);

  // When employer or trip date changes, load that employer's rate cards and pick the active one for the date
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

  const canEdit = timesheet?.status === 'draft'; // Only drivers can edit when draft; admin can edit when submitted/under_review (separate page)
  const canSubmit = timesheet?.status === 'draft';

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
      setNewTripEmployerId('');
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
    data: Partial<{ distance: number; notes: string }>,
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
    if (!id || !confirm('Remove this trip and all its pay items?')) return;
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

  const handleSubmit = async () => {
    if (!id || !canSubmit) return;
    setSubmitting(true);
    try {
      await apiClient.submitTimesheet(id);
      await fetchTimesheet();
      toast.success('Timesheet submitted');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to submit'));
    } finally {
      setSubmitting(false);
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

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <Button
          variant='ghost'
          asChild
          className='text-slate-300 hover:text-white'
        >
          <Link href='/driver/timesheets' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to timesheets
          </Link>
        </Button>
        <div className='flex items-center gap-2 flex-wrap'>
          <Badge className={STATUS_COLORS[timesheet.status]}>
            {timesheet.status.replace('_', ' ')}
          </Badge>
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || trips.length === 0}
            >
              {submitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4 mr-1' />
              )}
              Submit to employer
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
          <p className='text-sm text-slate-400'>
            Weekly total:{' '}
            <span className='font-semibold text-white'>
              ${Number(weeklyTotal).toFixed(2)}
            </span>
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {canEdit && (
            <div className='flex gap-2'>
              <Button
                onClick={() => {
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
              >
                <Plus className='h-4 w-4 mr-2' />
                Add trip
              </Button>
            </div>
          )}

          {trips.length === 0 ? (
            <p className='text-slate-400 py-8 text-center'>
              No trips yet. Add a trip to start logging pay items.
            </p>
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
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        canEdit={canEdit}
                        timesheetId={id}
                        updatingTripId={updatingTripId}
                        onUpdateTrip={handleUpdateTrip}
                        onDeleteTrip={handleDeleteTrip}
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

      {/* Add trip dialog */}
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
    </div>
  );
}

function TripCard({
  trip,
  canEdit,
  timesheetId,
  updatingTripId,
  onUpdateTrip,
  onDeleteTrip,
}: {
  trip: TimesheetTrip;
  canEdit: boolean;
  timesheetId: string;
  updatingTripId: number | null;
  onUpdateTrip: (
    tripId: number,
    data: Partial<{ distance: number; notes: string }>,
  ) => void;
  onDeleteTrip: (tripId: number) => void;
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
      onUpdateTrip(trip.id, { distance, notes: localNotes || undefined });
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
            {trip.minimum_applied && (
              <Badge variant='secondary' className='text-xs'>
                Min pay applied
              </Badge>
            )}
          </div>
          {canEdit && (
            <Button
              variant='ghost'
              size='sm'
              className='text-destructive hover:text-destructive'
              onClick={() => onDeleteTrip(trip.id)}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0 space-y-4'>
        <div className='grid grid-cols-2 sm:grid-cols-2 gap-2 text-sm'>
          <div>
            <span className='text-slate-400'>Distance</span>
            {canEdit ? (
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
        {canEdit && (
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
              {/* {trip.total_agency_billing != null && trip.total_agency_billing > 0 && (
                <span className="text-slate-400 ml-2">Agency: ${Number(trip.total_agency_billing).toFixed(2)}</span>
              )} */}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
