import type { ThemeSetting } from '@/storage/schemas';

export type Theme = Exclude<ThemeSetting, 'system'>;

export function resolveTheme(setting: ThemeSetting, prefersDark: boolean): Theme {
  if (setting !== 'system') return setting;
  return prefersDark ? 'dark' : 'light';
}

/** Mirrors the inline script in index.html, which applies the theme before first paint. */
export function applyTheme(setting: ThemeSetting): void {
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', resolveTheme(setting, prefersDark));
}
