import { Fragment, type CSSProperties } from 'react';
import { useT } from '@/features/settings/settingsContext';
import type { LetterState } from '@/game/feedback';
import styles from './GuessRow.module.css';

interface GuessRowProps {
  /** One entry per position; '' for an empty tile. */
  letters: readonly string[];
  states?: readonly LetterState[];
  /** Word lengths of a phrase, rendered with a gap between words. */
  segments?: readonly number[];
  /** Positions that are pre-filled from crossing words. */
  locked?: ReadonlySet<number>;
  /** Flip the tiles in on mount (newly submitted guess). */
  reveal?: boolean;
  /** Changing this value replays the shake animation. */
  shakeKey?: number;
  active?: boolean;
  label: string;
}

export function GuessRow({
  letters,
  states,
  segments,
  locked,
  reveal = false,
  shakeKey,
  active = false,
  label,
}: GuessRowProps) {
  const t = useT();
  const breaks = new Set<number>();
  let offset = 0;
  for (const length of segments?.slice(0, -1) ?? []) {
    offset += length;
    breaks.add(offset);
  }

  const description = letters
    .map((letter, i) => {
      const state = states?.[i];
      if (!letter) return t('tile.empty');
      return state ? t(`tile.${state}`, { letter }) : letter;
    })
    .join(', ');

  return (
    <div
      key={shakeKey}
      className={[styles.row, shakeKey ? styles.shake : '', active ? styles.active : ''].join(' ')}
      role="group"
      aria-label={`${label}: ${description}`}
      style={{ '--count': letters.length + breaks.size * 0.35 } as CSSProperties}
    >
      {letters.map((letter, i) => {
        const state = states?.[i];
        return (
          <Fragment key={i}>
            {breaks.has(i) && <span className={styles.gap} aria-hidden="true" />}
            <span
              className={styles.tile}
              data-state={state ?? (letter ? 'filled' : 'empty')}
              data-locked={locked?.has(i) || undefined}
              data-reveal={reveal || undefined}
              style={{ '--i': i } as CSSProperties}
              aria-hidden="true"
            >
              {letter}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
