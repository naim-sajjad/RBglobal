'use client';

import React, { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import type { EmploymentSectionState } from '@/lib/driver-register-section-merge';
import type { DriverRegisterFormState } from '@/lib/driver-register';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';
import {
  yearsFromInclusiveDateRange,
} from '@/lib/address-period-years';

export type EmploymentSectionProps = {
  data: EmploymentSectionState;
  setData: React.Dispatch<React.SetStateAction<EmploymentSectionState>>;
};

const MIN_EMPLOYMENT_HISTORY_YEARS = 10;

type PrevEmployer = DriverRegisterFormState['previous_employers'][number];

const PreviousEmployerRowEditor = React.memo(function PreviousEmployerRowEditor({
  index,
  employer,
  setData,
}: {
  index: number;
  employer: PrevEmployer;
  setData: React.Dispatch<React.SetStateAction<EmploymentSectionState>>;
}) {
  const company = useDebouncedStringField(
    employer.company,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, company: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const supervisor = useDebouncedStringField(
    employer.supervisor,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, supervisor: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const address = useDebouncedStringField(
    employer.address,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, address: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const phone = useDebouncedStringField(
    employer.phone,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, phone: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const position = useDebouncedStringField(
    employer.position,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, position: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const startDate = useDebouncedStringField(
    employer.start_date,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, start_date: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const endDate = useDebouncedStringField(
    employer.end_date,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, end_date: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const reasons = useDebouncedStringField(
    employer.reasons_for_leaving,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          previous_employers: prev.previous_employers.map((row, i) =>
            i === index ? { ...row, reasons_for_leaving: v } : row,
          ),
        })),
      [index, setData],
    ),
  );

  return (
    <div className='p-6 bg-gray-50 rounded-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='font-semibold text-[#111827]'>
          Previous Employer {index + 1}
        </h4>
        <Button
          type='button'
          onClick={() =>
            setData((prev) => ({
              ...prev,
              previous_employers: prev.previous_employers.filter(
                (_, i) => i !== index,
              ),
            }))
          }
          variant='ghost'
          size='sm'
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          <X className='w-4 h-4 mr-1' />
          Remove
        </Button>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>
            Company <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={company.value}
            onChange={(e) => company.onChangeValue(e.target.value)}
            onBlur={company.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='e.g., UPS'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Supervisor</Label>
          <Input
            value={supervisor.value}
            onChange={(e) => supervisor.onChangeValue(e.target.value)}
            onBlur={supervisor.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter supervisor name'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>
            Address <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={address.value}
            onChange={(e) => address.onChangeValue(e.target.value)}
            onBlur={address.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='e.g., Concord, ON'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Phone</Label>
          <Input
            value={phone.value}
            onChange={(e) => phone.onChangeValue(e.target.value)}
            onBlur={phone.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter phone number'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>
            Position <span className='text-red-500'>*</span>
          </Label>
          <Input
            value={position.value}
            onChange={(e) => position.onChangeValue(e.target.value)}
            onBlur={position.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='e.g., Delivery Driver'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>
            Start Date <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='date'
            value={startDate.value}
            onChange={(e) => startDate.onChangeValue(e.target.value)}
            onBlur={startDate.onBlur}
            required
            max={format(new Date(), 'yyyy-MM-dd')}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>
            End Date <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='date'
            value={endDate.value}
            onChange={(e) => endDate.onChangeValue(e.target.value)}
            onBlur={endDate.onBlur}
            required
            max={format(new Date(), 'yyyy-MM-dd')}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
        </div>
      </div>
      <div className='space-y-2 mt-4'>
        <Label className='text-sm font-medium'>Reasons for Leaving</Label>
        <Textarea
          value={reasons.value}
          onChange={(e) => reasons.onChangeValue(e.target.value)}
          onBlur={reasons.onBlur}
          rows={2}
          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          placeholder='e.g., Was getting less work'
        />
      </div>
    </div>
  );
});

function EmploymentFieldsInner({ data, setData }: EmploymentSectionProps) {
  const curCompany = useDebouncedStringField(
    data.current_employer.company,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, company: v },
        })),
      [setData],
    ),
  );
  const curSupervisor = useDebouncedStringField(
    data.current_employer.supervisor,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, supervisor: v },
        })),
      [setData],
    ),
  );
  const curAddress = useDebouncedStringField(
    data.current_employer.address,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, address: v },
        })),
      [setData],
    ),
  );
  const curPhone = useDebouncedStringField(
    data.current_employer.phone,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, phone: v },
        })),
      [setData],
    ),
  );
  const curPosition = useDebouncedStringField(
    data.current_employer.position,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, position: v },
        })),
      [setData],
    ),
  );
  const curStart = useDebouncedStringField(
    data.current_employer.start_date,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, start_date: v },
        })),
      [setData],
    ),
  );
  const curEnd = useDebouncedStringField(
    data.current_employer.end_date,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, end_date: v },
        })),
      [setData],
    ),
  );
  const curReasons = useDebouncedStringField(
    data.current_employer.reasons_for_leaving,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_employer: { ...prev.current_employer, reasons_for_leaving: v },
        })),
      [setData],
    ),
  );

  const addPreviousEmployer = useCallback(() => {
    setData((prev) => ({
      ...prev,
      previous_employers: [
        ...prev.previous_employers,
        {
          company: '',
          supervisor: '',
          address: '',
          phone: '',
          position: '',
          start_date: '',
          end_date: '',
          reasons_for_leaving: '',
        },
      ],
    }));
  }, [setData]);

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentCoverageYears = useMemo(() => {
    const from = data.current_employer.start_date.trim();
    const to = data.current_employer.end_date.trim() || todayIso;
    const y = yearsFromInclusiveDateRange(from, to);
    return y;
  }, [data.current_employer.start_date, data.current_employer.end_date, todayIso]);

  const showPreviousEmployers = useMemo(() => {
    if (currentCoverageYears === null) return true;
    return currentCoverageYears + 1e-9 < MIN_EMPLOYMENT_HISTORY_YEARS;
  }, [currentCoverageYears]);

  const coverageSummary = useMemo(() => {
    const curFrom = data.current_employer.start_date.trim();
    const curTo = data.current_employer.end_date.trim() || todayIso;
    const curYears = yearsFromInclusiveDateRange(curFrom, curTo) ?? 0;

    let prevSum = 0;
    for (const row of data.previous_employers) {
      if (!row.company.trim()) continue;
      const fd = row.start_date.trim();
      const td = row.end_date.trim();
      const y = yearsFromInclusiveDateRange(fd, td);
      if (y !== null && y > 0) prevSum += y;
    }

    if (!curFrom) return null;
    return { total: curYears + prevSum, curYears };
  }, [data.current_employer.start_date, data.current_employer.end_date, data.previous_employers, todayIso]);

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
          Employment History (Last {MIN_EMPLOYMENT_HISTORY_YEARS} Years)
        </h3>
        <p className='text-sm text-gray-600'>
          Enter employers and date ranges to cover the last {MIN_EMPLOYMENT_HISTORY_YEARS} years.
          If your current employer already covers {MIN_EMPLOYMENT_HISTORY_YEARS}+ years, we won&apos;t ask for previous employers.
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
          Current/Most Recent Employer
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Company <span className='text-red-500'>*</span>
            </Label>
            <Input
              value={curCompany.value}
              onChange={(e) => curCompany.onChangeValue(e.target.value)}
              onBlur={curCompany.onBlur}
              required
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='e.g., Go Logistics'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>Supervisor</Label>
            <Input
              value={curSupervisor.value}
              onChange={(e) => curSupervisor.onChangeValue(e.target.value)}
              onBlur={curSupervisor.onBlur}
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='e.g., Rajwinder Singh'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Address <span className='text-red-500'>*</span>
            </Label>
            <Input
              value={curAddress.value}
              onChange={(e) => curAddress.onChangeValue(e.target.value)}
              onBlur={curAddress.onBlur}
              required
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='e.g., Oakville, ON'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>Phone</Label>
            <Input
              value={curPhone.value}
              onChange={(e) => curPhone.onChangeValue(e.target.value)}
              onBlur={curPhone.onBlur}
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='e.g., 437-799-6534'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Position <span className='text-red-500'>*</span>
            </Label>
            <Input
              value={curPosition.value}
              onChange={(e) => curPosition.onChangeValue(e.target.value)}
              onBlur={curPosition.onBlur}
              required
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='e.g., Straight Truck Driver'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Start Date <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='date'
              value={curStart.value}
              onChange={(e) => curStart.onChangeValue(e.target.value)}
              onBlur={curStart.onBlur}
              required
              max={todayIso}
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>End Date</Label>
            <Input
              type='date'
              value={curEnd.value}
              onChange={(e) => curEnd.onChangeValue(e.target.value)}
              onBlur={curEnd.onBlur}
              max={todayIso}
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            />
            <p className='text-xs text-gray-600'>
              Leave blank if you still work here.
            </p>
          </div>
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>Reasons for Leaving</Label>
          <Textarea
            value={curReasons.value}
            onChange={(e) => curReasons.onChangeValue(e.target.value)}
            onBlur={curReasons.onBlur}
            rows={3}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter reasons for leaving...'
          />
        </div>
      </div>

      {coverageSummary ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            coverageSummary.total + 1e-9 >= MIN_EMPLOYMENT_HISTORY_YEARS
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-amber-200 bg-amber-50/90 text-amber-950'
          }`}
        >
          <span className='font-medium'>Time covered (estimate): </span>
          {coverageSummary.total.toFixed(2)} / {MIN_EMPLOYMENT_HISTORY_YEARS} years minimum
        </div>
      ) : (
        <div className='rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-950'>
          Enter your current employer start date to see how much history you have covered.
        </div>
      )}

      {showPreviousEmployers ? (
        <div className='space-y-4 pt-6 border-t border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-[#111827]'>
              Previous Employers (Last {MIN_EMPLOYMENT_HISTORY_YEARS} Years)
            </h3>
            <Button
              type='button'
              onClick={addPreviousEmployer}
              variant='outline'
              className='border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
            >
              <Upload className='w-4 h-4 mr-2' />
              Add Previous Employer
            </Button>
          </div>
          {data.previous_employers.length === 0 ? (
            <p className='text-sm text-gray-500 italic'>
              {`No previous employers added. Click "Add Previous Employer" to add one.`}
            </p>
          ) : (
            <div className='space-y-6'>
              {data.previous_employers.map((employer, index) => (
                <PreviousEmployerRowEditor
                  key={index}
                  index={index}
                  employer={employer}
                  setData={setData}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export const EmploymentSection = React.memo(function EmploymentSection(
  props: EmploymentSectionProps,
) {
  return <EmploymentFieldsInner {...props} />;
});
