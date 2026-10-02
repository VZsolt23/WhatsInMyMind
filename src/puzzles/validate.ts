import { cellKey, slotPositions } from '@/game/board';
import { GRID_SIZE, GRID_WORD_COUNT, GRID_WORD_LENGTH, SINGLE_LENGTH } from '@/game/config';
import { parsePuzzle, type Direction, type GridPuzzle, type GridWord, type Puzzle } from './schema';

export interface ValidationResult {
  puzzles: Puzzle[];
  errors: string[];
}

function inRange(n: number, range: { min: number; max: number }): boolean {
  return n >= range.min && n <= range.max;
}

/** Maximal runs (length >= 2) of filled cells along each row or column. */
function findRuns(filled: Set<string>, rows: number, cols: number, dir: Direction) {
  const runs: { row: number; col: number; length: number }[] = [];
  const outer = dir === 'across' ? rows : cols;
  const inner = dir === 'across' ? cols : rows;
  for (let o = 0; o < outer; o++) {
    let start = -1;
    for (let i = 0; i <= inner; i++) {
      const key = dir === 'across' ? cellKey(o, i) : cellKey(i, o);
      const isFilled = i < inner && filled.has(key);
      if (isFilled && start < 0) start = i;
      if (!isFilled && start >= 0) {
        const length = i - start;
        if (length >= 2) {
          runs.push(
            dir === 'across' ? { row: o, col: start, length } : { row: start, col: o, length },
          );
        }
        start = -1;
      }
    }
  }
  return runs;
}

export function checkGridLayout(puzzle: GridPuzzle): string[] {
  const errors: string[] = [];
  const label = `puzzle ${puzzle.id}`;

  if (!inRange(puzzle.rows, GRID_SIZE) || !inRange(puzzle.cols, GRID_SIZE)) {
    errors.push(`${label}: grid must be ${GRID_SIZE.min}-${GRID_SIZE.max} in both dimensions`);
  }
  if (!inRange(puzzle.words.length, GRID_WORD_COUNT)) {
    errors.push(`${label}: grid must have ${GRID_WORD_COUNT.min}-${GRID_WORD_COUNT.max} words`);
  }

  const ids = new Set<string>();
  for (const word of puzzle.words) {
    if (ids.has(word.id)) errors.push(`${label}: duplicate word id "${word.id}"`);
    ids.add(word.id);
    if (!inRange(word.answer.length, GRID_WORD_LENGTH)) {
      errors.push(
        `${label}: word ${word.id} must be ${GRID_WORD_LENGTH.min}-${GRID_WORD_LENGTH.max} letters`,
      );
    }
  }

  const letters = new Map<string, string>();
  const owners = new Map<string, string[]>();
  for (const word of puzzle.words) {
    slotPositions(word).forEach(({ row, col }, i) => {
      if (row >= puzzle.rows || col >= puzzle.cols) {
        errors.push(`${label}: word ${word.id} goes outside the grid`);
        return;
      }
      const key = cellKey(row, col);
      const letter = word.answer[i] as string;
      const existing = letters.get(key);
      if (existing !== undefined && existing !== letter) {
        errors.push(
          `${label}: letter conflict at row ${row}, col ${col} (${existing} vs ${letter})`,
        );
      }
      letters.set(key, letter);
      owners.set(key, [...(owners.get(key) ?? []), word.id]);
    });
  }
  if (errors.length > 0) return [...new Set(errors)];

  // Every run of 2+ adjacent letters must be exactly one word in that direction;
  // this rejects overlaps, extensions and accidental words formed by neighbours.
  const filled = new Set(letters.keys());
  for (const dir of ['across', 'down'] as const) {
    const words = puzzle.words.filter((w) => w.dir === dir);
    const runs = findRuns(filled, puzzle.rows, puzzle.cols, dir);
    for (const run of runs) {
      const matches = words.filter(
        (w) => w.row === run.row && w.col === run.col && w.answer.length === run.length,
      );
      if (matches.length !== 1) {
        errors.push(
          `${label}: letters at row ${run.row}, col ${run.col} (${dir}, ${run.length}) do not form exactly one word`,
        );
      }
    }
    for (const word of words) {
      const hasRun = runs.some(
        (r) => r.row === word.row && r.col === word.col && r.length === word.answer.length,
      );
      if (!hasRun) errors.push(`${label}: word ${word.id} touches or overlaps other letters`);
    }
  }

  errors.push(...checkConnected(puzzle.words, owners, label));
  return [...new Set(errors)];
}

function checkConnected(words: GridWord[], owners: Map<string, string[]>, label: string): string[] {
  const first = words[0];
  if (!first) return [];
  const neighbours = new Map<string, Set<string>>(words.map((w) => [w.id, new Set<string>()]));
  for (const ids of owners.values()) {
    for (const a of ids) for (const b of ids) if (a !== b) neighbours.get(a)?.add(b);
  }
  const seen = new Set([first.id]);
  const queue = [first.id];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const next of neighbours.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === words.length ? [] : [`${label}: not all words are connected`];
}

function checkSingle(puzzle: Puzzle & { type: 'single' }): string[] {
  const length = puzzle.answer.replaceAll(' ', '').length;
  return inRange(length, SINGLE_LENGTH)
    ? []
    : [`puzzle ${puzzle.id}: answer must be ${SINGLE_LENGTH.min}-${SINGLE_LENGTH.max} letters`];
}

function answerFingerprint(puzzle: Puzzle): string {
  return puzzle.type === 'single'
    ? puzzle.answer
    : puzzle.words
        .map((w) => w.answer)
        .sort()
        .join('+');
}

/** Validates a whole puzzle file. Only fully valid puzzles are returned. */
export function validatePuzzleList(raw: unknown, { minCount = 0 } = {}): ValidationResult {
  if (!Array.isArray(raw)) return { puzzles: [], errors: ['puzzle file must be an array'] };

  const errors: string[] = [];
  const puzzles: Puzzle[] = [];
  const ids = new Set<string>();
  const answers = new Map<string, string>();

  raw.forEach((item, index) => {
    const { puzzle, errors: parseErrors } = parsePuzzle(item, `puzzle[${index}]`);
    if (!puzzle) {
      errors.push(...parseErrors);
      return;
    }
    const ruleErrors = puzzle.type === 'single' ? checkSingle(puzzle) : checkGridLayout(puzzle);
    if (ids.has(puzzle.id)) ruleErrors.push(`puzzle ${puzzle.id}: duplicate id`);
    ids.add(puzzle.id);

    const fingerprint = answerFingerprint(puzzle);
    const sameAnswer = answers.get(fingerprint);
    if (sameAnswer) ruleErrors.push(`puzzle ${puzzle.id}: same answer as ${sameAnswer}`);
    answers.set(fingerprint, puzzle.id);

    if (ruleErrors.length > 0) errors.push(...ruleErrors);
    else puzzles.push(puzzle);
  });

  if (raw.length < minCount) {
    errors.push(`puzzle file has ${raw.length} puzzles, at least ${minCount} required`);
  }
  return { puzzles, errors };
}
