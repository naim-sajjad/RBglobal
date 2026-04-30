'use client';

import React, { useCallback } from 'react';
import type { DrivingSectionState } from '@/lib/driver-register-section-merge';
import { Button } from '@/components/ui/button';
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
import { Upload, X } from 'lucide-react';
import { vehicleTypeOptions } from '@/lib/driver-register-constants';
import {
  DRIVER_REGISTER_SELECT_CONTROL,
  DRIVER_REGISTER_SELECT_MENU,
} from '@/components/driver-registration/sections/driver-register-select-classes';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';

export type DrivingSectionProps = {
  data: DrivingSectionState;
  setData: React.Dispatch<React.SetStateAction<DrivingSectionState>>;
};

type ViolationRow = DrivingSectionState['traffic_violations'][number];

const TrafficViolationRowEditor = React.memo(function TrafficViolationRowEditor({
  index,
  violation,
  setData,
}: {
  index: number;
  violation: ViolationRow;
  setData: React.Dispatch<React.SetStateAction<DrivingSectionState>>;
}) {
  const location = useDebouncedStringField(
    violation.location,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          traffic_violations: prev.traffic_violations.map((row, i) =>
            i === index ? { ...row, location: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const charge = useDebouncedStringField(
    violation.violation_charge,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          traffic_violations: prev.traffic_violations.map((row, i) =>
            i === index ? { ...row, violation_charge: v } : row,
          ),
        })),
      [index, setData],
    ),
  );
  const penalty = useDebouncedStringField(
    violation.penalty,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          traffic_violations: prev.traffic_violations.map((row, i) =>
            i === index ? { ...row, penalty: v } : row,
          ),
        })),
      [index, setData],
    ),
  );

  return (
    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='font-medium text-[#111827]'>Violation {index + 1}</h4>
        <Button
          type='button'
          onClick={() =>
            setData((prev) => ({
              ...prev,
              traffic_violations: prev.traffic_violations.filter(
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
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='space-y-2'>
          <Label className='text-sm'>Date</Label>
          <Input
            type='date'
            value={violation.date}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                traffic_violations: prev.traffic_violations.map((row, i) =>
                  i === index ? { ...row, date: e.target.value } : row,
                ),
              }))
            }
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm'>Location</Label>
          <Input
            value={location.value}
            onChange={(e) => location.onChangeValue(e.target.value)}
            onBlur={location.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter location'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm'>Violation/Charge</Label>
          <Input
            value={charge.value}
            onChange={(e) => charge.onChangeValue(e.target.value)}
            onBlur={charge.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter violation'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-sm'>Penalty</Label>
          <Input
            value={penalty.value}
            onChange={(e) => penalty.onChangeValue(e.target.value)}
            onBlur={penalty.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter penalty'
          />
        </div>
      </div>
    </div>
  );
});

function DrivingFieldsInner({ data, setData }: DrivingSectionProps) {
  const numIncidents = useDebouncedStringField(
    data.number_of_incidents,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          number_of_incidents: v,
        })),
      [setData],
    ),
  );
  const accidentExplanation = useDebouncedStringField(
    data.accident_explanation,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          accident_explanation: v,
        })),
      [setData],
    ),
  );

  const handleVehicleTypeToggle = useCallback(
    (type: string) => {
      setData((prev) => {
        const types = prev.vehicle_types || [];
        if (types.includes(type)) {
          return { ...prev, vehicle_types: types.filter((t) => t !== type) };
        }
        return { ...prev, vehicle_types: [...types, type] };
      });
    },
    [setData],
  );

  const addTrafficViolation = useCallback(() => {
    setData((prev) => ({
      ...prev,
      traffic_violations: [
        ...prev.traffic_violations,
        {
          date: '',
          location: '',
          violation_charge: '',
          penalty: '',
        },
      ],
    }));
  }, [setData]);

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label className='text-[#111827] font-medium'>
          Vehicle Types <span className='text-red-500'>*</span>
        </Label>
        <div className='flex flex-wrap gap-3'>
          {vehicleTypeOptions.map((type) => (
            <button
              key={type}
              type='button'
              onClick={() => handleVehicleTypeToggle(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                data.vehicle_types.includes(type)
                  ? 'bg-[#D4AF37] text-[#111827] border-2 border-[#D4AF37]'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#D4AF37]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-4 pt-6 border-t border-gray-200'>
        <h3 className='text-lg font-semibold text-[#111827]'>Accident History</h3>
        <YesNoRadio
          name='ever_had_accidents'
          label='Ever had accidents?'
          value={data.ever_had_accidents}
          onChange={(value) =>
            setData((prev) => ({
              ...prev,
              ever_had_accidents: value,
            }))
          }
          required
        />
        {data.ever_had_accidents === 'yes' && (
          <>
            <div className='space-y-2'>
              <Label className='text-[#111827] font-medium'>
                Number of incidents <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='number'
                name='number_of_incidents'
                value={numIncidents.value}
                onChange={(e) => numIncidents.onChangeValue(e.target.value)}
                onBlur={numIncidents.onBlur}
                required={data.ever_had_accidents === 'yes'}
                min='0'
                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                placeholder='Enter number'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-[#111827] font-medium'>
                If Yes, please explain <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                name='accident_explanation'
                value={accidentExplanation.value}
                onChange={(e) => accidentExplanation.onChangeValue(e.target.value)}
                onBlur={accidentExplanation.onBlur}
                rows={4}
                required={data.ever_had_accidents === 'yes'}
                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                placeholder='Please provide details about the accidents...'
              />
            </div>
          </>
        )}
      </div>

      <div className='space-y-4 pt-6 border-t border-gray-200'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-[#111827]'>
            Last 3 Years History of Traffic Violations and Convictions
          </h3>
          <Button
            type='button'
            onClick={addTrafficViolation}
            variant='outline'
            className='border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
          >
            <Upload className='w-4 h-4 mr-2' />
            Add Violation
          </Button>
        </div>
        {data.traffic_violations.length === 0 ? (
          <p className='text-sm text-gray-500 italic'>
            {`No violations recorded. Click "Add Violation" if applicable.`}
          </p>
        ) : (
          <div className='space-y-4'>
            {data.traffic_violations.map((violation, index) => (
              <TrafficViolationRowEditor
                key={index}
                index={index}
                violation={violation}
                setData={setData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Route & shift preferences removed from this step */}
    </div>
  );
}

export const DrivingSection = React.memo(function DrivingSection(
  props: DrivingSectionProps,
) {
  return <DrivingFieldsInner {...props} />;
});
