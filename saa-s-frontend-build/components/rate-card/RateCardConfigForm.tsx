'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  RateCardFormData,
  RateCardRatesConfig,
  DistanceBand,
  AdditionalCharge,
  AdditionalChargeUnit,
  RateCard as RateCardType,
  DriverClass,
} from '@/lib/types';
import { apiClient } from '@/lib/api';

const CHARGE_UNITS: { value: AdditionalChargeUnit | string; label: string }[] = [
  { value: 'per_stop', label: 'Per Stop' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'flat', label: 'Flat' },
  { value: 'per_trip', label: 'Per Trip' },
  { value: 'per_km', label: 'Per KM' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'other', label: 'Other' },
];

function defaultRates(measurementUnit: 'miles' | 'km', currency: string): RateCardRatesConfig {
  return {
    measurement_unit: measurementUnit,
    currency,
    minimum_trip_pay_agency: 0,
    minimum_trip_pay_driver: 0,
    distance_bands: [{ distance_from: 0, distance_to: null, agency_rate: 0, driver_rate: 0 }],
    additional_charges: [],
  };
}

function checkOverlappingBands(bands: DistanceBand[]): string | null {
  const sorted = [...bands].sort((a, b) => a.distance_from - b.distance_from);
  for (let i = 0; i < sorted.length; i++) {
    const aFrom = sorted[i].distance_from;
    const aTo = sorted[i].distance_to ?? Infinity;
    if (aTo <= aFrom && sorted[i].distance_to != null) {
      return `Row ${i + 1}: "Distance To" must be greater than "Distance From"`;
    }
    for (let j = i + 1; j < sorted.length; j++) {
      const bFrom = sorted[j].distance_from;
      const bTo = sorted[j].distance_to ?? Infinity;
      if (bTo <= bFrom && sorted[j].distance_to != null) {
        return `Row ${j + 1}: "Distance To" must be greater than "Distance From"`;
      }
      if (aFrom < bTo && bFrom < aTo) {
        return `Distance bands overlap: [${aFrom}, ${aTo === Infinity ? '∞' : aTo}) and [${bFrom}, ${bTo === Infinity ? '∞' : bTo})`;
      }
    }
  }
  return null;
}

export interface RateCardConfigFormProps {
  employerId: string;
  employerName: string;
  employerMeasurementUnit: 'miles' | 'km';
  employerCurrency: string;
  mode: 'create' | 'edit';
  initialData?: RateCardFormData | null;
  rateCardId?: number;
  existingRateCards?: RateCardType[];
  onSaveDraft: (data: RateCardFormData) => Promise<void>;
  onActivate: (data: RateCardFormData) => Promise<void>;
  onCancel: () => void;
}

export function RateCardConfigForm({
  employerId,
  employerName,
  employerMeasurementUnit,
  employerCurrency,
  mode,
  initialData,
  rateCardId,
  existingRateCards = [],
  onSaveDraft,
  onActivate,
  onCancel,
}: RateCardConfigFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [effectiveFrom, setEffectiveFrom] = useState(initialData?.effective_from ?? '');
  const [effectiveTo, setEffectiveTo] = useState(initialData?.effective_to ?? '');
  const [measurementUnit, setMeasurementUnit] = useState<'miles' | 'km'>(
    (initialData?.rates?.measurement_unit as 'miles' | 'km') ?? employerMeasurementUnit
  );
  const [currency, setCurrency] = useState(initialData?.rates?.currency ?? employerCurrency);
  const [minTripPayAgency, setMinTripPayAgency] = useState<string>(
    String(initialData?.rates?.minimum_trip_pay_agency ?? 0)
  );
  const [minTripPayDriver, setMinTripPayDriver] = useState<string>(
    String(initialData?.rates?.minimum_trip_pay_driver ?? 0)
  );
  const [distanceBands, setDistanceBands] = useState<DistanceBand[]>(
    initialData?.rates?.distance_bands?.length
      ? initialData.rates.distance_bands.map((b) => ({
          distance_from: Number(b.distance_from),
          distance_to: b.distance_to != null ? Number(b.distance_to) : null,
          agency_rate: Number(b.agency_rate),
          driver_rate: Number(b.driver_rate),
          driver_rates_by_class: b.driver_rates_by_class ? { ...b.driver_rates_by_class } : undefined,
        }))
      : defaultRates(employerMeasurementUnit, employerCurrency).distance_bands!
  );
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(
    initialData?.rates?.additional_charges?.length
      ? initialData.rates.additional_charges.map((c) => ({
          charge_type: String(c.charge_type),
          agency_rate: Number(c.agency_rate),
          driver_rate: Number(c.driver_rate),
          driver_rates_by_class: c.driver_rates_by_class ? { ...c.driver_rates_by_class } : undefined,
          unit: (c.unit as AdditionalChargeUnit) || 'flat',
          active: Boolean(c.active),
        }))
      : []
  );
  const [driverClasses, setDriverClasses] = useState<DriverClass[]>([]);
  const [minTripPayByClass, setMinTripPayByClass] = useState<Record<string, string>>({});
  const [duplicateFromId, setDuplicateFromId] = useState<string>('');
  const [error, setError] = useState('');
  const [bandError, setBandError] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    apiClient.getDriverClasses({ status: 'active' }).then((list) => {
      const arr = Array.isArray(list) ? list : [];
      setDriverClasses(arr);
      setMinTripPayByClass((prev) => {
        const next = { ...prev };
        arr.forEach((dc) => {
          if (next[dc.code] === undefined) {
            next[dc.code] = initialData?.rates?.minimum_trip_pay_driver_by_class?.[dc.code] != null
              ? String(initialData.rates.minimum_trip_pay_driver_by_class[dc.code])
              : '';
          }
        });
        return next;
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const byClass = initialData?.rates?.minimum_trip_pay_driver_by_class;
    if (byClass && Object.keys(byClass).length > 0) {
      setMinTripPayByClass((prev) => {
        const next = { ...prev };
        Object.entries(byClass).forEach(([code, val]) => {
          next[code] = String(val);
        });
        return next;
      });
    }
  }, [initialData?.rates?.minimum_trip_pay_driver_by_class]);

  useEffect(() => {
    setBandError(checkOverlappingBands(distanceBands));
  }, [distanceBands]);

  const loadFromRateCard = (card: RateCardType) => {
    setName(card.name + ' (Copy)');
    setEffectiveFrom(card.effective_from.slice(0, 10));
    setEffectiveTo(card.effective_to.slice(0, 10));
    if (card.rates) {
      const r = card.rates as RateCardRatesConfig;
      if (r.measurement_unit) setMeasurementUnit(r.measurement_unit);
      if (r.currency) setCurrency(r.currency);
      if (r.minimum_trip_pay_agency != null) setMinTripPayAgency(String(r.minimum_trip_pay_agency));
      if (r.minimum_trip_pay_driver != null) setMinTripPayDriver(String(r.minimum_trip_pay_driver));
      if (r.minimum_trip_pay_driver_by_class) {
        setMinTripPayByClass((prev) => {
          const next = { ...prev };
          Object.entries(r.minimum_trip_pay_driver_by_class!).forEach(([code, val]) => {
            next[code] = String(val);
          });
          return next;
        });
      }
      if (r.distance_bands?.length) {
        setDistanceBands(
          r.distance_bands.map((b) => ({
            distance_from: Number(b.distance_from),
            distance_to: b.distance_to != null ? Number(b.distance_to) : null,
            agency_rate: Number(b.agency_rate),
            driver_rate: Number(b.driver_rate),
            driver_rates_by_class: b.driver_rates_by_class
              ? { ...b.driver_rates_by_class }
              : undefined,
          }))
        );
      }
      if (r.additional_charges?.length) {
        setAdditionalCharges(
          r.additional_charges.map((c) => ({
            charge_type: String(c.charge_type),
            agency_rate: Number(c.agency_rate),
            driver_rate: Number(c.driver_rate),
            driver_rates_by_class: c.driver_rates_by_class ? { ...c.driver_rates_by_class } : undefined,
            unit: (c.unit as AdditionalChargeUnit) || 'flat',
            active: Boolean(c.active),
          }))
        );
      }
    }
    setDuplicateFromId('');
  };

  const buildPayload = (): RateCardFormData => {
    const driverByClassPayload: Record<string, number> = {};
    driverClasses.forEach((dc) => {
      const v = minTripPayByClass[dc.code];
      if (v !== undefined && v !== '') driverByClassPayload[dc.code] = Number(v) || 0;
    });
    return {
      name,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      rates: {
        measurement_unit: measurementUnit,
        currency,
        minimum_trip_pay_agency: minTripPayAgency === '' ? 0 : Number(minTripPayAgency),
        minimum_trip_pay_driver: minTripPayDriver === '' ? 0 : Number(minTripPayDriver),
        minimum_trip_pay_driver_by_class: Object.keys(driverByClassPayload).length > 0 ? driverByClassPayload : undefined,
        distance_bands: distanceBands.map((b) => {
          const band: { distance_from: number; distance_to: number | null; agency_rate: number; driver_rate: number; driver_rates_by_class?: Record<string, number> } = {
            distance_from: b.distance_from,
            distance_to: b.distance_to,
            agency_rate: b.agency_rate,
            driver_rate: b.driver_rate,
          };
          if (b.driver_rates_by_class && Object.keys(b.driver_rates_by_class).length > 0) {
            band.driver_rates_by_class = b.driver_rates_by_class;
          }
          return band;
        }),
        additional_charges: additionalCharges.map((c) => {
          const charge: AdditionalCharge & { driver_rates_by_class?: Record<string, number> } = {
            charge_type: c.charge_type,
            agency_rate: c.agency_rate,
            driver_rate: c.driver_rate,
            unit: c.unit,
            active: c.active,
          };
          if (c.driver_rates_by_class && Object.keys(c.driver_rates_by_class).length > 0) {
            charge.driver_rates_by_class = c.driver_rates_by_class;
          }
          return charge;
        }),
      },
    };
  };

  const handleSaveDraft = async () => {
    setError('');
    if (!name.trim()) {
      setError('Rate Card Name is required.');
      return;
    }
    if (!effectiveFrom || !effectiveTo) {
      setError('Effective From and Effective To are required.');
      return;
    }
    if (new Date(effectiveTo) < new Date(effectiveFrom)) {
      setError('Effective To must be on or after Effective From.');
      return;
    }
    if (bandError) {
      setError(bandError);
      return;
    }
    setSavingDraft(true);
    try {
      await onSaveDraft({ ...buildPayload(), status: 'draft' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleActivate = async () => {
    setError('');
    if (!name.trim()) {
      setError('Rate Card Name is required.');
      return;
    }
    if (!effectiveFrom || !effectiveTo) {
      setError('Effective From and Effective To are required.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(effectiveFrom);
    const to = new Date(effectiveTo);
    if (from > today) {
      setError('To activate, Effective From must be today or earlier.');
      return;
    }
    if (to < today) {
      setError('To activate, Effective To must be today or later.');
      return;
    }
    if (bandError) {
      setError(bandError);
      return;
    }
    setActivating(true);
    try {
      await onActivate({ ...buildPayload(), status: 'active' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to activate rate card');
    } finally {
      setActivating(false);
    }
  };

  const addBand = () => {
    const maxTo = distanceBands.reduce((max, b) => {
      const to = b.distance_to ?? Infinity;
      return to !== Infinity && to > max ? to : max;
    }, 0);
    const driver_rates_by_class: Record<string, number> = {};
    driverClasses.forEach((dc) => { driver_rates_by_class[dc.code] = 0; });
    setDistanceBands([
      ...distanceBands,
      {
        distance_from: maxTo,
        distance_to: null,
        agency_rate: 0,
        driver_rate: 0,
        ...(driverClasses.length > 0 ? { driver_rates_by_class } : {}),
      },
    ]);
  };

  const removeBand = (index: number) => {
    if (distanceBands.length <= 1) return;
    setDistanceBands(distanceBands.filter((_, i) => i !== index));
  };

  const updateBand = (index: number, field: keyof DistanceBand, value: number | null | Record<string, number>) => {
    setDistanceBands(
      distanceBands.map((b, i) => {
        if (i !== index) return b;
        if (field === 'driver_rates_by_class' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return { ...b, driver_rates_by_class: value as Record<string, number> };
        }
        return { ...b, [field]: value };
      })
    );
  };

  const updateBandDriverRateForClass = (bandIndex: number, classCode: string, value: number) => {
    setDistanceBands(
      distanceBands.map((b, i) => {
        if (i !== bandIndex) return b;
        const byClass = { ...(b.driver_rates_by_class || {}) };
        byClass[classCode] = value;
        return { ...b, driver_rates_by_class: byClass };
      })
    );
  };

  const addCharge = () => {
    const driver_rates_by_class: Record<string, number> = {};
    driverClasses.forEach((dc) => { driver_rates_by_class[dc.code] = 0; });
    setAdditionalCharges([
      ...additionalCharges,
      {
        charge_type: '',
        agency_rate: 0,
        driver_rate: 0,
        ...(driverClasses.length > 0 ? { driver_rates_by_class } : {}),
        unit: 'flat',
        active: true,
      },
    ]);
  };

  const removeCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const updateCharge = (index: number, field: keyof AdditionalCharge, value: string | number | boolean | Record<string, number>) => {
    setAdditionalCharges(
      additionalCharges.map((c, i) => {
        if (i !== index) return c;
        if (field === 'driver_rates_by_class' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return { ...c, driver_rates_by_class: value as Record<string, number> };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const updateChargeDriverRateForClass = (chargeIndex: number, classCode: string, value: number) => {
    setAdditionalCharges(
      additionalCharges.map((c, i) => {
        if (i !== chargeIndex) return c;
        const byClass = { ...(c.driver_rates_by_class || {}) };
        byClass[classCode] = value;
        return { ...c, driver_rates_by_class: byClass };
      })
    );
  };

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* General Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">General Information</CardTitle>
          <CardDescription className="text-slate-400">
            Basic rate card details and employer context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Employer</Label>
              <Input
                value={employerName}
                readOnly
                className="bg-slate-700/50 border-slate-600 text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Rate Card Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard 2025"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Effective From *</Label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Effective To *</Label>
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Measurement Unit</Label>
              <Select
                value={measurementUnit}
                onValueChange={(v: 'miles' | 'km') => setMeasurementUnit(v)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="km">KM</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Currency</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="e.g. CAD"
                maxLength={10}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            {driverClasses.length > 0 ? (
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-200">Minimum Trip Pay</Label>
                <p className="text-slate-400 text-sm">Agency rate and per-driver-class minimum pay</p>
                <div className="rounded-lg border border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 bg-slate-700/50">
                        <TableHead className="text-slate-300">Type</TableHead>
                        <TableHead className="text-slate-300">Agency</TableHead>
                        {driverClasses.map((dc) => (
                          <TableHead key={dc.id} className="text-slate-300 whitespace-nowrap">
                            Class {dc.code}{dc.name ? ` (${dc.name})` : ''}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-slate-700">
                        <TableCell className="text-slate-200 font-medium">Minimum Trip Pay</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={minTripPayAgency}
                            onChange={(e) => setMinTripPayAgency(e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white h-9"
                          />
                        </TableCell>
                        {driverClasses.map((dc) => (
                          <TableCell key={dc.id}>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={minTripPayByClass[dc.code] ?? ''}
                              onChange={(e) => setMinTripPayByClass((prev) => ({ ...prev, [dc.code]: e.target.value }))}
                              className="bg-slate-700 border-slate-600 text-white h-9"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-200">Minimum Trip Pay — Agency</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={minTripPayAgency}
                    onChange={(e) => setMinTripPayAgency(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Minimum Trip Pay — Driver</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={minTripPayDriver}
                    onChange={(e) => setMinTripPayDriver(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distance Band Rates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Distance Band Rates</CardTitle>
            <CardDescription className="text-slate-400">
              Rate per distance unit by band. Leave &quot;Distance To&quot; empty for open-ended.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addBand} className="border-slate-600 text-slate-300">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </CardHeader>
        <CardContent>
          {bandError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bandError}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg border border-slate-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 bg-slate-700/50">
                  <TableHead className="text-slate-300">Distance From</TableHead>
                  <TableHead className="text-slate-300">Distance To (empty = open-ended)</TableHead>
                  <TableHead className="text-slate-300 bg-slate-700/70">Agency Rate</TableHead>
                  {driverClasses.length > 0 ? (
                    driverClasses.map((dc) => (
                      <TableHead key={dc.id} className="text-slate-300 whitespace-nowrap">
                        Driver — Class {dc.code}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className="text-slate-300">Driver Rate</TableHead>
                  )}
                  <TableHead className="text-slate-300 w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distanceBands.map((band, i) => (
                  <TableRow key={i} className="border-slate-700">
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={band.distance_from}
                        onChange={(e) => updateBand(i, 'distance_from', Number(e.target.value) || 0)}
                        className="bg-slate-700 border-slate-600 text-white h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Open-ended"
                        value={band.distance_to ?? ''}
                        onChange={(e) =>
                          updateBand(i, 'distance_to', e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="bg-slate-700 border-slate-600 text-white h-9"
                      />
                    </TableCell>
                    <TableCell className="bg-slate-700/30">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={band.agency_rate}
                        onChange={(e) => updateBand(i, 'agency_rate', Number(e.target.value) || 0)}
                        className="bg-slate-700 border-slate-600 text-white h-9"
                      />
                    </TableCell>
                    {driverClasses.length > 0 ? (
                      driverClasses.map((dc) => (
                        <TableCell key={dc.id}>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={band.driver_rates_by_class?.[dc.code] ?? ''}
                            onChange={(e) => updateBandDriverRateForClass(i, dc.code, Number(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white h-9"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={band.driver_rate}
                          onChange={(e) => updateBand(i, 'driver_rate', Number(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white h-9"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400"
                        onClick={() => removeBand(i)}
                        disabled={distanceBands.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Charges */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Additional Charges</CardTitle>
            <CardDescription className="text-slate-400">
              Custom charge types with agency and driver rates
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCharge} className="border-slate-600 text-slate-300">
            <Plus className="h-4 w-4 mr-2" />
            Add Charge
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 bg-slate-700/50">
                  <TableHead className="text-slate-300">Charge Type</TableHead>
                  <TableHead className="text-slate-300 bg-slate-700/70">Agency Rate</TableHead>
                  {driverClasses.length > 0 ? (
                    driverClasses.map((dc) => (
                      <TableHead key={dc.id} className="text-slate-300 whitespace-nowrap">
                        Class {dc.code}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className="text-slate-300">Driver Rate</TableHead>
                  )}
                  <TableHead className="text-slate-300">Unit</TableHead>
                  <TableHead className="text-slate-300">Active</TableHead>
                  <TableHead className="text-slate-300 w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additionalCharges.length === 0 ? (
                  <TableRow className="border-slate-700">
                    <TableCell colSpan={driverClasses.length > 0 ? 5 + driverClasses.length : 6} className="text-slate-400 text-center py-6">
                      No additional charges. Click &quot;Add Charge&quot; to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  additionalCharges.map((charge, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell>
                        <Input
                          value={charge.charge_type}
                          onChange={(e) => updateCharge(i, 'charge_type', e.target.value)}
                          placeholder="e.g. Delay, Stops, Handbomb"
                          className="bg-slate-700 border-slate-600 text-white h-9"
                        />
                      </TableCell>
                      <TableCell className="bg-slate-700/30">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={charge.agency_rate}
                          onChange={(e) => updateCharge(i, 'agency_rate', Number(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white h-9"
                        />
                      </TableCell>
                      {driverClasses.length > 0 ? (
                        driverClasses.map((dc) => (
                          <TableCell key={dc.id}>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={charge.driver_rates_by_class?.[dc.code] ?? ''}
                              onChange={(e) => updateChargeDriverRateForClass(i, dc.code, Number(e.target.value) || 0)}
                              className="bg-slate-700 border-slate-600 text-white h-9"
                            />
                          </TableCell>
                        ))
                      ) : (
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={charge.driver_rate}
                            onChange={(e) => updateCharge(i, 'driver_rate', Number(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white h-9"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Select
                          value={charge.unit}
                          onValueChange={(v) => updateCharge(i, 'unit', v)}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {CHARGE_UNITS.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={charge.active}
                          onCheckedChange={(v) => updateCharge(i, 'active', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400"
                          onClick={() => removeCharge(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate from Existing (only when we have other cards) */}
      {existingRateCards.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Duplicate from Existing</CardTitle>
            <CardDescription className="text-slate-400">
              Load configuration from another rate card for this employer
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-200">Select rate card</Label>
              <Select value={duplicateFromId} onValueChange={(id) => {
                setDuplicateFromId(id);
                const card = existingRateCards.find((c) => String(c.id) === id);
                if (card) loadFromRateCard(card);
              }}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Choose a rate card..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {existingRateCards.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.effective_from.slice(0, 10)} – {c.effective_to.slice(0, 10)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const id = duplicateFromId;
                const card = existingRateCards.find((c) => String(c.id) === id);
                if (card) loadFromRateCard(card);
              }}
              className="border-slate-600 text-slate-300"
            >
              Load
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Options */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Save Options</CardTitle>
          <CardDescription className="text-slate-400">
            Save as draft to continue later, or activate to make this rate card effective
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={savingDraft || activating}
            className="border-slate-600 bg-transparent text-slate-300"
          >
            {savingDraft ? <Spinner className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={handleActivate}
            disabled={savingDraft || activating}
            className="bg-green-600 hover:bg-green-700"
          >
            {activating ? <Spinner className="h-4 w-4 mr-2 animate-spin" /> : null}
            Activate Rate Card
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={savingDraft || activating}
            className="border-slate-600 bg-transparent text-slate-300"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
