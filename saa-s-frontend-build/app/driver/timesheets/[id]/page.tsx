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
  ArrowLeft,
  Plus,
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
  RateCard,
  RateCardRatesConfig,
} from '@/lib/types';
import { toast } from 'sonner';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { DriverTimesheetDocumentsCard } from '@/components/driver/driver-timesheet-documents-card';
import { TimesheetStatusBadge } from '@/components/timesheet-status-badge';
import {
  suggestNextTripDate,
  resolveClassDriverRate,
  resolveDistanceBandRates,
  DISTANCE_RATE_OVERRIDE_KEY,
  type PayRateDraft,
} from '@/lib/timesheet-lines';

const TOOLBAR_BTN = 'h-8 shrink-0 gap-1 px-2.5 text-xs font-medium';
const TOOLBAR_SECONDARY =
  'h-8 shrink-0 gap-1 px-2.5 text-xs font-medium border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white';

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
  const [addTripStep, setAddTripStep] = useState<'date' | 'details'>('date');
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
  const [payRates, setPayRates] = useState<Record<string, PayRateDraft>>({});

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

  // Keep trip employer locked to the timesheet employer.
  useEffect(() => {
    if (timesheet?.employer_id) {
      setNewTripEmployerId(String(timesheet.employer_id));
    }
  }, [timesheet?.employer_id]);

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
        const date = new Date(`${newTripDate}T12:00:00`);
        const active = cards.find((c) => {
          if (c.status !== 'active' && c.status !== 'scheduled') return false;
          const from = c.effective_from
            ? new Date(`${String(c.effective_from).slice(0, 10)}T12:00:00`)
            : null;
          const to = c.effective_to
            ? new Date(`${String(c.effective_to).slice(0, 10)}T12:00:00`)
            : null;
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

    void load();
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
    // Drivers cannot override rates — always sync from the rate card.
    setPayRates(() => {
      const next: Record<string, PayRateDraft> = {
        [DISTANCE_RATE_OVERRIDE_KEY]: {
          driver_rate: String(distanceRates.driverRate),
          agency_rate: String(distanceRates.agencyRate),
        },
      };
      for (const c of activeRateConfig.additional_charges ?? []) {
        if (!c.active) continue;
        const key = c.key ?? c.charge_type;
        if (!key) continue;
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
  }, [activeRateConfig, newTripDistance, timesheet?.driver?.driver_class?.code]);

  const canEdit = timesheet?.status === 'draft'; // Only drivers can edit when draft; admin can edit when submitted/under_review (separate page)
  const canSubmit = timesheet?.status === 'draft';

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const employerId =
      newTripEmployerId ||
      (timesheet?.employer_id ? String(timesheet.employer_id) : '');
    const distance = parseFloat(newTripDistance);
    if (!id || !employerId || !newTripDate || isNaN(distance) || distance < 0)
      return;
    setSaving(true);
    try {
      const additional_quantities = Object.fromEntries(
        Object.entries(additionalQuantities)
          .map(([key, val]) => [key, Number(val)] as const)
          .filter(([, num]) => Number.isFinite(num) && num > 0),
      ) as Record<string, number>;

      await apiClient.createTimesheetTrip(id, {
        employer_id: parseInt(employerId, 10),
        trip_date: newTripDate,
        trip_number: newTripNumber || undefined,
        distance,
        notes: newTripNotes || undefined,
        additional_quantities,
      });
      await fetchTimesheet();
      setAddTripOpen(false);
      setAddTripStep('date');
      setNewTripEmployerId(employerId);
      setNewTripDate('');
      setNewTripNumber('');
      setNewTripDistance('0');
      setNewTripNotes('');
      setAdditionalQuantities({});
      setPayRates({});
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
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Button
          variant='ghost'
          asChild
          className='h-8 -ml-2 w-fit px-2 text-xs text-slate-300 hover:text-white'
        >
          <Link href='/driver/timesheets' className='flex items-center gap-1.5'>
            <ArrowLeft className='h-3.5 w-3.5' />
            Back to timesheets
          </Link>
        </Button>
        <div className='flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5'>
          <TimesheetStatusBadge
            status={timesheet.status}
            adjusted={Boolean(timesheet.adjusted_at)}
            driverReviewStatus={
              timesheet.latest_document_review?.status ??
              timesheet.document_reviews?.[0]?.status ??
              null
            }
            driverReviewLabel={
              timesheet.latest_document_review?.status_label ??
              timesheet.document_reviews?.[0]?.status_label ??
              null
            }
          />
          {canSubmit && (
            <Button
              size='sm'
              onClick={handleSubmit}
              disabled={
                submitting ||
                (trips.length === 0 &&
                  (timesheet.documents?.length ?? 0) === 0)
              }
              className={cn(
                TOOLBAR_BTN,
                'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
            >
              {submitting ? (
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <Send className='h-3.5 w-3.5' />
              )}
              Submit
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
            {timesheet.employer?.name
              ? `Customer: ${timesheet.employer.name} — `
              : ''}
            Weekly total:{' '}
            <span className='font-semibold text-white'>
              ${Number(weeklyTotal).toFixed(2)}
            </span>
          </p>
          {timesheet.reject_reason ? (
            <Alert variant='destructive' className='mt-3'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Admin rejected this timesheet. Please update trips and submit
                again. Reason: {timesheet.reject_reason}
              </AlertDescription>
            </Alert>
          ) : null}
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
                  if (timesheet.employer_id) {
                    setNewTripEmployerId(String(timesheet.employer_id));
                  }
                  // No trips yet → week start; otherwise day after last trip.
                  setNewTripDate(
                    suggestNextTripDate(
                      timesheet.trips,
                      timesheet.week_start_date,
                      timesheet.week_end_date,
                    ),
                  );
                  setNewTripNumber('');
                  setNewTripDistance('0');
                  setNewTripNotes('');
                  setAdditionalQuantities({});
                  setPayRates({});
                  setAddTripStep('date');
                  setAddTripOpen(true);
                }}
                size='sm'
                className='bg-slate-700 hover:bg-slate-600 text-white'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add trip
              </Button>
            </div>
          )}

          {trips.length === 0 ? (
            <p className='text-slate-400 py-8 text-center border border-dashed border-slate-600 rounded-md'>
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

      <DriverTimesheetDocumentsCard
        timesheetId={timesheet.id}
        documents={timesheet.documents ?? []}
        canUpload={timesheet.status !== 'paid'}
        onDocumentsChange={fetchTimesheet}
      />

      {/* Add trip — step 1: date, step 2: pay item quantities */}
      <Dialog
        open={addTripOpen}
        onOpenChange={(open) => {
          setAddTripOpen(open);
          if (!open) setAddTripStep('date');
        }}
      >
        <DialogContent
          className={cn(
            'bg-slate-800 border-slate-700',
            addTripStep === 'date'
              ? 'w-[calc(100%-1.5rem)] max-w-md sm:max-w-md'
              : 'flex min-h-0 max-h-[min(90vh,880px)] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl',
          )}
        >
          {addTripStep === 'date' ? (
            <>
              <DialogHeader className='text-left'>
                <DialogTitle className='flex items-center gap-2 text-white'>
                  <Plus className='h-5 w-5' />
                  Add trip
                </DialogTitle>
                <DialogDescription className='text-slate-400'>
                  Choose the trip date first. Pay items from the Rate Card will
                  open next.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-2'>
                <div className='space-y-1.5'>
                  <Label className='text-slate-300'>Customer</Label>
                  <Input
                    value={
                      timesheet?.employer?.name ??
                      employers.find((e) => String(e.id) === newTripEmployerId)
                        ?.name ??
                      ''
                    }
                    readOnly
                    className='h-9 bg-slate-700/60 border-slate-600 text-white'
                  />
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
              <DialogFooter className='gap-2 sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setAddTripOpen(false)}
                  className={TOOLBAR_SECONDARY}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  disabled={!newTripDate}
                  onClick={() => {
                    setNewTripDistance('0');
                    setAdditionalQuantities({});
                    setNewTripNotes('');
                    setAddTripStep('details');
                  }}
                  className='bg-emerald-600 text-white hover:bg-emerald-500'
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form
              onSubmit={handleAddTrip}
              className='flex min-h-0 flex-1 flex-col overflow-hidden'
            >
              <DialogHeader className='shrink-0 space-y-3 border-b border-slate-700 px-6 py-4 pr-12 text-left'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <DialogTitle className='flex items-center gap-2 text-white'>
                    <Plus className='h-5 w-5' />
                    Trip details
                  </DialogTitle>
                  <DialogDescription className='max-w-md text-right text-xs text-slate-400'>
                    Enter quantities only. Rates come from the customer Rate
                    Card.
                  </DialogDescription>
                </div>
                <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300'>
                  <span>
                    <span className='text-slate-500'>Customer: </span>
                    {timesheet?.employer?.name ?? '—'}
                  </span>
                  <span>
                    <span className='text-slate-500'>Date: </span>
                    {newTripDate ? formatDate(newTripDate) : '—'}
                  </span>
                  {newTripNumber ? (
                    <span>
                      <span className='text-slate-500'>Trip #: </span>
                      {newTripNumber}
                    </span>
                  ) : null}
                </div>
              </DialogHeader>

              <div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-6 py-3'>
                <div className='overflow-x-auto rounded-md border border-slate-700'>
                  <table className='w-full min-w-[640px] table-fixed border-collapse text-sm'>
                    <thead>
                      <tr className='border-b border-slate-700 bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400'>
                        <th className='w-[36%] px-2 py-2 font-medium'>
                          Pay Item
                        </th>
                        <th className='w-[18%] px-2 py-2 font-medium'>Unit</th>
                        <th className='w-[18%] px-2 py-2 font-medium'>Rate</th>
                        <th className='w-[20%] px-2 py-2 font-medium'>Qty</th>
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

                        return (
                          <>
                            <tr className='border-b border-slate-700/80'>
                              <td className='px-2 py-1.5 align-middle font-medium text-white'>
                                Distance
                              </td>
                              <td className='px-2 py-1.5 align-middle text-slate-300'>
                                {distanceUnit}
                              </td>
                              <td className='px-2 py-1.5 align-middle text-slate-200'>
                                $
                                {Number(distanceRateDraft.driver_rate).toFixed(
                                  2,
                                )}
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
                            </tr>

                            {loadingCharges ? (
                              <tr>
                                <td
                                  colSpan={4}
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
                                    <td className='px-2 py-1.5 align-middle text-slate-200'>
                                      $
                                      {Number(rateDraft.driver_rate).toFixed(2)}
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
                                  </tr>
                                );
                              })
                            )}

                            {!loadingCharges &&
                            rateCardCharges.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className='px-2 py-3 text-center text-xs text-slate-500'
                                >
                                  No Rate Card add-ons for this customer/date.
                                </td>
                              </tr>
                            ) : null}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
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
                  onClick={() => setAddTripStep('date')}
                  disabled={saving}
                  className={TOOLBAR_SECONDARY}
                >
                  Back
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
          )}
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
              — {trip.employer?.name ?? `Customer #${trip.employer_id}`}
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
              className='text-red-400 hover:text-red-300 hover:bg-slate-700'
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
