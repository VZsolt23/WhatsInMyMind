import { ALPHABETS } from '@/i18n/alphabet';
import type { GridPuzzle, SinglePuzzle } from '@/puzzles/schema';
import { createPlayState, inputRow, playReducer, type PlayAction, type PlayState } from './reducer';

const LETTERS = ALPHABETS.en.letters;
const NOW = new Date(2026, 9, 2, 1, 30);
const DAY = '2026-10-02';

const single: SinglePuzzle = { id: 's1', type: 'single', category: 'Fruit', answer: 'APPLE' };

// C A T
// A . .
// R . .      w1 CAT across, w2 CAR down, w3 TOE down from T
const grid: GridPuzzle = {
  id: 'g1',
  type: 'grid',
  category: 'Things',
  rows: 3,
  cols: 3,
  words: [
    { id: 'w1', answer: 'CAT', row: 0, col: 0, dir: 'across' },
    { id: 'w2', answer: 'CAR', row: 0, col: 0, dir: 'down' },
    { id: 'w3', answer: 'TOE', row: 0, col: 2, dir: 'down' },
  ],
};

function run(state: PlayState, ...actions: PlayAction[]): PlayState {
  return actions.reduce(playReducer, state);
}

function typeWord(state: PlayState, word: string): PlayState {
  return run(state, ...[...word].map((letter): PlayAction => ({ type: 'type', letter })));
}

function guess(state: PlayState, word: string): PlayState {
  return run(typeWord(state, word), { type: 'submit', now: NOW });
}

describe('single puzzle', () => {
  const start = () => createPlayState(single, DAY, null, LETTERS);

  it('starts with the only slot selected and 6 attempts', () => {
    const s = start();
    expect(s.selectedSlotId).toBe('main');
    expect(s.maxAttempts).toBe(6);
    expect(s.game.status).toBe('in-progress');
  });

  it('ignores letters beyond the word length and outside the alphabet', () => {
    const s = typeWord(start(), 'APPLES1é');
    expect(s.typed).toBe('APPLE');
  });

  it('supports backspace', () => {
    const s = run(typeWord(start(), 'APP'), { type: 'backspace' });
    expect(s.typed).toBe('AP');
  });

  it('rejects an incomplete guess without using an attempt', () => {
    const s = run(typeWord(start(), 'APP'), { type: 'submit', now: NOW });
    expect(s.game.guesses).toHaveLength(0);
    expect(s.notice?.id).toBe('notEnoughLetters');
  });

  it('does not pre-fill correct letters in single mode', () => {
    const s = guess(start(), 'ANGLE');
    expect(inputRow(s, s.board.slots[0]!)).toEqual(['', '', '', '', '']);
  });

  it('wins on the correct guess and records completion time', () => {
    const s = guess(guess(start(), 'ANGLE'), 'APPLE');
    expect(s.game.status).toBe('won');
    expect(s.game.guesses).toHaveLength(2);
    expect(s.game.completedHour).toBe(1);
    expect(s.game.completedAt).toBe(NOW.toISOString());
    expect(s.selectedSlotId).toBeNull();
  });

  it('loses after the last attempt', () => {
    let s = start();
    for (let i = 0; i < 6; i++) s = guess(s, 'ANGLE');
    expect(s.game.status).toBe('lost');
    expect(guess(s, 'APPLE').game.guesses).toHaveLength(6);
  });

  it('ignores word stepping in single mode', () => {
    const s = start();
    expect(run(s, { type: 'selectAdjacent', step: 1 })).toBe(s);
  });

  it('ignores input after the game is over', () => {
    const won = guess(start(), 'APPLE');
    expect(typeWord(won, 'A')).toBe(won);
  });

  it('resumes from a saved game of the same day', () => {
    const played = guess(start(), 'ANGLE');
    const resumed = createPlayState(single, DAY, played.game, LETTERS);
    expect(resumed.game.guesses).toHaveLength(1);
  });

  it('syncs a game from another tab only when it is further along', () => {
    const mine = guess(start(), 'ANGLE');
    const other = guess(guess(start(), 'ANGLE'), 'APPLE');
    expect(run(mine, { type: 'sync', game: other.game }).game.status).toBe('won');
    expect(run(other, { type: 'sync', game: mine.game })).toBe(other);
    const otherDay = { ...other.game, day: '2026-10-03' };
    expect(run(mine, { type: 'sync', game: otherDay })).toBe(mine);
  });

  it('starts fresh when the saved game is for another day or puzzle', () => {
    const played = guess(start(), 'ANGLE');
    expect(createPlayState(single, '2026-10-03', played.game, LETTERS).game.guesses).toHaveLength(
      0,
    );
    const other = { ...single, id: 's2' };
    expect(createPlayState(other, DAY, played.game, LETTERS).game.guesses).toHaveLength(0);
  });
});

describe('grid puzzle', () => {
  const start = () => createPlayState(grid, DAY, null, LETTERS);

  it('selects the first word and allows switching', () => {
    const s = start();
    expect(s.selectedSlotId).toBe('w1');
    expect(run(s, { type: 'select', slotId: 'w3' }).selectedSlotId).toBe('w3');
  });

  it('steps to the next and previous word in crossword order, wrapping around', () => {
    // Numbering: 1 = CAT across / CAR down (w1, w2), 2 = TOE down (w3).
    const s = start();
    expect(run(s, { type: 'selectAdjacent', step: 1 }).selectedSlotId).toBe('w2');
    expect(
      run(s, { type: 'selectAdjacent', step: 1 }, { type: 'selectAdjacent', step: 1 })
        .selectedSlotId,
    ).toBe('w3');
    expect(run(s, { type: 'selectAdjacent', step: -1 }).selectedSlotId).toBe('w3');
  });

  it('skips solved words when stepping', () => {
    const s = guess(start(), 'CAT'); // w1 solved, w2 selected
    expect(run(s, { type: 'selectAdjacent', step: 1 }).selectedSlotId).toBe('w3');
    expect(
      run(s, { type: 'selectAdjacent', step: 1 }, { type: 'selectAdjacent', step: 1 })
        .selectedSlotId,
    ).toBe('w2');
  });

  it('clears typed letters when switching words', () => {
    const s = run(typeWord(start(), 'CA'), { type: 'select', slotId: 'w2' });
    expect(s.typed).toBe('');
  });

  it('locks correct letters and shares them with crossing words', () => {
    // CUT on CAT: C and T are correct → shared with CAR (0,0) and TOE (0,2).
    const s = guess(start(), 'CUT');
    expect(s.progress.lockedCells).toEqual(new Set(['0,0', '0,2']));
    const selected = run(s, { type: 'select', slotId: 'w2' });
    expect(inputRow(selected, selected.board.slots[1]!)).toEqual(['C', '', '']);
  });

  it('only needs the open letters typed for a word with locked cells', () => {
    let s = run(guess(start(), 'CUT'), { type: 'select', slotId: 'w2' });
    s = typeWord(s, 'ARX');
    expect(s.typed).toBe('AR');
    s = run(s, { type: 'submit', now: NOW });
    expect(s.progress.solvedSlots.has('w2')).toBe(true);
    expect(s.game.guesses.at(-1)?.letters).toBe('CAR');
  });

  it('moves to the next unsolved word after solving one', () => {
    const s = guess(start(), 'CAT');
    expect(s.progress.solvedSlots).toEqual(new Set(['w1']));
    expect(s.selectedSlotId).toBe('w2');
  });

  it('cannot select a solved word', () => {
    const s = guess(start(), 'CAT');
    expect(run(s, { type: 'select', slotId: 'w1' }).selectedSlotId).toBe('w2');
  });

  it('wins when every word is solved, with attempts shared across words', () => {
    let s = guess(start(), 'CAT'); // locks C, A, T; C is shared with CAR, T with TOE
    s = guess(s, 'AR'); // CAR needs only A and R
    expect(s.selectedSlotId).toBe('w3');
    s = guess(s, 'OE');
    expect(s.game.status).toBe('won');
    expect(s.game.guesses).toHaveLength(3);
  });

  it('loses when shared attempts run out', () => {
    let s = start();
    for (let i = 0; i < s.maxAttempts; i++) s = guess(s, 'XYZ');
    expect(s.game.status).toBe('lost');
  });
});
