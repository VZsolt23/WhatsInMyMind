import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createTranslator } from '@/i18n/translate';
import styles from './ErrorBoundary.module.css';

interface State {
  failed: boolean;
}

/** Last line of defence; uses a fixed English translator because context may be broken. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WhatsInMyMind crashed', error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    const t = createTranslator('en');
    return (
      <div className={styles.error} role="alert">
        <h1>{t('error.title')}</h1>
        <p>{t('error.body')}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </button>
      </div>
    );
  }
}
