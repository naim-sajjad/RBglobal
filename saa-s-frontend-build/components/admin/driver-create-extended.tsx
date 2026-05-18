'use client';

import React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { FileImage, X, Plus, Trash2 } from 'lucide-react';
import type { CreateDriverData, DriverClass } from '@/lib/types';
import type { DriverCompliancePayload } from '@/lib/admin-driver-compliance';
import {
  blankEmployer,
  blankEquipment,
  blankPreviousAddress,
  blankViolation,
} from '@/lib/admin-driver-compliance';

/** Radix SelectItem must not use an empty string value. */
const NO_DRIVER_CLASS_SELECT = '__no_driver_class__';

type DocumentFilesState = {
  pcc_document: File | null;
  license_front_image: File | null;
  license_back_image: File | null;
  license_document: File | null;
  abstract_document: File | null;
  cvor_document: File | null;
  safety_certificate: File | null;
};

type Props = {
  currentSection: number;
  isLoading: boolean;
  isEditing: boolean;
  compliance: DriverCompliancePayload;
  setCompliance: React.Dispatch<React.SetStateAction<DriverCompliancePayload>>;
  formData: CreateDriverData;
  setFormData: React.Dispatch<React.SetStateAction<CreateDriverData>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleVehicleTypeToggle: (type: string) => void;
  vehicleTypeOptions: string[];
  licenseTypes: string[];
  documentFiles: DocumentFilesState;
  handleFileChange: (field: keyof DocumentFilesState, file: File | null) => void;
  driverClasses: DriverClass[];
};

function DocumentUploadField({
  field,
  label,
  required = false,
  isEditing,
  isLoading,
  documentFiles,
  handleFileChange,
}: {
  field: keyof DocumentFilesState;
  label: string;
  required?: boolean;
  isEditing: boolean;
  isLoading: boolean;
  documentFiles: DocumentFilesState;
  handleFileChange: (field: keyof DocumentFilesState, file: File | null) => void;
}) {
  const file = documentFiles[field];
  const fileRequired = Boolean(required && !isEditing);

  return (
    <div className='space-y-2'>
      <Label htmlFor={field} className='text-slate-200'>
        {label} {required && '*'}
      </Label>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          id={field}
          type='file'
          accept='.pdf,.jpg,.jpeg,.png'
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            handleFileChange(field, selectedFile);
          }}
          disabled={isLoading}
          className='border-slate-600 bg-slate-700 text-white'
          required={fileRequired}
        />
        {file ? (
          <div className='flex items-center gap-2'>
            <FileImage className='h-4 w-4 text-green-400' />
            <span className='text-sm text-slate-300'>{file.name}</span>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => handleFileChange(field, null)}
              className='h-6 w-6 p-0 text-red-400 hover:text-red-300'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : null}
      </div>
      <p className='text-xs text-slate-400'>
        Accepted: PDF, JPG, PNG (Max 5MB). Leave empty when editing to keep
        existing file.
      </p>
    </div>
  );
}

export function DriverCreateExtendedSteps({
  currentSection,
  isLoading,
  isEditing,
  compliance,
  setCompliance,
  formData,
  setFormData,
  handleChange,
  handleVehicleTypeToggle,
  vehicleTypeOptions,
  licenseTypes,
  documentFiles,
  handleFileChange,
  driverClasses,
}: Props) {
  const inputCls = 'border-slate-600 bg-slate-700 text-white';

  return (
    <>
      {currentSection === 2 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>
            Address &amp; contact
          </h3>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label className='text-slate-200'>Street address</Label>
              <Input
                value={compliance.address.current_address}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: { ...p.address, current_address: e.target.value },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>
                At current address since (date or duration)
              </Label>
              <Input
                value={compliance.address.current_address_living_since}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: {
                      ...p.address,
                      current_address_living_since: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Cell phone</Label>
              <Input
                value={compliance.address.cell_phone}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: { ...p.address, cell_phone: e.target.value },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>City</Label>
              <Input
                value={compliance.address.city}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: { ...p.address, city: e.target.value },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Province</Label>
              <Input
                value={compliance.address.province}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: { ...p.address, province: e.target.value },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Postal code</Label>
              <Input
                value={compliance.address.postal_code}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    address: { ...p.address, postal_code: e.target.value },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label className='text-slate-200'>Previous addresses</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='border-slate-600 text-slate-300'
                onClick={() =>
                  setCompliance((p) => ({
                    ...p,
                    address: {
                      ...p.address,
                      previous_addresses: [
                        ...p.address.previous_addresses,
                        blankPreviousAddress(),
                      ],
                    },
                  }))
                }
                disabled={isLoading}
              >
                <Plus className='mr-1 h-4 w-4' />
                Add row
              </Button>
            </div>
            {compliance.address.previous_addresses.map((row, idx) => (
              <div
                key={idx}
                className='grid gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3 sm:grid-cols-3'
              >
                <div className='space-y-2 sm:col-span-3'>
                  <Label className='text-xs text-slate-400'>Address</Label>
                  <Input
                    value={row.address}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompliance((p) => {
                        const rows = [...p.address.previous_addresses];
                        rows[idx] = { ...rows[idx], address: v };
                        return {
                          ...p,
                          address: { ...p.address, previous_addresses: rows },
                        };
                      });
                    }}
                    disabled={isLoading}
                    className={inputCls}
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-xs text-slate-400'>From</Label>
                  <Input
                    type='date'
                    value={row.from_date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompliance((p) => {
                        const rows = [...p.address.previous_addresses];
                        rows[idx] = { ...rows[idx], from_date: v };
                        return {
                          ...p,
                          address: { ...p.address, previous_addresses: rows },
                        };
                      });
                    }}
                    disabled={isLoading}
                    className={inputCls}
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-xs text-slate-400'>To</Label>
                  <Input
                    type='date'
                    value={row.to_date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompliance((p) => {
                        const rows = [...p.address.previous_addresses];
                        rows[idx] = { ...rows[idx], to_date: v };
                        return {
                          ...p,
                          address: { ...p.address, previous_addresses: rows },
                        };
                      });
                    }}
                    disabled={isLoading}
                    className={inputCls}
                  />
                </div>
                <div className='flex items-end justify-end sm:col-span-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-red-400 hover:text-red-300'
                    onClick={() =>
                      setCompliance((p) => ({
                        ...p,
                        address: {
                          ...p.address,
                          previous_addresses:
                            p.address.previous_addresses.filter(
                              (_, i) => i !== idx,
                            ),
                        },
                      }))
                    }
                    disabled={
                      isLoading ||
                      compliance.address.previous_addresses.length <= 1
                    }
                  >
                    <Trash2 className='mr-1 h-4 w-4' />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentSection === 3 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>
            License (record + extra details)
          </h3>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='license_number' className='text-slate-200'>
                License number *
              </Label>
              <Input
                id='license_number'
                name='license_number'
                value={formData.license_number}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>License type *</Label>
              <Select
                value={formData.license_type || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    license_type: value as CreateDriverData['license_type'],
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent className='border-slate-600 bg-slate-700 text-white'>
                  {licenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.license_type === 'Other' ? (
            <div className='space-y-2'>
              <Label htmlFor='license_other' className='text-slate-200'>
                Specify license type *
              </Label>
              <Input
                id='license_other'
                name='license_other'
                value={formData.license_other}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
                required
              />
            </div>
          ) : null}

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='issuing_authority' className='text-slate-200'>
                Issuing authority *
              </Label>
              <Input
                id='issuing_authority'
                name='issuing_authority'
                value={formData.issuing_authority}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>License province (jurisdiction)</Label>
              <Input
                value={compliance.license.license_province}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    license: {
                      ...p.license,
                      license_province: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>License class (as on card)</Label>
              <Input
                value={compliance.license.license_class}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    license: {
                      ...p.license,
                      license_class: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='license_issue_date' className='text-slate-200'>
                Issue date *
              </Label>
              <Input
                id='license_issue_date'
                name='license_issue_date'
                type='date'
                value={formData.license_issue_date || ''}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='license_expiry_date' className='text-slate-200'>
                Expiry date *
              </Label>
              <Input
                id='license_expiry_date'
                name='license_expiry_date'
                type='date'
                value={formData.license_expiry_date || ''}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label className='text-slate-200'>Endorsements</Label>
              <Input
                value={compliance.license.license_endorsements}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    license: {
                      ...p.license,
                      license_endorsements: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label className='text-slate-200'>Conditions / restrictions</Label>
              <Input
                value={compliance.license.license_conditions}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    license: {
                      ...p.license,
                      license_conditions: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label className='text-slate-200'>License ever denied</Label>
              <Input
                value={compliance.questions.license_denied}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    questions: {
                      ...p.questions,
                      license_denied: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Privileges revoked</Label>
              <Input
                value={compliance.questions.privileges_revoked}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    questions: {
                      ...p.questions,
                      privileges_revoked: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Dangerous goods certificate</Label>
              <Input
                value={compliance.questions.dangerous_goods_certificate}
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    questions: {
                      ...p.questions,
                      dangerous_goods_certificate: e.target.value,
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <DocumentUploadField
              field='license_front_image'
              label='License front image'
              required
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
            <DocumentUploadField
              field='license_back_image'
              label='License back image'
              required
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
          </div>
        </div>
      )}

      {currentSection === 4 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>
            Driving experience &amp; history
          </h3>
          <div className='space-y-2'>
            <Label className='text-slate-200'>Vehicle types</Label>
            <div className='flex flex-wrap gap-4'>
              {vehicleTypeOptions.map((type) => (
                <label
                  key={type}
                  className='flex cursor-pointer items-center gap-2 text-slate-300'
                >
                  <Checkbox
                    checked={(formData.vehicle_types || []).includes(type)}
                    onCheckedChange={() => handleVehicleTypeToggle(type)}
                    disabled={isLoading}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label className='text-slate-200'>Equipment used</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='border-slate-600 text-slate-300'
                onClick={() =>
                  setCompliance((p) => ({
                    ...p,
                    driving_experience: {
                      ...p.driving_experience,
                      equipment_used: [
                        ...p.driving_experience.equipment_used,
                        blankEquipment(),
                      ],
                    },
                  }))
                }
                disabled={isLoading}
              >
                <Plus className='mr-1 h-4 w-4' />
                Add equipment
              </Button>
            </div>
            {compliance.driving_experience.equipment_used.map((row, idx) => (
              <div
                key={idx}
                className='grid gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3 sm:grid-cols-2 lg:grid-cols-3'
              >
                {(
                  [
                    ['make', 'Make'],
                    ['tractor_type', 'Tractor type'],
                    ['transmissions', 'Transmissions'],
                    ['trailer_type', 'Trailer type'],
                    ['areas_operated', 'Areas operated'],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key} className='space-y-2'>
                    <Label className='text-xs text-slate-400'>{lab}</Label>
                    <Input
                      value={row[key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompliance((p) => {
                          const rows = [...p.driving_experience.equipment_used];
                          rows[idx] = { ...rows[idx], [key]: v };
                          return {
                            ...p,
                            driving_experience: {
                              ...p.driving_experience,
                              equipment_used: rows,
                            },
                          };
                        });
                      }}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div className='flex items-end justify-end sm:col-span-2 lg:col-span-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-red-400 hover:text-red-300'
                    onClick={() =>
                      setCompliance((p) => ({
                        ...p,
                        driving_experience: {
                          ...p.driving_experience,
                          equipment_used:
                            p.driving_experience.equipment_used.filter(
                              (_, i) => i !== idx,
                            ),
                        },
                      }))
                    }
                    disabled={isLoading}
                  >
                    <Trash2 className='mr-1 h-4 w-4' />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Ever had accidents</Label>
              <Input
                value={
                  compliance.driving_experience.accident_history.ever_had_accidents
                }
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    driving_experience: {
                      ...p.driving_experience,
                      accident_history: {
                        ...p.driving_experience.accident_history,
                        ever_had_accidents: e.target.value,
                      },
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Number of incidents</Label>
              <Input
                value={
                  compliance.driving_experience.accident_history
                    .number_of_incidents
                }
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    driving_experience: {
                      ...p.driving_experience,
                      accident_history: {
                        ...p.driving_experience.accident_history,
                        number_of_incidents: e.target.value,
                      },
                    },
                  }))
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2 sm:col-span-3'>
              <Label className='text-slate-200'>Accident explanation</Label>
              <Textarea
                value={
                  compliance.driving_experience.accident_history
                    .accident_explanation
                }
                onChange={(e) =>
                  setCompliance((p) => ({
                    ...p,
                    driving_experience: {
                      ...p.driving_experience,
                      accident_history: {
                        ...p.driving_experience.accident_history,
                        accident_explanation: e.target.value,
                      },
                    },
                  }))
                }
                disabled={isLoading}
                className={`min-h-[80px] ${inputCls}`}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label className='text-slate-200'>Traffic violations</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='border-slate-600 text-slate-300'
                onClick={() =>
                  setCompliance((p) => ({
                    ...p,
                    driving_experience: {
                      ...p.driving_experience,
                      traffic_violations: [
                        ...p.driving_experience.traffic_violations,
                        blankViolation(),
                      ],
                    },
                  }))
                }
                disabled={isLoading}
              >
                <Plus className='mr-1 h-4 w-4' />
                Add violation
              </Button>
            </div>
            {compliance.driving_experience.traffic_violations.map((row, idx) => (
              <div
                key={idx}
                className='grid gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3 sm:grid-cols-2'
              >
                {(
                  [
                    ['date', 'Date'],
                    ['location', 'Location'],
                    ['violation_charge', 'Charge'],
                    ['penalty', 'Penalty'],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key} className='space-y-2'>
                    <Label className='text-xs text-slate-400'>{lab}</Label>
                    <Input
                      value={row[key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompliance((p) => {
                          const rows = [
                            ...p.driving_experience.traffic_violations,
                          ];
                          rows[idx] = { ...rows[idx], [key]: v };
                          return {
                            ...p,
                            driving_experience: {
                              ...p.driving_experience,
                              traffic_violations: rows,
                            },
                          };
                        });
                      }}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div className='flex justify-end sm:col-span-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-red-400 hover:text-red-300'
                    onClick={() =>
                      setCompliance((p) => ({
                        ...p,
                        driving_experience: {
                          ...p.driving_experience,
                          traffic_violations:
                            p.driving_experience.traffic_violations.filter(
                              (_, i) => i !== idx,
                            ),
                        },
                      }))
                    }
                    disabled={isLoading}
                  >
                    <Trash2 className='mr-1 h-4 w-4' />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentSection === 5 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>
            Employment history
          </h3>
          <p className='text-sm text-slate-400'>
            Current employer and previous employers (as collected on registration).
          </p>

          <EmployerEditor
            title='Current employer'
            emp={compliance.employment_history.current_employer}
            onChange={(next) =>
              setCompliance((p) => ({
                ...p,
                employment_history: {
                  ...p.employment_history,
                  current_employer: next,
                },
              }))
            }
            isLoading={isLoading}
            inputCls={inputCls}
          />

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label className='text-slate-200'>Previous employers</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='border-slate-600 text-slate-300'
                onClick={() =>
                  setCompliance((p) => ({
                    ...p,
                    employment_history: {
                      ...p.employment_history,
                      previous_employers: [
                        ...p.employment_history.previous_employers,
                        blankEmployer(),
                      ],
                    },
                  }))
                }
                disabled={isLoading}
              >
                <Plus className='mr-1 h-4 w-4' />
                Add employer
              </Button>
            </div>
            {compliance.employment_history.previous_employers.map((emp, idx) => (
              <EmployerEditor
                key={idx}
                title={`Previous employer ${idx + 1}`}
                emp={emp}
                onChange={(next) =>
                  setCompliance((p) => {
                    const list = [...p.employment_history.previous_employers];
                    list[idx] = next;
                    return {
                      ...p,
                      employment_history: {
                        ...p.employment_history,
                        previous_employers: list,
                      },
                    };
                  })
                }
                isLoading={isLoading}
                inputCls={inputCls}
                onRemove={() =>
                  setCompliance((p) => ({
                    ...p,
                    employment_history: {
                      ...p.employment_history,
                      previous_employers:
                        p.employment_history.previous_employers.filter(
                          (_, i) => i !== idx,
                        ),
                    },
                  }))
                }
                showRemove
              />
            ))}
          </div>
        </div>
      )}

      {currentSection === 6 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-white'>
            Documents &amp; admin
          </h3>
          <div className='grid gap-4 sm:grid-cols-2'>
            <DocumentUploadField
              field='pcc_document'
              label='PCC / Criminal background check'
              required
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
            <DocumentUploadField
              field='license_document'
              label='License document — single PDF/image (legacy / optional)'
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
            <DocumentUploadField
              field='abstract_document'
              label='Abstract'
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
            <DocumentUploadField
              field='cvor_document'
              label='CVOR'
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
            <DocumentUploadField
              field='safety_certificate'
              label='Safety certificate'
              isEditing={isEditing}
              isLoading={isLoading}
              documentFiles={documentFiles}
              handleFileChange={handleFileChange}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-slate-200'>
              Additional notes (driver documents step)
            </Label>
            <Textarea
              value={compliance.existing_notes}
              onChange={(e) =>
                setCompliance((p) => ({
                  ...p,
                  existing_notes: e.target.value,
                }))
              }
              disabled={isLoading}
              placeholder='Free-form notes stored with the application…'
              className={`min-h-[80px] ${inputCls}`}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='payee_business_name' className='text-slate-200'>
                Payee / business name (remittance)
              </Label>
              <Input
                id='payee_business_name'
                name='payee_business_name'
                value={formData.payee_business_name || ''}
                onChange={handleChange}
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='payee_address' className='text-slate-200'>
                Payee mailing address
              </Label>
              <Textarea
                id='payee_address'
                name='payee_address'
                value={formData.payee_address || ''}
                onChange={handleChange}
                disabled={isLoading}
                className={`min-h-[72px] ${inputCls}`}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Background check</Label>
              <Select
                value={formData.background_check_status || 'pending'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    background_check_status: value as 'pending' | 'completed',
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-slate-600 bg-slate-700 text-white'>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Status</Label>
              <Select
                value={formData.status || 'pending_approval'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as CreateDriverData['status'],
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-slate-600 bg-slate-700 text-white'>
                  <SelectItem value='pending_approval'>Pending approval</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Driver class</Label>
              <Select
                value={
                  formData.driver_class_id != null
                    ? String(formData.driver_class_id)
                    : NO_DRIVER_CLASS_SELECT
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    driver_class_id:
                      value === NO_DRIVER_CLASS_SELECT
                        ? undefined
                        : Number(value),
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder='Optional' />
                </SelectTrigger>
                <SelectContent className='border-slate-600 bg-slate-700 text-white'>
                  <SelectItem value={NO_DRIVER_CLASS_SELECT}>None</SelectItem>
                  {driverClasses.map((dc) => (
                    <SelectItem key={dc.id} value={String(dc.id)}>
                      {dc.code}
                      {dc.name ? ` — ${dc.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Class effective date</Label>
              <Input
                type='date'
                value={formData.driver_class_effective_date ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    driver_class_effective_date: e.target.value,
                  })
                }
                disabled={isLoading}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmployerEditor({
  title,
  emp,
  onChange,
  isLoading,
  inputCls,
  onRemove,
  showRemove,
}: {
  title: string;
  emp: DriverCompliancePayload['employment_history']['current_employer'];
  onChange: (
    next: DriverCompliancePayload['employment_history']['current_employer'],
  ) => void;
  isLoading: boolean;
  inputCls: string;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  const set = (k: keyof typeof emp, v: string) => onChange({ ...emp, [k]: v });
  return (
    <div className='space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-sm font-medium text-white'>{title}</p>
        {showRemove && onRemove ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-red-400 hover:text-red-300'
            onClick={onRemove}
            disabled={isLoading}
          >
            <Trash2 className='mr-1 h-4 w-4' />
            Remove
          </Button>
        ) : null}
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        {(
          [
            ['company', 'Company'],
            ['supervisor', 'Supervisor'],
            ['address', 'Address'],
            ['phone', 'Phone'],
            ['position', 'Position'],
            ['start_date', 'Start date'],
            ['end_date', 'End date'],
          ] as const
        ).map(([key, lab]) => (
          <div key={key} className='space-y-2'>
            <Label className='text-xs text-slate-400'>{lab}</Label>
            <Input
              type={key.includes('date') ? 'date' : 'text'}
              value={emp[key]}
              onChange={(e) => set(key, e.target.value)}
              disabled={isLoading}
              className={inputCls}
            />
          </div>
        ))}
        <div className='space-y-2 sm:col-span-2'>
          <Label className='text-xs text-slate-400'>Reasons for leaving</Label>
          <Textarea
            value={emp.reasons_for_leaving}
            onChange={(e) => set('reasons_for_leaving', e.target.value)}
            disabled={isLoading}
            className={`min-h-[64px] ${inputCls}`}
          />
        </div>
      </div>
    </div>
  );
}
