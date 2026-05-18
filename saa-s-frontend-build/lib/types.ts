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
  license_issue_date?: string;
  license_expiry_date?: string;
  // Vehicle Information
  vehicle_types?: string[];
  years_of_experience?: number | null;
  driving_history?: string | null;
  route_type?: string | null;
  pay_type?: string | null;
  shift_timing?: string | null;
  drug_alcohol_test?: boolean;
  // Compliance Requirements & Documents
  pcc_document_path?: string;
  license_document_path?: string; // legacy
  license_front_image_path?: string;
  license_back_image_path?: string;
  abstract_document_path?: string;
  cvor_document_path?: string;
  safety_certificate_path?: string;
  /** Full browser URLs returned by API (APP_URL/storage/...) */
  pcc_document_url?: string | null;
  license_document_url?: string | null;
  license_front_image_url?: string | null;
  license_back_image_url?: string | null;
  abstract_document_url?: string | null;
  cvor_document_url?: string | null;
  safety_certificate_url?: string | null;
  background_check_status?: 'pending' | 'completed';
  reference_check_status?: 'pending' | 'completed';
  compliance_notes?: string;
  /** Remittance slip “Payment to” (e.g. corporation + mailing address) */
  payee_business_name?: string | null;
  payee_address?: string | null;
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
  license_issue_date?: string;
  license_expiry_date?: string;
  // Vehicle Information
  vehicle_types?: string[];
  // Compliance Requirements & Documents
  license_document?: File;
  abstract_document?: File;
  cvor_document?: File;
  safety_certificate?: File;
  background_check_status?: 'pending' | 'completed';
  reference_check_status?: 'pending' | 'completed';
  drug_alcohol_test?: boolean;
  compliance_notes?: string;
  payee_business_name?: string | null;
  payee_address?: string | null;
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
  /** Payroll: include in driver pay snapshot */
  is_payable?: boolean;
  /** Client billing: include on invoice when agency bills */
  is_billable?: boolean;
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
  invoice_id?: number | null;
  payslip_id?: number | null;
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
  manual_rate_snapshot?: TimesheetTripRateSnapshot | null;
  is_adjusted?: boolean;
  adjusted_at?: string | null;
  adjusted_reason?: string | null;
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
  adjusted_at?: string | null;
  adjusted_by?: number | null;
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

// --- Client billing (employer invoices from approved trips) ---

export type ClientInvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue';

export interface ClientInvoiceItem {
  id: number;
  invoice_id: number;
  timesheet_trip_id: number;
  driver_id: number;
  trip_date: string;
  pay_item_type: string;
  line_type: string | null;
  quantity: string | number;
  unit: string | null;
  rate: string | number;
  amount: string | number;
  line_index: number;
  driver?: DriverWithDetails;
}

export interface ClientInvoicePayment {
  id: number;
  invoice_id: number;
  amount: string | number;
  payment_date: string;
  reference: string | null;
  created_at: string;
}

export interface ClientInvoice {
  id: number;
  tenant_id: string | null;
  employer_id: number;
  start_date: string;
  end_date: string;
  status: ClientInvoiceStatus;
  subtotal: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  total: string | number;
  invoice_number: string | null;
  notes: string | null;
  employer?: Employer;
  items?: ClientInvoiceItem[];
  payments?: ClientInvoicePayment[];
  paid_total?: string | number;
  created_at: string;
  updated_at: string;
}

export interface InvoicePreviewDriverRow {
  driver_id: number;
  driver_name: string;
  total_billing: number;
  quantities_by_unit: Record<string, number>;
  trip_count: number;
}

export interface InvoicePreviewResponse {
  employer_id: number;
  /** Omitted or null when “all drivers” */
  driver_id?: number | null;
  start_date: string;
  end_date: string;
  trip_count: number;
  billable_trip_count: number;
  subtotal: number;
  drivers: InvoicePreviewDriverRow[];
}

// --- Driver payroll (payslips / remittances) ---

export interface PayrollPreviewDriverRow {
  driver_id: number;
  driver_name: string;
  gross_pay: number;
  vacation_pay: number;
  deductions: number;
  net_pay: number;
  breakdown: Record<string, number>;
  trip_count: number;
  /** Sum of agency billable lines on the driver’s trips (before tax). */
  agency_billing_subtotal?: number;
  billing_tax_rate?: number;
  billing_tax_from_percent?: number;
  billing_tax_fixed?: number;
  billing_tax_amount?: number;
  agency_billing_total?: number;
  /** Computed line amounts for this driver. */
  billing_tax_lines?: PayrollBillingTaxLineSnapshot[];
}

export interface PayrollPreviewResponse {
  period_start: string;
  period_end: string;
  vacation_percent: number;
  default_deductions: number;
  /** Saved tenant tax rules (name, type, value — no amounts). */
  billing_taxes?: PayrollBillingTaxRule[];
  drivers: PayrollPreviewDriverRow[];
}

export type PayrollBillingTaxType = 'percentage' | 'fixed';

export interface PayrollBillingTaxRule {
  id?: number;
  name: string;
  type: PayrollBillingTaxType;
  /** Percentage 0–100, or fixed dollar amount per driver when type is fixed. */
  value: number;
  sort_order?: number;
}

export interface PayrollBillingTaxLineSnapshot {
  name: string;
  type: PayrollBillingTaxType;
  value: number;
  amount: number;
}

export interface PayrollBillingTaxSettingsResponse {
  taxes: PayrollBillingTaxRule[];
}

/** Tenant company profile (Settings → Company); used on driver invoice PDF client block when set. */
export interface TenantCompanyProfile {
  company_legal_name: string;
  company_address: string;
  company_phone?: string;
  company_email?: string;
  /** Comma or newline separated; CC’d on pay stub emails to drivers. */
  pay_stub_cc_emails?: string;
}

export interface Payslip {
  id: number;
  tenant_id: string | null;
  driver_calculation_id: number;
  driver_id: number;
  period_start: string;
  period_end: string;
  total_pay: string | number;
  vacation_pay: string | number;
  deductions: string | number;
  net_pay: string | number;
  agency_billing_subtotal?: string | number;
  billing_tax_rate?: string | number;
  billing_tax_from_percent?: string | number;
  billing_tax_fixed?: string | number;
  billing_tax_amount?: string | number;
  agency_billing_total?: string | number;
  billing_tax_lines?: PayrollBillingTaxLineSnapshot[] | null;
  breakdown: Record<string, number> | null;
  status: 'pending' | 'paid';
  driver?: DriverWithDetails;
  driver_calculation?: {
    id: number;
    gross_pay: string | number;
    status: string;
    billing_tax_lines?: PayrollBillingTaxLineSnapshot[] | null;
  };
  remittances?: Remittance[];
  created_at: string;
  updated_at: string;
}

export interface Remittance {
  id: number;
  payslip_id: number;
  driver_id: number;
  amount_paid: string | number;
  payment_date: string;
  reference: string | null;
  created_at: string;
}
