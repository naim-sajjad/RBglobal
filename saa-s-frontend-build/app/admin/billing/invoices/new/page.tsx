'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { apiClient } from '@/lib/api';
import { DriverWithDetails, Employer, InvoicePreviewResponse } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function NewClientInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [drivers, setDrivers] = useState<DriverWithDetails[]>([]);
  const [employerId, setEmployerId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taxRate, setTaxRate] = useState('0.13');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<InvoicePreviewResponse | null>(null);
  const [loadingEmployers, setLoadingEmployers] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const qpDriver = searchParams.get('driver_id');
    const qpEmployer = searchParams.get('employer_id');
    const qpStart = searchParams.get('start_date');
    const qpEnd = searchParams.get('end_date');
    if (qpDriver) setDriverId(qpDriver);
    if (qpEmployer) setEmployerId(qpEmployer);
    if (qpStart) setStartDate(qpStart);
    if (qpEnd) setEndDate(qpEnd);
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.getEmployers();
        setEmployers(Array.isArray(data) ? data : []);
      } catch {
        setEmployers([]);
      } finally {
        setLoadingEmployers(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.getDrivers();
        setDrivers(Array.isArray(data) ? data : []);
      } catch {
        setDrivers([]);
      } finally {
        setLoadingDrivers(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPreview(null);
  }, [employerId, driverId]);

  const runPreview = async () => {
    if (!employerId || !startDate || !endDate) {
      toast.error('Choose employer and date range');
      return;
    }
    setPreviewLoading(true);
    setPreview(null);
    try {
      const payload: Parameters<typeof apiClient.previewClientInvoice>[0] = {
        employer_id: parseInt(employerId, 10),
        start_date: startDate,
        end_date: endDate,
      };
      if (driverId !== 'all') {
        payload.driver_id = parseInt(driverId, 10);
      }
      const data = await apiClient.previewClientInvoice(payload);
      setPreview(data as InvoicePreviewResponse);
      if (!data.drivers?.length) {
        toast.message('No billable trips in range', {
          description: 'Use approved timesheets with client-billable lines (positive agency billing).',
        });
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const createInvoice = async () => {
    if (!employerId || !startDate || !endDate) return;
    const tr = parseFloat(taxRate);
    if (Number.isNaN(tr) || tr < 0) {
      toast.error('Invalid tax rate (use decimal e.g. 0.13 for 13%)');
      return;
    }
    setCreateLoading(true);
    try {
      const body: Parameters<typeof apiClient.createClientInvoice>[0] = {
        employer_id: parseInt(employerId, 10),
        start_date: startDate,
        end_date: endDate,
        tax_rate: tr,
        notes: notes || undefined,
      };
      if (driverId !== 'all') {
        body.driver_id = parseInt(driverId, 10);
      }
      const inv = await apiClient.createClientInvoice(body);
      toast.success('Invoice created');
      router.push(`/admin/billing/invoices/${inv.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const tax = preview ? preview.subtotal * parseFloat(taxRate || '0') : 0;
  const grand = preview ? preview.subtotal + tax : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Button variant="ghost" asChild className="text-slate-300 mb-2 -ml-2">
          <Link href="/admin/billing/invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-white">New client invoice</h1>
        <p className="text-slate-400 mt-1">
          Preview billable trips, then create a draft invoice with tax snapshot. Optionally limit to one driver;
          default is all drivers.
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Selection</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingEmployers || loadingDrivers ? (
            <Spinner className="h-6 w-6 text-white" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Employer</Label>
                <Select value={employerId} onValueChange={setEmployerId}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select employer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {employers.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Driver</Label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">All drivers</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.user?.name ?? `Driver #${d.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tax rate (decimal)</Label>
                <Input
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0.13"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Trip date from</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white scheme-dark"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Trip date to</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white scheme-dark"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button type="button" onClick={runPreview} disabled={previewLoading} variant="secondary" className="bg-slate-600">
            {previewLoading ? <Spinner className="h-4 w-4" /> : 'Preview'}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Preview (by driver)</h2>
            <p className="text-sm text-slate-400">
              {preview.driver_id != null
                ? `Filtered to one driver · `
                : `All drivers · `}
              Subtotal ${preview.subtotal.toFixed(2)} + est. tax ${tax.toFixed(2)} = ${grand.toFixed(2)}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Driver</TableHead>
                  <TableHead className="text-slate-300">Trips</TableHead>
                  <TableHead className="text-slate-300">Quantities</TableHead>
                  <TableHead className="text-slate-300 text-right">Billing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.drivers.map((d) => (
                  <TableRow key={d.driver_id} className="border-slate-700">
                    <TableCell className="text-white">{d.driver_name}</TableCell>
                    <TableCell className="text-slate-300">{d.trip_count}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {Object.entries(d.quantities_by_unit)
                        .map(([u, q]) => `${q} ${u}`)
                        .join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right text-white">${d.total_billing.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-6 bg-emerald-600 hover:bg-emerald-500"
              disabled={createLoading || !preview.drivers.length}
              onClick={createInvoice}
            >
              {createLoading ? <Spinner className="h-4 w-4" /> : 'Create draft invoice'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
