export function inMonth(
  d: Date,
  year: number,
  monthIndex0: number
): boolean {
  return d.getFullYear() === year && d.getMonth() === monthIndex0;
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function monthBounds(year: number, month0: number) {
  return {
    start: new Date(year, month0, 1, 0, 0, 0, 0),
    end: new Date(year, month0 + 1, 0, 23, 59, 59, 999),
  };
}

export function ytdFromJanuary(year: number, getMonthTotal: (y: number, m: number) => number) {
  const now = new Date();
  const byMonth: { m: string; n: string; y: number; t: number }[] = [];
  for (let m0 = 0; m0 < 12; m0++) {
    const t = getMonthTotal(year, m0);
    byMonth.push({ m: String(m0 + 1), n: "חודש " + String(m0 + 1), y: t, t });
  }
  return { byMonth, ytd: byMonth.filter((b, i) => i <= (year === now.getFullYear() ? now.getMonth() : 11)).reduce((a, b) => a + b.t, 0) };
}
