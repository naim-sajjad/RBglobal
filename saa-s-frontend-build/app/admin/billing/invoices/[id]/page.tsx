'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { apiClient } from '@/lib/api';
import { ClientInvoice, ClientInvoiceStatus } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft, FileDown } from 'lucide-react';

const STATUSES: ClientInvoiceStatus[] = ['draft', 'sent', 'paid', 'partially_paid', 'overdue'];

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [inv, setInv] = useState<ClientInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ClientInvoiceStatus>('draft');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payRef, setPayRef] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.getClientInvoice(id);
      setInv(data as ClientInvoice);
      setStatus(data.status);
      setInvoiceNumber(data.invoice_number || '');
    } catch {
      toast.error('Failed to load invoice');
      setInv(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveMeta = async () => {
    try {
      await apiClient.updateClientInvoice(id, { invoice_number: invoiceNumber || undefined });
      toast.success('Saved');
      load();
    } catch {
      toast.error('Save failed');
    }
  };

  const saveStatus = async (s: ClientInvoiceStatus) => {
    try {
      await apiClient.updateClientInvoiceStatus(id, s);
      setStatus(s);
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Status update failed');
    }
  };

  const downloadInvoicePdf = async () => {
    setPdfLoading(true);
    try {
      await apiClient.downloadInvoicePdf(id, inv?.invoice_number);
      toast.success('PDF downloaded');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const addPayment = async () => {
    const amt = parseFloat(payAmount);
    if (!payDate || Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter amount and payment date');
      return;
    }
    try {
      await apiClient.recordClientInvoicePayment(id, {
        amount: amt,
        payment_date: payDate,
        reference: payRef || undefined,
      });
      toast.success('Payment recorded');
      setPayAmount('');
      setPayRef('');
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Payment failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8 text-white" />
      </div>
    );
  }

  if (!inv) {
    return <p className="text-slate-400">Invoice not found.</p>;
  }

  const paid =
    inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ??
    Number((inv as { paid_total?: string }).paid_total || 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" asChild className="text-slate-300 -ml-2">
        <Link href="/admin/billing/invoices">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Invoices
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoice #{inv.id}</h1>
          <p className="text-slate-400 mt-1">
            {inv.employer?.name ?? `Employer #${inv.employer_id}`} · {inv.start_date} → {inv.end_date}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer"
            disabled={pdfLoading}
            onClick={downloadInvoicePdf}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </Button>
          <Badge className="text-base px-3 py-1">{inv.status.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800 border-slate-700 md:col-span-1">
          <CardHeader>
            <h2 className="text-white font-semibold">Totals</h2>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(inv.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({(Number(inv.tax_rate) * 100).toFixed(2)}%)</span>
              <span>${Number(inv.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-medium pt-2 border-t border-slate-600">
              <span>Total</span>
              <span>${Number(inv.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Paid</span>
              <span>${paid.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 md:col-span-2">
          <CardHeader>
            <h2 className="text-white font-semibold">Status & reference</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-slate-300">Workflow status</Label>
                <Select value={status} onValueChange={(v) => saveStatus(v as ClientInvoiceStatus)}>
                  <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="text-slate-300">Invoice #</Label>
                <div className="flex gap-2">
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="External invoice number"
                  />
                  <Button type="button" variant="secondary" onClick={saveMeta}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-white font-semibold">Line items (snapshot)</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300">Driver</TableHead>
                <TableHead className="text-slate-300">Item</TableHead>
                <TableHead className="text-slate-300 text-right">Qty</TableHead>
                <TableHead className="text-slate-300 text-right">Rate</TableHead>
                <TableHead className="text-slate-300 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inv.items ?? []).map((row) => (
                <TableRow key={row.id} className="border-slate-700">
                  <TableCell className="text-slate-300">{row.trip_date}</TableCell>
                  <TableCell className="text-white">
                    {row.driver?.user?.name ?? `Driver #${row.driver_id}`}
                  </TableCell>
                  <TableCell className="text-slate-300">{row.pay_item_type}</TableCell>
                  <TableCell className="text-right text-slate-300">
                    {Number(row.quantity)} {row.unit || ''}
                  </TableCell>
                  <TableCell className="text-right text-slate-300">${Number(row.rate).toFixed(4)}</TableCell>
                  <TableCell className="text-right text-white">${Number(row.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-white font-semibold">Client payment</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-slate-300">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-36 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Payment date</Label>
            <Input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white scheme-dark"
            />
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label className="text-slate-300">Reference</Label>
            <Input
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button type="button" onClick={addPayment} className="bg-emerald-600 hover:bg-emerald-500">
            Record payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
