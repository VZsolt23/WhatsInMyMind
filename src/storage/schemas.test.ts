import { createMemoryBackend, createStorage } from './storage';
import { metaSpec, settingsSpec } from './schemas';

function storageWith(key: string, value: unknown) {
  const backend = createMemoryBackend();
  backend.setItem(key, JSON.stringify(value));
  return createStorage(backend);
}

describe('settingsSpec', () => {
  it('defaults to the system theme', () => {
    expect(createStorage(null).load(settingsSpec).theme).toBe('system');
  });

  it('keeps valid fields and repairs invalid ones', () => {
    const storage = storageWith('wim:settings', {
      v: 1,
      theme: 'legacy',
      locale: 'xx',
      reducedMotion: 'yes',
    });
    expect(storage.load(settingsSpec)).toEqual({
      theme: 'legacy',
      locale: 'en',
      reducedMotion: false,
      seenHelp: false,
    });
  });
});

describe('metaSpec', () => {
  it('accepts a valid day', () => {
    const storage = storageWith('wim:meta', { v: 1, lastSeenDay: '2026-10-02' });
    expect(storage.load(metaSpec).lastSeenDay).toBe('2026-10-02');
  });

  it('drops an invalid day', () => {
    const storage = storageWith('wim:meta', { v: 1, lastSeenDay: '2026-02-31' });
    expect(storage.load(metaSpec).lastSeenDay).toBeNull();
  });
});
