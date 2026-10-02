import { GAMES_RETENTION_DAYS } from '@/game/config';
import type { LetterState } from '@/game/feedback';
import type { Guess } from '@/game/progress';
import type { GameStatus, SavedGame } from '@/game/reducer';
import { daysBetween, isDayKey, type DayKey } from '@/lib/dayKey';
import type { Storage, StoreSpec } from '@/storage/storage';

export interface GamesDoc {
  byDay: Record<DayKey, SavedGame>;
}

const STATUSES: readonly GameStatus[] = ['in-progress', 'won', 'lost'];
const LETTER_STATES: readonly LetterState[] = ['correct', 'present', 'absent'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseGuess(raw: unknown): Guess | null {
  if (!isRecord(raw)) return null;
  const { slotId, letters, states } = raw;
  if (typeof slotId !== 'string' || typeof letters !== 'string' || !Array.isArray(states))
    return null;
  if (states.length !== [...letters].length) return null;
  if (!states.every((s) => LETTER_STATES.includes(s as LetterState))) return null;
  return { slotId, letters, states: states as LetterState[] };
}

export function parseSavedGame(raw: unknown): SavedGame | null {
  if (!isRecord(raw)) return null;
  const { puzzleId, day, status, guesses, completedAt, completedHour } = raw;
  if (typeof puzzleId !== 'string' || !isDayKey(day)) return null;
  if (!STATUSES.includes(status as GameStatus) || !Array.isArray(guesses)) return null;
  const parsed = guesses.map(parseGuess);
  if (parsed.some((g) => g === null)) return null;

  const game: SavedGame = {
    puzzleId,
    day,
    status: status as GameStatus,
    guesses: parsed as Guess[],
  };
  if (typeof completedAt === 'string') game.completedAt = completedAt;
  if (
    typeof completedHour === 'number' &&
    Number.isInteger(completedHour) &&
    completedHour >= 0 &&
    completedHour < 24
  ) {
    game.completedHour = completedHour;
  }
  return game;
}

export const gamesSpec: StoreSpec<GamesDoc> = {
  key: 'wim:games',
  version: 1,
  defaults: () => ({ byDay: {} }),
  parse: (doc) => {
    if (!isRecord(doc.byDay)) return null;
    const byDay: Record<DayKey, SavedGame> = {};
    for (const [day, raw] of Object.entries(doc.byDay)) {
      const game = parseSavedGame(raw);
      // A single corrupt day is dropped without losing the others.
      if (game && game.day === day) byDay[day] = game;
    }
    return { byDay };
  },
};

export function pruneGames(
  doc: GamesDoc,
  today: DayKey,
  retentionDays = GAMES_RETENTION_DAYS,
): GamesDoc {
  const byDay = Object.fromEntries(
    Object.entries(doc.byDay).filter(([day]) => daysBetween(day, today) <= retentionDays),
  );
  return { byDay };
}

export function loadGame(store: Storage, day: DayKey): SavedGame | null {
  return store.load(gamesSpec).byDay[day] ?? null;
}

export function saveGame(store: Storage, game: SavedGame): void {
  const doc = store.load(gamesSpec);
  store.save(gamesSpec, pruneGames({ byDay: { ...doc.byDay, [game.day]: game } }, game.day));
}
