import { createContext, useContext } from 'react';

export interface ToastOptions {
  /** How long the toast stays visible, in ms. */
  duration?: number;
  icon?: string;
}

export type ShowToast = (message: string, options?: ToastOptions) => void;

export const ToastContext = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside ToastProvider');
  return show;
}
