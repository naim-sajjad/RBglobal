'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Banknote, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PayrollPreviewResponse, Payslip } from '@/lib/types';
import { toast } from 'sonner';
import { formatApiDateRange } from '@/lib/utils';

function payslipRows(payload: unknown): Payslip[] {
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Payslip[] }).data;
  }
  if (Array.isArray(payload)) return payload as Payslip[];
  return [];
}

export default function PayrollPage() {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [vacationPct, setVacationPct] = useState('4');
  const [deductions, setDeductions] = useState('0');
  const [taxSettingsPercent, setTaxSettingsPercent] = useState('0');
  const [taxSettingsFixed, setTaxSettingsFixed] = useState('0');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [preview, setPreview] = useState<PayrollPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const loadPayslips = async () => {
    try {
      const payload = await apiClient.getPayslips({ per_page: 50 });
      setPayslips(payslipRows(payload));
    } catch {
      setPayslips([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const runPreview = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Enter period dates');
      return;
    }
    setPreviewLoading(true);
    setPreview(null);
    try {
      const data = await apiClient.previewPayrollCalculation({
        period_start: periodStart,
        period_end: periodEnd,
        vacation_percent: parseFloat(vacationPct) || 0,
        default_deductions: parseFloat(deductions) || 0,
      });
      setPreview(data as PayrollPreviewResponse);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const runGenerate = async () => {
    if (!periodStart || !periodEnd) return;
    setGenLoading(true);
    try {
      await apiClient.generatePayroll({
        period_start: periodStart,
        period_end: periodEnd,
        vacation_percent: parseFloat(vacationPct) || 0,
        default_deductions: parseFloat(deductions) || 0,
      });
      toast.success('Payslips generated');
      setPreview(null);
      loadPayslips();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Generate failed');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Banknote className="h-8 w-8" />
          Payroll
        </h1>
        <p className="text-slate-400 mt-1">
          Driver pay from approved timesheet trips (payable rate-card lines). Each trip is linked to at most one
          payslip; snapshots are stored on the payslip.
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            Client billing tax (HST / fixed amounts) is under{' '}
            <Link href="/admin/settings/billing-tax" className="text-emerald-400 hover:underline">
              Tax configuration
            </Link>
            . Company name and address for driver invoice PDFs are under{' '}
            <Link href="/admin/settings/company-profile" className="text-emerald-400 hover:underline">
              Company profile
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Run payroll for period</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Period start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white scheme-dark"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Period end</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white scheme-dark"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Vacation % of gross</Label>
              <Input
                value={vacationPct}
                onChange={(e) => setVacationPct(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Flat deductions / driver</Label>
              <Input
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="bg-slate-600" onClick={runPreview} disabled={previewLoading}>
              {previewLoading ? <Spinner className="h-4 w-4" /> : 'Preview'}
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={runGenerate}
              disabled={genLoading || !periodStart || !periodEnd}
            >
              {genLoading ? <Spinner className="h-4 w-4" /> : 'Generate payslips'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && preview.drivers.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Preview</h2>
            <p className="text-slate-500 text-sm font-normal">
              {preview.billing_taxes && preview.billing_taxes.length > 0 ? (
                <>
                  Saved taxes:{' '}
                  {preview.billing_taxes
                    .map((t) =>
                      t.type === 'percentage'
                        ? `${t.name} (${Number(t.value).toFixed(2)}%)`
                        : `${t.name} ($${Number(t.value).toFixed(2)} fixed)`
                    )
                    .join(' · ')}
                </>
              ) : (
                <>No taxes configured — add rules under Tax configuration.</>
              )}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Driver</TableHead>
                  <TableHead className="text-slate-300">Trips</TableHead>
                  <TableHead className="text-slate-300 text-right">Gross</TableHead>
                  <TableHead className="text-slate-300 text-right">Vacation</TableHead>
                  <TableHead className="text-slate-300 text-right">Net</TableHead>
                  <TableHead className="text-slate-300 text-right">Client subtotal</TableHead>
                  <TableHead className="text-slate-300 text-right">Total tax</TableHead>
                  <TableHead className="text-slate-300 text-right">Client total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.drivers.map((d) => (
                  <TableRow key={d.driver_id} className="border-slate-700">
                    <TableCell className="text-white">{d.driver_name}</TableCell>
                    <TableCell className="text-slate-300">{d.trip_count}</TableCell>
                    <TableCell className="text-right text-slate-300">${d.gross_pay.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-slate-300">${d.vacation_pay.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-white">${d.net_pay.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-slate-300">
                      ${(d.agency_billing_subtotal ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      ${(d.billing_tax_amount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      ${(d.agency_billing_total ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Payslips</h2>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8 text-white" />
            </div>
          ) : payslips.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No payslips yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Driver</TableHead>
                  <TableHead className="text-slate-300">Period</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300 text-right">Net pay</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id} className="border-slate-700">
                    <TableCell className="text-white">{p.driver?.user?.name ?? `Driver #${p.driver_id}`}</TableCell>
                    <TableCell className="text-slate-300">
                      {formatApiDateRange(String(p.period_start), String(p.period_end))}
                    </TableCell>
                    <TableCell>
                      <Badge className={p.status === 'paid' ? 'bg-green-600' : 'bg-amber-600'}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-white">${Number(p.net_pay).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/payroll/${p.id}`}>
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
