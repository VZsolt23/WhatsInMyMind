import type { Locale } from '@/storage/schemas';

export interface AlphabetConfig {
  letters: ReadonlySet<string>;
  keyboardRows: readonly (readonly string[])[];
}

const EN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const ALPHABETS: Record<Locale, AlphabetConfig> = {
  en: {
    letters: new Set(EN_LETTERS),
    keyboardRows: [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ],
  },
};

/** Maps a raw key to an alphabet letter, or null if it is not one. */
export function normalizeLetter(key: string, alphabet: AlphabetConfig): string | null {
  if ([...key].length !== 1) return null;
  const upper = key.toLocaleUpperCase('en');
  return alphabet.letters.has(upper) ? upper : null;
}
