import { DriverWithDetails } from '@/lib/types';
import { parseDriverComplianceNotes } from '@/lib/admin-driver-compliance';

/** Ops spreadsheet headers (including blank spacer columns). */
export const DRIVER_EXPORT_CSV_HEADERS = [
  'Sr. no',
  'Name',
  'New A #',
  'Old ID',
  'Position',
  'Phone Number',
  'Work Phone',
  'Email',
  'Start Date',
  'Corporation Name',
  'Corp. Director (if not driver)',
  'Immigration Status Document',
  'Expiry (yyyy/mm/dd)',
  'HST #',
  'Remarks',
  'Rate',
  'License (Expiry)',
  'Independent Contracter',
  'Carriers Edge',
  'TDG',
  'TruckRight Profile',
  "Driver's License",
  'Emergency Contact',
  '',
  '',
  'Corporation',
  'Contract',
  'Days',
  'Time',
  'Location',
] as const;

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function formatYmdSlash(value?: string | null): string {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  // Already yyyy/mm/dd or yyyy-mm-dd
  const iso = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}/${iso[2]}/${iso[3]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function formatStartDate(value?: string | null): string {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function yesNoFromFlag(value?: string | null): string {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!v) return '';
  if (['yes', 'y', 'true', '1', 'completed', 'done'].includes(v)) return 'Yes';
  if (['no', 'n', 'false', '0'].includes(v)) return 'No';
  return String(value).trim();
}

function hasLicenseDoc(driver: DriverWithDetails): string {
  if (
    driver.license_front_image_url ||
    driver.license_back_image_url ||
    driver.license_document_url ||
    driver.license_front_image_path ||
    driver.license_back_image_path ||
    driver.license_document_path
  ) {
    return 'Yes';
  }
  return '';
}

function locationFromDriver(
  driver: DriverWithDetails,
  city: string,
  province: string,
  address: string,
): string {
  if (driver.route_details?.trim()) return driver.route_details.trim();
  const parts = [address, city, province].map((p) => p.trim()).filter(Boolean);
  return parts.join(', ');
}

/** Build one CSV data row for a driver (best-effort mapping from available fields). */
export function buildDriverExportRow(
  driver: DriverWithDetails,
  srNo: number,
): string[] {
  const compliance = parseDriverComplianceNotes(driver.compliance_notes ?? null);
  const current = compliance.employment_history.current_employer;
  const name = driver.name ?? driver.user?.name ?? '';
  const email = driver.email ?? driver.user?.email ?? '';
  const phone = compliance.address.cell_phone || '';
  const workPhone = current.phone || '';
  const position = current.position || driver.route_type || '';
  const startDate =
    formatStartDate(current.start_date) ||
    formatStartDate(driver.driver_class_effective_date) ||
    formatStartDate(driver.created_at);
  const corporationName = driver.payee_business_name?.trim() || current.company || '';
  const immigration = compliance.personal.work_eligibility_canada || '';
  const remarks = compliance.existing_notes || '';
  const rate = driver.driver_class?.name || driver.driver_class?.code || '';
  const licenseExpiry = formatYmdSlash(driver.license_expiry_date);
  const tdg = yesNoFromFlag(compliance.questions.dangerous_goods_certificate);
  const time = driver.shift_timing || '';
  const location = locationFromDriver(
    driver,
    compliance.address.city,
    compliance.address.province,
    compliance.address.current_address,
  );

  return [
    String(srNo),
    name,
    '', // New A # — not stored in app yet
    '', // Old ID — not stored in app yet
    position,
    phone,
    workPhone,
    email,
    startDate,
    corporationName,
    '', // Corp. Director
    immigration,
    '', // Immigration doc expiry — not stored
    '', // HST #
    remarks,
    rate,
    licenseExpiry,
    '', // Independent Contracter
    '', // Carriers Edge
    tdg,
    '', // TruckRight Profile
    hasLicenseDoc(driver),
    '', // Emergency Contact
    '', // spacer
    '', // spacer
    '', // Corporation status checklist
    '', // Contract
    '', // Days
    time,
    location,
  ];
}

export function downloadDriversCsv(
  drivers: DriverWithDetails[],
  filename = `drivers-export-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const rows = drivers.map((driver, index) =>
    buildDriverExportRow(driver, index + 1),
  );
  const content = [DRIVER_EXPORT_CSV_HEADERS as unknown as string[], ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
