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
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Send,
  Save,
  Loader2,
  Calculator,
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

const STATUS_COLORS: Record<TimesheetStatus, string> = {
  draft: 'bg-slate-500',
  submitted: 'bg-blue-500',
  under_review: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  paid: 'bg-emerald-600',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
  const [newTripDistance, setNewTripDistance] = useState('');
  const [newTripNotes, setNewTripNotes] = useState('');
  const [employerRateCards, setEmployerRateCards] = useState<Record<number, RateCard[]>>({});
  const [activeRateConfig, setActiveRateConfig] = useState<RateCardRatesConfig | null>(null);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [additionalQuantities, setAdditionalQuantities] = useState<Record<string, string>>({});

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
      setEmployers(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      setEmployers([]);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchTimesheet(), fetchEmployers()]).finally(() => setLoading(false));
    }
  }, [id, fetchTimesheet]);

  // When employer or trip date changes, load that employer's rate cards and pick the active one for the date
  useEffect(() => {
    const employerNumeric = newTripEmployerId ? Number(newTripEmployerId) : null;
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
          cards = Array.isArray(data) ? data : data?.data ?? [];
          setEmployerRateCards((prev) => ({ ...prev, [employerNumeric]: cards }));
        }
        const date = new Date(newTripDate);
        const active = cards.find((c) => {
          if (c.status !== 'active') return false;
          const from = c.effective_from ? new Date(c.effective_from) : null;
          const to = c.effective_to ? new Date(c.effective_to) : null;
          const inRange =
            (!from || date >= from) &&
            (!to || date <= to);
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

  const canEdit = timesheet?.status === 'draft'; // Only drivers can edit when draft; admin can edit when submitted/under_review (separate page)
  const canSubmit = timesheet?.status === 'draft';

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const distance = parseFloat(newTripDistance);
    if (!id || !newTripEmployerId || !newTripDate || isNaN(distance) || distance < 0) return;
    setSaving(true);
    try {
      const additional_quantities: Record<string, number> = Object.fromEntries(
        Object.entries(additionalQuantities)
          .map(([key, val]) => [key, parseFloat(val)])
          .filter(([, num]) => !isNaN(num) && num > 0)
      );

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
    data: Partial<{ distance: number; notes: string }>
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
      <div className="flex justify-center items-center min-h-[200px]">
        {loading ? <Spinner className="h-8 w-8 text-white" /> : <p className="text-slate-400">{error || 'Not found'}</p>}
      </div>
    );
  }

  const trips = timesheet.trips ?? [];
  const tripsByDate = trips.reduce<Record<string, TimesheetTrip[]>>((acc, t) => {
    const d = t.trip_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});
  const sortedDates = Object.keys(tripsByDate).sort();
  const dailyTotals = sortedDates.map((d) => ({
    date: d,
    total: tripsByDate[d].reduce((sum, t) => sum + Number(t.trip_total || 0), 0),
  }));
  const weeklyTotal = typeof timesheet.weekly_total === 'number' ? timesheet.weekly_total : dailyTotals.reduce((s, d) => s + d.total, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="ghost" asChild className="text-slate-300 hover:text-white">
          <Link href="/driver/timesheets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to timesheets
          </Link>
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={STATUS_COLORS[timesheet.status]}>{timesheet.status.replace('_', ' ')}</Badge>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={saving}
              className="border-slate-600 text-slate-200"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4 mr-1" />}
              Recalculate
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={submitting || trips.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Submit to employer
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileSpreadsheet className="h-6 w-6" />
            {formatDate(timesheet.week_start_date)} – {formatDate(timesheet.week_end_date)}
          </CardTitle>
          <p className="text-sm text-slate-400">
            Weekly total: <span className="font-semibold text-white">${Number(weeklyTotal).toFixed(2)}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {canEdit && (
            <div className="flex gap-2">
              <Button onClick={() => setAddTripOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add trip
              </Button>
            </div>
          )}

          {trips.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">
              No trips yet. Add a trip to start logging pay items.
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => (
                <div key={dateStr}>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">
                    {formatDate(dateStr)} — Daily total: ${dailyTotals.find((d) => d.date === dateStr)?.total.toFixed(2) ?? '0.00'}
                  </h3>
                  <div className="space-y-4">
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

              <div className="border-t border-slate-700 pt-4 flex justify-end">
                <p className="text-lg font-semibold text-white">
                  Weekly total: ${Number(weeklyTotal).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add trip dialog */}
      <Dialog open={addTripOpen} onOpenChange={setAddTripOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl w-full max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Add trip</DialogTitle>
            <DialogDescription className="text-slate-400">Rates are calculated from the employer&apos;s Rate Card. Enter trip details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTrip} className="space-y-4 flex flex-col overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label className="text-slate-300">Employer</Label>
              <Select value={newTripEmployerId} onValueChange={setNewTripEmployerId} required>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select employer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {employers.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Trip date</Label>
              <Input
                type="date"
                value={newTripDate}
                onChange={(e) => setNewTripDate(e.target.value)}
                min={timesheet?.week_start_date}
                max={timesheet?.week_end_date}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Trip number (optional)</Label>
              <Input
                value={newTripNumber}
                onChange={(e) => setNewTripNumber(e.target.value)}
                placeholder="e.g. 101"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Distance *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newTripDistance}
                onChange={(e) => setNewTripDistance(e.target.value)}
                required
                placeholder="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">
                Additional charges for this employer come from the active Rate Card. Enter quantities for each pay item.
              </p>
              {loadingCharges ? (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Spinner className="h-4 w-4" />
                  Loading additional charges...
                </div>
              ) : activeRateConfig && activeRateConfig.additional_charges && activeRateConfig.additional_charges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeRateConfig.additional_charges
                    .filter((c) => c.active)
                    .map((c) => (
                      <div key={c.key ?? c.charge_type} className="space-y-2">
                        <Label className="text-slate-300">
                          {c.charge_type || 'Pay item'} {c.unit ? `(${c.unit})` : ''}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={c.unit === 'per_hour' ? '0.01' : '1'}
                          value={additionalQuantities[c.key ?? c.charge_type] ?? ''}
                          onChange={(e) =>
                            setAdditionalQuantities((prev) => ({
                              ...prev,
                              [c.key ?? c.charge_type]: e.target.value,
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    ))}
                </div>
              ) : newTripEmployerId && newTripDate ? (
                <p className="text-slate-500 text-sm">No additional charges defined on the active Rate Card for this date.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Notes (optional)</Label>
              <Input
                value={newTripNotes}
                onChange={(e) => setNewTripNotes(e.target.value)}
                placeholder="Notes"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <DialogFooter className="mt-4 border-t border-slate-700 pt-4 sticky bottom-0 bg-slate-800">
              <Button type="button" variant="outline" onClick={() => setAddTripOpen(false)} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add trip'}
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
  onUpdateTrip: (tripId: number, data: Partial<{ distance: number; notes: string }>) => void;
  onDeleteTrip: (tripId: number) => void;
}) {
  const [localDistance, setLocalDistance] = useState(String(trip.distance ?? 0));
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
    <Card className="border-l-4 border-l-slate-500 bg-slate-800 border-slate-700">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">Trip #{trip.trip_number || trip.id}</span>
            <span className="text-slate-400">— {trip.employer?.name ?? `Employer #${trip.employer_id}`}</span>
            {trip.minimum_applied && (
              <Badge variant="secondary" className="text-xs">Min pay applied</Badge>
            )}
          </div>
          {canEdit && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDeleteTrip(trip.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-400">Distance</span>
            {canEdit ? (
              <Input type="number" min={0} step="0.01" value={localDistance} onChange={(e) => setLocalDistance(e.target.value)} onBlur={handleBlur} className="mt-1 h-8 bg-slate-700 border-slate-600 text-white" />
            ) : (
              <p className="text-white font-medium">{trip.distance ?? 0}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div>
            <span className="text-slate-400 text-sm">Notes</span>
            <Input value={localNotes} onChange={(e) => setLocalNotes(e.target.value)} onBlur={handleBlur} placeholder="Optional" className="mt-1 bg-slate-700 border-slate-600 text-white" />
          </div>
        )}
        {snapshot?.error && (
          <p className="text-amber-400 text-sm">{snapshot.error}</p>
        )}
        {lines.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Item</TableHead>
                <TableHead className="text-slate-300">Qty</TableHead>
                <TableHead className="text-slate-300">Rate</TableHead>
                <TableHead className="text-slate-300 text-right">Driver pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx} className="border-slate-700">
                  <TableCell className="text-white">{line.label}</TableCell>
                  <TableCell className="text-white">{line.quantity}</TableCell>
                  <TableCell className="text-white">${Number(line.rate).toFixed(2)}</TableCell>
                  <TableCell className="text-white text-right">${Number(line.driver_amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
          <span className="text-slate-400 text-sm">Rates from Rate Card (read-only)</span>
          {isUpdating ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <p className="font-medium text-white">
              Trip total: ${Number(trip.trip_total ?? 0).toFixed(2)}
              {trip.total_agency_billing != null && trip.total_agency_billing > 0 && (
                <span className="text-slate-400 ml-2">Agency: ${Number(trip.total_agency_billing).toFixed(2)}</span>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
