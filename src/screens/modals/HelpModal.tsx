import { GuessRow } from '@/components/GuessRow';
import { Modal } from '@/components/Modal';
import { useT } from '@/features/settings/settingsContext';
import styles from './modals.module.css';

export function HelpModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <Modal title={t('help.title')} onClose={onClose}>
      <div className={styles.stack}>
        <p>{t('help.intro')}</p>
        <p>{t('help.single')}</p>
        <p>{t('help.grid')}</p>
        <p>{t('help.colors')}</p>
        <div className={styles.example}>
          <GuessRow
            letters={['M', 'I', 'N', 'D', 'S']}
            states={['correct', 'absent', 'absent', 'absent', 'absent']}
            label="M"
          />
          <p>
            <strong>M</strong> – {t('help.correct')}
          </p>
          <GuessRow
            letters={['T', 'H', 'I', 'N', 'K']}
            states={['absent', 'absent', 'present', 'absent', 'absent']}
            label="I"
          />
          <p>
            <strong>I</strong> – {t('help.present')}
          </p>
          <GuessRow
            letters={['W', 'O', 'R', 'D', 'S']}
            states={['absent', 'absent', 'absent', 'absent', 'absent']}
            label="W"
          />
          <p>
            <strong>W O R D S</strong> – {t('help.absent')}
          </p>
        </div>
        <p>{t('help.limit')}</p>
      </div>
    </Modal>
  );
}
