import type { SavedGame } from '@/game/reducer';
import { createMemoryBackend, createStorage } from '@/storage/storage';
import { displayStreak, emptyStats, recordGame, statsSpec, type Stats } from './stats';

/** A win ends with one correct guess; every other guess is a miss. */
function played(day: string, status: 'won' | 'lost', guesses = 3): SavedGame {
  const misses = status === 'won' ? guesses - 1 : guesses;
  return {
    puzzleId: 'p',
    day,
    status,
    guesses: Array.from({ length: guesses }, (_, i) => ({
      slotId: 'main',
      letters: 'A',
      states: [i < misses ? 'absent' : 'correct'],
    })),
  };
}

function playAll(games: SavedGame[], isGrid = false): Stats {
  return games.reduce((s, g) => recordGame(s, g, isGrid), emptyStats());
}

describe('recordGame', () => {
  it('ignores games in progress', () => {
    const s = emptyStats();
    expect(recordGame(s, { ...played('2026-10-02', 'won'), status: 'in-progress' }, false)).toBe(s);
  });

  it('starts a streak with the first win', () => {
    const s = playAll([played('2026-10-02', 'won', 2)]);
    expect(s).toMatchObject({ played: 1, won: 1, currentStreak: 1, bestStreak: 1 });
    expect(s.guessDistribution).toEqual([0, 1]);
    expect(s.lastCompletedDay).toBe('2026-10-02');
  });

  it('extends the streak on consecutive days, across month and year ends', () => {
    const s = playAll([
      played('2026-12-30', 'won'),
      played('2026-12-31', 'won'),
      played('2027-01-01', 'won'),
    ]);
    expect(s.currentStreak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });

  it('is idempotent for the same day and ignores older days', () => {
    const once = playAll([played('2026-10-02', 'won')]);
    expect(recordGame(once, played('2026-10-02', 'won'), false)).toBe(once);
    expect(recordGame(once, played('2026-10-01', 'won'), false)).toBe(once);
  });

  it('restarts after a skipped day and remembers the broken streak', () => {
    const s = playAll([
      played('2026-10-01', 'won'),
      played('2026-10-02', 'won'),
      played('2026-10-03', 'won'),
      played('2026-10-05', 'won'),
    ]);
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(3);
    expect(s.lastBrokenStreak).toBe(3);
  });

  it('breaks the streak immediately on a loss', () => {
    const s = playAll([
      played('2026-10-01', 'won'),
      played('2026-10-02', 'won'),
      played('2026-10-03', 'lost', 6),
    ]);
    expect(s).toMatchObject({ played: 3, won: 2, lost: 1, currentStreak: 0, lastBrokenStreak: 2 });
    const after = recordGame(s, played('2026-10-04', 'won'), false);
    expect(after.currentStreak).toBe(1);
    expect(after.lastBrokenStreak).toBe(2);
  });

  it('puts grid wins in the bucket of their wrong guesses, not their total guesses', () => {
    const grid: SavedGame = {
      puzzleId: 'g',
      day: '2026-10-01',
      status: 'won',
      guesses: [
        { slotId: 'w1', letters: 'A', states: ['absent'] },
        ...['w1', 'w2', 'w3', 'w4'].map((slotId) => ({
          slotId,
          letters: 'A',
          states: ['correct' as const],
        })),
      ],
    };
    expect(recordGame(emptyStats(), grid, true).guessDistribution).toEqual([0, 1]);
  });

  it('counts grid games separately', () => {
    const s = playAll([played('2026-10-01', 'won'), played('2026-10-02', 'lost')], true);
    expect(s).toMatchObject({ gridPlayed: 2, gridWon: 1 });
  });
});

describe('displayStreak', () => {
  const s = playAll([played('2026-10-01', 'won'), played('2026-10-02', 'won')]);

  it('shows the streak on the win day and the next day', () => {
    expect(displayStreak(s, '2026-10-02')).toBe(2);
    expect(displayStreak(s, '2026-10-03')).toBe(2);
  });

  it('shows 0 once a day was missed', () => {
    expect(displayStreak(s, '2026-10-04')).toBe(0);
    expect(displayStreak(emptyStats(), '2026-10-04')).toBe(0);
  });
});

describe('statsSpec', () => {
  it('repairs invalid fields', () => {
    const backend = createMemoryBackend();
    backend.setItem(
      'wim:stats',
      JSON.stringify({
        v: 1,
        played: 3,
        won: -1,
        lastCompletedDay: 'x',
        guessDistribution: [1, 'a'],
      }),
    );
    expect(createStorage(backend).load(statsSpec)).toMatchObject({
      played: 3,
      won: 0,
      lastCompletedDay: null,
      guessDistribution: [1, 0],
    });
  });
});
