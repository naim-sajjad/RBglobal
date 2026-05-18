/** Driver registration wizard — initial state + section validation (kept out of the page component to avoid huge per-render allocations). */

import {
  MIN_ADDRESS_HISTORY_YEARS,
  yearsFromIsoMoveInDate,
  yearsFromInclusiveDateRange,
} from '@/lib/address-period-years';
import { addDays, format, isValid, parseISO, startOfDay, subYears } from 'date-fns';

export type DriverPreviousAddressEntry = {
  address: string;
  from_date: string;
  to_date: string;
};

export interface DriverRegisterFormState {
  tenant_id: string | undefined;
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  middle_initial: string;
  gender: string;
  date_of_birth: string;
  work_eligibility_canada: string;
  education: string;
  medical_limitations: string;
  medical_limitations_explanation: string;
  current_address: string;
  city: string;
  province: string;
  postal_code: string;
  cell_phone: string;
  /** Move-in date (YYYY-MM-DD) or duration at current address (e.g. "2 years"). */
  current_address_living_since: string;
  previous_addresses: DriverPreviousAddressEntry[];
  license_number: string;
  license_province: string;
  license_class: string;
  license_type: string;
  license_other: string;
  license_issue_date: string;
  license_expiry_date: string;
  license_endorsements: string;
  license_conditions: string;
  issuing_authority: string;
  license_denied: string;
  privileges_revoked: string;
  dangerous_goods_certificate: string;
  license_front_image: File | null;
  license_back_image: File | null;
  years_of_experience: string;
  driving_history: string;
  vehicle_types: string[];
  vehicle_ownership: string;
  vehicle_capacity: string;
  route_type: string;
  route_details: string;
  shift_timing: string;
  pay_type: string;
  equipment_used: Array<{
    make: string;
    tractor_type: string;
    transmissions: string;
    trailer_type: string;
    areas_operated: string;
  }>;
  ever_had_accidents: string;
  number_of_incidents: string;
  accident_explanation: string;
  traffic_violations: Array<{
    date: string;
    location: string;
    violation_charge: string;
    penalty: string;
  }>;
  current_employer: {
    company: string;
    supervisor: string;
    address: string;
    phone: string;
    position: string;
    start_date: string;
    end_date: string;
    reasons_for_leaving: string;
  };
  previous_employers: Array<{
    company: string;
    supervisor: string;
    address: string;
    phone: string;
    position: string;
    start_date: string;
    end_date: string;
    reasons_for_leaving: string;
  }>;
  /** PCC / criminal background check document (PDF or image). */
  pcc_document: File | null;
  license_document: File | null;
  abstract_document: File | null;
  cvor_document: File | null;
  safety_certificate: File | null;
  drug_alcohol_test: boolean;
  compliance_notes: string;
}

export function getDriverRegisterInitialFormState(): DriverRegisterFormState {
  return {
    tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT,
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    middle_initial: '',
    gender: '',
    date_of_birth: '',
    work_eligibility_canada: '',
    education: '',
    medical_limitations: '',
    medical_limitations_explanation: '',
    current_address: '',
    city: '',
    province: '',
    postal_code: '',
    cell_phone: '',
    current_address_living_since: '',
    previous_addresses: [{ address: '', from_date: '', to_date: '' }],
    license_number: '',
    license_province: '',
    license_class: '',
    license_type: '',
    license_other: '',
    license_issue_date: '',
    license_expiry_date: '',
    license_endorsements: '',
    license_conditions: '',
    issuing_authority: '',
    license_denied: '',
    privileges_revoked: '',
    dangerous_goods_certificate: '',
    license_front_image: null,
    license_back_image: null,
    years_of_experience: '',
    driving_history: '',
    vehicle_types: [] as string[],
    vehicle_ownership: '',
    vehicle_capacity: '',
    route_type: '',
    route_details: '',
    shift_timing: '',
    pay_type: '',
    equipment_used: [] as Array<{
      make: string;
      tractor_type: string;
      transmissions: string;
      trailer_type: string;
      areas_operated: string;
    }>,
    ever_had_accidents: '',
    number_of_incidents: '',
    accident_explanation: '',
    traffic_violations: [] as Array<{
      date: string;
      location: string;
      violation_charge: string;
      penalty: string;
    }>,
    current_employer: {
      company: '',
      supervisor: '',
      address: '',
      phone: '',
      position: '',
      start_date: '',
      end_date: '',
      reasons_for_leaving: '',
    },
    previous_employers: [] as Array<{
      company: string;
      supervisor: string;
      address: string;
      phone: string;
      position: string;
      start_date: string;
      end_date: string;
      reasons_for_leaving: string;
    }>,
    pcc_document: null,
    license_document: null,
    abstract_document: null,
    cvor_document: null,
    safety_certificate: null,
    drug_alcohol_test: false,
    compliance_notes: '',
  };
}

export const DRIVER_REGISTER_VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  canadianPostalCode: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  canadianPhoneDigits: (s: string) =>
    s.replace(/\D/g, '').match(/^1?(\d{10})$/) ? true : false,
  minDriverAge: 18,
} as const;

export function isDateNotFuture(dateStr: string): boolean {
  if (!dateStr.trim()) return true;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && d <= new Date();
}

export function isDateNotPast(dateStr: string): boolean {
  if (!dateStr.trim()) return true;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d.getTime()) && d >= today;
}

/** Age in years from a YYYY-MM-DD or other parseable date string. */
export function getAge(dateStr: string): number | null {
  if (!dateStr.trim()) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function validateDriverRegisterSection(
  section: number,
  data: DriverRegisterFormState,
): { isValid: boolean; errorMessage: string } {
  const V = DRIVER_REGISTER_VALIDATION;

  switch (section) {
    case 1:
      if (!data.first_name.trim()) {
        return { isValid: false, errorMessage: 'First name is required' };
      }
      if (data.first_name.trim().length < 2) {
        return {
          isValid: false,
          errorMessage: 'First name must be at least 2 characters',
        };
      }
      if (!/^[\p{L}\s\-'.]+$/u.test(data.first_name.trim())) {
        return {
          isValid: false,
          errorMessage:
            'First name can only contain letters, spaces, hyphens, or apostrophes',
        };
      }
      if (!data.last_name.trim()) {
        return { isValid: false, errorMessage: 'Last name is required' };
      }
      if (data.last_name.trim().length < 2) {
        return {
          isValid: false,
          errorMessage: 'Last name must be at least 2 characters',
        };
      }
      if (!/^[\p{L}\s\-'.]+$/u.test(data.last_name.trim())) {
        return {
          isValid: false,
          errorMessage:
            'Last name can only contain letters, spaces, hyphens, or apostrophes',
        };
      }
      if (data.middle_initial.trim().length > 1) {
        return {
          isValid: false,
          errorMessage: 'Middle initial must be one character or empty',
        };
      }
      if (!data.date_of_birth) {
        return { isValid: false, errorMessage: 'Date of birth is required' };
      }
      if (!isDateNotFuture(data.date_of_birth)) {
        return {
          isValid: false,
          errorMessage: 'Date of birth cannot be in the future',
        };
      }
      const age = getAge(data.date_of_birth);
      if (age !== null && age < V.minDriverAge) {
        return {
          isValid: false,
          errorMessage: `Driver must be at least ${V.minDriverAge} years old`,
        };
      }
      if (!data.gender) {
        return { isValid: false, errorMessage: 'Gender is required' };
      }
      if (!data.cell_phone.trim()) {
        return {
          isValid: false,
          errorMessage: 'Phone number is required',
        };
      }
      if (!V.canadianPhoneDigits(data.cell_phone)) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid 10-digit Canadian phone number',
        };
      }
      if (!data.email.trim()) {
        return { isValid: false, errorMessage: 'Email address is required' };
      }
      if (!V.email.test(data.email.trim())) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid email address',
        };
      }
      if (data.email.trim().length > 254) {
        return {
          isValid: false,
          errorMessage: 'Email address is too long',
        };
      }
      if (!data.work_eligibility_canada) {
        return {
          isValid: false,
          errorMessage:
            'Please indicate if you are legally entitled to work in Canada',
        };
      }
      if (!data.medical_limitations) {
        return {
          isValid: false,
          errorMessage: 'Please indicate if you have any medical limitations',
        };
      }
      if (
        data.medical_limitations === 'yes' &&
        !data.medical_limitations_explanation.trim()
      ) {
        return {
          isValid: false,
          errorMessage: 'Please explain your medical limitations',
        };
      }
      return { isValid: true, errorMessage: '' };

    case 2:
      if (!data.current_address.trim()) {
        return {
          isValid: false,
          errorMessage: 'Current address is required',
        };
      }
      if (data.current_address.trim().length < 5) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid street address',
        };
      }
      if (!data.city.trim()) {
        return { isValid: false, errorMessage: 'City is required' };
      }
      if (data.city.trim().length < 2) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid city name',
        };
      }
      if (!data.province) {
        return { isValid: false, errorMessage: 'Province is required' };
      }
      if (!data.postal_code.trim()) {
        return { isValid: false, errorMessage: 'Postal code is required' };
      }
      const postalTrimmed = data.postal_code.replace(/\s/g, '');
      if (!V.canadianPostalCode.test(postalTrimmed)) {
        return {
          isValid: false,
          errorMessage:
            'Please enter a valid Canadian postal code (e.g. A1A 1A1)',
        };
      }
      if (!data.current_address_living_since.trim()) {
        return {
          isValid: false,
          errorMessage:
            'Living since / time period at your current address is required',
        };
      }
      const currentYears = yearsFromIsoMoveInDate(data.current_address_living_since);
      if (currentYears === null || currentYears <= 0) {
        return {
          isValid: false,
          errorMessage:
            'Select a valid move-in date for your current address (it cannot be in the future).',
        };
      }

      if (currentYears + 1e-9 >= MIN_ADDRESS_HISTORY_YEARS) {
        return { isValid: true, errorMessage: '' };
      }

      let previousSumYears = 0;
      for (const row of data.previous_addresses) {
        const addr = row.address.trim();
        const fd = row.from_date.trim();
        const td = row.to_date.trim();
        if (!addr && !fd && !td) continue;
        if (!addr || addr.length < 5) {
          return {
            isValid: false,
            errorMessage:
              'Each previous address you add needs a full street address (at least 5 characters).',
          };
        }
        if (!fd || !td) {
          return {
            isValid: false,
            errorMessage:
              'Select the date range (from and to) for each previous address you add.',
          };
        }
        const py = yearsFromInclusiveDateRange(fd, td);
        if (py === null || py <= 0) {
          return {
            isValid: false,
            errorMessage:
              'Previous address dates must be valid (YYYY-MM-DD), not in the future, and the end date must be on or after the start date.',
          };
        }
        previousSumYears += py;
      }

      const historyTotalYears = currentYears + previousSumYears;
      if (historyTotalYears + 1e-9 < MIN_ADDRESS_HISTORY_YEARS) {
        const entered = historyTotalYears.toFixed(2);
        return {
          isValid: false,
          errorMessage: `Address history must cover at least ${MIN_ADDRESS_HISTORY_YEARS} years in total (you entered about ${entered} years). Add or correct previous addresses and the dates you lived at each.`,
        };
      }

      return { isValid: true, errorMessage: '' };

    case 3:
      if (!data.license_number.trim()) {
        return { isValid: false, errorMessage: 'License number is required' };
      }
      if (data.license_number.trim().length < 5) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid license number',
        };
      }
      if (!data.license_province) {
        return {
          isValid: false,
          errorMessage: 'License province is required',
        };
      }
      if (!data.license_class) {
        return { isValid: false, errorMessage: 'License class is required' };
      }
      if (!data.license_issue_date) {
        return { isValid: false, errorMessage: 'Issue date is required' };
      }
      if (!isDateNotFuture(data.license_issue_date)) {
        return {
          isValid: false,
          errorMessage: 'Issue date cannot be in the future',
        };
      }
      if (!data.issuing_authority.trim()) {
        return {
          isValid: false,
          errorMessage: 'Issuing authority is required',
        };
      }
      if (!data.license_expiry_date) {
        return {
          isValid: false,
          errorMessage: 'License expiry date is required',
        };
      }
      if (!isDateNotPast(data.license_expiry_date)) {
        return {
          isValid: false,
          errorMessage: 'License expiry date cannot be in the past',
        };
      }
      if (!data.license_front_image) {
        return {
          isValid: false,
          errorMessage: 'License front image upload is required',
        };
      }
      if (!data.license_back_image) {
        return {
          isValid: false,
          errorMessage: 'License back image upload is required',
        };
      }
      if (!data.license_denied) {
        return {
          isValid: false,
          errorMessage:
            'Please answer if you have ever been denied a license',
        };
      }
      if (!data.privileges_revoked) {
        return {
          isValid: false,
          errorMessage:
            'Please answer if your driving privileges have been revoked',
        };
      }
      if (!data.dangerous_goods_certificate) {
        return {
          isValid: false,
          errorMessage:
            'Please indicate if you have a dangerous goods certificate',
        };
      }
      return { isValid: true, errorMessage: '' };

    case 4:
      if (!data.vehicle_types || data.vehicle_types.length === 0) {
        return {
          isValid: false,
          errorMessage: 'Please select at least one vehicle type',
        };
      }
      if (!data.ever_had_accidents) {
        return {
          isValid: false,
          errorMessage: 'Please indicate if you have ever had accidents',
        };
      }
      if (data.ever_had_accidents === 'yes') {
        if (
          !data.number_of_incidents ||
          parseInt(data.number_of_incidents, 10) < 0
        ) {
          return {
            isValid: false,
            errorMessage:
              'Number of incidents is required when you have had accidents',
          };
        }
        if (!data.accident_explanation.trim()) {
          return {
            isValid: false,
            errorMessage:
              'Accident explanation is required when you have had accidents',
          };
        }
      }
      return { isValid: true, errorMessage: '' };

    case 5:
      {
      const MIN_EMPLOYMENT_YEARS = 10;
      const today = startOfDay(new Date());
      const todayIso = format(today, 'yyyy-MM-dd');
      const cutoff = startOfDay(subYears(today, MIN_EMPLOYMENT_YEARS));

      if (!data.current_employer.company.trim()) {
        return {
          isValid: false,
          errorMessage: 'Current employer company is required',
        };
      }
      if (data.current_employer.company.trim().length < 2) {
        return {
          isValid: false,
          errorMessage: 'Please enter a valid company name',
        };
      }
      if (!data.current_employer.address.trim()) {
        return {
          isValid: false,
          errorMessage: 'Current employer address is required',
        };
      }
      if (!data.current_employer.position.trim()) {
        return {
          isValid: false,
          errorMessage: 'Current employer position is required',
        };
      }
      if (!data.current_employer.start_date.trim()) {
        return {
          isValid: false,
          errorMessage: 'Current employer start date is required',
        };
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(data.current_employer.start_date.trim()) ||
        !isValid(parseISO(data.current_employer.start_date.trim())) ||
        startOfDay(parseISO(data.current_employer.start_date.trim())) > today
      ) {
        return {
          isValid: false,
          errorMessage:
            'Current employer start date must be a valid date (YYYY-MM-DD) and cannot be in the future',
        };
      }

      if (data.current_employer.end_date.trim()) {
        const end = data.current_employer.end_date.trim();
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
          !isValid(parseISO(end)) ||
          startOfDay(parseISO(end)) > today
        ) {
          return {
            isValid: false,
            errorMessage:
              'Current employer end date must be a valid date (YYYY-MM-DD) and cannot be in the future',
          };
        }
        if (
          startOfDay(parseISO(end)) <
          startOfDay(parseISO(data.current_employer.start_date.trim()))
        ) {
          return {
            isValid: false,
            errorMessage:
              'Current employer end date cannot be before the start date',
          };
        }
      }
      if (
        data.current_employer.phone.trim() &&
        !V.canadianPhoneDigits(data.current_employer.phone)
      ) {
        return {
          isValid: false,
          errorMessage:
            'Please enter a valid 10-digit phone number for current employer',
        };
      }

      const curFromIso = data.current_employer.start_date.trim();
      const curToIso = data.current_employer.end_date.trim() || todayIso;
      const currentYears = yearsFromInclusiveDateRange(curFromIso, curToIso);
      if (currentYears === null || currentYears <= 0) {
        return {
          isValid: false,
          errorMessage:
            'Current employer dates must be valid (YYYY-MM-DD), not in the future, and the end date must be on or after the start date.',
        };
      }

      // If current employer already covers 10+ years, we don't require previous employers.
      if (currentYears + 1e-9 >= MIN_EMPLOYMENT_YEARS) {
        return { isValid: true, errorMessage: '' };
      }

      type Period = { from: Date; to: Date };
      const periods: Period[] = [];

      // Current period (counts toward the last-10-years timeline)
      periods.push({
        from: startOfDay(parseISO(curFromIso)),
        to: startOfDay(parseISO(curToIso)),
      });

      for (let i = 0; i < data.previous_employers.length; i++) {
        const emp = data.previous_employers[i];
        const hasAny =
          emp.company.trim() ||
          emp.address.trim() ||
          emp.position.trim() ||
          emp.start_date.trim() ||
          emp.end_date.trim() ||
          emp.supervisor.trim() ||
          emp.phone.trim() ||
          emp.reasons_for_leaving.trim();
        if (!hasAny) continue;

        if (!emp.company.trim()) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Company is required`,
          };
        }
        if (emp.company.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Please enter a valid company name`,
          };
        }
        if (!emp.address.trim()) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Address is required`,
          };
        }
        if (!emp.position.trim()) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Position is required`,
          };
        }
        if (!emp.start_date.trim()) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Start date is required`,
          };
        }
        if (!emp.end_date.trim()) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: End date is required`,
          };
        }
        const s = emp.start_date.trim();
        const e = emp.end_date.trim();
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(e) ||
          !isValid(parseISO(s)) ||
          !isValid(parseISO(e))
        ) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Dates must be valid (YYYY-MM-DD)`,
          };
        }
        const sd = startOfDay(parseISO(s));
        const ed = startOfDay(parseISO(e));
        if (sd > today || ed > today) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Dates cannot be in the future`,
          };
        }
        if (ed < sd) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: End date cannot be before start date`,
          };
        }
        if (emp.phone.trim() && !V.canadianPhoneDigits(emp.phone)) {
          return {
            isValid: false,
            errorMessage: `Previous employer ${i + 1}: Please enter a valid 10-digit phone number`,
          };
        }

        periods.push({ from: sd, to: ed });
      }
      if (periods.length === 1) {
        return {
          isValid: false,
          errorMessage: `Employment history must cover the last ${MIN_EMPLOYMENT_YEARS} years. Add previous employers to cover the remaining time.`,
        };
      }

      // Enforce coverage from today back to cutoff with no gaps.
      periods.sort((a, b) => b.to.getTime() - a.to.getTime());

      if (periods[0].to.getTime() !== today.getTime()) {
        return {
          isValid: false,
          errorMessage:
            'Employment history must include the most recent period up to today. Leave current employer end date blank if you still work there.',
        };
      }

      for (let i = 0; i < periods.length - 1; i++) {
        const cur = periods[i];
        const next = periods[i + 1];
        const dayBeforeCurStart = addDays(cur.from, -1);
        if (next.to.getTime() < dayBeforeCurStart.getTime()) {
          return {
            isValid: false,
            errorMessage: `Employment history must cover the last ${MIN_EMPLOYMENT_YEARS} years without gaps. Add previous employers to fill missing time.`,
          };
        }
      }

      const oldest = periods[periods.length - 1];
      if (oldest.from.getTime() > cutoff.getTime()) {
        return {
          isValid: false,
          errorMessage: `Employment history must cover at least ${MIN_EMPLOYMENT_YEARS} years in total. Add earlier employers to reach ${MIN_EMPLOYMENT_YEARS} years.`,
        };
      }

      return { isValid: true, errorMessage: '' };
      }

    case 6:
      return { isValid: true, errorMessage: '' };

    case 7:
      return { isValid: true, errorMessage: '' };

    case 8:
      if (!data.password) {
        return { isValid: false, errorMessage: 'Password is required' };
      }
      if (data.password.length < 8) {
        return {
          isValid: false,
          errorMessage: 'Password must be at least 8 characters long',
        };
      }
      if (data.password.length > 128) {
        return {
          isValid: false,
          errorMessage: 'Password is too long',
        };
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])/.test(data.password)) {
        return {
          isValid: false,
          errorMessage:
            'Password must contain at least one uppercase and one lowercase letter',
        };
      }
      if (!/\d/.test(data.password)) {
        return {
          isValid: false,
          errorMessage: 'Password must contain at least one number',
        };
      }
      if (!data.confirmPassword) {
        return {
          isValid: false,
          errorMessage: 'Please confirm your password',
        };
      }
      if (data.password !== data.confirmPassword) {
        return { isValid: false, errorMessage: 'Passwords do not match' };
      }
      return { isValid: true, errorMessage: '' };

    default:
      return { isValid: true, errorMessage: '' };
  }
}
