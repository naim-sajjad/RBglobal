'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { apiClient } from '@/lib/api';
import { Payslip } from '@/lib/types';
import { toast } from 'sonner';
import { formatApiDateRange } from '@/lib/utils';
import { ArrowLeft, FileDown, Mail, Trash2 } from 'lucide-react';

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [p, setP] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [reference, setReference] = useState('');
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [remittanceBusy, setRemittanceBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.getPayslip(id);
      setP(data as Payslip);
    } catch {
      toast.error('Failed to load payslip');
      setP(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const runPdfDownload = async (key: string, fn: () => Promise<void>) => {
    setPdfBusy(key);
    try {
      await fn();
      toast.success('PDF downloaded');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setPdfBusy(null);
    }
  };

  const deletePayslip = async () => {
    const paidCount = p?.remittances?.length ?? 0;
    const warn =
      paidCount > 0
        ? `This payslip has ${paidCount} remittance record(s). Deleting removes them permanently. `
        : '';
    if (
      !confirm(
        `${warn}Delete payslip #${id}? Linked trips will be unlinked so you can generate payroll again.`,
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    try {
      await apiClient.deletePayslip(id);
      toast.success('Payslip deleted');
      router.push('/admin/payroll');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || 'Failed to delete payslip');
    } finally {
      setDeleteBusy(false);
    }
  };

  const sendPayStubEmail = async () => {
    setEmailBusy(true);
    try {
      const res = await apiClient.sendPayStubEmail(id);
      toast.success(res.message || 'Pay stub email sent');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || 'Failed to send email');
    } finally {
      setEmailBusy(false);
    }
  };

  const submitRemittance = async () => {
    const amt = parseFloat(amount);
    if (!payDate || Number.isNaN(amt) || amt <= 0) {
      toast.error('Enter amount and payment date');
      return;
    }
    setRemittanceBusy(true);
    try {
      await apiClient.recordRemittance(id, {
        amount_paid: amt,
        payment_date: payDate,
        reference: reference || undefined,
      });
      toast.success('Remittance recorded');
      setAmount('');
      setReference('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || 'Failed');
    } finally {
      setRemittanceBusy(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center py-24'>
        <Spinner className='h-8 w-8 text-white' />
      </div>
    );
  }

  if (!p) {
    return <p className='text-slate-400'>Payslip not found.</p>;
  }

  const paid =
    p.remittances?.reduce((s, r) => s + Number(r.amount_paid), 0) ?? 0;

  const driverUserEmail = p.driver?.user?.email?.trim() ?? '';

  return (
    <div className='space-y-6 max-w-3xl'>
      <Button variant='ghost' asChild className='text-slate-300 -ml-2'>
        <Link href='/admin/payroll'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Payroll
        </Link>
      </Button>

      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Payslip #{p.id}</h1>
          <p className='text-slate-400 mt-1'>
            {p.driver?.user?.name ?? `Driver #${p.driver_id}`} ·{' '}
            {formatApiDateRange(String(p.period_start), String(p.period_end))}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge
            className={p.status === 'paid' ? 'bg-green-600' : 'bg-amber-600'}
          >
            {p.status}
          </Badge>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            className='cursor-pointer text-white'
            disabled={deleteBusy || remittanceBusy}
            onClick={deletePayslip}
          >
            {deleteBusy ? (
              <Spinner className='h-4 w-4' />
            ) : (
              <Trash2 className='h-4 w-4 mr-2' />
            )}
            Delete payslip
          </Button>
        </div>
      </div>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <h2 className='text-white font-semibold'>PDF downloads</h2>
          <p className='text-slate-500 text-sm font-normal mt-1'>
            Email pay stub uses the driver&apos;s login email
            {driverUserEmail ? (
              <>
                : <span className='text-slate-400'>{driverUserEmail}</span>
              </>
            ) : (
              <span className='text-amber-400/90'>
                {' '}
                — none on file; update the driver user to send.
              </span>
            )}
            . CC list:{' '}
            <Link
              href='/admin/settings/company-profile'
              className='text-violet-400 hover:underline'
            >
              Company profile
            </Link>{' '}
            and/or <code className='text-slate-400 text-xs'>PAY_STUB_EMAIL_CC</code>.
          </p>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='default'
            className='cursor-pointer bg-violet-700 hover:bg-violet-600 text-white'
            disabled={
              pdfBusy !== null ||
              remittanceBusy ||
              emailBusy ||
              !driverUserEmail
            }
            title={
              !driverUserEmail
                ? 'Driver user has no email'
                : 'Send pay stub PDF by email'
            }
            onClick={() => {
              if (
                !confirm(
                  `Send pay stub PDF to ${driverUserEmail}? CC addresses from company profile and PAY_STUB_EMAIL_CC will be included.`,
                )
              ) {
                return;
              }
              void sendPayStubEmail();
            }}
          >
            {emailBusy ? (
              <Spinner className='h-4 w-4 mr-2' />
            ) : (
              <Mail className='h-4 w-4 mr-2' />
            )}
            {emailBusy ? 'Sending…' : 'Email pay stub to driver'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            className='cursor-pointer'
            disabled={pdfBusy !== null || remittanceBusy || emailBusy}
            onClick={() =>
              runPdfDownload('payslip', () => apiClient.downloadPayslipPdf(id))
            }
          >
            <FileDown className='h-4 w-4 mr-2' />
            {pdfBusy === 'payslip' ? 'Preparing…' : 'Payslip'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            className='cursor-pointer'
            disabled={pdfBusy !== null || remittanceBusy || emailBusy}
            onClick={() =>
              runPdfDownload('invoice', () => apiClient.downloadPayslipInvoicePdf(id))
            }
          >
            <FileDown className='h-4 w-4 mr-2' />
            {pdfBusy === 'invoice' ? 'Preparing…' : 'Invoice'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            className='cursor-pointer'
            disabled={pdfBusy !== null || remittanceBusy || emailBusy}
            onClick={() =>
              runPdfDownload('remittance', () =>
                apiClient.downloadRemittancePdf(id),
              )
            }
          >
            <FileDown className='h-4 w-4 mr-2' />
            {pdfBusy === 'remittance' ? 'Preparing…' : 'Remittance'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            className='cursor-pointer'
            disabled={
              pdfBusy !== null || remittanceBusy || emailBusy || !p.driver_calculation_id
            }
            title={
              !p.driver_calculation_id
                ? 'No driver calculation linked'
                : undefined
            }
            onClick={() =>
              runPdfDownload('calc', () =>
                apiClient.downloadDriverCalculationPdf(p.driver_calculation_id),
              )
            }
          >
            <FileDown className='h-4 w-4 mr-2' />
            {pdfBusy === 'calc' ? 'Preparing…' : 'Calculation'}
          </Button>
        </CardContent>
      </Card>

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <h2 className='text-white font-semibold'>Snapshot</h2>
        </CardHeader>
        <CardContent className='text-slate-300 space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span>Gross pay</span>
            <span>${Number(p.total_pay).toFixed(2)}</span>
          </div>
          <div className='flex justify-between'>
            <span>Vacation</span>
            <span>${Number(p.vacation_pay).toFixed(2)}</span>
          </div>
          <div className='flex justify-between'>
            <span>Deductions</span>
            <span>${Number(p.deductions).toFixed(2)}</span>
          </div>
          <div className='flex justify-between text-white font-medium pt-2 border-t border-slate-600'>
            <span>Net pay</span>
            <span>${Number(p.net_pay).toFixed(2)}</span>
          </div>
          <div className='flex justify-between pt-2'>
            <span>Remitted to date</span>
            <span>${paid.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {(() => {
        const billSub = Number(p.agency_billing_subtotal ?? 0);
        const billTax = Number(p.billing_tax_amount ?? 0);
        const billTot = Number(p.agency_billing_total ?? 0);
        const billRate = Number(p.billing_tax_rate ?? 0);
        const fromPct = Number(p.billing_tax_from_percent ?? 0);
        const taxFixed = Number(p.billing_tax_fixed ?? 0);
        const lines = Array.isArray(p.billing_tax_lines)
          ? p.billing_tax_lines
          : [];
        if (billSub <= 0 && billTax <= 0 && billTot <= 0) return null;
        return (
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <h2 className='text-white font-semibold'>
                Client billing &amp; taxes
              </h2>
              <p className='text-slate-500 text-xs font-normal'>
                Agency billable trip totals for this period; taxes do not affect
                driver net pay.
              </p>
            </CardHeader>
            <CardContent className='text-slate-300 space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span>Subtotal — client billing</span>
                <span>${billSub.toFixed(2)}</span>
              </div>
              {lines.length > 0 ? (
                <>
                  {lines.map((tl, i) => (
                    <div key={i} className='flex justify-between'>
                      <span>
                        {tl.name}
                        {tl.type === 'percentage'
                          ? ` (${Number(tl.value).toFixed(2)}%)`
                          : tl.type === 'fixed'
                            ? ' (fixed)'
                            : ''}
                      </span>
                      <span>${Number(tl.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  {lines.length > 1 && billTax > 0 && (
                    <div className='flex justify-between text-slate-400 text-xs pt-1'>
                      <span>Total tax</span>
                      <span>${billTax.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : fromPct > 0.0001 || taxFixed > 0.0001 ? (
                <>
                  {fromPct > 0.0001 && (
                    <div className='flex justify-between'>
                      <span>
                        Tax on subtotal
                        {billRate > 0
                          ? ` (${(billRate * 100).toFixed(2)}%)`
                          : ''}
                      </span>
                      <span>${fromPct.toFixed(2)}</span>
                    </div>
                  )}
                  {taxFixed > 0.0001 && (
                    <div className='flex justify-between'>
                      <span>Tax (fixed amount)</span>
                      <span>${taxFixed.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : billTax > 0 ? (
                <div className='flex justify-between'>
                  <span>Tax</span>
                  <span>${billTax.toFixed(2)}</span>
                </div>
              ) : null}
              <div className='flex justify-between text-white font-medium pt-2 border-t border-slate-600'>
                <span>Total incl. tax</span>
                <span>${billTot.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {p.breakdown && Object.keys(p.breakdown).length > 0 && (
        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader>
            <h2 className='text-white font-semibold'>
              Breakdown (pay item totals)
            </h2>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            {Object.entries(p.breakdown).map(([k, v]) => (
              <div key={k} className='flex justify-between text-slate-300'>
                <span className='pr-4 truncate'>{k}</span>
                <span>${Number(v).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <h2 className='text-white font-semibold'>
            Remittance (payment to driver)
          </h2>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-4 items-end'>
          <div className='space-y-2'>
            <Label className='text-slate-300'>Amount paid</Label>
            <Input
              type='number'
              step='0.01'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='w-40 bg-slate-700 border-slate-600 text-white'
              disabled={remittanceBusy || pdfBusy !== null || emailBusy}
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-slate-300'>Payment date</Label>
            <Input
              type='date'
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className='bg-slate-700 border-slate-600 text-white scheme-dark'
              disabled={remittanceBusy || pdfBusy !== null || emailBusy}
            />
          </div>
          <div className='space-y-2 flex-1 min-w-[200px]'>
            <Label className='text-slate-300'>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className='bg-slate-700 border-slate-600 text-white'
              disabled={remittanceBusy || pdfBusy !== null || emailBusy}
            />
          </div>
          <Button
            type='button'
            onClick={submitRemittance}
            className='bg-emerald-600 hover:bg-emerald-500 min-w-[160px]'
            disabled={remittanceBusy || pdfBusy !== null || emailBusy}
          >
            {remittanceBusy ? (
              <>
                <Spinner className='h-4 w-4 mr-2' />
                Recording…
              </>
            ) : (
              'Record remittance'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
