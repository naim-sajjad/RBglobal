'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  approveTimesheetDocumentReviewByToken,
  getTimesheetDocumentReviewByToken,
  requestTimesheetDocumentAdjustmentByToken,
} from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Calculator,
  Mail,
} from 'lucide-react';

type ReviewPayload = Awaited<
  ReturnType<typeof getTimesheetDocumentReviewByToken>
>;

function buildMailto(
  email: string,
  subject: string,
  body: string,
): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  return `mailto:${email}?${params.toString()}`;
}

export default function TimesheetDocumentReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const action = searchParams?.get('action');

  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  const [showAdjustForm, setShowAdjustForm] = useState(action === 'adjust');
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getTimesheetDocumentReviewByToken(token);
      setReview(data);
      if (data.message && data.outdated) {
        setError(data.message);
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          'This review link is invalid or has expired.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (action === 'approve' && review?.can_respond && !doneMessage && !submitting) {
      setShowAdjustForm(false);
    }
    if (action === 'adjust') {
      setShowAdjustForm(true);
    }
  }, [action, review, doneMessage, submitting]);

  const periodLabel = useMemo(() => {
    if (!review?.period_start || !review?.period_end) return '';
    return `${review.period_start} – ${review.period_end}`;
  }, [review]);

  const adjustmentsEmail =
    review?.legacy_emails?.adjustments ||
    'adjustments@randbservicesplus.ca';
  const clearanceEmail =
    review?.legacy_emails?.clearance || 'asifa@randbservicesplus.ca';

  const adjustmentMailto = buildMailto(
    adjustmentsEmail,
    `Adjustment request${periodLabel ? ` – ${periodLabel}` : ''}`,
    [
      `Driver: ${review?.driver_name || ''}`,
      periodLabel ? `Period: ${periodLabel}` : '',
      review?.employer_name ? `Employer: ${review.employer_name}` : '',
      '',
      'Please describe what needs to be corrected:',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  const clearanceMailto = buildMailto(
    clearanceEmail,
    `Clearance / document request${periodLabel ? ` – ${periodLabel}` : ''}`,
    [
      `Driver: ${review?.driver_name || ''}`,
      periodLabel ? `Period: ${periodLabel}` : '',
      '',
      'Please describe the document or clearance request:',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  const handleApprove = async () => {
    if (!token) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await approveTimesheetDocumentReviewByToken(token);
      setDoneMessage(res.message);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not record confirmation'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAdjustment = async () => {
    if (!token) return;
    if (comment.trim().length < 3) {
      setError(
        'Please describe what needs to be corrected (at least a few words).',
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await requestTimesheetDocumentAdjustmentByToken(
        token,
        comment.trim(),
      );
      setDoneMessage(res.message);
      setShowAdjustForm(false);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not submit adjustment request'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-zinc-100'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-zinc-100 px-4 py-10'>
      <div className='mx-auto w-full max-w-lg space-y-4'>
        <Card className='border-zinc-200 shadow-sm'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-xl text-zinc-900'>
              Timesheet document review
            </CardTitle>
            {review ? (
              <p className='text-sm text-zinc-600'>
                {review.driver_name ? `${review.driver_name} · ` : ''}
                {periodLabel}
                {review.employer_name ? ` · ${review.employer_name}` : ''}
              </p>
            ) : null}
            {review?.status_label ? (
              <p className='text-xs font-medium text-zinc-500'>
                Status: {review.status_label}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className='space-y-4'>
            {error ? (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {doneMessage ? (
              <Alert className='border-emerald-200 bg-emerald-50 text-emerald-900'>
                <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                <AlertDescription>{doneMessage}</AlertDescription>
              </Alert>
            ) : null}

            {review?.status === 'approved' && !doneMessage ? (
              <Alert className='border-emerald-200 bg-emerald-50 text-emerald-900'>
                <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                <AlertDescription>
                  Confirmed
                  {review.reviewed_at
                    ? ` (${new Date(review.reviewed_at).toLocaleString()})`
                    : ''}
                  .
                </AlertDescription>
              </Alert>
            ) : null}

            {review?.status === 'adjustment_requested' && !doneMessage ? (
              <Alert className='border-amber-200 bg-amber-50 text-amber-950'>
                <AlertCircle className='h-4 w-4 text-amber-600' />
                <AlertDescription>
                  Adjustment Requested
                  {review.reviewed_at
                    ? ` (${new Date(review.reviewed_at).toLocaleString()})`
                    : ''}
                  .
                  {review.adjustment_comment ? (
                    <span className='mt-2 block whitespace-pre-wrap'>
                      “{review.adjustment_comment}”
                    </span>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            {review?.status === 'pending' && review.can_respond ? (
              <Alert className='border-blue-200 bg-blue-50 text-blue-950'>
                <AlertCircle className='h-4 w-4 text-blue-600' />
                <AlertDescription>
                  Pending Review — please confirm the documents or request an
                  adjustment below. You can still use the legacy email process if
                  you prefer.
                </AlertDescription>
              </Alert>
            ) : null}

            {review ? (
              <div className='flex flex-col gap-2'>
                <Button asChild variant='outline' className='justify-start'>
                  <a
                    href={review.documents.invoice.view_url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <FileText className='h-4 w-4 mr-2' />
                    View Invoice
                  </a>
                </Button>
                <Button asChild variant='outline' className='justify-start'>
                  <a
                    href={review.documents.calculation_sheet.view_url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Calculator className='h-4 w-4 mr-2' />
                    View Calculation Sheet
                  </a>
                </Button>
              </div>
            ) : null}

            {review?.can_respond ? (
              <div className='space-y-4 border-t border-zinc-200 pt-4'>
                <div>
                  <h3 className='text-sm font-semibold text-zinc-900 mb-2'>
                    1. Everything is Fine
                  </h3>
                  <p className='text-xs text-zinc-600 mb-2'>
                    Confirm that the invoice and calculation sheet are correct.
                  </p>
                  {!showAdjustForm ? (
                    <Button
                      className='w-full bg-green-600 hover:bg-green-700 text-white'
                      disabled={submitting}
                      onClick={() => void handleApprove()}
                    >
                      {submitting ? (
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      ) : (
                        <CheckCircle2 className='h-4 w-4 mr-2' />
                      )}
                      Everything is Fine
                    </Button>
                  ) : null}
                </div>

                <div>
                  <h3 className='text-sm font-semibold text-zinc-900 mb-2'>
                    2. Request Adjustment
                  </h3>
                  <p className='text-xs text-zinc-600 mb-2'>
                    Submit a correction request in the app for admin review.
                  </p>
                  {!showAdjustForm ? (
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full border-red-200 text-red-700 hover:bg-red-50'
                      disabled={submitting}
                      onClick={() => setShowAdjustForm(true)}
                    >
                      Request Adjustment
                    </Button>
                  ) : (
                    <div className='space-y-3'>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        placeholder='e.g. Distance on Aug 21 should be 210 km, not 187…'
                        className='bg-white'
                      />
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          className='flex-1'
                          disabled={submitting}
                          onClick={() => setShowAdjustForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='button'
                          className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                          disabled={submitting}
                          onClick={() => void handleRequestAdjustment()}
                        >
                          {submitting ? (
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                          ) : null}
                          Submit request
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {review ? (
              <div className='space-y-3 border-t border-zinc-200 pt-4'>
                <div>
                  <h3 className='text-sm font-semibold text-zinc-900 mb-1'>
                    3. Legacy email process
                  </h3>
                  <p className='text-xs text-zinc-600 mb-3'>
                    Prefer the previous manual process? Email us directly. This
                    does not change your in-app status — use options 1 or 2
                    above if you want the system to track your response.
                  </p>
                  <div className='flex flex-col gap-2'>
                    <Button asChild variant='outline' className='justify-start'>
                      <a href={adjustmentMailto}>
                        <Mail className='h-4 w-4 mr-2' />
                        Email adjustments ({adjustmentsEmail})
                      </a>
                    </Button>
                    <Button asChild variant='outline' className='justify-start'>
                      <a href={clearanceMailto}>
                        <Mail className='h-4 w-4 mr-2' />
                        Email clearance ({clearanceEmail})
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
