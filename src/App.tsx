import { useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { useToast } from '@/components/toast/toastContext';
import { useCurrentDay } from '@/features/game/currentDay';
import { ProgressProvider } from '@/features/progress/ProgressProvider';
import { SettingsProvider } from '@/features/settings/SettingsProvider';
import { useSettings } from '@/features/settings/settingsContext';
import { storage } from '@/storage/storage';
import { Game } from '@/screens/game/Game';
import { Header, type ModalId } from '@/screens/Header';
import { AchievementsModal } from '@/screens/modals/AchievementsModal';
import { HelpModal } from '@/screens/modals/HelpModal';
import { SettingsModal } from '@/screens/modals/SettingsModal';
import { StatsModal } from '@/screens/modals/StatsModal';
import styles from './App.module.css';

function Shell() {
  const { t, settings, updateSettings } = useSettings();
  const toast = useToast();
  const { day, clockBehind } = useCurrentDay();
  const [modal, setModal] = useState<ModalId | null>(() => (settings.seenHelp ? null : 'help'));

  useEffect(() => {
    if (!settings.seenHelp) updateSettings({ seenHelp: true });
  }, [settings.seenHelp, updateSettings]);

  useEffect(() => {
    if (!storage.persistent) toast(t('status.storageUnavailable'), { duration: 5000 });
  }, [t, toast]);

  const close = () => setModal(null);

  return (
    <>
      <Header onOpen={setModal} />
      {clockBehind && (
        <p className={styles.banner} role="status">
          {t('status.clockBehind')}
        </p>
      )}
      <main className={styles.main}>
        <Game day={day} inputEnabled={modal === null} />
      </main>
      {modal === 'help' && <HelpModal onClose={close} />}
      {modal === 'stats' && <StatsModal day={day} onClose={close} />}
      {modal === 'achievements' && <AchievementsModal onClose={close} />}
      {modal === 'settings' && <SettingsModal onClose={close} />}
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <ProgressProvider>
            <Shell />
          </ProgressProvider>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
