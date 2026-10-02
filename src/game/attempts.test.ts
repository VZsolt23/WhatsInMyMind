import type { GridPuzzle, GridWord, SinglePuzzle } from '@/puzzles/schema';
import { getMaxAttempts } from './attempts';

const single = (answer: string, maxAttempts?: number): SinglePuzzle => ({
  id: 't',
  type: 'single',
  category: 'c',
  answer,
  ...(maxAttempts ? { maxAttempts } : {}),
});

const grid = (lengths: number[]): GridPuzzle => ({
  id: 'g',
  type: 'grid',
  category: 'c',
  rows: 9,
  cols: 9,
  words: lengths.map((n, i): GridWord => ({
    id: `w${i}`,
    answer: 'A'.repeat(n),
    row: i * 2,
    col: 0,
    dir: 'across',
  })),
});

describe('getMaxAttempts', () => {
  it.each([
    ['APPLE', 6],
    ['BANANA', 6],
    ['DAD BOD', 6],
    ['ORCHARD', 7],
    ['PINEAPPLE', 7],
    ['WATERMELON', 8],
    ['ICE CREAM TRUCK', 8],
  ])('single %s → %i', (answer, expected) => {
    expect(getMaxAttempts(single(answer))).toBe(expected);
  });

  it('respects an explicit override', () => {
    expect(getMaxAttempts(single('APPLE', 4))).toBe(4);
  });

  it.each([
    [[3, 4, 5], 6],
    [[3, 4, 5, 6], 7],
    [[3, 4, 5, 6, 7], 8],
    [[3, 4, 5, 6, 8], 9],
    [[8, 3, 3], 7],
  ])('grid %j → %i', (lengths, expected) => {
    expect(getMaxAttempts(grid(lengths))).toBe(expected);
  });
});
