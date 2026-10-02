import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ShowToast } from './toastContext';
import styles from './Toast.module.css';

interface ToastItem {
  id: number;
  message: string;
  icon?: string;
  duration: number;
}

const DEFAULT_DURATION = 1800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const show = useCallback<ShowToast>((message, options = {}) => {
    const id = nextId.current++;
    const duration = options.duration ?? DEFAULT_DURATION;
    setToasts((list) => [
      ...list.slice(-2),
      { id, message, duration, ...(options.icon ? { icon: options.icon } : {}) },
    ]);
    const timer = window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, duration);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            {toast.icon && (
              <span className={styles.icon} aria-hidden="true">
                {toast.icon}
              </span>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
