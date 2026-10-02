import { useEffect, useReducer, type Dispatch } from 'react';
import { useProgress } from '@/features/progress/progressContext';
import { useSettings } from '@/features/settings/settingsContext';
import { createPlayState, playReducer, type PlayAction, type PlayState } from '@/game/reducer';
import type { DayKey } from '@/lib/dayKey';
import type { Puzzle } from '@/puzzles/schema';
import { storage, subscribeToExternalChanges } from '@/storage/storage';
import { gamesSpec, loadGame, saveGame } from './gamesStore';

/** Today's game: restored from storage, saved after every change, and recorded once finished. */
export function useDailyGame(puzzle: Puzzle, day: DayKey): [PlayState, Dispatch<PlayAction>] {
  const { alphabet } = useSettings();
  const { recordGameEnd } = useProgress();
  const [state, dispatch] = useReducer(playReducer, null, () =>
    createPlayState(puzzle, day, loadGame(storage, day), alphabet.letters),
  );
  const { game, maxAttempts } = state;

  useEffect(() => {
    saveGame(storage, game);
  }, [game]);

  useEffect(() => {
    if (game.status !== 'in-progress') {
      recordGameEnd({ game, isGrid: puzzle.type === 'grid', maxAttempts });
    }
  }, [game, maxAttempts, puzzle.type, recordGameEnd]);

  useEffect(
    () =>
      subscribeToExternalChanges((key) => {
        if (key !== gamesSpec.key) return;
        const saved = loadGame(storage, day);
        if (saved) dispatch({ type: 'sync', game: saved });
      }),
    [day],
  );

  return [state, dispatch];
}
