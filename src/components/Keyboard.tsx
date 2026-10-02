import { useT } from '@/features/settings/settingsContext';
import type { LetterState } from '@/game/feedback';
import { Icon } from './Icon';
import styles from './Keyboard.module.css';

interface KeyboardProps {
  rows: readonly (readonly string[])[];
  keyStates: ReadonlyMap<string, LetterState>;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function Keyboard({
  rows,
  keyStates,
  onLetter,
  onEnter,
  onBackspace,
  disabled,
}: KeyboardProps) {
  const t = useT();
  return (
    <div className={styles.keyboard} role="group" aria-label={t('keyboard.label')}>
      {rows.map((row, r) => (
        <div key={r} className={styles.row}>
          {r === rows.length - 1 && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              onClick={onEnter}
              disabled={disabled}
            >
              {t('keyboard.enter')}
            </button>
          )}
          {row.map((letter) => {
            const state = keyStates.get(letter);
            return (
              <button
                key={letter}
                type="button"
                className={styles.key}
                data-state={state}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                aria-label={state ? t(`tile.${state}`, { letter }) : letter}
              >
                {letter}
              </button>
            );
          })}
          {r === rows.length - 1 && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              onClick={onBackspace}
              disabled={disabled}
              aria-label={t('keyboard.backspace')}
            >
              <Icon name="backspace" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
