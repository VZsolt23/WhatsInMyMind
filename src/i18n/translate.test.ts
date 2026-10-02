import { createTranslator } from './translate';

describe('createTranslator', () => {
  const t = createTranslator('en');

  it('returns plain messages', () => {
    expect(t('app.title')).toBe('WhatsInMyMind');
  });

  it('interpolates parameters and leaves unknown placeholders', () => {
    expect(t('game.attempts', { used: 2, max: 6 })).toBe('Guesses: 2/6');
    expect(t('game.attempts', { used: 2 })).toBe('Guesses: 2/{max}');
  });
});
