import type { GridPuzzle } from '@/puzzles/schema';
import { buildBoard, cellKey, numberSlots, SINGLE_SLOT_ID } from './board';

describe('buildBoard (single)', () => {
  it('creates one slot without spaces and records phrase segments', () => {
    const board = buildBoard({ id: 's', type: 'single', category: 'c', answer: 'DAD BOD' });
    expect(board.rows).toBe(1);
    expect(board.cols).toBe(6);
    expect(board.slots).toHaveLength(1);
    expect(board.slots[0]).toMatchObject({
      id: SINGLE_SLOT_ID,
      answer: 'DADBOD',
      segments: [3, 3],
    });
    expect(board.cells.get(cellKey(0, 3))?.letter).toBe('B');
  });
});

describe('buildBoard (grid)', () => {
  const puzzle: GridPuzzle = {
    id: 'g',
    type: 'grid',
    category: 'c',
    rows: 5,
    cols: 5,
    words: [
      { id: 'w1', answer: 'CAT', row: 0, col: 0, dir: 'across' },
      { id: 'w2', answer: 'CAR', row: 0, col: 0, dir: 'down', clue: 'Vroom' },
    ],
  };

  it('shares intersecting cells between slots', () => {
    const board = buildBoard(puzzle);
    expect(board.cells.size).toBe(5);
    expect(board.cells.get(cellKey(0, 0))?.slotIds).toEqual(['w1', 'w2']);
    expect(board.slots[1]?.cellKeys).toEqual(['0,0', '1,0', '2,0']);
    expect(board.slots[1]?.clue).toBe('Vroom');
  });

  it('numbers start cells in reading order, sharing numbers', () => {
    const board = buildBoard({
      ...puzzle,
      words: [...puzzle.words, { id: 'w3', answer: 'TOE', row: 0, col: 2, dir: 'down' }],
    });
    const { bySlot, byCell } = numberSlots(board);
    expect(Object.fromEntries(bySlot)).toEqual({ w1: 1, w2: 1, w3: 2 });
    expect(byCell.get('0,2')).toBe(2);
  });

  it('throws on conflicting letters', () => {
    const broken: GridPuzzle = {
      ...puzzle,
      words: [puzzle.words[0]!, { id: 'w2', answer: 'BAR', row: 0, col: 0, dir: 'down' }],
    };
    expect(() => buildBoard(broken)).toThrow(/conflict/);
  });
});
