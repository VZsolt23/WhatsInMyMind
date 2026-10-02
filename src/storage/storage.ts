/**
 * The only module that touches localStorage. Every stored document carries a
 * schema version `v`; loading migrates old versions, validates the shape and
 * falls back to defaults, so a corrupt key never takes the app down.
 */

export interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

export interface StoreSpec<T> {
  key: string;
  version: number;
  defaults: () => T;
  /** Validates a document already at `version`; returns null if the shape is wrong. */
  parse: (doc: Record<string, unknown>) => T | null;
  /** `migrations[n]` upgrades a version-n document to version n + 1. */
  migrations?: Record<number, Migration>;
}

export interface Storage {
  /** False when localStorage is unavailable and data lives only in memory. */
  readonly persistent: boolean;
  load<T>(spec: StoreSpec<T>): T;
  save<T>(spec: StoreSpec<T>, value: T): void;
  remove(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createMemoryBackend(): KeyValueBackend {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

export function detectLocalStorage(): KeyValueBackend | null {
  try {
    const ls = globalThis.localStorage;
    const probe = 'wim:__probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

function migrate<T>(
  spec: StoreSpec<T>,
  doc: Record<string, unknown>,
): Record<string, unknown> | null {
  let current = doc;
  let version = current.v;
  if (typeof version !== 'number' || !Number.isInteger(version)) return null;
  if (version > spec.version) return null;
  while (version < spec.version) {
    const step = spec.migrations?.[version];
    if (!step) return null;
    current = step(current);
    version += 1;
  }
  return current;
}

export function createStorage(backend: KeyValueBackend | null): Storage {
  const store = backend ?? createMemoryBackend();

  return {
    persistent: backend !== null,

    load<T>(spec: StoreSpec<T>): T {
      let raw: string | null;
      try {
        raw = store.getItem(spec.key);
      } catch {
        return spec.defaults();
      }
      if (raw === null) return spec.defaults();

      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed)) return spec.defaults();
        const migrated = migrate(spec, parsed);
        if (!migrated) return spec.defaults();
        return spec.parse(migrated) ?? spec.defaults();
      } catch {
        return spec.defaults();
      }
    },

    save<T>(spec: StoreSpec<T>, value: T): void {
      try {
        store.setItem(spec.key, JSON.stringify({ ...value, v: spec.version }));
      } catch {
        // Quota exceeded or storage revoked mid-session: keep playing without saving.
      }
    },

    remove(key: string): void {
      try {
        store.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

export const storage: Storage = createStorage(detectLocalStorage());

/** Notifies when another tab changes one of our keys. Returns an unsubscribe function. */
export function subscribeToExternalChanges(onChange: (key: string) => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key?.startsWith('wim:')) onChange(event.key);
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
