'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertCircle, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { RateCard, RateCardRatesConfig } from '@/lib/types';
import { toast } from 'sonner';

export default function ViewRateCardPage() {
  const params = useParams();
  const employerId = params?.id as string;
  const rateCardId = params?.rateCardId as string;

  const [rateCard, setRateCard] = useState<RateCard | null>(null);
  const [employerName, setEmployerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employerId && rateCardId) {
      fetchRateCard();
      apiClient.getEmployer(Number(employerId)).then((e) => setEmployerName(e.name)).catch(() => {});
    }
  }, [employerId, rateCardId]);

  const fetchRateCard = async () => {
    if (!employerId || !rateCardId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.getRateCard(Number(employerId), Number(rateCardId));
      setRateCard(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load rate card';
      setError(message || 'Failed to load rate card');
      toast.error('Failed to load rate card');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-600',
      draft: 'bg-slate-500',
      scheduled: 'bg-amber-600',
      expired: 'bg-red-600',
    };
    return <Badge className={map[status] || 'bg-slate-600'}>{status}</Badge>;
  };

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '—');

  if (isLoading || !rateCard) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/employers/${employerId}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{rateCard.name}</h1>
            <p className="text-slate-400 mt-1">
              {employerName ? `Rate card for ${employerName}` : 'Rate card details'}
            </p>
          </div>
        </div>
        <Link href={`/admin/employers/${employerId}/rate-cards/${rateCardId}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Rate Card
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800 border-slate-700 max-w-xl">
        <CardHeader>
          <CardTitle className="text-white">Rate Card Details</CardTitle>
          <CardDescription className="text-slate-400">View rate card information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Name</p>
            <p className="text-white font-medium">{rateCard.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Effective From</p>
            <p className="text-white">{formatDate(rateCard.effective_from)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Effective To</p>
            <p className="text-white">{formatDate(rateCard.effective_to)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <div className="mt-1">{getStatusBadge(rateCard.status)}</div>
          </div>
          {rateCard.rates && (() => {
            const r = rateCard.rates as RateCardRatesConfig;
            const hasStructured =
              r.measurement_unit != null ||
              r.currency != null ||
              r.minimum_trip_pay_agency != null ||
              r.minimum_trip_pay_driver != null ||
              (r.minimum_trip_pay_driver_by_class && Object.keys(r.minimum_trip_pay_driver_by_class).length > 0) ||
              (r.distance_bands && r.distance_bands.length > 0) ||
              (r.additional_charges && r.additional_charges.length > 0);
            if (!hasStructured && Object.keys(rateCard.rates).length === 0) return null;
            return (
              <>
                {(r.measurement_unit != null || r.currency != null) && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {r.measurement_unit != null && (
                      <div>
                        <p className="text-slate-400 text-sm">Measurement Unit</p>
                        <p className="text-white">{r.measurement_unit}</p>
                      </div>
                    )}
                    {r.currency != null && (
                      <div>
                        <p className="text-slate-400 text-sm">Currency</p>
                        <p className="text-white">{r.currency}</p>
                      </div>
                    )}
                  </div>
                )}
                {(r.minimum_trip_pay_agency != null || r.minimum_trip_pay_driver != null || (r.minimum_trip_pay_driver_by_class && Object.keys(r.minimum_trip_pay_driver_by_class).length > 0)) && (
                  <div className="space-y-2 pt-2">
                    <p className="text-slate-400 text-sm">Minimum Trip Pay</p>
                    <div className="grid grid-cols-2 gap-4">
                      {r.minimum_trip_pay_agency != null && (
                        <div>
                          <p className="text-slate-500 text-xs">Agency</p>
                          <p className="text-white">{r.minimum_trip_pay_agency}</p>
                        </div>
                      )}
                      {r.minimum_trip_pay_driver != null && (
                        <div>
                          <p className="text-slate-500 text-xs">Driver</p>
                          <p className="text-white">{r.minimum_trip_pay_driver}</p>
                        </div>
                      )}
                      {r.minimum_trip_pay_driver_by_class && Object.entries(r.minimum_trip_pay_driver_by_class).map(([code, val]) => (
                        <div key={code}>
                          <p className="text-slate-500 text-xs">Class {code}</p>
                          <p className="text-white">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {r.distance_bands && r.distance_bands.length > 0 && (() => {
                  const hasByClass = r.distance_bands.some((b) => b.driver_rates_by_class && Object.keys(b.driver_rates_by_class).length > 0);
                  const classCodes = hasByClass
                    ? [...new Set(r.distance_bands.flatMap((b) => Object.keys(b.driver_rates_by_class || {})))]
                    : [];
                  return (
                    <div className="pt-4">
                      <p className="text-slate-400 text-sm mb-2">Distance Band Rates</p>
                      <div className="rounded border border-slate-700 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700 bg-slate-700/50">
                              <TableHead className="text-slate-300">Distance From</TableHead>
                              <TableHead className="text-slate-300">Distance To</TableHead>
                              <TableHead className="text-slate-300">Agency Rate</TableHead>
                              {hasByClass
                                ? classCodes.map((code) => (
                                    <TableHead key={code} className="text-slate-300">Class {code}</TableHead>
                                  ))
                                : (
                                    <TableHead className="text-slate-300">Driver Rate</TableHead>
                                  )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {r.distance_bands.map((b, i) => (
                              <TableRow key={i} className="border-slate-700">
                                <TableCell className="text-white">{b.distance_from}</TableCell>
                                <TableCell className="text-slate-300">{b.distance_to ?? 'Open-ended'}</TableCell>
                                <TableCell className="text-slate-300">{b.agency_rate}</TableCell>
                                {hasByClass
                                  ? classCodes.map((code) => (
                                      <TableCell key={code} className="text-slate-300">
                                        {b.driver_rates_by_class?.[code] ?? '—'}
                                      </TableCell>
                                    ))
                                  : (
                                    <TableCell className="text-slate-300">{b.driver_rate}</TableCell>
                                  )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
                {r.additional_charges && r.additional_charges.length > 0 && (() => {
                  const hasByClass = r.additional_charges!.some((c) => c.driver_rates_by_class && Object.keys(c.driver_rates_by_class).length > 0);
                  const chargeClassCodes = hasByClass
                    ? [...new Set(r.additional_charges!.flatMap((c) => Object.keys(c.driver_rates_by_class || {})))]
                    : [];
                  return (
                    <div className="pt-4">
                      <p className="text-slate-400 text-sm mb-2">Additional Charges</p>
                      <div className="rounded border border-slate-700 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700 bg-slate-700/50">
                              <TableHead className="text-slate-300">Charge Type</TableHead>
                              <TableHead className="text-slate-300">Agency Rate</TableHead>
                              {hasByClass
                                ? chargeClassCodes.map((code) => (
                                    <TableHead key={code} className="text-slate-300">Class {code}</TableHead>
                                  ))
                                : (
                                    <TableHead className="text-slate-300">Driver Rate</TableHead>
                                  )}
                              <TableHead className="text-slate-300">Unit</TableHead>
                              <TableHead className="text-slate-300">Active</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {r.additional_charges!.map((c, i) => (
                              <TableRow key={i} className="border-slate-700">
                                <TableCell className="text-white">{c.charge_type || '—'}</TableCell>
                                <TableCell className="text-slate-300">{c.agency_rate}</TableCell>
                                {hasByClass
                                  ? chargeClassCodes.map((code) => (
                                      <TableCell key={code} className="text-slate-300">
                                        {c.driver_rates_by_class?.[code] ?? '—'}
                                      </TableCell>
                                    ))
                                  : (
                                    <TableCell className="text-slate-300">{c.driver_rate}</TableCell>
                                  )}
                                <TableCell className="text-slate-300">{String(c.unit ?? '—')}</TableCell>
                                <TableCell className="text-slate-300">{c.active ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
                {!r.distance_bands?.length && !r.additional_charges?.length && Object.keys(rateCard.rates).length > 0 && (
                  <div className="pt-2">
                    <p className="text-slate-400 text-sm mb-2">Rates (raw)</p>
                    <pre className="bg-slate-700/50 rounded p-4 text-slate-300 text-sm overflow-x-auto">
                      {JSON.stringify(rateCard.rates, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href={`/admin/employers/${employerId}`}>
          <Button variant="outline" className="border-slate-600 bg-transparent text-slate-300">
            Back to Employer
          </Button>
        </Link>
      </div>
    </div>
  );
}
