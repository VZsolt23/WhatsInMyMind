import { GuessRow } from '@/components/GuessRow';
import { useT } from '@/features/settings/settingsContext';
import { inputRow, type PlayState } from '@/game/reducer';
import styles from './SingleBoard.module.css';

interface SingleBoardProps {
  state: PlayState;
  revealFrom: number;
}

export function SingleBoard({ state, revealFrom }: SingleBoardProps) {
  const t = useT();
  const slot = state.board.slots[0];
  if (!slot) return null;

  const { guesses, status } = state.game;
  const emptyRow = slot.cellKeys.map(() => '');
  const remaining = state.maxAttempts - guesses.length - (status === 'in-progress' ? 1 : 0);

  return (
    <div className={styles.board} aria-label={t('game.board')} role="group">
      {guesses.map((guess, i) => (
        <GuessRow
          key={i}
          letters={[...guess.letters]}
          states={guess.states}
          segments={slot.segments}
          reveal={i >= revealFrom}
          label={t('game.guessN', { n: i + 1 })}
        />
      ))}
      {status === 'in-progress' && (
        <GuessRow
          letters={inputRow(state, slot)}
          segments={slot.segments}
          active
          shakeKey={state.notice?.seq}
          label={t('game.guessN', { n: guesses.length + 1 })}
        />
      )}
      {Array.from({ length: Math.max(0, remaining) }, (_, i) => (
        <GuessRow
          key={`empty-${i}`}
          letters={emptyRow}
          segments={slot.segments}
          label={t('game.guessN', { n: guesses.length + 2 + i })}
        />
      ))}
    </div>
  );
}
