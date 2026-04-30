'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Percent, ArrowLeft, Banknote, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PayrollBillingTaxSettingsResponse, PayrollBillingTaxType } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type FormRow = {
  key: string;
  name: string;
  type: PayrollBillingTaxType;
  value: string;
};

function newKey() {
  return `tax-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function BillingTaxSettingsPage() {
  const { user, tenantId, currentTenant } = useAuth();
  const [rows, setRows] = useState<FormRow[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const isSuperAdmin =
    user?.is_global_admin || user?.roles?.some((r) => r.name === 'super-admin') || false;
  const hasTenantContext = Boolean(tenantId);

  const loadTaxSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = (await apiClient.getPayrollBillingTaxSettings()) as PayrollBillingTaxSettingsResponse;
      const list = res.taxes ?? [];
      setRows(
        list.length
          ? list.map((t) => ({
              key: newKey(),
              name: t.name,
              type: t.type,
              value: String(t.value),
            }))
          : []
      );
    } catch {
      setRows([]);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxSettings();
  }, [tenantId, loadTaxSettings]);

  const addRow = () => {
    setRows((r) => [
      ...r,
      { key: newKey(), name: '', type: 'percentage', value: '0' },
    ]);
  };

  const removeRow = (key: string) => {
    setRows((r) => r.filter((x) => x.key !== key));
  };

  const updateRow = (key: string, patch: Partial<FormRow>) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  };

  const saveTaxSettings = async () => {
    for (const row of rows) {
      if (!row.name.trim()) {
        toast.error('Each tax needs a name');
        return;
      }
    }
    const taxes = rows.map((row) => {
      const v = parseFloat(row.value);
      return {
        name: row.name.trim(),
        type: row.type,
        value: Number.isFinite(v) ? Math.max(0, v) : 0,
      };
    });
    for (const t of taxes) {
      if (t.type === 'percentage' && t.value > 100) {
        toast.error(`"${t.name}" percentage cannot exceed 100`);
        return;
      }
    }
    setSettingsSaving(true);
    try {
      await apiClient.putPayrollBillingTaxSettings({ taxes });
      toast.success('Tax configuration saved');
      await loadTaxSettings();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Could not save (tenant context required)');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" asChild className="text-slate-300 -ml-2">
        <Link href="/admin/payroll">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Payroll
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Percent className="h-8 w-8" />
          Tax configuration
        </h1>
        <p className="text-slate-400 mt-1">
          Define named taxes for client (agency) billing on payroll. Each line is either a <strong>percentage</strong>{' '}
          of the driver’s billing subtotal or a <strong>fixed</strong> dollar amount per driver. Stored per tenant.
        </p>
      </div>

      {isSuperAdmin && !hasTenantContext && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          Select a tenant in the header (or sign in as a tenant user) to load and save tax settings. Super admins need
          an active tenant context for tenant APIs.
        </div>
      )}

      {hasTenantContext && currentTenant && (
        <p className="text-slate-500 text-sm">
          Tenant: <span className="text-slate-300">{currentTenant.name ?? currentTenant.id}</span>
        </p>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Billing taxes</h2>
          <p className="text-slate-500 text-sm font-normal">
            Add one row per tax (e.g. &quot;HST&quot; as 13% percentage, or &quot;Enviro fee&quot; as a fixed dollar
            amount). Order is applied top to bottom.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8 text-white" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="hidden sm:grid sm:grid-cols-[1fr_140px_140px_44px] gap-2 text-xs text-slate-500 uppercase tracking-wide px-1">
                  <span>Tax name</span>
                  <span>Type</span>
                  <span>Value</span>
                  <span />
                </div>
                {rows.length === 0 && (
                  <p className="text-slate-500 text-sm py-4">No taxes yet. Add a row to get started.</p>
                )}
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end border border-slate-700 rounded-lg p-3 bg-slate-900/40"
                  >
                    <div className="space-y-2">
                      <Label className="text-slate-400 sm:hidden">Tax name</Label>
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                        placeholder="e.g. HST"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={!hasTenantContext}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 sm:hidden">Type</Label>
                      <Select
                        value={row.type}
                        onValueChange={(v) => updateRow(row.key, { type: v as PayrollBillingTaxType })}
                        disabled={!hasTenantContext}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 sm:hidden">
                        {row.type === 'percentage' ? 'Rate (%)' : 'Amount ($)'}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={row.type === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={row.value}
                        onChange={(e) => updateRow(row.key, { value: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder={row.type === 'percentage' ? '13' : '0.00'}
                        disabled={!hasTenantContext}
                      />
                    </div>
                    <div className="flex sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => removeRow(row.key)}
                        disabled={!hasTenantContext}
                        aria-label="Remove tax"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-slate-600"
                  disabled={!hasTenantContext}
                  onClick={addRow}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add tax
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  disabled={settingsSaving || !hasTenantContext}
                  onClick={saveTaxSettings}
                >
                  {settingsSaving ? <Spinner className="h-4 w-4" /> : 'Save configuration'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Where this is used
          </h2>
        </CardHeader>
        <CardContent className="text-slate-400 text-sm space-y-2">
          <p>
            Payroll preview and generation apply these rules to each driver’s client billing subtotal. Payslips and
            driver calculation PDFs store a line-by-line snapshot.
          </p>
          <Button variant="outline" asChild className="border-slate-600 text-slate-200 mt-2">
            <Link href="/admin/payroll">Go to payroll</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
