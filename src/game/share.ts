import { cellKey, type Board } from './board';
import { APP_NAME } from './config';
import type { LetterState } from './feedback';
import { countMisses, type Progress } from './progress';
import type { SavedGame } from './reducer';

const EMOJI: Record<LetterState, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
const GRID_EMPTY = '⬛';
const GRID_SOLVED = '🟩';
const GRID_MISSED = '🟥';

export interface ShareInput {
  puzzleNumber: number;
  board: Board;
  game: SavedGame;
  progress: Progress;
  maxAttempts: number;
  isGrid: boolean;
}

/** Spoiler-free result text: never contains a letter of the answer. */
export function buildShareText({
  puzzleNumber,
  board,
  game,
  progress,
  maxAttempts,
  isGrid,
}: ShareInput): string {
  const won = game.status === 'won';

  if (!isGrid) {
    const score = won ? String(game.guesses.length) : 'X';
    const header = `${APP_NAME} #${puzzleNumber} ${score}/${maxAttempts}`;
    const rows = game.guesses.map((g) => g.states.map((s) => EMOJI[s]).join(''));
    return [header, '', ...rows].join('\n');
  }

  // Grid: only wrong guesses count against the limit, so that is the score.
  const score = won ? String(countMisses(game.guesses)) : 'X';
  const header = `${APP_NAME} #${puzzleNumber} 🧩 ${score}/${maxAttempts} ✗`;

  const rows: string[] = [];
  for (let r = 0; r < board.rows; r++) {
    let line = '';
    for (let c = 0; c < board.cols; c++) {
      const key = cellKey(r, c);
      if (!board.cells.has(key)) line += GRID_EMPTY;
      else line += progress.lockedCells.has(key) ? GRID_SOLVED : GRID_MISSED;
    }
    rows.push(line);
  }
  return [header, '', ...rows].join('\n');
}
