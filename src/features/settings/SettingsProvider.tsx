import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ALPHABETS } from '@/i18n/alphabet';
import { createTranslator } from '@/i18n/translate';
import { settingsSpec, type Settings } from '@/storage/schemas';
import { storage, subscribeToExternalChanges } from '@/storage/storage';
import { SettingsContext, type SettingsContextValue } from './settingsContext';
import { applyTheme } from './theme';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => storage.load(settingsSpec));

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.save(settingsSpec, next);
      return next;
    });
  }, []);

  useEffect(
    () =>
      subscribeToExternalChanges((key) => {
        if (key === settingsSpec.key) setSettings(storage.load(settingsSpec));
      }),
    [],
  );

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduced-motion', settings.reducedMotion);
  }, [settings.reducedMotion]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings,
      t: createTranslator(settings.locale),
      alphabet: ALPHABETS[settings.locale],
    }),
    [settings, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
