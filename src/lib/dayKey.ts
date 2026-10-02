/**
 * The single source of truth for "what day is it". A day is the player's local
 * calendar date as a `YYYY-MM-DD` string. Day arithmetic goes through UTC dates
 * built from the y/m/d parts, so DST transitions never shift a day.
 */
export type DayKey = string;

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function formatDayKey(year: number, month: number, day: number): DayKey {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function toUtcDayNumber(key: DayKey): number {
  const match = DAY_KEY_RE.exec(key);
  if (!match) throw new Error(`Invalid day key: ${key}`);
  const [, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d)) / MS_PER_DAY;
}

function fromUtcDayNumber(dayNumber: number): DayKey {
  const date = new Date(dayNumber * MS_PER_DAY);
  return formatDayKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function todayKey(now: Date = new Date()): DayKey {
  return formatDayKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== 'string' || !DAY_KEY_RE.test(value)) return false;
  // Rejects impossible dates such as 2026-02-30, which Date.UTC would roll over.
  return fromUtcDayNumber(toUtcDayNumber(value)) === value;
}

/** Number of calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  return toUtcDayNumber(to) - toUtcDayNumber(from);
}

export function addDays(key: DayKey, days: number): DayKey {
  return fromUtcDayNumber(toUtcDayNumber(key) + days);
}

/** Milliseconds until the next local midnight (for the next-puzzle countdown). */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function maxDayKey(a: DayKey, b: DayKey): DayKey {
  return a >= b ? a : b;
}
