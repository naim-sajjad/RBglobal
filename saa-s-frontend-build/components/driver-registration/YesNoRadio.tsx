'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export const YesNoRadio = React.memo(function YesNoRadio({
  name,
  label,
  value,
  onChange,
  required = false,
}: Props) {
  return (
    <div className='space-y-3'>
      <Label className='text-[#111827] font-medium'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className='flex gap-6'>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='yes' id={`${name}-yes`} />
          <Label
            htmlFor={`${name}-yes`}
            className='cursor-pointer font-normal text-gray-900'
          >
            Yes
          </Label>
        </div>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='no' id={`${name}-no`} />
          <Label
            htmlFor={`${name}-no`}
            className='cursor-pointer font-normal text-gray-900'
          >
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
});
