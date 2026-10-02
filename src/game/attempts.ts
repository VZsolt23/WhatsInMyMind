import type { Puzzle } from '@/puzzles/schema';
import { ATTEMPTS } from './config';

export function getMaxAttempts(puzzle: Puzzle): number {
  if (puzzle.maxAttempts !== undefined) return puzzle.maxAttempts;

  if (puzzle.type === 'single') {
    const length = puzzle.answer.replaceAll(' ', '').length;
    // The last tier has maxLength Infinity, so a tier is always found.
    const tier = ATTEMPTS.single.find((t) => length <= t.maxLength);
    return tier?.attempts ?? ATTEMPTS.gridMin;
  }

  const longest = Math.max(...puzzle.words.map((w) => w.answer.length));
  const bonus = longest >= ATTEMPTS.gridLongWordLength ? ATTEMPTS.gridLongWordBonus : 0;
  const raw = puzzle.words.length + ATTEMPTS.gridExtra + bonus;
  return Math.min(ATTEMPTS.gridMax, Math.max(ATTEMPTS.gridMin, raw));
}
