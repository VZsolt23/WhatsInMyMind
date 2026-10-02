import { useEffect, useState } from 'react';
import { Keyboard } from '@/components/Keyboard';
import { useToast } from '@/components/toast/toastContext';
import { useDailyGame } from '@/features/game/useDailyGame';
import { useSettings, useT } from '@/features/settings/settingsContext';
import { normalizeLetter } from '@/i18n/alphabet';
import { getSlot } from '@/game/board';
import { deriveKeyStates } from '@/game/progress';
import type { DayKey } from '@/lib/dayKey';
import { puzzleForDay } from '@/puzzles/daily';
import { loadPuzzles } from '@/puzzles';
import type { Puzzle } from '@/puzzles/schema';
import { EndPanel } from './EndPanel';
import { GridBoard } from './GridBoard';
import { SingleBoard } from './SingleBoard';
import styles from './Game.module.css';

interface GameProps {
  day: DayKey;
  /** Physical keyboard input is ignored while a modal is open. */
  inputEnabled: boolean;
}

export function Game({ day, inputEnabled }: GameProps) {
  const t = useT();
  const { settings } = useSettings();
  const puzzles = loadPuzzles(settings.locale);
  if (puzzles.length === 0) {
    return <p className={styles.error}>{t('game.loadError')}</p>;
  }
  const { puzzle, number } = puzzleForDay(puzzles, day);
  return (
    <GameView
      key={`${day}:${puzzle.id}`}
      puzzle={puzzle}
      number={number}
      day={day}
      inputEnabled={inputEnabled}
    />
  );
}

interface GameViewProps extends GameProps {
  puzzle: Puzzle;
  number: number;
}

/**
 * Whether Enter should go to the focused control instead of submitting a guess.
 * Grid cells and the already-selected word button submit, so a click followed
 * by typing and Enter works as expected.
 */
function enterBelongsToControl(target: EventTarget | null, selectedSlotId: string | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (!target.closest('button, a, input, select, textarea')) return false;
  if (target.closest('[data-grid-cell]')) return false;
  const chip = target.closest<HTMLElement>('[data-slot-chip]');
  return !(chip && chip.dataset.slotChip === selectedSlotId);
}

function GameView({ puzzle, number, day, inputEnabled }: GameViewProps) {
  const t = useT();
  const toast = useToast();
  const { alphabet } = useSettings();
  const [state, dispatch] = useDailyGame(puzzle, day);
  // Guesses already on screen when the page loaded do not replay the flip animation.
  const [revealFrom] = useState(state.game.guesses.length);
  const playing = state.game.status === 'in-progress';
  const isGrid = puzzle.type === 'grid';
  const { selectedSlotId } = state;

  useEffect(() => {
    if (state.notice) toast(t(`notice.${state.notice.id}`));
  }, [state.notice, t, toast]);

  useEffect(() => {
    if (!inputEnabled || !playing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Enter') {
        if (enterBelongsToControl(event.target, selectedSlotId)) return;
        event.preventDefault();
        dispatch({ type: 'submit', now: new Date() });
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'backspace' });
      } else {
        const letter = normalizeLetter(event.key, alphabet);
        if (letter) {
          event.preventDefault();
          dispatch({ type: 'type', letter });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inputEnabled, playing, alphabet, dispatch, selectedSlotId]);

  const selectedGuesses = selectedSlotId
    ? (state.progress.guessesBySlot.get(selectedSlotId) ?? [])
    : [];
  const keyStates = deriveKeyStates(isGrid ? selectedGuesses : state.game.guesses);
  const selectedSlot = selectedSlotId ? getSlot(state.board, selectedSlotId) : undefined;

  return (
    <div className={styles.game}>
      <section className={styles.banner} aria-label={t('game.category')}>
        <div className={styles.meta}>
          <span>{t('game.puzzleNumber', { n: number })}</span>
          <span>
            {t('game.attempts', { used: state.game.guesses.length, max: state.maxAttempts })}
          </span>
        </div>
        <p className={styles.categoryLabel}>{t('game.category')}</p>
        <h2 className={styles.category}>{puzzle.category}</h2>
      </section>

      <div className={styles.board}>
        {isGrid ? (
          <GridBoard state={state} dispatch={dispatch} revealFrom={revealFrom} />
        ) : (
          <SingleBoard state={state} revealFrom={revealFrom} />
        )}
      </div>

      {playing ? (
        <div className={styles.controls}>
          {isGrid && selectedSlot === undefined && (
            <p className={styles.hint}>{t('notice.selectWord')}</p>
          )}
          <Keyboard
            rows={alphabet.keyboardRows}
            keyStates={keyStates}
            onLetter={(letter) => dispatch({ type: 'type', letter })}
            onEnter={() => dispatch({ type: 'submit', now: new Date() })}
            onBackspace={() => dispatch({ type: 'backspace' })}
          />
        </div>
      ) : (
        <EndPanel state={state} number={number} />
      )}

      <footer className={styles.statusBar} aria-hidden="true">
        <span>{t('game.puzzleNumber', { n: number })}</span>
        <span>
          {t('game.attempts', { used: state.game.guesses.length, max: state.maxAttempts })}
        </span>
      </footer>
    </div>
  );
}
