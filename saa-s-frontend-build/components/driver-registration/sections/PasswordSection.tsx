'use client';

import React, { useCallback } from 'react';
import type { PasswordSectionState } from '@/lib/driver-register-section-merge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';

export type PasswordSectionProps = {
  data: PasswordSectionState;
  setData: React.Dispatch<React.SetStateAction<PasswordSectionState>>;
  /** Shown as “Email on file” — lives outside `PasswordSectionState`. */
  accountEmail: string;
};

function PasswordFieldsInner({
  data,
  setData,
  accountEmail,
}: PasswordSectionProps) {
  const password = useDebouncedStringField(
    data.password,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          password: v,
        })),
      [setData],
    ),
  );
  const confirmPassword = useDebouncedStringField(
    data.confirmPassword,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          confirmPassword: v,
        })),
      [setData],
    ),
  );

  return (
    <div className='space-y-6'>
      <p className='text-sm text-gray-600'>
        Email on file:{' '}
        <span className='font-medium text-[#111827]'>
          {accountEmail || '—'}
        </span>
      </p>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Password <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='password'
            name='password'
            value={password.value}
            onChange={(e) => password.onChangeValue(e.target.value)}
            onBlur={password.onBlur}
            required
            minLength={8}
            autoComplete='new-password'
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Minimum 8 characters'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Confirm Password <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='password'
            name='confirmPassword'
            value={confirmPassword.value}
            onChange={(e) => confirmPassword.onChangeValue(e.target.value)}
            onBlur={confirmPassword.onBlur}
            required
            autoComplete='new-password'
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Confirm your password'
          />
        </div>
      </div>

      <Alert className='bg-blue-50 border-blue-200'>
        <AlertCircle className='h-4 w-4 text-blue-600' />
        <AlertDescription className='text-blue-800'>
          Your account will be created with <strong>pending approval</strong>{' '}
          status. You&apos;ll be able to log in once an administrator approves
          your application.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export const PasswordSection = React.memo(function PasswordSection(
  props: PasswordSectionProps,
) {
  return <PasswordFieldsInner {...props} />;
});
