/**
 * Shape of `compliance_notes` JSON written by public driver registration
 * (`app/driver/register/page.tsx`). Admin create/edit uses the same structure
 * for round-trip editing.
 */

export type DriverCompliancePreviousAddress = {
  address: string;
  from_date: string;
  to_date: string;
};

export type DriverComplianceEquipmentRow = {
  make: string;
  tractor_type: string;
  transmissions: string;
  trailer_type: string;
  areas_operated: string;
};

export type DriverComplianceViolation = {
  date: string;
  location: string;
  violation_charge: string;
  penalty: string;
};

export type DriverComplianceEmployer = {
  company: string;
  supervisor: string;
  address: string;
  phone: string;
  position: string;
  start_date: string;
  end_date: string;
  reasons_for_leaving: string;
};

export type DriverCompliancePayload = {
  personal: {
    middle_initial: string;
    gender: string;
    date_of_birth: string;
    work_eligibility_canada: string;
    education: string;
    medical_limitations: string;
    medical_limitations_explanation: string;
  };
  address: {
    current_address: string;
    current_address_living_since: string;
    city: string;
    province: string;
    postal_code: string;
    cell_phone: string;
    previous_addresses: DriverCompliancePreviousAddress[];
  };
  license: {
    license_province: string;
    license_class: string;
    license_endorsements: string;
    license_conditions: string;
  };
  questions: {
    license_denied: string;
    privileges_revoked: string;
    dangerous_goods_certificate: string;
  };
  driving_experience: {
    equipment_used: DriverComplianceEquipmentRow[];
    accident_history: {
      ever_had_accidents: string;
      number_of_incidents: string;
      accident_explanation: string;
    };
    traffic_violations: DriverComplianceViolation[];
  };
  employment_history: {
    current_employer: DriverComplianceEmployer;
    previous_employers: DriverComplianceEmployer[];
  };
  /** Free-form notes from the documents step (registration) */
  existing_notes: string;
};

export const blankPreviousAddress = (): DriverCompliancePreviousAddress => ({
  address: '',
  from_date: '',
  to_date: '',
});

export const blankViolation = (): DriverComplianceViolation => ({
  date: '',
  location: '',
  violation_charge: '',
  penalty: '',
});

/** For appending rows in admin driver form */
export const blankEmployer = (): DriverComplianceEmployer => ({
  company: '',
  supervisor: '',
  address: '',
  phone: '',
  position: '',
  start_date: '',
  end_date: '',
  reasons_for_leaving: '',
});

export const blankEquipment = (): DriverComplianceEquipmentRow => ({
  make: '',
  tractor_type: '',
  transmissions: '',
  trailer_type: '',
  areas_operated: '',
});

export function getDefaultDriverCompliancePayload(): DriverCompliancePayload {
  return {
    personal: {
      middle_initial: '',
      gender: '',
      date_of_birth: '',
      work_eligibility_canada: '',
      education: '',
      medical_limitations: '',
      medical_limitations_explanation: '',
    },
    address: {
      current_address: '',
      current_address_living_since: '',
      city: '',
      province: '',
      postal_code: '',
      cell_phone: '',
      previous_addresses: [blankPreviousAddress()],
    },
    license: {
      license_province: '',
      license_class: '',
      license_endorsements: '',
      license_conditions: '',
    },
    questions: {
      license_denied: '',
      privileges_revoked: '',
      dangerous_goods_certificate: '',
    },
    driving_experience: {
      equipment_used: [],
      accident_history: {
        ever_had_accidents: '',
        number_of_incidents: '',
        accident_explanation: '',
      },
      traffic_violations: [],
    },
    employment_history: {
      current_employer: blankEmployer(),
      previous_employers: [],
    },
    existing_notes: '',
  };
}

function mapEmployer(e: Partial<DriverComplianceEmployer> | undefined) {
  const d = blankEmployer();
  if (!e) return d;
  return {
    company: String(e.company ?? ''),
    supervisor: String(e.supervisor ?? ''),
    address: String(e.address ?? ''),
    phone: String(e.phone ?? ''),
    position: String(e.position ?? ''),
    start_date: String(e.start_date ?? ''),
    end_date: String(e.end_date ?? ''),
    reasons_for_leaving: String(e.reasons_for_leaving ?? ''),
  };
}

/** Parse stored `compliance_notes` string into editable payload + defaults */
export function parseDriverComplianceNotes(
  raw: string | undefined | null,
): DriverCompliancePayload {
  const base = getDefaultDriverCompliancePayload();
  if (!raw?.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const personal = (parsed.personal ?? {}) as DriverCompliancePayload['personal'];
    const address = (parsed.address ?? {}) as DriverCompliancePayload['address'];
    const license = (parsed.license ?? {}) as DriverCompliancePayload['license'];
    const questions = (parsed.questions ?? {}) as DriverCompliancePayload['questions'];
    const driving = (parsed.driving_experience ?? {}) as Record<string, unknown>;
    const accident = (driving.accident_history ?? {}) as Record<string, string>;
    const employment = (parsed.employment_history ?? {}) as Record<string, unknown>;

    const prevFromApi =
      Array.isArray(address.previous_addresses) && address.previous_addresses.length
        ? (address.previous_addresses as DriverCompliancePreviousAddress[]).map(
            (a) => ({
              address: String(a?.address ?? ''),
              from_date: String(a?.from_date ?? ''),
              to_date: String(a?.to_date ?? ''),
            }),
          )
        : base.address.previous_addresses;

    const equipmentRaw = driving.equipment_used;
    const equipment =
      Array.isArray(equipmentRaw) && equipmentRaw.length > 0
        ? equipmentRaw.map((row: DriverComplianceEquipmentRow) => ({
            make: String(row?.make ?? ''),
            tractor_type: String(row?.tractor_type ?? ''),
            transmissions: String(row?.transmissions ?? ''),
            trailer_type: String(row?.trailer_type ?? ''),
            areas_operated: String(row?.areas_operated ?? ''),
          }))
        : base.driving_experience.equipment_used;

    const violationsRaw = driving.traffic_violations;
    const violations =
      Array.isArray(violationsRaw) && violationsRaw.length > 0
        ? violationsRaw.map((v: DriverComplianceViolation) => ({
            date: String(v?.date ?? ''),
            location: String(v?.location ?? ''),
            violation_charge: String(v?.violation_charge ?? ''),
            penalty: String(v?.penalty ?? ''),
          }))
        : base.driving_experience.traffic_violations;

    const prevEmplRaw = employment.previous_employers;
    const prevEmployers =
      Array.isArray(prevEmplRaw) && prevEmplRaw.length > 0
        ? prevEmplRaw.map((emp: DriverComplianceEmployer) => mapEmployer(emp))
        : base.employment_history.previous_employers;

    return {
      personal: { ...base.personal, ...personal },
      address: {
        ...base.address,
        ...address,
        previous_addresses: prevFromApi,
      },
      license: { ...base.license, ...license },
      questions: { ...base.questions, ...questions },
      driving_experience: {
        equipment_used: equipment,
        accident_history: {
          ...base.driving_experience.accident_history,
          ever_had_accidents: String(
            accident.ever_had_accidents ??
              base.driving_experience.accident_history.ever_had_accidents,
          ),
          number_of_incidents: String(
            accident.number_of_incidents ??
              base.driving_experience.accident_history.number_of_incidents,
          ),
          accident_explanation: String(
            accident.accident_explanation ??
              base.driving_experience.accident_history.accident_explanation,
          ),
        },
        traffic_violations: violations,
      },
      employment_history: {
        current_employer: mapEmployer(
          employment.current_employer as DriverComplianceEmployer,
        ),
        previous_employers: prevEmployers,
      },
      existing_notes:
        typeof parsed.existing_notes === 'string'
          ? parsed.existing_notes
          : base.existing_notes,
    };
  } catch {
    return { ...base, existing_notes: raw };
  }
}

export function serializeDriverCompliancePayload(
  c: DriverCompliancePayload,
): string {
  const payload = {
    personal: c.personal,
    address: {
      ...c.address,
      previous_addresses: c.address.previous_addresses.filter((a) =>
        a.address.trim(),
      ),
    },
    license: c.license,
    questions: c.questions,
    driving_experience: {
      equipment_used: c.driving_experience.equipment_used,
      accident_history: c.driving_experience.accident_history,
      traffic_violations: c.driving_experience.traffic_violations,
    },
    employment_history: {
      current_employer: c.employment_history.current_employer,
      previous_employers: c.employment_history.previous_employers,
    },
    existing_notes: c.existing_notes,
  };
  return JSON.stringify(payload);
}
