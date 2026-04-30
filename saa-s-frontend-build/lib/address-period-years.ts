/** Parse "living since" / duration text into approximate calendar years (for address history validation). */

import { differenceInCalendarDays, isValid, parseISO, startOfDay } from 'date-fns';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
function startOfTodayNoon(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

/** Years from a past YYYY-MM-DD move-in date to today; null if invalid or future. */
export function yearsFromIsoMoveInDate(text: string): number | null {
  const t = text.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day, 12, 0, 0, 0);
  if (isNaN(d.getTime())) return null;
  const today = startOfTodayNoon();
  if (d > today) return null;
  return Math.max(0, (today.getTime() - d.getTime()) / MS_PER_YEAR);
}

/**
 * Duration-only: "2 years", "18 months", "1 year 6 months", or a plain number (years).
 * Does not interpret ISO dates (avoids wrong "years until today" for past residences).
 */
export function parseDurationOnlyToYears(text: string): number | null {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
  if (!s) return null;

  let totalYears = 0;
  let found = false;
  const re =
    /(\d+(?:\.\d+)?)\s*(years?|yrs?|yr\b|months?|mons?\b|mo\b)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s)) !== null) {
    found = true;
    const n = parseFloat(match[1]);
    if (Number.isNaN(n) || n < 0) return null;
    const u = match[2].toLowerCase();
    if (u.startsWith('month') || u === 'mo' || u.startsWith('mon'))
      totalYears += n / 12;
    else totalYears += n;
  }
  if (found) return totalYears;

  if (/^\d+(?:\.\d+)?$/.test(s)) {
    return parseFloat(s);
  }
  return null;
}

/** Current address: move-in date (YYYY-MM-DD) or duration spent at this address. */
export function parseCurrentLivingPeriodYears(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const fromDate = yearsFromIsoMoveInDate(t);
  if (fromDate !== null) return fromDate;
  return parseDurationOnlyToYears(t);
}

/**
 * Years of residence for an inclusive calendar range (move-in through move-out day).
 * Both dates must be valid YYYY-MM-DD, not in the future, and from ≤ to.
 */
export function yearsFromInclusiveDateRange(
  fromIso: string,
  toIso: string,
): number | null {
  const a = fromIso.trim();
  const b = toIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
    return null;
  }
  const from = parseISO(a);
  const to = parseISO(b);
  if (!isValid(from) || !isValid(to)) return null;
  const f = startOfDay(from);
  const t = startOfDay(to);
  const today = startOfDay(new Date());
  if (f > t) return null;
  if (f > today || t > today) return null;
  const days = differenceInCalendarDays(t, f) + 1;
  if (days < 1) return null;
  return days / 365.25;
}

export const MIN_ADDRESS_HISTORY_YEARS = 3;
