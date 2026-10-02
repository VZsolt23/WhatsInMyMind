import type { CSSProperties } from 'react';
import { Modal } from '@/components/Modal';
import { loadGame } from '@/features/game/gamesStore';
import { useProgress } from '@/features/progress/progressContext';
import { useT } from '@/features/settings/settingsContext';
import { displayStreak } from '@/features/streak/stats';
import type { DayKey } from '@/lib/dayKey';
import { storage } from '@/storage/storage';
import styles from './modals.module.css';

const MIN_BARS = 6;

export function StatsModal({ day, onClose }: { day: DayKey; onClose: () => void }) {
  const t = useT();
  const { stats } = useProgress();
  const today = loadGame(storage, day);
  const highlight = today?.status === 'won' ? today.guesses.length - 1 : -1;

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const bars = Array.from(
    { length: Math.max(MIN_BARS, stats.guessDistribution.length) },
    (_, i) => stats.guessDistribution[i] ?? 0,
  );
  const maxBar = Math.max(1, ...bars);

  const tiles = [
    { label: t('stats.played'), value: stats.played },
    { label: t('stats.winRate'), value: winRate },
    { label: t('stats.currentStreak'), value: displayStreak(stats, day) },
    { label: t('stats.bestStreak'), value: stats.bestStreak },
  ];

  return (
    <Modal title={t('stats.title')} onClose={onClose}>
      {stats.played === 0 ? (
        <p>{t('stats.empty')}</p>
      ) : (
        <div className={styles.stack}>
          <dl className={styles.statTiles}>
            {tiles.map(({ label, value }) => (
              <div key={label} className={styles.statTile}>
                <dd className={styles.statValue}>{value}</dd>
                <dt className={styles.statLabel}>{label}</dt>
              </div>
            ))}
          </dl>

          <h3 className={styles.subTitle}>{t('stats.distribution')}</h3>
          <ol className={styles.bars}>
            {bars.map((count, i) => (
              <li key={i} className={styles.barRow}>
                <span className={styles.barLabel}>{i + 1}</span>
                <span
                  className={styles.bar}
                  data-highlight={i === highlight || undefined}
                  style={{ '--w': `${Math.max(8, (count / maxBar) * 100)}%` } as CSSProperties}
                >
                  {count}
                </span>
              </li>
            ))}
          </ol>

          {stats.gridPlayed > 0 && (
            <p className={styles.muted}>
              {t('stats.gridWins', { won: stats.gridWon, played: stats.gridPlayed })}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
