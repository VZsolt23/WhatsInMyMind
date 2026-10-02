import type { SavedGame } from '@/game/reducer';
import { emptyStats, type Stats } from '@/features/streak/stats';
import { createMemoryBackend, createStorage } from '@/storage/storage';
import {
  ACHIEVEMENTS,
  achievementsSpec,
  emptyAchievements,
  evaluateAchievements,
  type AchievementEvent,
  type AchievementsState,
} from './achievements';

const DAY = '2026-10-02';
const AT = '2026-10-02T10:00:00.000Z';

function game(status: 'won' | 'lost', guesses: number, hour = 12): SavedGame {
  return {
    puzzleId: 'p',
    day: DAY,
    status,
    completedHour: hour,
    guesses: Array.from({ length: guesses }, () => ({
      slotId: 'main',
      letters: 'A',
      states: ['absent'],
    })),
  };
}

function ended(
  g: SavedGame,
  {
    stats = {},
    isGrid = false,
    maxAttempts = 6,
  }: { stats?: Partial<Stats>; isGrid?: boolean; maxAttempts?: number } = {},
): AchievementEvent {
  const base: Stats = { ...emptyStats(), currentStreak: g.status === 'won' ? 1 : 0, ...stats };
  return { type: 'gameEnded', game: g, isGrid, maxAttempts, stats: base };
}

function unlockedBy(event: AchievementEvent, state: AchievementsState = emptyAchievements()) {
  return evaluateAchievements(state, event, DAY, AT).newlyUnlocked;
}

describe('evaluateAchievements', () => {
  it('has 13 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(13);
  });

  it('first-thoughts: first win, not a loss', () => {
    expect(unlockedBy(ended(game('won', 3)))).toContain('first-thoughts');
    expect(unlockedBy(ended(game('lost', 6)))).not.toContain('first-thoughts');
  });

  it('mind-reader: first-guess win only', () => {
    expect(unlockedBy(ended(game('won', 1)))).toContain('mind-reader');
    expect(unlockedBy(ended(game('won', 2)))).not.toContain('mind-reader');
  });

  it('clutch: win with the last guess', () => {
    expect(unlockedBy(ended(game('won', 6)))).toContain('clutch');
    expect(unlockedBy(ended(game('won', 5)))).not.toContain('clutch');
    expect(unlockedBy(ended(game('lost', 6)))).not.toContain('clutch');
  });

  it.each([
    ['warming-up', 3],
    ['on-a-roll', 7],
    ['mastermind', 30],
  ])('%s: streak of %i', (id, streak) => {
    expect(unlockedBy(ended(game('won', 3), { stats: { currentStreak: streak } }))).toContain(id);
    expect(
      unlockedBy(ended(game('won', 3), { stats: { currentStreak: streak - 1 } })),
    ).not.toContain(id);
  });

  it('crossed-wires and grid-lock: grid wins', () => {
    expect(unlockedBy(ended(game('won', 4), { isGrid: true, stats: { gridWon: 1 } }))).toContain(
      'crossed-wires',
    );
    expect(unlockedBy(ended(game('won', 4)))).not.toContain('crossed-wires');
    expect(unlockedBy(ended(game('won', 4), { isGrid: true, stats: { gridWon: 5 } }))).toContain(
      'grid-lock',
    );
    expect(
      unlockedBy(ended(game('won', 4), { isGrid: true, stats: { gridWon: 4 } })),
    ).not.toContain('grid-lock');
  });

  it.each([
    [0, 'night-owl'],
    [3, 'night-owl'],
    [4, 'early-bird'],
    [5, 'early-bird'],
  ])('hour %i unlocks %s', (hour, id) => {
    expect(unlockedBy(ended(game('won', 3, hour)))).toContain(id);
  });

  it('time-of-day achievements need a win in the window', () => {
    const ids = unlockedBy(ended(game('won', 3, 6)));
    expect(ids).not.toContain('night-owl');
    expect(ids).not.toContain('early-bird');
    expect(unlockedBy(ended(game('lost', 6, 2)))).not.toContain('night-owl');
  });

  it('comeback-kid: new streak after a broken streak of 3+', () => {
    const win = game('won', 3);
    expect(unlockedBy(ended(win, { stats: { currentStreak: 1, lastBrokenStreak: 3 } }))).toContain(
      'comeback-kid',
    );
    expect(
      unlockedBy(ended(win, { stats: { currentStreak: 1, lastBrokenStreak: 2 } })),
    ).not.toContain('comeback-kid');
    expect(
      unlockedBy(ended(win, { stats: { currentStreak: 2, lastBrokenStreak: 5 } })),
    ).not.toContain('comeback-kid');
  });

  it('retro-soul: choosing the legacy theme', () => {
    expect(unlockedBy({ type: 'themeChanged', theme: 'legacy' })).toEqual(['retro-soul']);
    expect(unlockedBy({ type: 'themeChanged', theme: 'dark' })).toEqual([]);
  });

  it('flawless: five wins in a row with 3 guesses or fewer', () => {
    let state = emptyAchievements();
    const results: string[][] = [];
    for (const g of [3, 2, 3, 1, 2]) {
      const r = evaluateAchievements(state, ended(game('won', g)), DAY, AT);
      state = r.state;
      results.push(r.newlyUnlocked);
    }
    expect(results[3]).not.toContain('flawless');
    expect(results[4]).toContain('flawless');
  });

  it('flawless: a loss or a 4+ guess win resets the run', () => {
    let state = emptyAchievements();
    for (const g of [game('won', 2), game('won', 2), game('won', 4), game('won', 2)]) {
      state = evaluateAchievements(state, ended(g), DAY, AT).state;
    }
    expect(state.counters.flawlessRun).toBe(1);
    state = evaluateAchievements(state, ended(game('lost', 6)), DAY, AT).state;
    expect(state.counters.flawlessRun).toBe(0);
  });

  it('theme changes do not touch the flawless run', () => {
    const state = { ...emptyAchievements(), counters: { flawlessRun: 3 } };
    expect(
      evaluateAchievements(state, { type: 'themeChanged', theme: 'dark' }, DAY, AT).state.counters,
    ).toEqual({
      flawlessRun: 3,
    });
  });

  it('never unlocks the same achievement twice and records when', () => {
    const first = evaluateAchievements(emptyAchievements(), ended(game('won', 3)), DAY, AT);
    expect(first.state.unlocked['first-thoughts']).toEqual({ day: DAY, at: AT });
    const second = evaluateAchievements(first.state, ended(game('won', 3)), '2026-10-03', 'later');
    expect(second.newlyUnlocked).not.toContain('first-thoughts');
    expect(second.state.unlocked['first-thoughts']).toEqual({ day: DAY, at: AT });
  });
});

describe('achievementsSpec', () => {
  it('drops unknown ids and invalid entries', () => {
    const backend = createMemoryBackend();
    backend.setItem(
      'wim:achievements',
      JSON.stringify({
        v: 1,
        unlocked: {
          'first-thoughts': { day: DAY, at: AT },
          'made-up': { day: DAY, at: AT },
          clutch: { day: 'x', at: AT },
        },
        counters: { flawlessRun: -2 },
      }),
    );
    expect(createStorage(backend).load(achievementsSpec)).toEqual({
      unlocked: { 'first-thoughts': { day: DAY, at: AT } },
      counters: { flawlessRun: 0 },
    });
  });
});
