import en from './en.json';
import type { GridPuzzle, GridWord } from './schema';
import { checkGridLayout, validatePuzzleList } from './validate';

const word = (
  id: string,
  answer: string,
  row: number,
  col: number,
  dir: 'across' | 'down',
): GridWord => ({
  id,
  answer,
  row,
  col,
  dir,
});

// H A M M E R
// . W . A . A
// . L . L . S
// . . . L . P
// . . . E . .
// . . . T . .
const valid: GridPuzzle = {
  id: 'g',
  type: 'grid',
  category: 'Tools',
  rows: 6,
  cols: 6,
  words: [
    word('w1', 'HAMMER', 0, 0, 'across'),
    word('w2', 'AWL', 0, 1, 'down'),
    word('w3', 'MALLET', 0, 3, 'down'),
    word('w4', 'RASP', 0, 5, 'down'),
  ],
};

const withWords = (words: GridWord[], extra: Partial<GridPuzzle> = {}): GridPuzzle => ({
  ...valid,
  ...extra,
  words,
});

describe('checkGridLayout', () => {
  it('accepts a valid crossword', () => {
    expect(checkGridLayout(valid)).toEqual([]);
  });

  it('rejects a word outside the grid', () => {
    const words = [...valid.words.slice(0, 3), word('w4', 'RASPY', 2, 5, 'down')];
    expect(checkGridLayout(withWords(words)).join()).toMatch(/outside the grid/);
  });

  it('rejects conflicting letters at an intersection', () => {
    const words = [...valid.words.slice(0, 3), word('w4', 'BASP', 0, 5, 'down')];
    expect(checkGridLayout(withWords(words)).join()).toMatch(/letter conflict/);
  });

  it('rejects parallel neighbours that form accidental words', () => {
    // AWL (col 1) next to a new down word in col 2 makes "WX" / "LY" runs across.
    const words = [...valid.words, word('w5', 'MXY', 0, 2, 'down')];
    expect(checkGridLayout(withWords(words)).join()).toMatch(/do not form exactly one word/);
  });

  it('rejects a word that runs into another word', () => {
    // RAS ends right above P of an across word → the down run is RASP, not RAS.
    const words = [
      word('w1', 'HAMMER', 0, 0, 'across'),
      word('w2', 'AWL', 0, 1, 'down'),
      word('w3', 'MALLET', 0, 3, 'down'),
      word('w4', 'RAS', 0, 5, 'down'),
      word('w5', 'LAP', 3, 3, 'across'),
    ];
    expect(checkGridLayout(withWords(words)).length).toBeGreaterThan(0);
  });

  it('rejects disconnected words', () => {
    const words = [
      word('w1', 'CAT', 0, 0, 'across'),
      word('w2', 'CAR', 0, 0, 'down'),
      word('w3', 'DOG', 4, 2, 'across'),
    ];
    expect(checkGridLayout(withWords(words)).join()).toMatch(/not all words are connected/);
  });

  it('enforces word count, word length and grid size', () => {
    const tooFew = withWords([word('w1', 'CAT', 0, 0, 'across'), word('w2', 'CAR', 0, 0, 'down')]);
    expect(checkGridLayout(tooFew).join()).toMatch(/3-5 words/);
    expect(checkGridLayout({ ...valid, rows: 4 }).join()).toMatch(/grid must be/);
    const longWord = [...valid.words.slice(1), word('w1', 'HAMMERHEAD', 0, 0, 'across')];
    expect(checkGridLayout(withWords(longWord, { cols: 9 })).join()).toMatch(/3-8 letters/);
  });

  it('rejects duplicate word ids', () => {
    const words = [...valid.words.slice(0, 3), word('w1', 'RASP', 0, 5, 'down')];
    expect(checkGridLayout(withWords(words)).join()).toMatch(/duplicate word id/);
  });
});

describe('validatePuzzleList', () => {
  const single = (id: string, answer: string) => ({ id, type: 'single', category: 'c', answer });

  it('rejects a non-array file', () => {
    expect(validatePuzzleList({}).errors).toEqual(['puzzle file must be an array']);
  });

  it('returns only valid puzzles and reports the rest', () => {
    const { puzzles, errors } = validatePuzzleList([
      single('a', 'APPLE'),
      single('b', 'apple'),
      single('c', 'FIG'),
      { id: 'd', type: 'riddle', category: 'c' },
    ]);
    expect(puzzles.map((p) => p.id)).toEqual(['a']);
    expect(errors).toHaveLength(3);
  });

  it('rejects duplicate ids and duplicate answers', () => {
    const { errors } = validatePuzzleList([
      single('a', 'APPLE'),
      single('a', 'MANGO'),
      single('c', 'APPLE'),
    ]);
    expect(errors.join()).toMatch(/duplicate id/);
    expect(errors.join()).toMatch(/same answer as a/);
  });

  it('accepts phrases and rejects double spaces', () => {
    expect(validatePuzzleList([single('a', 'DAD BOD')]).errors).toEqual([]);
    expect(validatePuzzleList([single('a', 'DAD  BOD')]).errors).toHaveLength(1);
  });

  it('enforces a minimum count', () => {
    expect(validatePuzzleList([single('a', 'APPLE')], { minCount: 2 }).errors.join()).toMatch(
      /at least 2/,
    );
  });

  it('accepts the shipped English puzzles', () => {
    expect(validatePuzzleList(en).errors).toEqual([]);
  });
});
