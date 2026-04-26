import type { FixedPayment } from "@prisma/client";

function monthKey(year: number, month0: number): number {
  return year * 12 + month0;
}

/**
 * Whether this fixed plan applies in (year, month0).
 * Starts from validFrom (1st of that month). Ends by totalMonths and/or endYear+endMonth (inclusive last month).
 */
export function isFixedActiveInMonth(
  f: Pick<FixedPayment, "validFrom" | "totalMonths" | "endYear" | "endMonth">,
  year: number,
  month0: number
): boolean {
  const start = new Date(f.validFrom);
  const start0 = new Date(start.getFullYear(), start.getMonth(), 1);
  const cur = new Date(year, month0, 1);
  const diff =
    (cur.getFullYear() - start0.getFullYear()) * 12 + (cur.getMonth() - start0.getMonth());
  if (diff < 0) return false;

  if (f.totalMonths != null && diff >= f.totalMonths) return false;

  if (f.endYear != null && f.endMonth != null) {
    const em = Math.min(12, Math.max(1, f.endMonth));
    const endM0 = em - 1;
    if (monthKey(year, month0) > monthKey(f.endYear, endM0)) return false;
  }

  return true;
}

/** Safe calendar day: e.g. day 31 → 28/29/30 in February */
export function dayInMonth(year: number, month0: number, dayOfMonth: number): number {
  const last = new Date(year, month0 + 1, 0).getDate();
  return Math.min(Math.max(1, dayOfMonth), last);
}

export function monthIndexFromValidFrom(validFrom: Date): { year: number; month0: number } {
  const d = new Date(validFrom);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

export function countMonthsInPlan(validFrom: Date, totalMonths: number | null): { current: number; of: string } {
  if (totalMonths == null) return { current: 0, of: "∞" };
  const start = new Date(new Date(validFrom).getFullYear(), new Date(validFrom).getMonth(), 1);
  const now = new Date();
  const cur0 = new Date(now.getFullYear(), now.getMonth(), 1);
  const i =
    (cur0.getFullYear() - start.getFullYear()) * 12 + (cur0.getMonth() - start.getMonth());
  if (i < 0) return { current: 0, of: String(totalMonths) };
  if (i >= totalMonths) return { current: totalMonths, of: String(totalMonths) };
  return { current: i + 1, of: String(totalMonths) };
}
