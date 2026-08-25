'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, RotateCcw, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { EmailTemplate } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { EmailRichTextEditor } from '@/components/admin/email-rich-text-editor';
import { cn, getApiErrorMessage } from '@/lib/utils';

export default function EmailTemplatesSettingsPage() {
  const { user, tenantId, currentTenant } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isSuperAdmin =
    user?.is_global_admin ||
    user?.roles?.some((r) => r.name === 'super-admin') ||
    false;
  const hasTenantContext = Boolean(tenantId);

  const selected = templates.find((t) => t.key === selectedKey) ?? null;

  const applyTemplate = useCallback((t: EmailTemplate) => {
    setSelectedKey(t.key);
    setSubject(t.subject);
    setBodyHtml(t.body_html);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiClient.getEmailTemplates();
      setTemplates(list);
      setSelectedKey((prev) => {
        const keep = list.find((t) => t.key === prev) ?? list[0];
        if (keep) {
          setSubject(keep.subject);
          setBodyHtml(keep.body_html);
          return keep.key;
        }
        return '';
      });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to load email templates'));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasTenantContext) {
      setLoading(false);
      setTemplates([]);
      return;
    }
    void load();
  }, [tenantId, hasTenantContext, load]);

  const save = async () => {
    if (!selectedKey) return;
    setSaving(true);
    try {
      const updated = await apiClient.updateEmailTemplate(selectedKey, {
        subject: subject.trim(),
        body_html: bodyHtml,
      });
      setTemplates((prev) =>
        prev.map((t) => (t.key === updated.key ? { ...t, ...updated } : t)),
      );
      applyTemplate(updated);
      toast.success('Email template saved');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not save template'));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!selectedKey) return;
    if (
      !confirm(
        'Reset this template to the default wording? Your edits will be lost.',
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      const updated = await apiClient.resetEmailTemplate(selectedKey);
      setTemplates((prev) =>
        prev.map((t) => (t.key === updated.key ? { ...t, ...updated } : t)),
      );
      applyTemplate(updated);
      toast.success(updated.message || 'Template reset');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not reset template'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className='space-y-6 max-w-5xl'>
      <Button variant='ghost' asChild className='text-slate-300 -ml-2'>
        <Link href='/admin/settings/company-profile'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Settings
        </Link>
      </Button>

      <div>
        <h1 className='text-3xl font-bold text-white flex items-center gap-2'>
          <Mail className='h-8 w-8' />
          Email templates
        </h1>
        <p className='text-slate-400 mt-1'>
          Edit the subject and body used when emailing pay stubs and timesheet
          document review packages to drivers. Use placeholders like{' '}
          <code className='text-slate-300'>{'{{period}}'}</code> — they are
          filled in when the email is sent.
        </p>
      </div>

      {isSuperAdmin && !hasTenantContext && (
        <div className='rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100'>
          Select a tenant in the header (or sign in as a tenant user) to manage
          email templates.
        </div>
      )}

      {hasTenantContext && currentTenant && (
        <p className='text-slate-500 text-sm'>
          Tenant:{' '}
          <span className='text-slate-300'>
            {currentTenant.name ?? currentTenant.id}
          </span>
        </p>
      )}

      {loading ? (
        <div className='flex justify-center py-16'>
          <Spinner className='h-8 w-8 text-white' />
        </div>
      ) : !hasTenantContext ? null : (
        <div className='grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]'>
          <Card className='bg-slate-800 border-slate-700 h-fit'>
            <CardHeader className='pb-2'>
              <h2 className='text-sm font-semibold text-white'>Templates</h2>
            </CardHeader>
            <CardContent className='space-y-1'>
              {templates.map((t) => (
                <button
                  key={t.key}
                  type='button'
                  onClick={() => applyTemplate(t)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                    selectedKey === t.key
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700/60',
                  )}
                >
                  {t.name}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader className='space-y-1'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h2 className='text-lg font-semibold text-white'>
                  {selected?.name ?? 'Template'}
                </h2>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    className='border-slate-600 text-slate-200'
                    disabled={resetting || saving || !selectedKey}
                    onClick={() => void reset()}
                  >
                    {resetting ? (
                      <Spinner className='h-3.5 w-3.5' />
                    ) : (
                      <RotateCcw className='h-3.5 w-3.5' />
                    )}
                    Reset default
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    className='bg-emerald-600 hover:bg-emerald-500 text-white'
                    disabled={saving || resetting || !selectedKey}
                    onClick={() => void save()}
                  >
                    {saving ? (
                      <Spinner className='h-3.5 w-3.5' />
                    ) : (
                      <Save className='h-3.5 w-3.5' />
                    )}
                    Save
                  </Button>
                </div>
              </div>
              {selected?.placeholders?.length ? (
                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {selected.placeholders.map((p) => (
                    <Badge
                      key={p}
                      variant='outline'
                      className='border-slate-600 font-mono text-[10px] text-slate-300'
                    >
                      {`{{${p}}}`}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email-subject' className='text-slate-300'>
                  Template title / subject
                </Label>
                <Input
                  id='email-subject'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className='bg-slate-900 border-slate-600 text-white'
                  placeholder='{{company_name}} - {{period}}'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-slate-300'>Email body</Label>
                <EmailRichTextEditor value={bodyHtml} onChange={setBodyHtml} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
