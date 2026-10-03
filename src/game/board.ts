import type { Direction, Puzzle } from '@/puzzles/schema';

export interface Cell {
  key: string;
  row: number;
  col: number;
  letter: string;
  slotIds: string[];
}

/** A word position on the board: a single answer is one slot, a grid has one per word. */
export interface Slot {
  id: string;
  dir: Direction;
  answer: string;
  cellKeys: string[];
  clue?: string;
  /** Word lengths for phrases (e.g. DAD BOD → [3, 3]); a single word is [length]. */
  segments: number[];
}

export interface Board {
  rows: number;
  cols: number;
  cells: Map<string, Cell>;
  slots: Slot[];
}

export const SINGLE_SLOT_ID = 'main';

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function slotPositions(word: {
  row: number;
  col: number;
  dir: Direction;
  answer: string;
}): { row: number; col: number }[] {
  return [...word.answer].map((_, i) =>
    word.dir === 'across'
      ? { row: word.row, col: word.col + i }
      : { row: word.row + i, col: word.col },
  );
}

/** Builds the board of an already validated puzzle. */
export function buildBoard(puzzle: Puzzle): Board {
  const cells = new Map<string, Cell>();

  if (puzzle.type === 'single') {
    const parts = puzzle.answer.split(' ');
    const answer = parts.join('');
    const cellKeys = [...answer].map((letter, col) => {
      const key = cellKey(0, col);
      cells.set(key, { key, row: 0, col, letter, slotIds: [SINGLE_SLOT_ID] });
      return key;
    });
    return {
      rows: 1,
      cols: answer.length,
      cells,
      slots: [
        {
          id: SINGLE_SLOT_ID,
          dir: 'across',
          answer,
          cellKeys,
          segments: parts.map((p) => p.length),
        },
      ],
    };
  }

  const slots: Slot[] = puzzle.words.map((word) => {
    const cellKeys = slotPositions(word).map(({ row, col }, i) => {
      const key = cellKey(row, col);
      const letter = word.answer[i] as string;
      const existing = cells.get(key);
      if (existing) {
        if (existing.letter !== letter) {
          throw new Error(`Puzzle ${puzzle.id}: letter conflict at ${key}`);
        }
        existing.slotIds.push(word.id);
      } else {
        cells.set(key, { key, row, col, letter, slotIds: [word.id] });
      }
      return key;
    });
    const slot: Slot = {
      id: word.id,
      dir: word.dir,
      answer: word.answer,
      cellKeys,
      segments: [word.answer.length],
    };
    if (word.clue) slot.clue = word.clue;
    return slot;
  });

  return { rows: puzzle.rows, cols: puzzle.cols, cells, slots };
}

/** Crossword numbering: start cells numbered in reading order; across and down share a number. */
export function numberSlots(board: Board): {
  bySlot: Map<string, number>;
  byCell: Map<string, number>;
} {
  const starts = [...new Set(board.slots.map((s) => s.cellKeys[0] as string))].sort((a, b) => {
    const ca = board.cells.get(a) as Cell;
    const cb = board.cells.get(b) as Cell;
    return ca.row - cb.row || ca.col - cb.col;
  });
  const byCell = new Map(starts.map((key, i) => [key, i + 1]));
  const bySlot = new Map(board.slots.map((s) => [s.id, byCell.get(s.cellKeys[0] as string) ?? 0]));
  return { bySlot, byCell };
}

/** Slots sorted by clue number, across before down for a shared number. */
export function slotsInCrosswordOrder(board: Board): Slot[] {
  const { bySlot } = numberSlots(board);
  const rank = (slot: Slot) => (bySlot.get(slot.id) ?? 0) * 2 + (slot.dir === 'across' ? 0 : 1);
  return [...board.slots].sort((a, b) => rank(a) - rank(b));
}

export function getSlot(board: Board, slotId: string): Slot | undefined {
  return board.slots.find((s) => s.id === slotId);
}
