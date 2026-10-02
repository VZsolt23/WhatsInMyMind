import type { Locale } from '@/storage/schemas';
import en from './en.json';
import type { Puzzle } from './schema';
import { validatePuzzleList } from './validate';

const SOURCES: Record<Locale, unknown> = { en };
const cache = new Map<Locale, Puzzle[]>();

/** Returns the valid puzzles of a locale; invalid entries are skipped (the build validator catches them). */
export function loadPuzzles(locale: Locale): Puzzle[] {
  const cached = cache.get(locale);
  if (cached) return cached;
  const { puzzles, errors } = validatePuzzleList(SOURCES[locale]);
  if (errors.length > 0) console.error('Invalid puzzles skipped:', errors);
  cache.set(locale, puzzles);
  return puzzles;
}
