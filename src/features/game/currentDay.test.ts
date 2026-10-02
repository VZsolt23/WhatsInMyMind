import { metaSpec } from '@/storage/schemas';
import { createMemoryBackend, createStorage } from '@/storage/storage';
import { checkCurrentDay, resolveDay } from './currentDay';

describe('resolveDay', () => {
  it('uses today normally', () => {
    expect(resolveDay('2026-10-02', null)).toEqual({ day: '2026-10-02', clockBehind: false });
    expect(resolveDay('2026-10-02', '2026-10-01')).toEqual({
      day: '2026-10-02',
      clockBehind: false,
    });
  });

  it('stays on the last seen day when the clock goes back', () => {
    expect(resolveDay('2026-09-30', '2026-10-02')).toEqual({
      day: '2026-10-02',
      clockBehind: true,
    });
  });
});

describe('checkCurrentDay', () => {
  it('remembers the latest day and guards against going back', () => {
    const store = createStorage(createMemoryBackend());
    expect(checkCurrentDay(store, new Date(2026, 9, 2, 10)).day).toBe('2026-10-02');
    expect(store.load(metaSpec).lastSeenDay).toBe('2026-10-02');

    expect(checkCurrentDay(store, new Date(2026, 9, 1, 10))).toEqual({
      day: '2026-10-02',
      clockBehind: true,
    });
    expect(store.load(metaSpec).lastSeenDay).toBe('2026-10-02');

    expect(checkCurrentDay(store, new Date(2026, 9, 3, 0, 1)).day).toBe('2026-10-03');
    expect(store.load(metaSpec).lastSeenDay).toBe('2026-10-03');
  });
});
