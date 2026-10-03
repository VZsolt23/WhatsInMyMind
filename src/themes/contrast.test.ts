import css from './tokens.css?raw';

/**
 * WCAG contrast check of the design tokens in every theme. Normal text needs
 * 4.5:1; tile and key letters are large and bold, so 3:1 is enough there.
 */
function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Selector not found: ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start));
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[name as string] = value as string;
  }
  return tokens;
}

const base = tokensOf(":root,\n[data-theme='light']");
const themes: Record<string, Record<string, string>> = {
  light: base,
  dark: { ...base, ...tokensOf("[data-theme='dark']") },
  legacy: { ...base, ...tokensOf("[data-theme='legacy']") },
};

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [fg: string, bg: string, min: number][] = [
  ['--color-text', '--color-bg', 4.5],
  ['--color-text', '--color-surface', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-accent-text', '--color-accent', 4.5],
  ['--color-toast-text', '--color-toast-bg', 4.5],
  ['--color-key-text', '--color-key-bg', 4.5],
  ['--color-correct-text', '--color-correct', 3],
  ['--color-present-text', '--color-present', 3],
  ['--color-absent-text', '--color-absent', 3],
  ['--color-text', '--color-cell-selected', 4.5],
];

/** Retro: all text sits inside grey windows; the teal desktop never carries text. */
const EXEMPT: Record<string, string[]> = { legacy: ['--color-text|--color-bg'] };

describe.each(Object.entries(themes))('%s theme contrast', (theme, tokens) => {
  const pairs = PAIRS.filter(([fg, bg]) => !EXEMPT[theme]?.includes(`${fg}|${bg}`));
  it.each(pairs)('%s on %s ≥ %d:1', (fg, bg, min) => {
    const a = tokens[fg];
    const b = tokens[bg];
    expect(a, fg).toBeDefined();
    expect(b, bg).toBeDefined();
    expect(contrast(a as string, b as string)).toBeGreaterThanOrEqual(min);
  });
});
