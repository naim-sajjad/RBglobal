'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PreEmploymentReferenceCheckForm } from '@/components/reference-check/PreEmploymentReferenceCheckForm';
import { getReferenceCheckByToken, submitReferenceCheckByToken } from '@/lib/api';
import type { ReferenceCheck, ReferenceCheckFormData } from '@/lib/types';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ReferenceCheckByTokenPage() {
  const params = useParams();
  const token = params?.token as string;
  const [check, setCheck] = useState<ReferenceCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    getReferenceCheckByToken(token)
      .then((data) => {
        setCheck(data);
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || 'This reference check link is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (formData: ReferenceCheckFormData) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await submitReferenceCheckByToken(token, formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading reference check...</p>
        </div>
      </div>
    );
  }

  if (error && !check) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid or expired link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-muted-foreground">
              If you received this link from R&amp;B Services Inc., please contact them for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h2 className="text-xl font-semibold">Thank you</h2>
              <p className="text-muted-foreground">
                Your reference check has been submitted successfully. R&amp;B Services Inc. will review the information in confidence.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reference Check</h1>
          <p className="text-muted-foreground mt-1">
            R&amp;B Services Inc. – Pre-employment reference
          </p>
        </div>
        {check?.reference_request && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant &amp; employer details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Applicant: {check.reference_request.applicant_name}</p>
              <p>Previous company: {check.reference_request.previous_company_name}</p>
              <p>Supervisor/Employer: {check.reference_request.supervisor_employer_name}</p>
            </CardContent>
          </Card>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <PreEmploymentReferenceCheckForm
          applicantName={check?.reference_request?.applicant_name ?? check?.driver?.user?.name ?? ''}
          initialData={check?.form_data}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          submitLabel="Submit reference check"
        />
      </div>
    </div>
  );
}
