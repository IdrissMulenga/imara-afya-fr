// lib/dates.ts — plain "YYYY-MM-DD" helpers.
//
// Everything here works on year/month/day numbers rather than Date parsing.
// `new Date('2026-07-29')` is parsed as UTC midnight, so in Bujumbura (UTC+2)
// reading it back as a local date can land on the previous day — which would
// shift a woman's period by one day on the calendar. Explicit numbers avoid it.

const pad = (n: number) => String(n).padStart(2, '0');

export const toIso = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, monthIndex: m - 1, day: d };
};

export const todayIso = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

export const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

// 0 = Sunday
export const firstWeekdayOfMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).getDay();

export const addDaysIso = (iso: string, days: number) => {
  const { year, monthIndex, day } = parseIso(iso);
  const d = new Date(year, monthIndex, day + days);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};

// inclusive on both ends
export const daysBetweenIso = (fromIso: string, toIsoStr: string) => {
  const a = parseIso(fromIso);
  const b = parseIso(toIsoStr);
  const ms =
    new Date(b.year, b.monthIndex, b.day).getTime() -
    new Date(a.year, a.monthIndex, a.day).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

// every date from start to end, inclusive. Capped so a bad end date can't
// build a runaway array.
export const rangeIso = (startIso: string, endIso: string, cap = 400) => {
  const out: string[] = [];
  const total = daysBetweenIso(startIso, endIso);

  if (total < 0) return out;

  for (let i = 0; i <= Math.min(total, cap); i++) {
    out.push(addDaysIso(startIso, i));
  }

  return out;
};
