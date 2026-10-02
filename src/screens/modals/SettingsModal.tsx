import { useId } from 'react';
import { Modal } from '@/components/Modal';
import { useProgress } from '@/features/progress/progressContext';
import { useSettings } from '@/features/settings/settingsContext';
import { THEME_SETTINGS, type ThemeSetting } from '@/storage/schemas';
import styles from './modals.module.css';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { t, settings, updateSettings } = useSettings();
  const { recordThemeChange } = useProgress();
  const motionId = useId();

  const chooseTheme = (theme: ThemeSetting) => {
    updateSettings({ theme });
    recordThemeChange(theme);
  };

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      <div className={styles.stack}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.subTitle}>{t('settings.theme')}</legend>
          <div className={styles.themeOptions}>
            {THEME_SETTINGS.map((theme) => (
              <label
                key={theme}
                className={styles.themeOption}
                data-checked={settings.theme === theme || undefined}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={() => chooseTheme(theme)}
                />
                <span className={styles.swatch} data-swatch={theme} aria-hidden="true" />
                {t(`settings.theme.${theme}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.toggleRow}>
          <label htmlFor={motionId}>{t('settings.reducedMotion')}</label>
          <input
            id={motionId}
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
          />
        </div>
      </div>
    </Modal>
  );
}
