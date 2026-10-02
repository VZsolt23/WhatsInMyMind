export type Direction = 'across' | 'down';

export interface GridWord {
  id: string;
  answer: string;
  row: number;
  col: number;
  dir: Direction;
  clue?: string;
}

interface PuzzleBase {
  id: string;
  category: string;
  maxAttempts?: number;
  note?: string;
}

export interface SinglePuzzle extends PuzzleBase {
  type: 'single';
  /** Uppercase letters; single spaces separate words of a phrase. */
  answer: string;
}

export interface GridPuzzle extends PuzzleBase {
  type: 'grid';
  rows: number;
  cols: number;
  words: GridWord[];
}

export type Puzzle = SinglePuzzle | GridPuzzle;

export interface ParseResult {
  puzzle: Puzzle | null;
  errors: string[];
}

const LETTERS_RE = /^[A-Z]+$/;
const PHRASE_RE = /^[A-Z]+( [A-Z]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseWord(raw: unknown, where: string, errors: string[]): GridWord | null {
  if (!isRecord(raw)) {
    errors.push(`${where}: word must be an object`);
    return null;
  }
  const before = errors.length;
  if (!isNonEmptyString(raw.id)) errors.push(`${where}: "id" is required`);
  if (typeof raw.answer !== 'string' || !LETTERS_RE.test(raw.answer)) {
    errors.push(`${where}: "answer" must be uppercase letters A-Z only`);
  }
  if (!isNonNegativeInt(raw.row)) errors.push(`${where}: "row" must be a non-negative integer`);
  if (!isNonNegativeInt(raw.col)) errors.push(`${where}: "col" must be a non-negative integer`);
  if (raw.dir !== 'across' && raw.dir !== 'down') {
    errors.push(`${where}: "dir" must be "across" or "down"`);
  }
  if (raw.clue !== undefined && !isNonEmptyString(raw.clue)) {
    errors.push(`${where}: "clue" must be a non-empty string`);
  }
  if (errors.length > before) return null;

  const word: GridWord = {
    id: raw.id as string,
    answer: raw.answer as string,
    row: raw.row as number,
    col: raw.col as number,
    dir: raw.dir as Direction,
  };
  if (typeof raw.clue === 'string') word.clue = raw.clue;
  return word;
}

/** Structural validation only; grid layout rules live in validate.ts. */
export function parsePuzzle(raw: unknown, where = 'puzzle'): ParseResult {
  const errors: string[] = [];
  if (!isRecord(raw)) return { puzzle: null, errors: [`${where}: must be an object`] };

  const label = isNonEmptyString(raw.id) ? `${where} (${raw.id})` : where;
  if (!isNonEmptyString(raw.id)) errors.push(`${label}: "id" is required`);
  if (!isNonEmptyString(raw.category)) errors.push(`${label}: "category" is required`);
  if (
    raw.maxAttempts !== undefined &&
    !(isNonNegativeInt(raw.maxAttempts) && raw.maxAttempts >= 1)
  ) {
    errors.push(`${label}: "maxAttempts" must be a positive integer`);
  }
  if (raw.note !== undefined && typeof raw.note !== 'string') {
    errors.push(`${label}: "note" must be a string`);
  }

  const base: PuzzleBase = { id: raw.id as string, category: raw.category as string };
  if (typeof raw.maxAttempts === 'number') base.maxAttempts = raw.maxAttempts;
  if (typeof raw.note === 'string') base.note = raw.note;

  if (raw.type === 'single') {
    if (typeof raw.answer !== 'string' || !PHRASE_RE.test(raw.answer)) {
      errors.push(`${label}: "answer" must be uppercase A-Z words separated by single spaces`);
    }
    if (errors.length > 0) return { puzzle: null, errors };
    return { puzzle: { ...base, type: 'single', answer: raw.answer as string }, errors };
  }

  if (raw.type === 'grid') {
    const rows = raw.rows;
    const cols = raw.cols;
    if (!isNonNegativeInt(rows) || rows < 1) errors.push(`${label}: "rows" must be >= 1`);
    if (!isNonNegativeInt(cols) || cols < 1) errors.push(`${label}: "cols" must be >= 1`);
    if (!Array.isArray(raw.words)) {
      errors.push(`${label}: "words" must be an array`);
      return { puzzle: null, errors };
    }
    const words = raw.words.map((w, i) => parseWord(w, `${label} word[${i}]`, errors));
    if (errors.length > 0) return { puzzle: null, errors };
    return {
      puzzle: {
        ...base,
        type: 'grid',
        rows: rows as number,
        cols: cols as number,
        words: words as GridWord[],
      },
      errors,
    };
  }

  errors.push(`${label}: "type" must be "single" or "grid"`);
  return { puzzle: null, errors };
}
