'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Receipt, ChevronRight, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ClientInvoice, ClientInvoiceStatus } from '@/lib/types';
import { toast } from 'sonner';

const STATUS_VARIANT: Record<ClientInvoiceStatus, string> = {
  draft: 'bg-slate-600',
  sent: 'bg-blue-600',
  paid: 'bg-green-600',
  partially_paid: 'bg-amber-600',
  overdue: 'bg-red-600',
};

function rowsFromPayload(payload: unknown): ClientInvoice[] {
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: ClientInvoice[] }).data;
  }
  if (Array.isArray(payload)) return payload as ClientInvoice[];
  return [];
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const payload = await apiClient.getClientInvoices({ per_page: 50 });
        setInvoices(rowsFromPayload(payload));
      } catch {
        toast.error('Failed to load invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Client billing
          </h1>
          <p className="text-slate-400 mt-1">
            Invoices from approved timesheet trips (billable rate-card lines only). Trips already on an invoice are
            excluded.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
          <Link href="/admin/billing/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            New invoice
          </Link>
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Invoices</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8 text-white" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Employer</TableHead>
                  <TableHead className="text-slate-300">Period</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300 text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-slate-700">
                    <TableCell className="text-white">{inv.employer?.name ?? `Employer #${inv.employer_id}`}</TableCell>
                    <TableCell className="text-slate-300">
                      {inv.start_date} → {inv.end_date}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_VARIANT[inv.status]}>{inv.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-white">${Number(inv.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/billing/invoices/${inv.id}`}>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
