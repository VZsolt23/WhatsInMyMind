import { countMisses } from '@/game/progress';
import type { SavedGame } from '@/game/reducer';
import { addDays, daysBetween, isDayKey, type DayKey } from '@/lib/dayKey';
import type { StoreSpec } from '@/storage/storage';

export interface Stats {
  played: number;
  won: number;
  lost: number;
  currentStreak: number;
  bestStreak: number;
  /** Length of the most recently broken streak (for Comeback Kid). */
  lastBrokenStreak: number;
  /** Last day with a win; streaks count consecutive won days. */
  lastCompletedDay: DayKey | null;
  /** Last day whose result was recorded; makes recording idempotent. */
  lastRecordedDay: DayKey | null;
  /** Index i = number of wins with i wrong guesses (shown as "solved on try i + 1"). */
  guessDistribution: number[];
  gridPlayed: number;
  gridWon: number;
}

export function emptyStats(): Stats {
  return {
    played: 0,
    won: 0,
    lost: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastBrokenStreak: 0,
    lastCompletedDay: null,
    lastRecordedDay: null,
    guessDistribution: [],
    gridPlayed: 0,
    gridWon: 0,
  };
}

/** Records a finished game. Returns the same object if the day was already recorded. */
export function recordGame(stats: Stats, game: SavedGame, isGrid: boolean): Stats {
  if (game.status === 'in-progress') return stats;
  if (stats.lastRecordedDay && game.day <= stats.lastRecordedDay) return stats;

  const next: Stats = {
    ...stats,
    played: stats.played + 1,
    gridPlayed: stats.gridPlayed + (isGrid ? 1 : 0),
    lastRecordedDay: game.day,
    guessDistribution: [...stats.guessDistribution],
  };

  if (game.status === 'lost') {
    next.lost += 1;
    if (stats.currentStreak > 0) {
      next.lastBrokenStreak = stats.currentStreak;
      next.currentStreak = 0;
    }
    return next;
  }

  next.won += 1;
  next.gridWon += isGrid ? 1 : 0;
  // Bucket n+1 = won with n wrong guesses; for single words that is "solved on guess n+1".
  const index = countMisses(game.guesses);
  while (next.guessDistribution.length <= index) next.guessDistribution.push(0);
  next.guessDistribution[index] = (next.guessDistribution[index] ?? 0) + 1;

  const continues = stats.lastCompletedDay === addDays(game.day, -1);
  if (continues) {
    next.currentStreak = stats.currentStreak + 1;
  } else {
    if (stats.currentStreak > 0) next.lastBrokenStreak = stats.currentStreak;
    next.currentStreak = 1;
  }
  next.bestStreak = Math.max(stats.bestStreak, next.currentStreak);
  next.lastCompletedDay = game.day;
  return next;
}

/** The streak as it stands today: it is already broken if neither today nor yesterday was won. */
export function displayStreak(stats: Stats, today: DayKey): number {
  if (!stats.lastCompletedDay) return 0;
  return daysBetween(stats.lastCompletedDay, today) <= 1 ? stats.currentStreak : 0;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

export const statsSpec: StoreSpec<Stats> = {
  key: 'wim:stats',
  version: 1,
  defaults: emptyStats,
  parse: (doc) => ({
    played: count(doc.played),
    won: count(doc.won),
    lost: count(doc.lost),
    currentStreak: count(doc.currentStreak),
    bestStreak: count(doc.bestStreak),
    lastBrokenStreak: count(doc.lastBrokenStreak),
    lastCompletedDay: isDayKey(doc.lastCompletedDay) ? doc.lastCompletedDay : null,
    lastRecordedDay: isDayKey(doc.lastRecordedDay) ? doc.lastRecordedDay : null,
    guessDistribution: Array.isArray(doc.guessDistribution) ? doc.guessDistribution.map(count) : [],
    gridPlayed: count(doc.gridPlayed),
    gridWon: count(doc.gridWon),
  }),
};
