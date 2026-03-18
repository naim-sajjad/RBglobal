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

  // Add trip form (contract-driven: distance, stops, delay, handbomb from Rate Card)
  const [newTripEmployerId, setNewTripEmployerId] = useState<string>('');
  const [newTripDate, setNewTripDate] = useState('');
  const [newTripNumber, setNewTripNumber] = useState('');
  const [newTripDistance, setNewTripDistance] = useState('');
  const [newTripStopsCount, setNewTripStopsCount] = useState('0');
  const [newTripDelayHours, setNewTripDelayHours] = useState('0');
  const [newTripHandbombCount, setNewTripHandbombCount] = useState('0');
  const [newTripNotes, setNewTripNotes] = useState('');

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

  const canEdit = timesheet?.status === 'draft'; // Only drivers can edit when draft; admin can edit when submitted/under_review (separate page)
  const canSubmit = timesheet?.status === 'draft';

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const distance = parseFloat(newTripDistance);
    if (!id || !newTripEmployerId || !newTripDate || isNaN(distance) || distance < 0) return;
    setSaving(true);
    try {
      await apiClient.createTimesheetTrip(id, {
        employer_id: parseInt(newTripEmployerId, 10),
        trip_date: newTripDate,
        trip_number: newTripNumber || undefined,
        distance,
        stops_count: parseInt(newTripStopsCount, 10) || 0,
        delay_hours: parseFloat(newTripDelayHours) || 0,
        handbomb_count: parseInt(newTripHandbombCount, 10) || 0,
        notes: newTripNotes || undefined,
      });
      await fetchTimesheet();
      setAddTripOpen(false);
      setNewTripEmployerId('');
      setNewTripDate('');
      setNewTripNumber('');
      setNewTripDistance('');
      setNewTripStopsCount('0');
      setNewTripDelayHours('0');
      setNewTripHandbombCount('0');
      setNewTripNotes('');
      toast.success('Trip added');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to add trip'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTrip = async (
    tripId: number,
    data: Partial<{ distance: number; stops_count: number; delay_hours: number; handbomb_count: number; notes: string }>
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
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add trip</DialogTitle>
            <DialogDescription className="text-slate-400">Rates are calculated from the employer&apos;s Rate Card. Enter trip details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTrip} className="space-y-4">
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Stops</Label>
                <Input
                  type="number"
                  min={0}
                  value={newTripStopsCount}
                  onChange={(e) => setNewTripStopsCount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Delay (hrs)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTripDelayHours}
                  onChange={(e) => setNewTripDelayHours(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Handbomb</Label>
                <Input
                  type="number"
                  min={0}
                  value={newTripHandbombCount}
                  onChange={(e) => setNewTripHandbombCount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
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
            <DialogFooter>
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
  onUpdateTrip: (tripId: number, data: Partial<{ distance: number; stops_count: number; delay_hours: number; handbomb_count: number; notes: string }>) => void;
  onDeleteTrip: (tripId: number) => void;
}) {
  const [localDistance, setLocalDistance] = useState(String(trip.distance ?? 0));
  const [localStops, setLocalStops] = useState(String(trip.stops_count ?? 0));
  const [localDelay, setLocalDelay] = useState(String(trip.delay_hours ?? 0));
  const [localHandbomb, setLocalHandbomb] = useState(String(trip.handbomb_count ?? 0));
  const [localNotes, setLocalNotes] = useState(trip.notes ?? '');

  const snapshot = trip.rate_snapshot;
  const lines = snapshot?.lines ?? [];
  const isUpdating = updatingTripId === trip.id;

  const handleBlur = () => {
    const distance = parseFloat(localDistance);
    if (isNaN(distance) || distance < 0) return;
    const stops = parseInt(localStops, 10) || 0;
    const delay = parseFloat(localDelay) || 0;
    const handbomb = parseInt(localHandbomb, 10) || 0;
    if (
      distance !== (trip.distance ?? 0) ||
      stops !== (trip.stops_count ?? 0) ||
      delay !== (trip.delay_hours ?? 0) ||
      handbomb !== (trip.handbomb_count ?? 0) ||
      localNotes !== (trip.notes ?? '')
    ) {
      onUpdateTrip(trip.id, { distance, stops_count: stops, delay_hours: delay, handbomb_count: handbomb, notes: localNotes || undefined });
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-slate-400">Distance</span>
            {canEdit ? (
              <Input type="number" min={0} step="0.01" value={localDistance} onChange={(e) => setLocalDistance(e.target.value)} onBlur={handleBlur} className="mt-1 h-8 bg-slate-700 border-slate-600 text-white" />
            ) : (
              <p className="text-white font-medium">{trip.distance ?? 0}</p>
            )}
          </div>
          <div>
            <span className="text-slate-400">Stops</span>
            {canEdit ? (
              <Input type="number" min={0} value={localStops} onChange={(e) => setLocalStops(e.target.value)} onBlur={handleBlur} className="mt-1 h-8 bg-slate-700 border-slate-600 text-white" />
            ) : (
              <p className="text-white font-medium">{trip.stops_count ?? 0}</p>
            )}
          </div>
          <div>
            <span className="text-slate-400">Delay (hrs)</span>
            {canEdit ? (
              <Input type="number" min={0} step="0.01" value={localDelay} onChange={(e) => setLocalDelay(e.target.value)} onBlur={handleBlur} className="mt-1 h-8 bg-slate-700 border-slate-600 text-white" />
            ) : (
              <p className="text-white font-medium">{trip.delay_hours ?? 0}</p>
            )}
          </div>
          <div>
            <span className="text-slate-400">Handbomb</span>
            {canEdit ? (
              <Input type="number" min={0} value={localHandbomb} onChange={(e) => setLocalHandbomb(e.target.value)} onBlur={handleBlur} className="mt-1 h-8 bg-slate-700 border-slate-600 text-white" />
            ) : (
              <p className="text-white font-medium">{trip.handbomb_count ?? 0}</p>
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
