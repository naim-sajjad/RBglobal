'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReferenceCheckFormData, ReferenceRating } from '@/lib/types';

const RATINGS: ReferenceRating[] = ['POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'EXCELLENT', 'N/A'];

const defaultFormData: Partial<ReferenceCheckFormData> = {
  relationship_to_applicant: 'supervisor',
  involved_in_accidents: 'no',
  reason_for_leaving: 'resignation',
};

interface PreEmploymentReferenceCheckFormProps {
  applicantName?: string;
  initialData?: Partial<ReferenceCheckFormData>;
  onSubmit: (data: ReferenceCheckFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function PreEmploymentReferenceCheckForm({
  applicantName = '',
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit Reference Check',
}: PreEmploymentReferenceCheckFormProps) {
  const [form, setForm] = React.useState<Partial<ReferenceCheckFormData>>({
    ...defaultFormData,
    applicant_name: applicantName,
    ...initialData,
  });

  const update = (key: keyof ReferenceCheckFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof ReferenceCheckFormData)[] = [
      'applicant_name',
      'date_of_reference_check',
      'date_of_employment_from',
      'date_of_employment_to',
      'positions_held',
      'nature_of_job',
      'driver_off_illness_injury',
      'involved_in_accidents',
      'reason_for_leaving',
      'attendance_rating',
      'dependability_rating',
      'willingness_rating',
      'ability_to_follow_instructions_rating',
      'quality_of_work_rating',
      'name_of_person_supplying_info',
      'referee_signature_date',
    ];
    for (const k of required) {
      if (form[k] === undefined || form[k] === '') {
        return;
      }
    }
    if (form.involved_in_accidents === 'yes') {
      if (form.accident_injuries === undefined || form.accident_fatalities === undefined || form.accident_hazardous_material_spilled === undefined) return;
    }
    onSubmit(form as ReferenceCheckFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PRE-EMPLOYMENT REFERENCE CHECK FORM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            We appreciate your time in completing, in confidence, the information below. Your reply will be held in strictest confidence.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Applicant Name</Label>
              <Input
                value={form.applicant_name ?? ''}
                onChange={(e) => update('applicant_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Date of Reference Check</Label>
              <Input
                type="date"
                value={form.date_of_reference_check ?? ''}
                onChange={(e) => update('date_of_reference_check', e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Relationship to Applicant</Label>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rel-supervisor"
                  checked={form.relationship_to_applicant === 'supervisor'}
                  onCheckedChange={(c) => update('relationship_to_applicant', c ? 'supervisor' : 'other')}
                />
                <label htmlFor="rel-supervisor">Supervisor</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rel-other"
                  checked={form.relationship_to_applicant === 'other'}
                  onCheckedChange={(c) => update('relationship_to_applicant', c ? 'other' : 'supervisor')}
                />
                <label htmlFor="rel-other">Other (specify)</label>
                <Input
                  className="w-40"
                  value={form.relationship_other_specify ?? ''}
                  onChange={(e) => update('relationship_other_specify', e.target.value)}
                  placeholder="Specify"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Date of Employment (From)</Label>
              <Input
                type="text"
                placeholder="e.g. Oct 2025"
                value={form.date_of_employment_from ?? ''}
                onChange={(e) => update('date_of_employment_from', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Date of Employment (To)</Label>
              <Input
                type="text"
                placeholder="e.g. Present"
                value={form.date_of_employment_to ?? ''}
                onChange={(e) => update('date_of_employment_to', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Salary (optional)</Label>
              <Input
                value={form.salary ?? ''}
                onChange={(e) => update('salary', e.target.value)}
              />
            </div>
            <div>
              <Label>Position(s) Held</Label>
              <Input
                value={form.positions_held ?? ''}
                onChange={(e) => update('positions_held', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment &amp; Conduct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>1. What was the nature of the applicant&apos;s job?</Label>
            <Textarea
              value={form.nature_of_job ?? ''}
              onChange={(e) => update('nature_of_job', e.target.value)}
              required
              rows={2}
            />
          </div>
          <div>
            <Label>2. Was the driver off for any length of time with an illness or injury?</Label>
            <RadioGroup
              value={form.driver_off_illness_injury ?? ''}
              onValueChange={(v) => update('driver_off_illness_injury', v)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="ill-yes" />
                <Label htmlFor="ill-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="ill-no" />
                <Label htmlFor="ill-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label>3. Was this applicant involved in any preventable or non-preventable vehicle accidents?</Label>
            <RadioGroup
              value={form.involved_in_accidents ?? 'no'}
              onValueChange={(v: 'yes' | 'no') => update('involved_in_accidents', v)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="acc-yes" />
                <Label htmlFor="acc-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="acc-no" />
                <Label htmlFor="acc-no">No</Label>
              </div>
            </RadioGroup>
            {form.involved_in_accidents === 'yes' && (
              <div className="ml-6 mt-2 space-y-2 border-l pl-4">
                <div className="flex items-center gap-4">
                  <Label className="w-48">a) Injuries:</Label>
                  <RadioGroup value={form.accident_injuries ?? ''} onValueChange={(v: 'yes' | 'no') => update('accident_injuries', v)} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="inj-yes" />
                      <Label htmlFor="inj-yes">YES</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="inj-no" />
                      <Label htmlFor="inj-no">NO</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48">b) Fatalities:</Label>
                  <RadioGroup value={form.accident_fatalities ?? ''} onValueChange={(v: 'yes' | 'no') => update('accident_fatalities', v)} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="fat-yes" />
                      <Label htmlFor="fat-yes">YES</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="fat-no" />
                      <Label htmlFor="fat-no">NO</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48">c) Hazardous material spilled?</Label>
                  <RadioGroup value={form.accident_hazardous_material_spilled ?? ''} onValueChange={(v: 'yes' | 'no') => update('accident_hazardous_material_spilled', v)} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="haz-yes" />
                      <Label htmlFor="haz-yes">YES</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="haz-no" />
                      <Label htmlFor="haz-no">NO</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label>4. Reason for leaving company:</Label>
            <div className="flex flex-wrap gap-4 pt-2">
              {(['discharged', 'resignation', 'lay_off'] as const).map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <Checkbox
                    id={`reason-${r}`}
                    checked={form.reason_for_leaving === r}
                    onCheckedChange={(c) => c && update('reason_for_leaving', r)}
                  />
                  <label htmlFor={`reason-${r}`}>{r === 'lay_off' ? 'Lay Off' : r.charAt(0).toUpperCase() + r.slice(1)}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">5. Please rank the candidate based on the following areas:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'attendance_rating' as const, label: 'Attendance' },
            { key: 'dependability_rating' as const, label: 'Dependability' },
            { key: 'willingness_rating' as const, label: 'Willingness to Assume Responsibility' },
            { key: 'ability_to_follow_instructions_rating' as const, label: 'Ability to Follow Instructions' },
            { key: 'quality_of_work_rating' as const, label: 'Quality of Work' },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label className="mb-2 block">{label}</Label>
              <RadioGroup
                value={form[key] ?? ''}
                onValueChange={(v: ReferenceRating) => update(key, v)}
                className="flex flex-wrap gap-4"
              >
                {RATINGS.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem value={r} id={`${key}-${r}`} />
                    <Label htmlFor={`${key}-${r}`} className="font-normal">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Information Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name of Person Supplying Information</Label>
            <Input
              value={form.name_of_person_supplying_info ?? ''}
              onChange={(e) => update('name_of_person_supplying_info', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.referee_signature_date ?? ''}
              onChange={(e) => update('referee_signature_date', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Additional comments (optional)</Label>
            <Textarea
              value={form.additional_comments ?? ''}
              onChange={(e) => update('additional_comments', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
