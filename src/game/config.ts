import type { DayKey } from '@/lib/dayKey';

export const APP_NAME = 'WhatsInMyMind';

/** Puzzle #1 is played on this day (the first Netlify deploy). Never change it after release. */
export const LAUNCH_DATE: DayKey = '2026-10-03';

export const MIN_PUZZLES = 30;
export const GAMES_RETENTION_DAYS = 60;

export const SINGLE_LENGTH = { min: 5, max: 12 } as const;
export const GRID_WORD_LENGTH = { min: 3, max: 8 } as const;
export const GRID_WORD_COUNT = { min: 3, max: 5 } as const;
export const GRID_SIZE = { min: 5, max: 9 } as const;

export const ATTEMPTS = {
  /** Single-word puzzles: attempts by letter count (spaces excluded). */
  single: [
    { maxLength: 6, attempts: 6 },
    { maxLength: 9, attempts: 7 },
    { maxLength: Infinity, attempts: 8 },
  ],
  /** Grid puzzles: words + extra, +bonus when the longest word is long, clamped. */
  gridExtra: 3,
  gridLongWordLength: 8,
  gridLongWordBonus: 1,
  gridMin: 6,
  gridMax: 10,
} as const;
