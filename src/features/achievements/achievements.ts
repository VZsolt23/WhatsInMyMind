import type { SavedGame } from '@/game/reducer';
import { isDayKey, type DayKey } from '@/lib/dayKey';
import type { ThemeSetting } from '@/storage/schemas';
import type { StoreSpec } from '@/storage/storage';
import type { Stats } from '@/features/streak/stats';

export type AchievementEvent =
  | { type: 'gameEnded'; game: SavedGame; isGrid: boolean; maxAttempts: number; stats: Stats }
  | { type: 'themeChanged'; theme: ThemeSetting };

export interface Counters {
  /** Consecutive wins in 3 guesses or fewer. */
  flawlessRun: number;
}

interface Context {
  event: AchievementEvent;
  counters: Counters;
}

export interface AchievementDefinition {
  id: string;
  icon: string;
  check: (ctx: Context) => boolean;
}

function won(event: AchievementEvent): event is Extract<AchievementEvent, { type: 'gameEnded' }> {
  return event.type === 'gameEnded' && event.game.status === 'won';
}

function streakAtLeast(n: number) {
  return ({ event }: Context) => event.type === 'gameEnded' && event.stats.currentStreak >= n;
}

function wonBetween(fromHour: number, toHour: number) {
  return ({ event }: Context) => {
    const hour = won(event) ? event.game.completedHour : undefined;
    return hour !== undefined && hour >= fromHour && hour < toHour;
  };
}

export const FLAWLESS_RUN = 5;
export const FLAWLESS_MAX_GUESSES = 3;
export const COMEBACK_MIN_STREAK = 3;

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-thoughts', icon: '💭', check: ({ event }) => won(event) },
  {
    id: 'mind-reader',
    icon: '🔮',
    check: ({ event }) => won(event) && event.game.guesses.length === 1,
  },
  {
    id: 'clutch',
    icon: '😮‍💨',
    check: ({ event }) => won(event) && event.game.guesses.length === event.maxAttempts,
  },
  { id: 'warming-up', icon: '🔥', check: streakAtLeast(3) },
  { id: 'on-a-roll', icon: '🎯', check: streakAtLeast(7) },
  { id: 'mastermind', icon: '🧠', check: streakAtLeast(30) },
  { id: 'crossed-wires', icon: '✖️', check: ({ event }) => won(event) && event.isGrid },
  {
    id: 'grid-lock',
    icon: '🧩',
    check: ({ event }) => event.type === 'gameEnded' && event.stats.gridWon >= 5,
  },
  { id: 'night-owl', icon: '🦉', check: wonBetween(0, 4) },
  { id: 'early-bird', icon: '🐦', check: wonBetween(4, 6) },
  {
    id: 'comeback-kid',
    icon: '🔄',
    check: ({ event }) =>
      won(event) &&
      event.stats.currentStreak === 1 &&
      event.stats.lastBrokenStreak >= COMEBACK_MIN_STREAK,
  },
  {
    id: 'retro-soul',
    icon: '💾',
    check: ({ event }) => event.type === 'themeChanged' && event.theme === 'legacy',
  },
  { id: 'flawless', icon: '✨', check: ({ counters }) => counters.flawlessRun >= FLAWLESS_RUN },
];

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

export interface Unlock {
  day: DayKey;
  at: string;
}

export interface AchievementsState {
  unlocked: Record<string, Unlock>;
  counters: Counters;
}

export function emptyAchievements(): AchievementsState {
  return { unlocked: {}, counters: { flawlessRun: 0 } };
}

function updateCounters(counters: Counters, event: AchievementEvent): Counters {
  if (event.type !== 'gameEnded') return counters;
  const flawless = won(event) && event.game.guesses.length <= FLAWLESS_MAX_GUESSES;
  return { flawlessRun: flawless ? counters.flawlessRun + 1 : 0 };
}

/** Pure evaluation: returns the new state and the ids unlocked by this event. Unlocks are permanent. */
export function evaluateAchievements(
  state: AchievementsState,
  event: AchievementEvent,
  day: DayKey,
  at: string,
): { state: AchievementsState; newlyUnlocked: string[] } {
  const counters = updateCounters(state.counters, event);
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (a) => !state.unlocked[a.id] && a.check({ event, counters }),
  ).map((a) => a.id);

  const unlocked = { ...state.unlocked };
  for (const id of newlyUnlocked) unlocked[id] = { day, at };
  return { state: { unlocked, counters }, newlyUnlocked };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const KNOWN_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));

export const achievementsSpec: StoreSpec<AchievementsState> = {
  key: 'wim:achievements',
  version: 1,
  defaults: emptyAchievements,
  parse: (doc) => {
    const unlocked: Record<string, Unlock> = {};
    if (isRecord(doc.unlocked)) {
      for (const [id, raw] of Object.entries(doc.unlocked)) {
        if (KNOWN_IDS.has(id) && isRecord(raw) && isDayKey(raw.day) && typeof raw.at === 'string') {
          unlocked[id] = { day: raw.day, at: raw.at };
        }
      }
    }
    const run = isRecord(doc.counters) ? doc.counters.flawlessRun : 0;
    return {
      unlocked,
      counters: {
        flawlessRun: typeof run === 'number' && Number.isInteger(run) && run >= 0 ? run : 0,
      },
    };
  },
};
