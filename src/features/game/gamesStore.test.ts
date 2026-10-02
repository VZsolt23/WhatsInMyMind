import type { SavedGame } from '@/game/reducer';
import { createMemoryBackend, createStorage } from '@/storage/storage';
import { gamesSpec, loadGame, parseSavedGame, pruneGames, saveGame } from './gamesStore';

const game = (day: string, extra: Partial<SavedGame> = {}): SavedGame => ({
  puzzleId: 'en-001',
  day,
  status: 'in-progress',
  guesses: [{ slotId: 'main', letters: 'ABC', states: ['correct', 'present', 'absent'] }],
  ...extra,
});

describe('parseSavedGame', () => {
  it('accepts a valid game', () => {
    const g = game('2026-10-02', { status: 'won', completedAt: 'x', completedHour: 3 });
    expect(parseSavedGame(g)).toEqual(g);
  });

  it.each([
    ['bad day', { ...game('2026-10-02'), day: 'yesterday' }],
    ['bad status', { ...game('2026-10-02'), status: 'paused' }],
    [
      'bad state',
      { ...game('2026-10-02'), guesses: [{ slotId: 'main', letters: 'A', states: ['meh'] }] },
    ],
    [
      'length mismatch',
      { ...game('2026-10-02'), guesses: [{ slotId: 'main', letters: 'AB', states: ['correct'] }] },
    ],
  ])('rejects %s', (_, raw) => {
    expect(parseSavedGame(raw)).toBeNull();
  });

  it('drops an out-of-range completion hour', () => {
    expect(
      parseSavedGame({ ...game('2026-10-02'), completedHour: 24 })?.completedHour,
    ).toBeUndefined();
  });
});

describe('games store', () => {
  it('saves and loads by day', () => {
    const store = createStorage(createMemoryBackend());
    saveGame(store, game('2026-10-02'));
    expect(loadGame(store, '2026-10-02')?.guesses).toHaveLength(1);
    expect(loadGame(store, '2026-10-03')).toBeNull();
  });

  it('keeps valid days when one day is corrupt', () => {
    const backend = createMemoryBackend();
    backend.setItem(
      'wim:games',
      JSON.stringify({
        v: 1,
        byDay: { '2026-10-01': { nope: 1 }, '2026-10-02': game('2026-10-02') },
      }),
    );
    const doc = createStorage(backend).load(gamesSpec);
    expect(Object.keys(doc.byDay)).toEqual(['2026-10-02']);
  });

  it('prunes days older than the retention window', () => {
    const doc = { byDay: { '2026-08-01': game('2026-08-01'), '2026-10-01': game('2026-10-01') } };
    expect(Object.keys(pruneGames(doc, '2026-10-02', 60).byDay)).toEqual(['2026-10-01']);
  });
});
