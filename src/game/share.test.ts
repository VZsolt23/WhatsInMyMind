import { ALPHABETS } from '@/i18n/alphabet';
import type { GridPuzzle } from '@/puzzles/schema';
import { createPlayState, playReducer, type PlayAction, type PlayState } from './reducer';
import { buildShareText } from './share';

const NOW = new Date(2026, 9, 2, 12);

function guess(state: PlayState, word: string): PlayState {
  const actions: PlayAction[] = [...word].map((letter) => ({ type: 'type', letter }));
  return [...actions, { type: 'submit', now: NOW } as PlayAction].reduce(playReducer, state);
}

function share(state: PlayState, isGrid: boolean) {
  return buildShareText({ puzzleNumber: 7, ...state, isGrid });
}

describe('buildShareText', () => {
  it('renders single-word rows without letters', () => {
    let s = createPlayState(
      { id: 's', type: 'single', category: 'c', answer: 'APPLE' },
      '2026-10-02',
      null,
      ALPHABETS.en.letters,
    );
    s = guess(guess(s, 'PAPAL'), 'APPLE');
    const text = share(s, false);
    expect(text).toBe('WhatsInMyMind #7 2/6\n\n🟨🟨🟩⬛🟨\n🟩🟩🟩🟩🟩');
    expect(text).not.toMatch(/APPLE|PAPAL/);
  });

  it('marks a lost game with X and grid shape', () => {
    const puzzle: GridPuzzle = {
      id: 'g',
      type: 'grid',
      category: 'c',
      rows: 2,
      cols: 3,
      words: [
        { id: 'w1', answer: 'CAT', row: 0, col: 0, dir: 'across' },
        { id: 'w2', answer: 'CO', row: 0, col: 0, dir: 'down' },
      ],
      maxAttempts: 2,
    };
    let s = createPlayState(puzzle, '2026-10-02', null, ALPHABETS.en.letters);
    s = guess(s, 'CAT');
    s = guess(s, 'X');
    expect(s.game.status).toBe('lost');
    expect(share(s, true)).toBe('WhatsInMyMind #7 🧩 X/2\n\n🟩🟩🟩\n🟥⬛⬛');
  });
});
