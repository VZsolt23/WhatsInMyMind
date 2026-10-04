import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/toast/toastContext';
import { useT } from '@/features/settings/settingsContext';
import { numberSlots } from '@/game/board';
import { countMisses } from '@/game/progress';
import type { PlayState } from '@/game/reducer';
import { buildShareText } from '@/game/share';
import { msUntilNextDay } from '@/lib/dayKey';
import styles from './EndPanel.module.css';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
}

function Countdown() {
  const [remaining, setRemaining] = useState(() => msUntilNextDay());
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(msUntilNextDay()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className={styles.countdown}>{formatDuration(remaining)}</span>;
}

export function EndPanel({ state, number }: { state: PlayState; number: number }) {
  const t = useT();
  const toast = useToast();
  const { puzzle, board, game, maxAttempts, progress } = state;
  const won = game.status === 'won';
  const isGrid = puzzle.type === 'grid';
  const numbering = useMemo(() => numberSlots(board), [board]);

  const share = async () => {
    const text = buildShareText({
      puzzleNumber: number,
      board,
      game,
      progress,
      maxAttempts,
      isGrid,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast(t('end.copied'));
    } catch {
      toast(t('end.copyFailed'));
    }
  };

  return (
    <section className={styles.panel} aria-live="polite">
      <h2 className={styles.title}>{won ? t('end.won') : t('end.lost')}</h2>
      {won && (
        <p>
          {isGrid
            ? t('end.wonGrid', { n: countMisses(game.guesses), max: maxAttempts })
            : t('end.wonIn', { n: game.guesses.length, max: maxAttempts })}
        </p>
      )}

      <div className={styles.answers}>
        <p className={styles.label}>{isGrid ? t('end.answers') : t('end.answer')}</p>
        {puzzle.type === 'single' ? (
          <p className={styles.answer}>{puzzle.answer}</p>
        ) : (
          <ul className={styles.list}>
            {board.slots.map((slot) => (
              <li key={slot.id}>
                <span className={styles.wordLabel}>
                  {t('game.wordLabel', {
                    n: numbering.bySlot.get(slot.id) ?? 0,
                    dir: t(`dir.${slot.dir}`),
                  })}
                </span>{' '}
                <span className={styles.answer}>{slot.answer}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="primary" onClick={share}>
        <Icon name="share" size={18} />
        {t('end.share')}
      </Button>

      <p className={styles.next}>
        {t('end.next')} <Countdown />
      </p>
    </section>
  );
}
