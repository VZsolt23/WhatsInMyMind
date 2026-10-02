import type { KeyValueBackend, StoreSpec } from './storage';
import { createMemoryBackend, createStorage, subscribeToExternalChanges } from './storage';

interface Doc {
  name: string;
  count: number;
}

const spec: StoreSpec<Doc> = {
  key: 'wim:test',
  version: 2,
  defaults: () => ({ name: 'default', count: 0 }),
  parse: (doc) =>
    typeof doc.name === 'string' && typeof doc.count === 'number'
      ? { name: doc.name, count: doc.count }
      : null,
  migrations: {
    1: (old) => ({ ...old, v: 2, count: 0 }),
  },
};

function setup(initial?: Record<string, string>) {
  const backend = createMemoryBackend();
  for (const [k, v] of Object.entries(initial ?? {})) backend.setItem(k, v);
  return { backend, storage: createStorage(backend) };
}

describe('storage', () => {
  it('returns defaults when the key is missing', () => {
    expect(setup().storage.load(spec)).toEqual({ name: 'default', count: 0 });
  });

  it('round-trips a saved value with its version', () => {
    const { storage, backend } = setup();
    storage.save(spec, { name: 'x', count: 3 });
    expect(JSON.parse(backend.getItem('wim:test') ?? '')).toEqual({ name: 'x', count: 3, v: 2 });
    expect(storage.load(spec)).toEqual({ name: 'x', count: 3 });
  });

  it('falls back to defaults on corrupt JSON', () => {
    expect(setup({ 'wim:test': '{not json' }).storage.load(spec)).toEqual(spec.defaults());
  });

  it.each([
    ['an array', '[1,2]'],
    ['a primitive', '42'],
    ['no version', '{"name":"x","count":1}'],
    ['a wrong shape', '{"v":2,"name":5,"count":1}'],
    ['a future version', '{"v":9,"name":"x","count":1}'],
    ['a version without migration', '{"v":0,"name":"x"}'],
  ])('falls back to defaults on %s', (_, raw) => {
    expect(setup({ 'wim:test': raw }).storage.load(spec)).toEqual(spec.defaults());
  });

  it('migrates old versions', () => {
    const { storage } = setup({ 'wim:test': '{"v":1,"name":"old"}' });
    expect(storage.load(spec)).toEqual({ name: 'old', count: 0 });
  });

  it('works in memory when localStorage is unavailable', () => {
    const storage = createStorage(null);
    expect(storage.persistent).toBe(false);
    storage.save(spec, { name: 'mem', count: 1 });
    expect(storage.load(spec)).toEqual({ name: 'mem', count: 1 });
  });

  it('survives a backend that throws', () => {
    const throwing: KeyValueBackend = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    const storage = createStorage(throwing);
    expect(() => storage.save(spec, { name: 'x', count: 1 })).not.toThrow();
    expect(storage.load(spec)).toEqual(spec.defaults());
    expect(() => storage.remove('wim:test')).not.toThrow();
  });

  it('removes a key', () => {
    const { storage, backend } = setup({ 'wim:test': '{"v":2,"name":"x","count":1}' });
    storage.remove('wim:test');
    expect(backend.getItem('wim:test')).toBeNull();
  });
});

describe('subscribeToExternalChanges', () => {
  it('reports changes to our keys only', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToExternalChanges(onChange);
    window.dispatchEvent(new StorageEvent('storage', { key: 'wim:settings' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: 'wim:stats' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('wim:settings');
  });
});
