/**
 * Validates every src/puzzles/<locale>.json file. Runs as part of `yarn build`.
 * Usage: yarn validate [--min=<count>]   (default minimum: MIN_PUZZLES)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIN_PUZZLES } from '../src/game/config';
import { validatePuzzleList } from '../src/puzzles/validate';

const dir = join(import.meta.dirname, '..', 'src', 'puzzles');
const minArg = process.argv.find((a) => a.startsWith('--min='));
const minCount = minArg ? Number(minArg.slice('--min='.length)) : MIN_PUZZLES;

let failed = false;
for (const file of readdirSync(dir).filter((f) => /^[a-z]{2}\.json$/.test(f))) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (error) {
    console.error(`✗ ${file}: invalid JSON – ${(error as Error).message}`);
    failed = true;
    continue;
  }
  const { puzzles, errors } = validatePuzzleList(raw, { minCount });
  if (errors.length > 0) {
    failed = true;
    console.error(`✗ ${file}: ${errors.length} error(s)`);
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    const grids = puzzles.filter((p) => p.type === 'grid').length;
    console.log(
      `✓ ${file}: ${puzzles.length} puzzles (${puzzles.length - grids} single, ${grids} grid)`,
    );
  }
}

process.exit(failed ? 1 : 0);
