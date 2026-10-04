import type { Board } from './board';
import { betterState, type LetterState } from './feedback';

export interface Guess {
  slotId: string;
  letters: string;
  states: LetterState[];
}

export interface Progress {
  /** Cells revealed by a correct letter; shown in every slot that crosses them. */
  lockedCells: Set<string>;
  solvedSlots: Set<string>;
  guessesBySlot: Map<string, Guess[]>;
  solved: boolean;
}

/** Everything about a game's progress is derived from the guesses, never stored separately. */
export function deriveProgress(board: Board, guesses: readonly Guess[]): Progress {
  const lockedCells = new Set<string>();
  const guessesBySlot = new Map<string, Guess[]>();

  for (const guess of guesses) {
    const slot = board.slots.find((s) => s.id === guess.slotId);
    if (!slot) continue;
    guessesBySlot.set(slot.id, [...(guessesBySlot.get(slot.id) ?? []), guess]);
    guess.states.forEach((state, i) => {
      const key = slot.cellKeys[i];
      if (state === 'correct' && key) lockedCells.add(key);
    });
  }

  const solvedSlots = new Set(
    board.slots.filter((s) => s.cellKeys.every((k) => lockedCells.has(k))).map((s) => s.id),
  );

  return {
    lockedCells,
    solvedSlots,
    guessesBySlot,
    solved: solvedSlots.size === board.slots.length,
  };
}

/**
 * Wrong guesses: every guess that is not fully correct. Only these use up
 * attempts, so solving a grid word is free. In single mode this equals
 * "guesses so far" until the winning guess.
 */
export function countMisses(guesses: readonly Guess[]): number {
  return guesses.filter((g) => g.states.some((s) => s !== 'correct')).length;
}

/** Best known state per letter. In grid mode pass only the selected slot's guesses. */
export function deriveKeyStates(guesses: readonly Guess[]): Map<string, LetterState> {
  const result = new Map<string, LetterState>();
  for (const guess of guesses) {
    [...guess.letters].forEach((letter, i) => {
      const state = guess.states[i];
      if (state) result.set(letter, betterState(result.get(letter), state));
    });
  }
  return result;
}
