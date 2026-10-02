import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { useT } from '@/features/settings/settingsContext';
import type { MessageKey } from '@/i18n/en';
import styles from './Header.module.css';

export type ModalId = 'help' | 'stats' | 'achievements' | 'settings';

const LEFT: { id: ModalId; icon: IconName; label: MessageKey }[] = [
  { id: 'help', icon: 'help', label: 'header.help' },
];
const RIGHT: { id: ModalId; icon: IconName; label: MessageKey }[] = [
  { id: 'stats', icon: 'stats', label: 'header.stats' },
  { id: 'achievements', icon: 'trophy', label: 'header.achievements' },
  { id: 'settings', icon: 'settings', label: 'header.settings' },
];

export function Header({ onOpen }: { onOpen: (id: ModalId) => void }) {
  const t = useT();
  const renderButtons = (items: typeof LEFT) =>
    items.map(({ id, icon, label }) => (
      <Button
        key={id}
        variant="icon"
        onClick={() => onOpen(id)}
        aria-label={t(label)}
        title={t(label)}
      >
        <Icon name={icon} />
      </Button>
    ));

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.side} aria-label={t('header.help')}>
          {renderButtons(LEFT)}
        </nav>
        <h1 className={styles.title}>
          <span className={styles.logo} aria-hidden="true">
            ?
          </span>
          {t('app.title')}
        </h1>
        <nav className={`${styles.side} ${styles.right}`} aria-label={t('header.settings')}>
          {renderButtons(RIGHT)}
        </nav>
      </div>
    </header>
  );
}
