import { LAUNCH_DATE } from '@/game/config';
import { daysBetween, type DayKey } from '@/lib/dayKey';
import type { Puzzle } from './schema';

/** 1-based puzzle number for a day; days before launch map to #1. */
export function puzzleNumberFor(day: DayKey, launch: DayKey = LAUNCH_DATE): number {
  return Math.max(0, daysBetween(launch, day)) + 1;
}

export function puzzleForDay(
  puzzles: readonly Puzzle[],
  day: DayKey,
  launch: DayKey = LAUNCH_DATE,
): { puzzle: Puzzle; number: number } {
  if (puzzles.length === 0) throw new Error('No puzzles available');
  const number = puzzleNumberFor(day, launch);
  // Wrap around once the list runs out, so the game never breaks.
  const puzzle = puzzles[(number - 1) % puzzles.length] as Puzzle;
  return { puzzle, number };
}
