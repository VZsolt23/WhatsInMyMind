import { puzzleForDay, puzzleNumberFor } from './daily';
import type { Puzzle } from './schema';

const LAUNCH = '2026-10-01';
const puzzles: Puzzle[] = ['A', 'B', 'C'].map((id) => ({
  id,
  type: 'single',
  category: 'c',
  answer: 'APPLE',
}));

describe('puzzleNumberFor', () => {
  it('counts from 1 on launch day', () => {
    expect(puzzleNumberFor('2026-10-01', LAUNCH)).toBe(1);
    expect(puzzleNumberFor('2026-10-02', LAUNCH)).toBe(2);
    expect(puzzleNumberFor('2027-10-01', LAUNCH)).toBe(366);
  });

  it('maps days before launch to #1', () => {
    expect(puzzleNumberFor('2026-09-01', LAUNCH)).toBe(1);
  });
});

describe('puzzleForDay', () => {
  it('picks puzzles in order and wraps around', () => {
    expect(puzzleForDay(puzzles, '2026-10-01', LAUNCH).puzzle.id).toBe('A');
    expect(puzzleForDay(puzzles, '2026-10-03', LAUNCH).puzzle.id).toBe('C');
    expect(puzzleForDay(puzzles, '2026-10-04', LAUNCH)).toMatchObject({
      number: 4,
      puzzle: { id: 'A' },
    });
  });

  it('throws without puzzles', () => {
    expect(() => puzzleForDay([], '2026-10-01', LAUNCH)).toThrow();
  });
});
