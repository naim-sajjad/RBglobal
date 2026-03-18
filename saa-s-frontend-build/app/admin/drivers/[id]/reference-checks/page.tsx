'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ArrowLeft, FileText, Mail, Plus, Pencil, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PreEmploymentReferenceCheckForm } from '@/components/reference-check/PreEmploymentReferenceCheckForm';
import type { ReferenceCheck, ReferenceRequestData, ApplicantConsentData, ReferenceCheckFormData, DriverWithDetails } from '@/lib/types';
import { toast } from 'sonner';

export default function DriverReferenceChecksPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id as string;
  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [checks, setChecks] = useState<ReferenceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<ReferenceCheck | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<{
    referee_email: string;
    reference_request: ReferenceRequestData;
    applicant_consent?: ApplicantConsentData;
  }>({
    referee_email: '',
    reference_request: {
      applicant_name: '',
      drivers_license_number: '',
      previous_company_name: '',
      previous_company_phone: '',
      supervisor_employer_name: '',
    },
  });

  useEffect(() => {
    if (driverId) {
      fetchDriver();
      fetchChecks();
    }
  }, [driverId]);

  const fetchDriver = async () => {
    try {
      const data = await apiClient.getDriver(driverId);
      setDriver(data);
      setCreateForm((prev) => ({
        ...prev,
        reference_request: {
          ...prev.reference_request,
          applicant_name: data.user?.name ?? prev.reference_request.applicant_name,
          drivers_license_number: data.license_number ?? prev.reference_request.drivers_license_number,
        },
      }));
    } catch (e) {
      setError('Failed to load driver');
    }
  };

  const fetchChecks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getReferenceChecks(driverId);
      setChecks(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setChecks([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load reference checks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.createReferenceCheckRequest(driverId, {
        referee_email: createForm.referee_email || undefined,
        reference_request: createForm.reference_request,
        applicant_consent: createForm.applicant_consent,
      });
      toast.success('Reference check request created. ' + (createForm.referee_email ? 'Link can be sent to referee.' : 'You can fill it as admin or send link later.'));
      setCreateOpen(false);
      fetchChecks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reference check');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAsAdmin = (check: ReferenceCheck) => {
    setSelectedCheck(check);
    setFillOpen(true);
  };

  const handleSubmitFill = async (formData: ReferenceCheckFormData) => {
    if (!selectedCheck) return;
    setSubmitting(true);
    try {
      await apiClient.submitReferenceCheckAsAdmin(driverId, selectedCheck.id, formData);
      toast.success('Reference check submitted.');
      setFillOpen(false);
      setSelectedCheck(null);
      fetchChecks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const copyRefereeLink = (check: ReferenceCheck) => {
    if (!check.token) {
      toast.error('No link available for this request');
      return;
    }
    const url = typeof window !== 'undefined' ? `${window.location.origin}/reference/${check.token}` : '';
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/drivers/${driverId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reference checks</h1>
          <p className="text-muted-foreground">
            {driver ? `Driver: ${driver.user?.name ?? 'Unknown'}` : 'Driver reference checks'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pre-employment reference checks
          </CardTitle>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New reference check
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Create reference check request</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Request for Information from Previous Employer – applicant authorizes release to R&amp;B Services Inc.
                </p>
                <div>
                  <Label>Applicant name</Label>
                  <Input
                    value={createForm.reference_request.applicant_name}
                    onChange={(e) => setCreateForm((prev) => ({
                      ...prev,
                      reference_request: { ...prev.reference_request, applicant_name: e.target.value },
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label>Driver&apos;s license number</Label>
                  <Input
                    value={createForm.reference_request.drivers_license_number}
                    onChange={(e) => setCreateForm((prev) => ({
                      ...prev,
                      reference_request: { ...prev.reference_request, drivers_license_number: e.target.value },
                    }))}
                  />
                </div>
                <div>
                  <Label>Previous company name</Label>
                  <Input
                    value={createForm.reference_request.previous_company_name}
                    onChange={(e) => setCreateForm((prev) => ({
                      ...prev,
                      reference_request: { ...prev.reference_request, previous_company_name: e.target.value },
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label>Previous company phone</Label>
                  <Input
                    value={createForm.reference_request.previous_company_phone}
                    onChange={(e) => setCreateForm((prev) => ({
                      ...prev,
                      reference_request: { ...prev.reference_request, previous_company_phone: e.target.value },
                    }))}
                  />
                </div>
                <div>
                  <Label>Name of supervisor / employer</Label>
                  <Input
                    value={createForm.reference_request.supervisor_employer_name}
                    onChange={(e) => setCreateForm((prev) => ({
                      ...prev,
                      reference_request: { ...prev.reference_request, supervisor_employer_name: e.target.value },
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label>Referee email (optional – send link to previous employer)</Label>
                  <Input
                    type="email"
                    placeholder="e.g. supervisor@company.com"
                    value={createForm.referee_email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, referee_email: e.target.value }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground border-t pt-4 mt-4">
                  Optional: Record that the applicant has read and signed the consent (authorize investigation, abide by rules, certify information is true).
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Applicant consent date (optional)</Label>
                    <Input
                      type="date"
                      value={createForm.applicant_consent?.consent_date ?? ''}
                      onChange={(e) => setCreateForm((prev) => {
                        const date = e.target.value;
                        return {
                          ...prev,
                          applicant_consent: date ? {
                            applicant_name: prev.reference_request.applicant_name,
                            consent_date: date,
                            agreed_to_investigation: true,
                            agreed_to_rules: true,
                            certified_truthful: true,
                          } : undefined,
                        };
                      })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create request'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : checks.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No reference checks yet. Create one and either fill it as admin or send the link to the previous employer.
            </p>
          ) : (
            <ul className="space-y-3">
              {checks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">
                      {check.reference_request?.previous_company_name ?? 'Reference check'} –{' '}
                      <Badge variant={check.status === 'completed' || check.status === 'admin_filled' ? 'default' : 'secondary'}>
                        {check.status}
                      </Badge>
                    </div>
                    {check.referee_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" /> {check.referee_email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {check.token && (
                      <Button variant="outline" size="sm" onClick={() => copyRefereeLink(check)}>
                        <Copy className="h-4 w-4 mr-1" /> Copy link
                      </Button>
                    )}
                    {(check.status === 'pending' || check.status === 'sent') && (
                      <Button size="sm" onClick={() => handleFillAsAdmin(check)}>
                        <Pencil className="h-4 w-4 mr-1" /> Fill as admin
                      </Button>
                    )}
                    {(check.status === 'completed' || check.status === 'admin_filled') && (
                      <Button variant="outline" size="sm" onClick={() => handleFillAsAdmin(check)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={fillOpen} onOpenChange={setFillOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {selectedCheck?.form_data ? 'View / Edit reference check' : 'Fill reference check (as admin)'}
            </SheetTitle>
          </SheetHeader>
          <div className="pt-4">
            {selectedCheck && (
              <PreEmploymentReferenceCheckForm
                applicantName={selectedCheck.reference_request?.applicant_name ?? driver?.user?.name ?? ''}
                initialData={selectedCheck.form_data}
                onSubmit={handleSubmitFill}
                isSubmitting={submitting}
                submitLabel="Save reference check"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
