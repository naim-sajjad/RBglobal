import type {
  Timesheet,
  TimesheetTrip,
  TimesheetTripRateSnapshot,
  TimesheetTripRateSnapshotLine,
} from '@/lib/types';

export type TimesheetLineItemRow = {
  key: string;
  tripId: number;
  driverNo: string;
  driverName: string;
  customer: string;
  tripNumber: string;
  tripDate: string;
  payItem: string;
  quantity: number;
  rate: number;
  pay: number;
  isPayable: boolean;
  tripGroupKey: string;
};

export function effectiveTripSnapshot(
  trip: TimesheetTrip,
): TimesheetTripRateSnapshot | null {
  if (
    trip.is_adjusted &&
    trip.manual_rate_snapshot &&
    Array.isArray(trip.manual_rate_snapshot.lines) &&
    trip.manual_rate_snapshot.lines.length > 0
  ) {
    return trip.manual_rate_snapshot;
  }
  return trip.rate_snapshot ?? trip.manual_rate_snapshot ?? null;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function linePay(line: TimesheetTripRateSnapshotLine) {
  if (typeof line.driver_amount === 'number' && Number.isFinite(line.driver_amount)) {
    return roundMoney(line.driver_amount);
  }
  return roundMoney(Number(line.quantity || 0) * Number(line.rate || 0));
}

function isPayableLine(line: TimesheetTripRateSnapshotLine) {
  if (typeof line.is_payable === 'boolean') return line.is_payable;
  return linePay(line) !== 0 || line.line_type === 'minimum_adjustment';
}

/** Flatten trips into customer-format rows (one row per pay-item line). */
export function flattenTimesheetLineItems(
  timesheet: Timesheet,
): TimesheetLineItemRow[] {
  const driverNo =
    timesheet.driver?.license_number?.trim() ||
    String(timesheet.driver_id ?? '');
  const driverName =
    timesheet.driver?.user?.name?.trim() ||
    `Driver #${timesheet.driver_id}`;
  const trips = timesheet.trips ?? [];
  const rows: TimesheetLineItemRow[] = [];

  for (const trip of trips) {
    const snapshot = effectiveTripSnapshot(trip);
    const lines = snapshot?.lines ?? [];
    const customer =
      trip.employer?.name ||
      timesheet.employer?.name ||
      `Employer #${trip.employer_id}`;
    const tripNumber = trip.trip_number?.trim() || String(trip.id);
    const tripDate = (trip.trip_date || '').slice(0, 10);
    const tripGroupKey = `${trip.id}|${tripNumber}|${tripDate}`;

    if (lines.length === 0) {
      rows.push({
        key: `trip-${trip.id}-empty`,
        tripId: trip.id,
        driverNo,
        driverName,
        customer,
        tripNumber,
        tripDate,
        payItem: '—',
        quantity: 0,
        rate: 0,
        pay: 0,
        isPayable: false,
        tripGroupKey,
      });
      continue;
    }

    lines.forEach((line, idx) => {
      const pay = linePay(line);
      rows.push({
        key: `trip-${trip.id}-line-${idx}`,
        tripId: trip.id,
        driverNo,
        driverName,
        customer,
        tripNumber,
        tripDate,
        payItem: line.label || line.line_type || 'Line',
        quantity: Number(line.quantity || 0),
        rate: Number(line.rate || 0),
        pay,
        isPayable: isPayableLine(line),
        tripGroupKey,
      });
    });
  }

  return rows;
}

export function sumPayableLinePays(rows: TimesheetLineItemRow[]) {
  return roundMoney(
    rows.reduce((sum, row) => (row.pay !== 0 ? sum + row.pay : sum), 0),
  );
}

export type BillingTaxRule = {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
};

export type LineItemTotals = {
  subtotal: number;
  taxAmount: number;
  taxRows: Array<{ label: string; amount: number }>;
  total: number;
};

export function applyBillingTaxToSubtotal(
  subtotal: number,
  rules: BillingTaxRule[],
): LineItemTotals {
  const taxRows: Array<{ label: string; amount: number }> = [];
  let taxAmount = 0;

  for (const rule of rules) {
    let amount = 0;
    if (rule.type === 'percentage') {
      amount = roundMoney(subtotal * (Number(rule.value) / 100));
      taxRows.push({
        label: `${rule.name || 'Tax'} (${Number(rule.value).toFixed(2)}%)`,
        amount,
      });
    } else if (rule.type === 'fixed') {
      amount = roundMoney(Number(rule.value));
      taxRows.push({
        label: `${rule.name || 'Tax'} (fixed)`,
        amount,
      });
    }
    if (amount > 0) taxAmount = roundMoney(taxAmount + amount);
  }

  return {
    subtotal: roundMoney(subtotal),
    taxAmount,
    taxRows,
    total: roundMoney(subtotal + taxAmount),
  };
}

export function formatTripDateDisplay(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || '—';
  const d = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10)),
  );
  // Match customer PDF style: M-D-YYYY
  return `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
}

export function formatPayDisplay(pay: number) {
  if (!Number.isFinite(pay) || pay === 0) return '—';
  return `$${pay.toFixed(2)}`;
}

/** Day after the latest trip date, clamped to the timesheet week. Falls back to week start. */
export function suggestNextTripDate(
  trips: Pick<TimesheetTrip, 'trip_date'>[] | undefined,
  weekStart?: string | null,
  weekEnd?: string | null,
): string {
  const dates = (trips ?? [])
    .map((t) => t.trip_date)
    .filter(
      (d): d is string =>
        typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d),
    )
    .sort();
  const last = dates[dates.length - 1];
  let candidate = weekStart ?? '';
  if (last) {
    const [y, m, d] = last.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    candidate = [
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, '0'),
      String(next.getDate()).padStart(2, '0'),
    ].join('-');
  }
  if (weekStart && candidate && candidate < weekStart) candidate = weekStart;
  if (weekEnd && candidate && candidate > weekEnd) candidate = weekEnd;
  return candidate;
}

export function resolveClassDriverRate(
  legacyRate: number | undefined | null,
  byClass: Record<string, number> | undefined | null,
  classCode: string | null | undefined,
): number {
  if (
    classCode &&
    byClass &&
    Object.prototype.hasOwnProperty.call(byClass, classCode) &&
    byClass[classCode] != null
  ) {
    return Number(byClass[classCode]) || 0;
  }
  return Number(legacyRate ?? 0) || 0;
}

export function resolveDistanceBandRates(
  bands:
    | {
        distance_from?: number;
        distance_to?: number | null;
        agency_rate?: number;
        driver_rate?: number;
        driver_rates_by_class?: Record<string, number>;
      }[]
    | undefined
    | null,
  distance: number,
  classCode: string | null | undefined,
): { driverRate: number; agencyRate: number } {
  const list = Array.isArray(bands) ? bands : [];
  for (const band of list) {
    const from = Number(band.distance_from ?? 0);
    const to =
      band.distance_to === null || band.distance_to === undefined
        ? null
        : Number(band.distance_to);
    if (distance >= from && (to === null || Number.isNaN(to) || distance < to)) {
      return {
        agencyRate: Number(band.agency_rate ?? 0) || 0,
        driverRate: resolveClassDriverRate(
          band.driver_rate,
          band.driver_rates_by_class,
          classCode,
        ),
      };
    }
  }
  return { driverRate: 0, agencyRate: 0 };
}

export type CustomPayLineDraft = {
  id: string;
  label: string;
  unit: string;
  driver_rate: string;
  agency_rate: string;
  quantity: string;
};

/** Key used in rate_overrides for the Distance Pay row. */
export const DISTANCE_RATE_OVERRIDE_KEY = 'distance';

export type PayRateDraft = {
  driver_rate: string;
  agency_rate: string;
};

export function createCustomPayLineDraft(
  partial?: Partial<CustomPayLineDraft>,
): CustomPayLineDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    label: partial?.label ?? '',
    unit: partial?.unit ?? '',
    driver_rate: partial?.driver_rate ?? '0',
    agency_rate: partial?.agency_rate ?? '0',
    quantity: partial?.quantity ?? '1',
  };
}
