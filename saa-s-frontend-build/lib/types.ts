export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    model_type: string;
    model_id: number;
    role_id: number;
  };
}

export interface User {
  id: number;
  tenant_id: string | null; // Legacy - kept for backward compatibility
  is_global_admin: boolean;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  permissions: string[];
  tenants?: Tenant[]; // Many-to-many relationship
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (tenantName: string, adminName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
}

export interface LoginResponse {
  user: User;
  token: string;
  tenant_id: string | null;
  tenants?: Tenant[]; // All tenants user belongs to
}

export interface RegisterResponse {
  message: string;
  tenant: Tenant;
  user: User;
  access_token: string;
}

export interface Tenant {
  id: string;
  name?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  admin_id?: string;
  data?: any;
  domain?: string;
  domains?: Array<{
    id: number;
    domain: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface TenantWithDetails extends Tenant {
  user_count?: number;
  users?: User[];
  domain?: string;
  subdomain?: string;
  settings?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  tenant_id: string;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface UserWithDetails extends User {
  status?: 'active' | 'inactive';
  assigned_tenant?: Tenant | null;
  assigned_tenants?: Tenant[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_id?: string | number;
  tenant_id?: string | number; // Single tenant (for backward compatibility)
  tenant_ids?: string[]; // Multiple tenants
  status?: 'active' | 'inactive';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role_id?: string | number;
  tenant_id?: string | number; // Single tenant (for backward compatibility)
  tenant_ids?: string[]; // Multiple tenants
  status?: 'active' | 'inactive';
}

export interface RoleWithDetails extends Role {
  user_count?: number;
  users?: User[];
}

// Driver Classes (pay tiers) - used by Driver and rate cards
export interface DriverClass {
  id: number;
  tenant_id: string | null;
  code: string;
  name: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type DriverClassFormData = {
  code: string;
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
};

export interface Driver {
  id: number;
  user_id: number;
  tenant_id?: string;
  driver_class_id?: number | null;
  driver_class_effective_date?: string | null;
  // License Information
  license_number?: string;
  license_type?: 'AZ' | 'DZ' | 'G-Class' | 'G1/G2' | 'Other';
  license_other?: string;
  issuing_authority?: string;
  license_expiry_date?: string;
  // Driving Experience
  years_of_experience?: number;
  driving_history?: string;
  // Vehicle Information
  vehicle_types?: string[];
  vehicle_ownership?: 'company-owned' | 'self-owned';
  vehicle_capacity?: string;
  // Route & Shift Details
  route_type?: 'local' | 'regional' | 'long-haul' | 'intercity';
  route_details?: string;
  shift_timing?: 'day' | 'night' | 'rotational';
  pay_type?: 'hourly' | 'per_mile' | 'per_trip' | 'fixed_salary';
  // Compliance Requirements & Documents
  medical_certificate_path?: string;
  license_document_path?: string;
  abstract_document_path?: string;
  cvor_document_path?: string;
  safety_certificate_path?: string;
  background_check_status?: 'pending' | 'completed';
  drug_alcohol_test?: boolean;
  compliance_notes?: string;
  // Status
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  user?: User;
  tenant?: Tenant;
}

export interface DriverWithDetails extends Driver {
  user?: User;
  tenant?: Tenant;
  driver_class?: DriverClass;
}

export interface CreateDriverData {
  // User info
  name: string;
  email: string;
  password?: string;
  tenant_id?: string;
  // License Information
  license_number?: string;
  license_type?: 'AZ' | 'DZ' | 'G-Class' | 'G1/G2' | 'Other';
  license_other?: string;
  issuing_authority?: string;
  license_expiry_date?: string;
  // Driving Experience
  years_of_experience?: number;
  driving_history?: string;
  // Vehicle Information
  vehicle_types?: string[];
  vehicle_ownership?: 'company-owned' | 'self-owned';
  vehicle_capacity?: string;
  // Route & Shift Details
  route_type?: 'local' | 'regional' | 'long-haul' | 'intercity';
  route_details?: string;
  shift_timing?: 'day' | 'night' | 'rotational';
  pay_type?: 'hourly' | 'per_mile' | 'per_trip' | 'fixed_salary';
  // Compliance Requirements & Documents
  medical_certificate?: File;
  license_document?: File;
  abstract_document?: File;
  cvor_document?: File;
  safety_certificate?: File;
  background_check_status?: 'pending' | 'completed';
  drug_alcohol_test?: boolean;
  compliance_notes?: string;
  // Status (admin only)
  status?: 'pending_approval' | 'active' | 'inactive' | 'suspended';
  // Driver class (pay tier)
  driver_class_id?: number | null;
  driver_class_effective_date?: string | null;
}

// --- Reference Check (digitized from paper forms) ---

/** Applicant consent: "To be read and signed by the applicant" */
export interface ApplicantConsentData {
  applicant_name: string;
  consent_date: string; // ISO date
  agreed_to_investigation: boolean;
  agreed_to_rules: boolean;
  certified_truthful: boolean;
  signature?: string; // optional e-signature or consent flag
}

/** Request for Information from Previous Employer - applicant authorizes release */
export interface ReferenceRequestData {
  applicant_name: string;
  drivers_license_number: string;
  previous_company_name: string;
  previous_company_phone: string;
  supervisor_employer_name: string;
  applicant_signature_date?: string;
}

/** Rating scale for candidate (from Pre-Employment Reference Check Form) */
export type ReferenceRating = 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT' | 'N/A';

/** Pre-Employment Reference Check Form - filled by referee or admin */
export interface ReferenceCheckFormData {
  applicant_name: string;
  date_of_reference_check: string;
  relationship_to_applicant: 'supervisor' | 'other';
  relationship_other_specify?: string;
  date_of_employment_from: string;
  date_of_employment_to: string;
  salary?: string;
  positions_held: string;
  nature_of_job: string;
  driver_off_illness_injury: string; // Yes/No
  involved_in_accidents: 'yes' | 'no';
  accident_injuries?: 'yes' | 'no';
  accident_fatalities?: 'yes' | 'no';
  accident_hazardous_material_spilled?: 'yes' | 'no';
  reason_for_leaving: 'discharged' | 'resignation' | 'lay_off';
  attendance_rating: ReferenceRating;
  dependability_rating: ReferenceRating;
  willingness_rating: ReferenceRating;
  ability_to_follow_instructions_rating: ReferenceRating;
  quality_of_work_rating: ReferenceRating;
  name_of_person_supplying_info: string;
  referee_signature_date: string;
  referee_signature?: string;
  additional_comments?: string;
}

export interface ReferenceCheck {
  id: string;
  driver_id: number;
  tenant_id?: string;
  status: 'pending' | 'sent' | 'completed' | 'admin_filled';
  token?: string; // for referee link; e.g. /reference/[token]
  applicant_consent?: ApplicantConsentData;
  reference_request?: ReferenceRequestData;
  form_data?: ReferenceCheckFormData;
  filled_by: 'referee' | 'admin';
  referee_email?: string;
  sent_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  driver?: DriverWithDetails;
}

export interface CreateReferenceCheckRequestPayload {
  driver_id: number;
  referee_email?: string; // if set, system can send link to referee
  reference_request: ReferenceRequestData;
  applicant_consent?: ApplicantConsentData;
}

export interface SubmitReferenceCheckPayload {
  token: string;
  form_data: ReferenceCheckFormData;
}

// Employers (clients) & Rate Cards
export interface Employer {
  id: number;
  tenant_id: string | null;
  name: string;
  company_code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  billing_address: string | null;
  service_location: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  measurement_unit: 'miles' | 'km';
  default_currency: string;
  minimum_trip_guarantee: string | number | null;
  requires_driver_rate_tracking: boolean;
  rate_cards_count?: number;
  rate_cards?: RateCard[];
  created_at: string;
  updated_at: string;
}

export interface RateCard {
  id: number;
  employer_id: number;
  name: string;
  effective_from: string;
  effective_to: string;
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  rates: RateCardRatesConfig | null;
  created_at: string;
  updated_at: string;
}

/** Per-class driver rates: key = driver class code (e.g. "21"), value = rate */
export type DriverRatesByClass = Record<string, number>;

/** Single distance band: from (inclusive) to (exclusive or open-ended). Use driver_rates_by_class when multiple classes exist. */
export interface DistanceBand {
  distance_from: number;
  distance_to: number | null; // null = open-ended
  agency_rate: number;
  driver_rate: number; // legacy single-class
  driver_rates_by_class?: DriverRatesByClass;
}

/** Unit for additional charges */
export type AdditionalChargeUnit = 'per_stop' | 'per_hour' | 'flat' | 'per_km' | 'per_mile' | 'other';

export interface AdditionalCharge {
  /** Stable key used to map trip.additional_quantities to this charge */
  key?: string;
  charge_type: string;
  agency_rate: number;
  driver_rate: number; // legacy single-class
  driver_rates_by_class?: DriverRatesByClass;
  unit: AdditionalChargeUnit | string;
  active: boolean;
}

export interface RateCardRatesConfig {
  measurement_unit?: 'miles' | 'km';
  currency?: string;
  minimum_trip_pay_agency?: number;
  minimum_trip_pay_driver?: number; // legacy single-class
  /** Per-class minimum trip pay for drivers: key = driver class code */
  minimum_trip_pay_driver_by_class?: DriverRatesByClass;
  distance_bands?: DistanceBand[];
  additional_charges?: AdditionalCharge[];
}

// Pay Item Templates & Timesheets
export interface PayItemTemplate {
  id: number;
  tenant_id: string | null;
  code: string;
  name: string;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployerPayItemRateRow {
  pay_item_template_id: number;
  pay_item_template: PayItemTemplate;
  rate: number;
}

export type TimesheetStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';

export interface TimesheetTripPayItem {
  id: number;
  timesheet_trip_id: number;
  pay_item_template_id: number;
  quantity: number;
  rate: number;
  amount: number;
  pay_item_template?: PayItemTemplate;
  created_at: string;
  updated_at: string;
}

/** One line in the rate-snapshot breakdown (from Rate Card resolution). */
export interface TimesheetTripRateSnapshotLine {
  line_type: string;
  label: string;
  quantity: number;
  unit?: string;
  rate: number;
  agency_rate?: number;
  driver_amount: number;
  agency_amount: number;
}

export interface TimesheetTripRateSnapshot {
  rate_card_id?: number;
  driver_class_code?: string | null;
  lines?: TimesheetTripRateSnapshotLine[];
  total_driver_pay?: number;
  total_agency_billing?: number;
  error?: string;
}

export interface TimesheetTrip {
  id: number;
  timesheet_id: number;
  employer_id: number;
  trip_date: string;
  trip_number: string | null;
  distance?: number;
  stops_count?: number;
  delay_hours?: number;
  handbomb_count?: number;
  notes?: string | null;
  trip_total: number;
  minimum_applied: boolean;
  rate_snapshot?: TimesheetTripRateSnapshot | null;
  total_agency_billing?: number;
  employer?: Employer;
  pay_items?: TimesheetTripPayItem[];
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: number;
  driver_id: number;
  tenant_id: string | null;
  week_start_date: string;
  week_end_date: string;
  status: TimesheetStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: number | null;
  paid_at: string | null;
  paid_by: number | null;
  reject_reason: string | null;
  notes: string | null;
  weekly_total: number;
  driver?: DriverWithDetails;
  trips?: TimesheetTrip[];
  created_at: string;
  updated_at: string;
}

export type EmployerFormData = Partial<Omit<Employer, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'rate_cards_count' | 'rate_cards'>>;
export type RateCardFormData = {
  name: string;
  effective_from: string;
  effective_to: string;
  status?: 'draft' | 'active' | 'scheduled' | 'expired';
  rates?: RateCardRatesConfig;
};
