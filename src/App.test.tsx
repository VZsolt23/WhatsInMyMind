import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LAUNCH_DATE } from '@/game/config';
import { addDays } from '@/lib/dayKey';
import { App } from './App';

/** Noon on the day of puzzle #n, whatever LAUNCH_DATE is set to. */
function dayOfPuzzle(n: number): Date {
  const [y, m, d] = addDays(LAUNCH_DATE, n - 1)
    .split('-')
    .map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12, 0);
}

// Puzzle #2 is the "In the toolbox" grid, #3 is the single word COFFEE.
const GRID_DAY = dayOfPuzzle(2);
const SINGLE_DAY = dayOfPuzzle(3);

function seenHelp() {
  localStorage.setItem(
    'wim:settings',
    JSON.stringify({ v: 1, theme: 'light', locale: 'en', reducedMotion: true, seenHelp: true }),
  );
}

function setup(now: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, ...view };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('shows the help on the first visit only', async () => {
    const { user, unmount } = setup(SINGLE_DAY);
    const dialog = screen.getByRole('dialog', { name: 'How to play' });
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<App />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('plays a single-word puzzle to a win and records it', async () => {
    seenHelp();
    const { user } = setup(SINGLE_DAY);
    expect(
      screen.getByRole('heading', { name: "Monday morning's best friend" }),
    ).toBeInTheDocument();

    await user.keyboard('cof{Enter}');
    expect(await screen.findByText('Not enough letters')).toBeInTheDocument();

    await user.keyboard('fer{Enter}');
    expect(screen.getByRole('group', { name: /^Guess 1: C, correct/ })).toBeInTheDocument();
    expect(screen.getByText('Guesses: 1/6', { selector: 'section span' })).toBeInTheDocument();

    await user.keyboard('coffee{Enter}');
    expect(screen.getByRole('heading', { name: 'You read my mind!' })).toBeInTheDocument();
    expect(screen.getByText('Solved in 2/6 guesses.')).toBeInTheDocument();

    const stats = JSON.parse(localStorage.getItem('wim:stats') ?? '{}');
    expect(stats).toMatchObject({ played: 1, won: 1, currentStreak: 1 });
    expect(
      Object.keys(JSON.parse(localStorage.getItem('wim:achievements') ?? '{}').unlocked),
    ).toContain('first-thoughts');
  });

  it('accepts input from the on-screen keyboard', async () => {
    seenHelp();
    const { user } = setup(SINGLE_DAY);
    const keyboard = screen.getByRole('group', { name: 'Keyboard' });
    for (const letter of 'COFFEE')
      await user.click(within(keyboard).getByRole('button', { name: letter }));
    await user.click(within(keyboard).getByRole('button', { name: 'Enter' }));
    expect(screen.getByRole('heading', { name: 'You read my mind!' })).toBeInTheDocument();
  });

  it('restores the game after a reload', async () => {
    seenHelp();
    const { user, unmount } = setup(SINGLE_DAY);
    await user.keyboard('coffer{Enter}');
    unmount();

    render(<App />);
    expect(screen.getByRole('group', { name: /^Guess 1: C, correct/ })).toBeInTheDocument();
  });

  it('pre-fills revealed letters in crossing grid words', async () => {
    seenHelp();
    const { user } = setup(GRID_DAY);
    await user.keyboard('hammex{Enter}');

    await user.click(screen.getByRole('button', { name: /^2 Down/ }));
    expect(screen.getByRole('region', { name: /^Selected: 2 Down/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Guess 2: A, empty, empty' })).toBeInTheDocument();

    await user.keyboard('wl{Enter}');
    expect(screen.getByRole('button', { name: /^2 Down.*solved/ })).toBeDisabled();
  });

  it('moves between grid words with the arrow keys', async () => {
    seenHelp();
    const { user } = setup(GRID_DAY);
    const pressed = () => screen.getByRole('button', { pressed: true }).textContent;
    expect(pressed()).toMatch(/^1 Across/);
    await user.keyboard('{ArrowRight}');
    expect(pressed()).toMatch(/^2 Down/);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(pressed()).toMatch(/^4 Down/);
  });

  it('switches to the retro theme and unlocks Retro Soul', async () => {
    seenHelp();
    const { user } = setup(SINGLE_DAY);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('radio', { name: 'Retro 98' }));

    expect(document.documentElement.dataset.theme).toBe('legacy');
    expect(await screen.findByText('Achievement unlocked: Retro Soul')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('wim:settings') ?? '{}').theme).toBe('legacy');
  });

  it('ignores the physical keyboard while a modal is open', async () => {
    seenHelp();
    const { user } = setup(SINGLE_DAY);
    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    await user.keyboard('abc');
    await act(async () => {
      await user.keyboard('{Escape}');
    });
    expect(
      screen.getByRole('group', { name: 'Guess 1: empty, empty, empty, empty, empty, empty' }),
    ).toBeInTheDocument();
  });
});
