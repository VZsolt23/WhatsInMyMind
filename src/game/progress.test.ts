import { buildBoard } from './board';
import { countMisses, deriveKeyStates, deriveProgress, type Guess } from './progress';

const board = buildBoard({
  id: 'g',
  type: 'grid',
  category: 'c',
  rows: 3,
  cols: 3,
  words: [
    { id: 'w1', answer: 'CAT', row: 0, col: 0, dir: 'across' },
    { id: 'w2', answer: 'CAR', row: 0, col: 0, dir: 'down' },
  ],
});

const g = (slotId: string, letters: string, states: string): Guess => ({
  slotId,
  letters,
  states: [...states].map((c) => (c === 'c' ? 'correct' : c === 'p' ? 'present' : 'absent')),
});

describe('deriveProgress', () => {
  it('starts empty', () => {
    const p = deriveProgress(board, []);
    expect(p.lockedCells.size).toBe(0);
    expect(p.solved).toBe(false);
  });

  it('solves a crossing word through locked cells from other words', () => {
    const p = deriveProgress(board, [g('w1', 'CAT', 'ccc'), g('w2', 'CAR', 'ccc')]);
    expect(p.solvedSlots).toEqual(new Set(['w1', 'w2']));
    expect(p.solved).toBe(true);
  });

  it('groups guesses by slot and ignores unknown slots', () => {
    const p = deriveProgress(board, [g('w1', 'COT', 'cac'), g('zz', 'ABC', 'ccc')]);
    expect(p.guessesBySlot.get('w1')).toHaveLength(1);
    expect(p.guessesBySlot.has('zz')).toBe(false);
    expect(p.lockedCells).toEqual(new Set(['0,0', '0,2']));
  });
});

describe('countMisses', () => {
  it('counts guesses that are not fully correct', () => {
    expect(countMisses([])).toBe(0);
    expect(countMisses([g('w1', 'CAT', 'ccc'), g('w1', 'COT', 'cac'), g('w2', 'XYZ', 'aaa')])).toBe(
      2,
    );
  });
});

describe('deriveKeyStates', () => {
  it('keeps the best state per letter', () => {
    const keys = deriveKeyStates([
      g('w1', 'TAC', 'pcp'),
      g('w1', 'CAT', 'ccc'),
      g('w1', 'XAX', 'aca'),
    ]);
    expect(keys.get('C')).toBe('correct');
    expect(keys.get('T')).toBe('correct');
    expect(keys.get('X')).toBe('absent');
  });
});
