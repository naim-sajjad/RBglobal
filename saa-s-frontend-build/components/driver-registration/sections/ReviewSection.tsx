'use client';

import React from 'react';
import type { DriverRegisterFormState } from '@/lib/driver-register';
import { RegistrationReview } from '@/components/driver-registration/RegistrationReview';

export type ReviewSectionProps = {
  merged: DriverRegisterFormState;
  onEditSection: (n: number) => void;
};

export const ReviewSection = React.memo(function ReviewSection({
  merged,
  onEditSection,
}: ReviewSectionProps) {
  return (
    <RegistrationReview
      data={{
        first_name: merged.first_name,
        middle_initial: merged.middle_initial,
        last_name: merged.last_name,
        gender: merged.gender,
        date_of_birth: merged.date_of_birth,
        email: merged.email,
        cell_phone: merged.cell_phone,
        education: merged.education,
        current_address: merged.current_address,
        current_address_living_since: merged.current_address_living_since,
        previous_addresses: merged.previous_addresses,
        city: merged.city,
        province: merged.province,
        postal_code: merged.postal_code,
        license_number: merged.license_number,
        license_type: merged.license_type,
        license_other: merged.license_other,
      }}
      onEditSection={onEditSection}
    />
  );
});
