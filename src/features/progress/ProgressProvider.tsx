import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from '@/components/toast/toastContext';
import {
  ACHIEVEMENTS,
  achievementsSpec,
  evaluateAchievements,
  type AchievementEvent,
} from '@/features/achievements/achievements';
import { useT } from '@/features/settings/settingsContext';
import { recordGame, statsSpec } from '@/features/streak/stats';
import type { MessageKey } from '@/i18n/en';
import { todayKey, type DayKey } from '@/lib/dayKey';
import type { ThemeSetting } from '@/storage/schemas';
import { storage, subscribeToExternalChanges } from '@/storage/storage';
import { ProgressContext, type GameEndInput, type ProgressContextValue } from './progressContext';

const ACHIEVEMENT_TOAST_MS = 3500;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const toast = useToast();
  const [stats, setStats] = useState(() => storage.load(statsSpec));
  const [achievements, setAchievements] = useState(() => storage.load(achievementsSpec));

  useEffect(
    () =>
      subscribeToExternalChanges((key) => {
        if (key === statsSpec.key) setStats(storage.load(statsSpec));
        if (key === achievementsSpec.key) setAchievements(storage.load(achievementsSpec));
      }),
    [],
  );

  const unlock = useCallback(
    (event: AchievementEvent, day: DayKey) => {
      // Always evaluate against the stored state so two quick events never overwrite each other.
      const current = storage.load(achievementsSpec);
      const { state, newlyUnlocked } = evaluateAchievements(
        current,
        event,
        day,
        new Date().toISOString(),
      );
      storage.save(achievementsSpec, state);
      setAchievements(state);
      for (const id of newlyUnlocked) {
        const icon = ACHIEVEMENTS.find((a) => a.id === id)?.icon;
        const name = t(`achievement.${id}.name` as MessageKey);
        toast(t('achievements.toast', { name }), {
          duration: ACHIEVEMENT_TOAST_MS,
          ...(icon ? { icon } : {}),
        });
      }
    },
    [t, toast],
  );

  const recordGameEnd = useCallback(
    ({ game, isGrid, maxAttempts }: GameEndInput) => {
      const before = storage.load(statsSpec);
      const after = recordGame(before, game, isGrid);
      if (after === before) return; // already recorded (reload, StrictMode, another tab)
      storage.save(statsSpec, after);
      setStats(after);
      unlock({ type: 'gameEnded', game, isGrid, maxAttempts, stats: after }, game.day);
    },
    [unlock],
  );

  const recordThemeChange = useCallback(
    (theme: ThemeSetting) => unlock({ type: 'themeChanged', theme }, todayKey()),
    [unlock],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ stats, achievements, recordGameEnd, recordThemeChange }),
    [stats, achievements, recordGameEnd, recordThemeChange],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
