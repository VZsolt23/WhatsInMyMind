import { isDayKey, type DayKey } from '@/lib/dayKey';
import type { StoreSpec } from './storage';

export const THEME_SETTINGS = ['system', 'light', 'dark', 'legacy'] as const;
export type ThemeSetting = (typeof THEME_SETTINGS)[number];

export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];

export interface Settings {
  theme: ThemeSetting;
  locale: Locale;
  reducedMotion: boolean;
  /** Whether the how-to-play help has been shown once. */
  seenHelp: boolean;
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

export const settingsSpec: StoreSpec<Settings> = {
  key: 'wim:settings',
  version: 1,
  defaults: () => ({ theme: 'system', locale: 'en', reducedMotion: false, seenHelp: false }),
  parse: (doc) => ({
    theme: isOneOf(THEME_SETTINGS, doc.theme) ? doc.theme : 'system',
    locale: isOneOf(LOCALES, doc.locale) ? doc.locale : 'en',
    reducedMotion: doc.reducedMotion === true,
    seenHelp: doc.seenHelp === true,
  }),
};

export interface Meta {
  /** The latest day the app has ever seen; guards against the clock being turned back. */
  lastSeenDay: DayKey | null;
}

export const metaSpec: StoreSpec<Meta> = {
  key: 'wim:meta',
  version: 1,
  defaults: () => ({ lastSeenDay: null }),
  parse: (doc) => ({ lastSeenDay: isDayKey(doc.lastSeenDay) ? doc.lastSeenDay : null }),
};
