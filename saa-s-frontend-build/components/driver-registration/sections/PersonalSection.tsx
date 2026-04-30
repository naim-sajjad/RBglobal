'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PersonalSectionState } from '@/lib/driver-register-section-merge';
import {
  DOB_MONTHS,
  buildDobYearOptions,
  maxDayForYearMonth,
  splitDob,
} from '@/lib/driver-register-dob';
import { getAge } from '@/lib/driver-register';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { YesNoRadio } from '@/components/driver-registration/YesNoRadio';
import { genderOptions } from '@/lib/driver-register-constants';
import {
  DRIVER_REGISTER_SELECT_CONTROL,
  DRIVER_REGISTER_SELECT_MENU,
} from '@/components/driver-registration/sections/driver-register-select-classes';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';
import { formatCanadianPhoneDisplay, digitsOnly } from '@/lib/phone-format';

export type PersonalSectionProps = {
  data: PersonalSectionState;
  setData: React.Dispatch<React.SetStateAction<PersonalSectionState>>;
};

const DOB_YEAR_OPTIONS = buildDobYearOptions();

function PersonalFieldsInner({ data, setData }: PersonalSectionProps) {
  const [dobYear, setDobYear] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');

  useEffect(() => {
    if (!data.date_of_birth) return;
    const p = splitDob(data.date_of_birth);
    if (p.y && p.m && p.d) {
      setDobYear(p.y);
      setDobMonth(p.m);
      setDobDay(p.d);
    }
  }, [data.date_of_birth]);

  const dobMaxDay =
    dobYear && dobMonth ? maxDayForYearMonth(dobYear, dobMonth) : 31;
  const dobDayOptions = useMemo(
    () =>
      Array.from({ length: dobMaxDay }, (_, i) =>
        String(i + 1).padStart(2, '0'),
      ),
    [dobMaxDay],
  );

  const updateDobPart = useCallback(
    (key: 'y' | 'm' | 'd', val: string) => {
      let y = dobYear;
      let m = dobMonth;
      let d = dobDay;
      if (key === 'y') y = val;
      if (key === 'm') m = val;
      if (key === 'd') d = val;

      setDobYear(y);
      setDobMonth(m);
      setDobDay(d);

      if (!y || !m || !d) {
        setData((prev) => ({ ...prev, date_of_birth: '' }));
        return;
      }

      const maxD = maxDayForYearMonth(y, m);
      let dayNum = parseInt(d, 10);
      if (Number.isNaN(dayNum) || dayNum < 1) {
        setData((prev) => ({ ...prev, date_of_birth: '' }));
        return;
      }
      let dUse = d;
      if (dayNum > maxD) {
        dayNum = maxD;
        const dFixed = String(dayNum).padStart(2, '0');
        setDobDay(dFixed);
        dUse = dFixed;
      }

      const iso = `${y}-${m}-${dUse}`;
      const parsed = new Date(`${iso}T12:00:00`);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (parsed > endOfToday) {
        setData((prev) => ({ ...prev, date_of_birth: '' }));
        return;
      }

      setData((prev) => ({ ...prev, date_of_birth: iso }));
    },
    [dobYear, dobMonth, dobDay, setData],
  );

  const firstName = useDebouncedStringField(
    data.first_name,
    useCallback(
      (v) => setData((prev) => ({ ...prev, first_name: v })),
      [setData],
    ),
  );
  const middleInitial = useDebouncedStringField(
    data.middle_initial,
    useCallback(
      (v) => setData((prev) => ({ ...prev, middle_initial: v })),
      [setData],
    ),
  );
  const lastName = useDebouncedStringField(
    data.last_name,
    useCallback(
      (v) => setData((prev) => ({ ...prev, last_name: v })),
      [setData],
    ),
  );
  const education = useDebouncedStringField(
    data.education,
    useCallback(
      (v) => setData((prev) => ({ ...prev, education: v })),
      [setData],
    ),
  );
  const medicalExplain = useDebouncedStringField(
    data.medical_limitations_explanation,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          medical_limitations_explanation: v,
        })),
      [setData],
    ),
  );
  const email = useDebouncedStringField(
    data.email,
    useCallback(
      (v) => setData((prev) => ({ ...prev, email: v })),
      [setData],
    ),
  );

  const phoneDisplayCommitted = formatCanadianPhoneDisplay(data.cell_phone);
  const phone = useDebouncedStringField(
    phoneDisplayCommitted,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          cell_phone: digitsOnly(v).slice(0, 10),
        })),
      [setData],
    ),
  );

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            First Name <span className='text-red-500'>*</span>
          </Label>
          <Input
            name='first_name'
            value={firstName.value}
            onChange={(e) => firstName.onChangeValue(e.target.value)}
            onBlur={firstName.onBlur}
            required
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='Enter first name'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>Middle Initial</Label>
          <Input
            name='middle_initial'
            value={middleInitial.value}
            onChange={(e) => middleInitial.onChangeValue(e.target.value)}
            onBlur={middleInitial.onBlur}
            maxLength={1}
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='M'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Last Name <span className='text-red-500'>*</span>
          </Label>
          <Input
            name='last_name'
            value={lastName.value}
            onChange={(e) => lastName.onChangeValue(e.target.value)}
            onBlur={lastName.onBlur}
            required
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='Enter last name'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Date of Birth <span className='text-red-500'>*</span>
          </Label>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <Select
              value={dobMonth || undefined}
              onValueChange={(v: string) => updateDobPart('m', v)}
            >
              <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
                <SelectValue placeholder='Month' />
              </SelectTrigger>
              <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
                {DOB_MONTHS.map((mo) => (
                  <SelectItem key={mo.value} value={mo.value}>
                    {mo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={dobDay || undefined}
              onValueChange={(v: string) => updateDobPart('d', v)}
            >
              <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
                <SelectValue placeholder='Day' />
              </SelectTrigger>
              <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
                {dobDayOptions.map((day) => (
                  <SelectItem key={day} value={day}>
                    {parseInt(day, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={dobYear || undefined}
              onValueChange={(v: string) => updateDobPart('y', v)}
            >
              <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
                <SelectValue placeholder='Year' />
              </SelectTrigger>
              <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
                {DOB_YEAR_OPTIONS.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data.date_of_birth && getAge(data.date_of_birth) !== null && (
            <p className='text-xs text-gray-600'>
              Age:{' '}
              <span className='font-medium text-[#111827]'>
                {getAge(data.date_of_birth)} years
              </span>
            </p>
          )}
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Gender <span className='text-red-500'>*</span>
          </Label>
          <Select
            value={data.gender || undefined}
            onValueChange={(value) =>
              setData((prev) => ({ ...prev, gender: value }))
            }
          >
            <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
              <SelectValue placeholder='Select gender' />
            </SelectTrigger>
            <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
              {genderOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Phone Number <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='tel'
            name='cell_phone'
            inputMode='numeric'
            value={phone.value}
            onChange={(e) => phone.onChangeValue(e.target.value)}
            onBlur={phone.onBlur}
            required
            autoComplete='tel'
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='(555) 123-4567'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Email <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='email'
            name='email'
            value={email.value}
            onChange={(e) => email.onChangeValue(e.target.value)}
            onBlur={email.onBlur}
            required
            autoComplete='email'
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='you@example.com'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-[#111827] font-medium'>
          Certification or Education
        </Label>
        <Input
          name='education'
          value={education.value}
          onChange={(e) => education.onChangeValue(e.target.value)}
          onBlur={education.onBlur}
          className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
          placeholder='e.g., Post graduate diploma'
        />
      </div>

      <YesNoRadio
        name='work_eligibility'
        label='Are you legally entitled to work in Canada?'
        value={data.work_eligibility_canada}
        onChange={(value) =>
          setData((prev) => ({ ...prev, work_eligibility_canada: value }))
        }
        required
      />

      <YesNoRadio
        name='medical_limitations'
        label='Do you have any physical difficulties or medical limitation that might stop you from performing the position of a truck driver?'
        value={data.medical_limitations}
        onChange={(value) =>
          setData((prev) => ({ ...prev, medical_limitations: value }))
        }
        required
      />

      {data.medical_limitations === 'yes' && (
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            If Yes, please explain <span className='text-red-500'>*</span>
          </Label>
          <Textarea
            name='medical_limitations_explanation'
            value={medicalExplain.value}
            onChange={(e) => medicalExplain.onChangeValue(e.target.value)}
            onBlur={medicalExplain.onBlur}
            rows={3}
            required={data.medical_limitations === 'yes'}
            className='rounded-lg border-2 border-gray-200 bg-white focus:border-[#D4AF37]'
            placeholder='Please provide details...'
          />
        </div>
      )}
    </div>
  );
}

export const PersonalSection = React.memo(function PersonalSection(
  props: PersonalSectionProps,
) {
  return <PersonalFieldsInner {...props} />;
});
