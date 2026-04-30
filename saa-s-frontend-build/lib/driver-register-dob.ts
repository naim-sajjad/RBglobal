/** Shared DOB helpers for driver registration (month/day/year selects). */

export const DOB_MONTHS: { value: string; label: string }[] = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function splitDob(s: string): { y: string; m: string; d: string } {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return { y: '', m: '', d: '' };
  const [y, m, d] = s.split('-');
  return { y, m, d };
}

export function maxDayForYearMonth(y: string, m: string): number {
  if (!y || !m) return 31;
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  if (Number.isNaN(yi) || Number.isNaN(mi)) return 31;
  return new Date(yi, mi, 0).getDate();
}

export function buildDobYearOptions(): string[] {
  const y0 = new Date().getFullYear();
  const out: string[] = [];
  for (let y = y0; y >= 1920; y--) out.push(String(y));
  return out;
}
