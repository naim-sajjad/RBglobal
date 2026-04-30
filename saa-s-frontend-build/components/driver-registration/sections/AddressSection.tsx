'use client';

import React, { useCallback, useMemo } from 'react';
import { isValid, parseISO, startOfDay } from 'date-fns';
import type { AddressSectionState } from '@/lib/driver-register-section-merge';
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
import { provinces } from '@/lib/driver-register-constants';
import {
  MIN_ADDRESS_HISTORY_YEARS,
  yearsFromIsoMoveInDate,
  yearsFromInclusiveDateRange,
} from '@/lib/address-period-years';
import {
  DRIVER_REGISTER_SELECT_CONTROL,
  DRIVER_REGISTER_SELECT_MENU,
} from '@/components/driver-registration/sections/driver-register-select-classes';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';
import { Plus, Trash2 } from 'lucide-react';
import { IsoDatePopoverField } from '@/components/driver-registration/IsoDatePopoverField';

export type AddressSectionProps = {
  data: AddressSectionState;
  setData: React.Dispatch<React.SetStateAction<AddressSectionState>>;
};

function AddressFieldsInner({ data, setData }: AddressSectionProps) {
  const currentAddress = useDebouncedStringField(
    data.current_address,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          current_address: v,
        })),
      [setData],
    ),
  );
  const setLivingSince = useCallback(
    (iso: string) =>
      setData((prev) => ({
        ...prev,
        current_address_living_since: iso,
      })),
    [setData],
  );
  const city = useDebouncedStringField(
    data.city,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          city: v,
        })),
      [setData],
    ),
  );
  const postal = useDebouncedStringField(
    data.postal_code,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          postal_code: v,
        })),
      [setData],
    ),
  );

  const coverageTotalYears = useMemo(() => {
    const cur = yearsFromIsoMoveInDate(data.current_address_living_since);
    let prevSum = 0;
    for (const row of data.previous_addresses) {
      if (!row.address.trim()) continue;
      if (!row.from_date.trim() || !row.to_date.trim()) continue;
      const py = yearsFromInclusiveDateRange(row.from_date, row.to_date);
      if (py !== null && py > 0) prevSum += py;
    }
    if (cur === null || cur <= 0) {
      return prevSum > 0 ? { total: prevSum, currentOk: false } : null;
    }
    return { total: cur + prevSum, currentOk: true };
  }, [data.current_address_living_since, data.previous_addresses]);

  const showPreviousAddresses = useMemo(() => {
    const cur = yearsFromIsoMoveInDate(data.current_address_living_since);
    if (cur === null) return true;
    return cur + 1e-9 < MIN_ADDRESS_HISTORY_YEARS;
  }, [data.current_address_living_since]);

  const updatePreviousAddress = useCallback(
    (index: number, address: string) => {
      setData((prev) => ({
        ...prev,
        previous_addresses: prev.previous_addresses.map((r, i) =>
          i === index ? { ...r, address } : r,
        ),
      }));
    },
    [setData],
  );

  const setPreviousFromDate = useCallback(
    (index: number, from_date: string) => {
      setData((prev) => ({
        ...prev,
        previous_addresses: prev.previous_addresses.map((r, i) => {
          if (i !== index) return r;
          let to_date = r.to_date;
          if (from_date && to_date) {
            const a = parseISO(from_date);
            const b = parseISO(to_date);
            if (
              isValid(a) &&
              isValid(b) &&
              startOfDay(b) < startOfDay(a)
            ) {
              to_date = '';
            }
          }
          return { ...r, from_date, to_date };
        }),
      }));
    },
    [setData],
  );

  const setPreviousToDate = useCallback(
    (index: number, to_date: string) => {
      setData((prev) => ({
        ...prev,
        previous_addresses: prev.previous_addresses.map((r, i) =>
          i === index ? { ...r, to_date } : r,
        ),
      }));
    },
    [setData],
  );

  const addPreviousRow = useCallback(() => {
    setData((prev) => ({
      ...prev,
      previous_addresses: [
        ...prev.previous_addresses,
        { address: '', from_date: '', to_date: '' },
      ],
    }));
  }, [setData]);

  const removePreviousRow = useCallback(
    (index: number) => {
      setData((prev) => {
        if (prev.previous_addresses.length <= 1) return prev;
        return {
          ...prev,
          previous_addresses: prev.previous_addresses.filter(
            (_, i) => i !== index,
          ),
        };
      });
    },
    [setData],
  );

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
          Current Address
        </h3>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Street Address <span className='text-red-500'>*</span>
          </Label>
          <Input
            name='current_address'
            value={currentAddress.value}
            onChange={(e) => currentAddress.onChangeValue(e.target.value)}
            onBlur={currentAddress.onBlur}
            required
            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
            placeholder='Enter street address'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-[#111827] font-medium'>
            Living since / time period <span className='text-red-500'>*</span>
          </Label>
          <IsoDatePopoverField
            value={data.current_address_living_since}
            onChange={setLivingSince}
            placeholder='Move-in date'
            id='current_address_living_since'
            maxDate={new Date()}
          />
          <p className='text-xs text-gray-600'>
            Select the date you moved in. This counts toward the minimum{' '}
            {MIN_ADDRESS_HISTORY_YEARS}-year history below.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              City <span className='text-red-500'>*</span>
            </Label>
            <Input
              name='city'
              value={city.value}
              onChange={(e) => city.onChangeValue(e.target.value)}
              onBlur={city.onBlur}
              required
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='Enter city'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Province <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={data.province}
              onValueChange={(value) =>
                setData((prev) => ({
                  ...prev,
                  province: value,
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
          <div className='space-y-2'>
            <Label className='text-[#111827] font-medium'>
              Postal Code <span className='text-red-500'>*</span>
            </Label>
            <Input
              name='postal_code'
              value={postal.value}
              onChange={(e) => postal.onChangeValue(e.target.value)}
              onBlur={postal.onBlur}
              required
              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
              placeholder='A1A 1A1'
            />
          </div>
        </div>
      </div>

      {showPreviousAddresses ? (
        <div className='space-y-4 pt-4 border-t'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
                Previous addresses (last {MIN_ADDRESS_HISTORY_YEARS} years)
              </h3>
              <p className='mt-2 text-sm text-gray-600'>
                For each place you lived before your current home, add the
                address and a date range (move in through move out). Together
                with your current address, the total time must be at least{' '}
                {MIN_ADDRESS_HISTORY_YEARS} years.
              </p>
            </div>
          </div>

          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              coverageTotalYears &&
              coverageTotalYears.total + 1e-9 >= MIN_ADDRESS_HISTORY_YEARS
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                : 'border-amber-200 bg-amber-50/90 text-amber-950'
            }`}
          >
            {coverageTotalYears ? (
              <>
                <span className='font-medium'>Time covered (estimate): </span>
                {coverageTotalYears.total.toFixed(2)} /{' '}
                {MIN_ADDRESS_HISTORY_YEARS} years minimum
                {!coverageTotalYears.currentOk ? (
                  <span className='block mt-1 text-xs'>
                    Enter a valid move-in date or duration for your current
                    address to include it in this total.
                  </span>
                ) : null}
              </>
            ) : (
              <span>
                Enter your current &ldquo;living since&rdquo; field to see how
                much history you have covered (minimum{' '}
                {MIN_ADDRESS_HISTORY_YEARS} years in total).
              </span>
            )}
          </div>

          <div className='space-y-4'>
            {data.previous_addresses.map((row, index) => {
              const toValid = row.to_date && isValid(parseISO(row.to_date));
              const toAsMax = toValid ? parseISO(row.to_date) : new Date();
              const fromValid =
                row.from_date && isValid(parseISO(row.from_date));
              const fromAsMin = fromValid ? parseISO(row.from_date) : undefined;
              return (
                <div
                  key={index}
                  className='space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-sm font-medium text-[#111827]'>
                      Previous address {index + 1}
                    </span>
                    {data.previous_addresses.length > 1 ? (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='gap-1 border-gray-300 text-red-700 hover:bg-red-50'
                        onClick={() => removePreviousRow(index)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-[#111827] font-medium'>Address</Label>
                    <Input
                      name={`previous_address_${index}`}
                      value={row.address}
                      onChange={(e) =>
                        updatePreviousAddress(index, e.target.value)
                      }
                      className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                      placeholder='Street, city, province'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-[#111827] font-medium'>
                      When you lived there{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <p className='text-xs text-gray-600'>
                      Select the date you moved in and the date you moved out
                      (last day at this address). Dates cannot be in the future.
                    </p>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      <div className='space-y-1.5'>
                        <Label
                          className='text-xs text-gray-600'
                          htmlFor={`prev_from_${index}`}
                        >
                          From
                        </Label>
                        <IsoDatePopoverField
                          id={`prev_from_${index}`}
                          value={row.from_date}
                          onChange={(v) => setPreviousFromDate(index, v)}
                          placeholder='Move-in date'
                          maxDate={toAsMax}
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <Label
                          className='text-xs text-gray-600'
                          htmlFor={`prev_to_${index}`}
                        >
                          To
                        </Label>
                        <IsoDatePopoverField
                          id={`prev_to_${index}`}
                          value={row.to_date}
                          onChange={(v) => setPreviousToDate(index, v)}
                          placeholder='Move-out date'
                          minDate={fromAsMin}
                          maxDate={new Date()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type='button'
            variant='outline'
            className='gap-2 border-gray-300'
            onClick={addPreviousRow}
          >
            <Plus className='h-4 w-4' />
            Add another previous address
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export const AddressSection = React.memo(function AddressSection(
  props: AddressSectionProps,
) {
  return <AddressFieldsInner {...props} />;
});
