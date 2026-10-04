import type { DayKey } from '@/lib/dayKey';
import type { Puzzle } from '@/puzzles/schema';
import { getMaxAttempts } from './attempts';
import { buildBoard, getSlot, slotsInCrosswordOrder, type Board, type Slot } from './board';
import { evaluateGuess } from './feedback';
import { countMisses, deriveProgress, type Guess, type Progress } from './progress';

export type GameStatus = 'in-progress' | 'won' | 'lost';

/** The persisted part of a day's game. Everything else is derived from it. */
export interface SavedGame {
  puzzleId: string;
  day: DayKey;
  status: GameStatus;
  guesses: Guess[];
  completedAt?: string;
  /** Local hour 0-23 when the game ended (for time-of-day achievements). */
  completedHour?: number;
}

export type NoticeId = 'notEnoughLetters' | 'selectWord';

export interface PlayState {
  puzzle: Puzzle;
  board: Board;
  maxAttempts: number;
  game: SavedGame;
  progress: Progress;
  selectedSlotId: string | null;
  /** Letters typed for the selected slot's unlocked positions, in order. */
  typed: string;
  letters: ReadonlySet<string>;
  notice: { id: NoticeId; seq: number } | null;
}

export type PlayAction =
  | { type: 'select'; slotId: string }
  /** Grid only: move to the next (1) or previous (-1) unsolved word in crossword order. */
  | { type: 'selectAdjacent'; step: 1 | -1 }
  | { type: 'type'; letter: string }
  | { type: 'backspace' }
  | { type: 'submit'; now: Date }
  | { type: 'dismissNotice' }
  /** Adopt a game saved by another tab if it is further along. */
  | { type: 'sync'; game: SavedGame };

/** Grid mode pre-fills revealed letters; single mode plays like classic Wordle. */
export function usesLockedLetters(puzzle: Puzzle): boolean {
  return puzzle.type === 'grid';
}

/** Indexes of the slot positions the player still has to type. */
export function openPositions(state: Pick<PlayState, 'puzzle' | 'progress'>, slot: Slot): number[] {
  const indexes = slot.cellKeys.map((_, i) => i);
  if (!usesLockedLetters(state.puzzle)) return indexes;
  return indexes.filter((i) => !state.progress.lockedCells.has(slot.cellKeys[i] as string));
}

/** The selected slot's input row: locked letters, typed letters, and '' for empty positions. */
export function inputRow(state: PlayState, slot: Slot): string[] {
  const open = openPositions(state, slot);
  const row = slot.cellKeys.map((key) =>
    usesLockedLetters(state.puzzle) && state.progress.lockedCells.has(key)
      ? (state.board.cells.get(key)?.letter ?? '')
      : '',
  );
  [...state.typed].forEach((letter, i) => {
    const pos = open[i];
    if (pos !== undefined) row[pos] = letter;
  });
  return row;
}

function firstUnsolvedSlot(board: Board, progress: Progress, after?: string): string | null {
  const slots = board.slots;
  const start = after ? slots.findIndex((s) => s.id === after) + 1 : 0;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[(start + i) % slots.length];
    if (slot && !progress.solvedSlots.has(slot.id)) return slot.id;
  }
  return null;
}

export function newGame(puzzle: Puzzle, day: DayKey): SavedGame {
  return { puzzleId: puzzle.id, day, status: 'in-progress', guesses: [] };
}

export function createPlayState(
  puzzle: Puzzle,
  day: DayKey,
  saved: SavedGame | null,
  letters: ReadonlySet<string>,
): PlayState {
  const board = buildBoard(puzzle);
  const game =
    saved && saved.puzzleId === puzzle.id && saved.day === day ? saved : newGame(puzzle, day);
  const progress = deriveProgress(board, game.guesses);
  return {
    puzzle,
    board,
    maxAttempts: getMaxAttempts(puzzle),
    game,
    progress,
    selectedSlotId: game.status === 'in-progress' ? firstUnsolvedSlot(board, progress) : null,
    typed: '',
    letters,
    notice: null,
  };
}

function withNotice(state: PlayState, id: NoticeId): PlayState {
  return { ...state, notice: { id, seq: (state.notice?.seq ?? 0) + 1 } };
}

function submit(state: PlayState, now: Date): PlayState {
  const slot = state.selectedSlotId ? getSlot(state.board, state.selectedSlotId) : undefined;
  if (!slot) return withNotice(state, 'selectWord');

  const row = inputRow(state, slot);
  if (row.some((letter) => letter === '')) return withNotice(state, 'notEnoughLetters');

  const letters = row.join('');
  const guess: Guess = { slotId: slot.id, letters, states: evaluateGuess(letters, slot.answer) };
  const guesses = [...state.game.guesses, guess];
  const progress = deriveProgress(state.board, guesses);

  let status: GameStatus = 'in-progress';
  if (progress.solved) status = 'won';
  else if (countMisses(guesses) >= state.maxAttempts) status = 'lost';

  const game: SavedGame = { ...state.game, guesses, status };
  if (status !== 'in-progress') {
    game.completedAt = now.toISOString();
    game.completedHour = now.getHours();
  }

  let selectedSlotId: string | null = slot.id;
  if (status !== 'in-progress') selectedSlotId = null;
  else if (progress.solvedSlots.has(slot.id)) {
    selectedSlotId = firstUnsolvedSlot(state.board, progress, slot.id);
  }

  return { ...state, game, progress, selectedSlotId, typed: '', notice: null };
}

export function playReducer(state: PlayState, action: PlayAction): PlayState {
  if (action.type === 'dismissNotice') return { ...state, notice: null };
  if (action.type === 'sync') {
    const { game } = action;
    const sameGame = game.puzzleId === state.game.puzzleId && game.day === state.game.day;
    if (!sameGame || game.guesses.length <= state.game.guesses.length) return state;
    return createPlayState(state.puzzle, game.day, game, state.letters);
  }
  if (state.game.status !== 'in-progress') return state;

  switch (action.type) {
    case 'select': {
      if (action.slotId === state.selectedSlotId) return state;
      const slot = getSlot(state.board, action.slotId);
      if (!slot || state.progress.solvedSlots.has(slot.id)) return state;
      return { ...state, selectedSlotId: slot.id, typed: '' };
    }
    case 'selectAdjacent': {
      if (state.puzzle.type !== 'grid') return state;
      const order = slotsInCrosswordOrder(state.board).filter(
        (s) => s.id === state.selectedSlotId || !state.progress.solvedSlots.has(s.id),
      );
      const current = order.findIndex((s) => s.id === state.selectedSlotId);
      const next = order[(current + action.step + order.length) % order.length];
      if (!next || next.id === state.selectedSlotId) return state;
      return { ...state, selectedSlotId: next.id, typed: '' };
    }
    case 'type': {
      const slot = state.selectedSlotId ? getSlot(state.board, state.selectedSlotId) : undefined;
      if (!slot) return withNotice(state, 'selectWord');
      if (!state.letters.has(action.letter)) return state;
      if (state.typed.length >= openPositions(state, slot).length) return state;
      return { ...state, typed: state.typed + action.letter };
    }
    case 'backspace':
      return state.typed ? { ...state, typed: state.typed.slice(0, -1) } : state;
    case 'submit':
      return submit(state, action.now);
  }
}
