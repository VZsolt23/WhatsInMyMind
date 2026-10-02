const PATHS = {
  help: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-6.5v.5m0-3.5c0-2 2.5-2 2.5-4a2.5 2.5 0 0 0-5 0',
  stats: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  trophy:
    'M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm10 2h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.4a7.5 7.5 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  close: 'M6 6l12 12M18 6 6 18',
  backspace: 'M9 5h11v14H9l-6-7 6-7Zm3 4 5 6m0-6-5 6',
  share: 'M12 3v12m0-12-4 4m4-4 4 4M5 13v6h14v-6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
