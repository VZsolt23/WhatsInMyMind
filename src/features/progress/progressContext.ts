import { createContext, useContext } from 'react';
import type { AchievementsState } from '@/features/achievements/achievements';
import type { Stats } from '@/features/streak/stats';
import type { SavedGame } from '@/game/reducer';
import type { ThemeSetting } from '@/storage/schemas';

export interface GameEndInput {
  game: SavedGame;
  isGrid: boolean;
  maxAttempts: number;
}

export interface ProgressContextValue {
  stats: Stats;
  achievements: AchievementsState;
  recordGameEnd: (input: GameEndInput) => void;
  recordThemeChange: (theme: ThemeSetting) => void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}
