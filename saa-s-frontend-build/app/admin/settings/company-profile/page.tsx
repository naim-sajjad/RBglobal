'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Building2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TenantCompanyProfile } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function CompanyProfileSettingsPage() {
  const { user, tenantId, currentTenant } = useAuth();
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [payStubCcEmails, setPayStubCcEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin =
    user?.is_global_admin || user?.roles?.some((r) => r.name === 'super-admin') || false;
  const hasTenantContext = Boolean(tenantId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await apiClient.getTenantCompanyProfile()) as TenantCompanyProfile;
      setCompanyLegalName(res.company_legal_name ?? '');
      setCompanyAddress(res.company_address ?? '');
      setCompanyPhone(res.company_phone ?? '');
      setCompanyEmail(res.company_email ?? '');
      setPayStubCcEmails(res.pay_stub_cc_emails ?? '');
    } catch {
      setCompanyLegalName('');
      setCompanyAddress('');
      setCompanyPhone('');
      setCompanyEmail('');
      setPayStubCcEmails('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [tenantId, load]);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.putTenantCompanyProfile({
        company_legal_name: companyLegalName.trim(),
        company_address: companyAddress.trim(),
        company_phone: companyPhone.trim(),
        company_email: companyEmail.trim(),
        pay_stub_cc_emails: payStubCcEmails.trim(),
      });
      toast.success('Company profile saved');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Could not save (tenant context required)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" asChild className="text-slate-300 -ml-2">
        <Link href="/admin/payroll">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Payroll
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Company profile
        </h1>
        <p className="text-slate-400 mt-1">
          Shown at the top of <strong className="text-slate-300">driver invoice</strong> and{' '}
          <strong className="text-slate-300">remittance slip</strong> PDFs. For invoices, when name or address is set,
          the client / bill-to block uses this instead of trip employers. Pay stub CC list is used when you email a
          payroll PDF to a driver from the payslip page.
        </p>
      </div>

      {isSuperAdmin && !hasTenantContext && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          Select a tenant in the header (or sign in as a tenant user) to load and save this profile.
        </div>
      )}

      {hasTenantContext && currentTenant && (
        <p className="text-slate-500 text-sm">
          Tenant: <span className="text-slate-300">{currentTenant.name ?? currentTenant.id}</span>
        </p>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Billing identity</h2>
          <p className="text-slate-500 text-sm font-normal">
            Example: company legal name on one line, then suite, street, city, province, postal code, country on
            following lines.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8 text-white" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="company_legal_name" className="text-slate-300">
                  Company legal name
                </Label>
                <Input
                  id="company_legal_name"
                  value={companyLegalName}
                  onChange={(e) => setCompanyLegalName(e.target.value)}
                  placeholder="e.g. R&B Services Plus Inc."
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!hasTenantContext}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_address" className="text-slate-300">
                  Address
                </Label>
                <Textarea
                  id="company_address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder={
                    'Suite GR16 - 25 Watline Ave.,\nMississauga, ON L4Z 2Z1,\nCanada'
                  }
                  rows={5}
                  className="bg-slate-700 border-slate-600 text-white resize-y min-h-[120px]"
                  disabled={!hasTenantContext}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_phone" className="text-slate-300">
                  Phone (optional)
                </Label>
                <Input
                  id="company_phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+1 647 638 2755"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!hasTenantContext}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_email" className="text-slate-300">
                  Email (optional)
                </Label>
                <Input
                  id="company_email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="billing@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!hasTenantContext}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_stub_cc_emails" className="text-slate-300">
                  Pay stub CC emails (optional)
                </Label>
                <Textarea
                  id="pay_stub_cc_emails"
                  value={payStubCcEmails}
                  onChange={(e) => setPayStubCcEmails(e.target.value)}
                  placeholder={'finance@example.com, payroll@example.com\n(one per line or comma-separated)'}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white resize-y min-h-[80px]"
                  disabled={!hasTenantContext}
                />
                <p className="text-slate-500 text-xs">
                  These addresses are CC’d when sending the pay stub PDF to a driver. You can also set global CC in{' '}
                  <code className="text-slate-400">PAY_STUB_EMAIL_CC</code> in the API <code className="text-slate-400">.env</code>.
                </p>
              </div>
              <Button
                type="button"
                onClick={save}
                disabled={!hasTenantContext || saving}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {saving ? <Spinner className="h-4 w-4" /> : 'Save'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
