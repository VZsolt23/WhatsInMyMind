import { createContext, useContext } from 'react';
import type { AlphabetConfig } from '@/i18n/alphabet';
import type { Translate } from '@/i18n/translate';
import type { Settings } from '@/storage/schemas';

export interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  t: Translate;
  alphabet: AlphabetConfig;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}

export function useT(): Translate {
  return useSettings().t;
}
