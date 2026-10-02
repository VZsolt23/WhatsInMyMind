import { Modal } from '@/components/Modal';
import { ACHIEVEMENTS } from '@/features/achievements/achievements';
import { useProgress } from '@/features/progress/progressContext';
import { useSettings } from '@/features/settings/settingsContext';
import type { MessageKey } from '@/i18n/en';
import styles from './modals.module.css';

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const { t, settings } = useSettings();
  const { achievements } = useProgress();
  const unlockedCount = ACHIEVEMENTS.filter((a) => achievements.unlocked[a.id]).length;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(settings.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Modal title={t('achievements.title')} onClose={onClose}>
      <p className={styles.muted}>
        {t('achievements.progress', { n: unlockedCount, total: ACHIEVEMENTS.length })}
      </p>
      <ul className={styles.achievements}>
        {ACHIEVEMENTS.map(({ id, icon }) => {
          const unlock = achievements.unlocked[id];
          return (
            <li key={id} className={styles.achievement} data-unlocked={unlock ? true : undefined}>
              <span className={styles.achievementIcon} aria-hidden="true">
                {icon}
              </span>
              <span className={styles.achievementText}>
                <strong>{t(`achievement.${id}.name` as MessageKey)}</strong>
                <span>{t(`achievement.${id}.desc` as MessageKey)}</span>
                <span className={styles.achievementStatus}>
                  {unlock
                    ? t('achievements.unlockedOn', { date: formatDate(unlock.at) })
                    : t('achievements.locked')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
