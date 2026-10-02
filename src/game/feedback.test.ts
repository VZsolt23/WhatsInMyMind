import { betterState, evaluateGuess } from './feedback';

const short = (states: string[]) => states.map((s) => s[0]).join('');

describe('evaluateGuess', () => {
  it('marks an exact match as all correct', () => {
    expect(short(evaluateGuess('APPLE', 'APPLE'))).toBe('ccccc');
  });

  it('marks letters not in the answer as absent', () => {
    expect(short(evaluateGuess('BUDDY', 'APPLE'))).toBe('aaaaa');
  });

  it('handles repeated letters in two passes (APPLE / PAPAL)', () => {
    expect(evaluateGuess('PAPAL', 'APPLE')).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'present',
    ]);
  });

  it('does not mark a letter present more times than it occurs', () => {
    // Only one E in the answer, and it is already matched exactly.
    // THREE has two Es; one is matched exactly, so only one guess E can be present.
    expect(short(evaluateGuess('EERIE', 'THREE'))).toBe('pacac');
  });

  it('lets exact matches consume letters before earlier positions', () => {
    // HELLO has two Ls, both matched exactly, so the leading L is absent.
    expect(short(evaluateGuess('LOLLY', 'HELLO'))).toBe('apcca');
  });

  it('marks repeated letters present while copies remain', () => {
    expect(short(evaluateGuess('LLAMA', 'HELLO'))).toBe('ppaaa');
  });

  it('throws when lengths differ', () => {
    expect(() => evaluateGuess('ABC', 'ABCD')).toThrow();
  });
});

describe('betterState', () => {
  it('keeps the strongest known state', () => {
    expect(betterState(undefined, 'absent')).toBe('absent');
    expect(betterState('absent', 'present')).toBe('present');
    expect(betterState('correct', 'present')).toBe('correct');
    expect(betterState('present', 'absent')).toBe('present');
  });
});
