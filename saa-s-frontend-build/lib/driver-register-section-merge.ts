import type { DriverRegisterFormState } from '@/lib/driver-register';

export type PersonalSectionState = Pick<
  DriverRegisterFormState,
  | 'first_name'
  | 'last_name'
  | 'middle_initial'
  | 'gender'
  | 'date_of_birth'
  | 'work_eligibility_canada'
  | 'education'
  | 'medical_limitations'
  | 'medical_limitations_explanation'
  | 'cell_phone'
  | 'email'
>;

export type AddressSectionState = Pick<
  DriverRegisterFormState,
  | 'current_address'
  | 'current_address_living_since'
  | 'city'
  | 'province'
  | 'postal_code'
  | 'previous_addresses'
>;

export type LicenseSectionState = Pick<
  DriverRegisterFormState,
  | 'license_number'
  | 'license_province'
  | 'license_class'
  | 'license_type'
  | 'license_other'
  | 'license_issue_date'
  | 'license_expiry_date'
  | 'license_endorsements'
  | 'license_conditions'
  | 'issuing_authority'
  | 'license_denied'
  | 'privileges_revoked'
  | 'dangerous_goods_certificate'
  | 'license_front_image'
  | 'license_back_image'
>;

export type DrivingSectionState = Pick<
  DriverRegisterFormState,
  | 'years_of_experience'
  | 'driving_history'
  | 'vehicle_types'
  | 'vehicle_ownership'
  | 'vehicle_capacity'
  | 'route_type'
  | 'route_details'
  | 'shift_timing'
  | 'pay_type'
  | 'equipment_used'
  | 'ever_had_accidents'
  | 'number_of_incidents'
  | 'accident_explanation'
  | 'traffic_violations'
>;

export type EmploymentSectionState = Pick<
  DriverRegisterFormState,
  'current_employer' | 'previous_employers'
>;

export type DocumentsSectionState = Pick<
  DriverRegisterFormState,
  | 'pcc_document'
  | 'abstract_document'
  | 'cvor_document'
  | 'safety_certificate'
  | 'drug_alcohol_test'
  | 'compliance_notes'
>;

export type PasswordSectionState = Pick<
  DriverRegisterFormState,
  'password' | 'confirmPassword'
>;

export type DriverRegisterSectionSlices = {
  personal: PersonalSectionState;
  address: AddressSectionState;
  license: LicenseSectionState;
  driving: DrivingSectionState;
  employment: EmploymentSectionState;
  documents: DocumentsSectionState;
  password: PasswordSectionState;
};

export function getInitialDriverRegisterSectionSlices(
  full: DriverRegisterFormState,
): DriverRegisterSectionSlices {
  return {
    personal: {
      first_name: full.first_name,
      last_name: full.last_name,
      middle_initial: full.middle_initial,
      gender: full.gender,
      date_of_birth: full.date_of_birth,
      work_eligibility_canada: full.work_eligibility_canada,
      education: full.education,
      medical_limitations: full.medical_limitations,
      medical_limitations_explanation: full.medical_limitations_explanation,
      cell_phone: full.cell_phone,
      email: full.email,
    },
    address: {
      current_address: full.current_address,
      current_address_living_since: full.current_address_living_since,
      city: full.city,
      province: full.province,
      postal_code: full.postal_code,
      previous_addresses: full.previous_addresses.map((r) => ({ ...r })),
    },
    license: {
      license_number: full.license_number,
      license_province: full.license_province,
      license_class: full.license_class,
      license_type: full.license_type,
      license_other: full.license_other,
      license_issue_date: full.license_issue_date,
      license_expiry_date: full.license_expiry_date,
      license_endorsements: full.license_endorsements,
      license_conditions: full.license_conditions,
      issuing_authority: full.issuing_authority,
      license_denied: full.license_denied,
      privileges_revoked: full.privileges_revoked,
      dangerous_goods_certificate: full.dangerous_goods_certificate,
      license_front_image: full.license_front_image,
      license_back_image: full.license_back_image,
    },
    driving: {
      years_of_experience: full.years_of_experience,
      driving_history: full.driving_history,
      vehicle_types: full.vehicle_types,
      vehicle_ownership: full.vehicle_ownership,
      vehicle_capacity: full.vehicle_capacity,
      route_type: full.route_type,
      route_details: full.route_details,
      shift_timing: full.shift_timing,
      pay_type: full.pay_type,
      equipment_used: full.equipment_used,
      ever_had_accidents: full.ever_had_accidents,
      number_of_incidents: full.number_of_incidents,
      accident_explanation: full.accident_explanation,
      traffic_violations: full.traffic_violations,
    },
    employment: {
      current_employer: { ...full.current_employer },
      previous_employers: full.previous_employers.map((e) => ({ ...e })),
    },
    documents: {
      pcc_document: full.pcc_document,
      abstract_document: full.abstract_document,
      cvor_document: full.cvor_document,
      safety_certificate: full.safety_certificate,
      drug_alcohol_test: full.drug_alcohol_test,
      compliance_notes: full.compliance_notes,
    },
    password: {
      password: full.password,
      confirmPassword: full.confirmPassword,
    },
  };
}

export function mergeDriverRegisterSections(
  slices: DriverRegisterSectionSlices,
  tenant_id: string | undefined,
): DriverRegisterFormState {
  return {
    tenant_id,
    ...slices.personal,
    ...slices.address,
    ...slices.license,
    ...slices.driving,
    ...slices.employment,
    ...slices.documents,
    ...slices.password,
  };
}
