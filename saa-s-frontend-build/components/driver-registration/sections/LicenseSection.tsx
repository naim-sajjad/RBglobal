'use client';

import React, { useCallback } from 'react';
import type { LicenseSectionState } from '@/lib/driver-register-section-merge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LicenseTypeCards } from '@/components/driver-registration/LicenseTypeCards';
import { DocumentDropzone } from '@/components/driver-registration/DocumentDropzone';
import { YesNoRadio } from '@/components/driver-registration/YesNoRadio';
import { provinces, licenseClasses } from '@/lib/driver-register-constants';
import {
  DRIVER_REGISTER_SELECT_CONTROL,
  DRIVER_REGISTER_SELECT_MENU,
} from '@/components/driver-registration/sections/driver-register-select-classes';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';

export type LicenseSectionProps = {
  data: LicenseSectionState;
  setData: React.Dispatch<React.SetStateAction<LicenseSectionState>>;
};

function LicenseFieldsInner({ data, setData }: LicenseSectionProps) {
  const licenseNumber = useDebouncedStringField(
    data.license_number,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          license_number: v,
        })),
      [setData],
    ),
  );
  const licenseOther = useDebouncedStringField(
    data.license_other,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          license_other: v,
        })),
      [setData],
    ),
  );
  const issuingAuthority = useDebouncedStringField(
    data.issuing_authority,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          issuing_authority: v,
        })),
      [setData],
    ),
  );
  const endorsements = useDebouncedStringField(
    data.license_endorsements,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          license_endorsements: v,
        })),
      [setData],
    ),
  );
  const conditions = useDebouncedStringField(
    data.license_conditions,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          license_conditions: v,
        })),
      [setData],
    ),
  );

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            License Number <span className='text-red-500'>*</span>
          </Label>
          <Input
            name='license_number'
            value={licenseNumber.value}
            onChange={(e) => licenseNumber.onChangeValue(e.target.value)}
            onBlur={licenseNumber.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='B0928-65700-40116'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Province <span className='text-red-500'>*</span>
          </Label>
          <Select
            value={data.license_province}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                license_province: value,
              }))
            }
          >
            <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
              <SelectValue placeholder='Select province' />
            </SelectTrigger>
            <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
              {provinces.map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Class <span className='text-red-500'>*</span>
          </Label>
          <Select
            value={data.license_class}
            onValueChange={(value) =>
              setData((prev) => ({
                ...prev,
                license_class: value,
              }))
            }
          >
            <SelectTrigger className={DRIVER_REGISTER_SELECT_CONTROL}>
              <SelectValue placeholder='Select class' />
            </SelectTrigger>
            <SelectContent className={DRIVER_REGISTER_SELECT_MENU}>
              {licenseClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-3'>
        <Label className='text-[#111827] font-medium'>License type</Label>
        <p className='text-xs text-gray-500'>
          Tap the option that matches your licence.
        </p>
        <LicenseTypeCards
          value={data.license_type}
          onChange={(value) =>
            setData((prev) => ({
              ...prev,
              license_type: value,
            }))
          }
        />
      </div>

      {data.license_type === 'Other' && (
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Specify License Type
          </Label>
          <Input
            name='license_other'
            value={licenseOther.value}
            onChange={(e) => licenseOther.onChangeValue(e.target.value)}
            onBlur={licenseOther.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter license type'
          />
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Issue Date <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='date'
            name='license_issue_date'
            value={data.license_issue_date}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                license_issue_date: e.target.value,
              }))
            }
            required
            max={new Date().toISOString().slice(0, 10)}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Expiry Date <span className='text-red-500'>*</span>
          </Label>
          <Input
            type='date'
            name='license_expiry_date'
            value={data.license_expiry_date}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                license_expiry_date: e.target.value,
              }))
            }
            required
            min={new Date().toISOString().slice(0, 10)}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Issuing Authority <span className='text-red-500'>*</span>
          </Label>
          <Input
            name='issuing_authority'
            value={issuingAuthority.value}
            onChange={(e) => issuingAuthority.onChangeValue(e.target.value)}
            onBlur={issuingAuthority.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='e.g., Ontario Ministry of Transportation'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>Endorsements</Label>
          <Input
            name='license_endorsements'
            value={endorsements.value}
            onChange={(e) => endorsements.onChangeValue(e.target.value)}
            onBlur={endorsements.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='e.g., Air brake'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>Conditions</Label>
          <Input
            name='license_conditions'
            value={conditions.value}
            onChange={(e) => conditions.onChangeValue(e.target.value)}
            onBlur={conditions.onBlur}
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter conditions if any'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <DocumentDropzone
          label='License front image'
          file={data.license_front_image}
          onFileChange={(f) =>
            setData((prev) => ({
              ...prev,
              license_front_image: f,
            }))
          }
          required
        />
        <DocumentDropzone
          label='License back image'
          file={data.license_back_image}
          onFileChange={(f) =>
            setData((prev) => ({
              ...prev,
              license_back_image: f,
            }))
          }
          required
        />
      </div>

      <YesNoRadio
        name='license_denied'
        label='Have you ever been denied a license or permit to operate a vehicle?'
        value={data.license_denied}
        onChange={(value) =>
          setData((prev) => ({
            ...prev,
            license_denied: value,
          }))
        }
        required
      />

      <YesNoRadio
        name='privileges_revoked'
        label='Have you ever had your driving privileges revoked or suspended?'
        value={data.privileges_revoked}
        onChange={(value) =>
          setData((prev) => ({
            ...prev,
            privileges_revoked: value,
          }))
        }
        required
      />

      <YesNoRadio
        name='dangerous_goods'
        label='Do you have a dangerous good certificate?'
        value={data.dangerous_goods_certificate}
        onChange={(value) =>
          setData((prev) => ({
            ...prev,
            dangerous_goods_certificate: value,
          }))
        }
        required
      />
    </div>
  );
}

export const LicenseSection = React.memo(function LicenseSection(
  props: LicenseSectionProps,
) {
  return <LicenseFieldsInner {...props} />;
});
