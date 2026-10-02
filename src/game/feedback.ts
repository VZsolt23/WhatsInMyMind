export type LetterState = 'correct' | 'present' | 'absent';

const RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };

export function betterState(a: LetterState | undefined, b: LetterState): LetterState {
  return a === undefined || RANK[b] > RANK[a] ? b : a;
}

/**
 * Wordle-style evaluation in two passes so repeated letters are handled
 * correctly: exact matches first consume their letters, then the remaining
 * guess letters take "present" left to right while unused copies remain.
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = [...guess];
  const a = [...answer];
  if (g.length !== a.length) {
    throw new Error(`Guess length ${g.length} does not match answer length ${a.length}`);
  }

  const states: LetterState[] = g.map(() => 'absent');
  const remaining = new Map<string, number>();

  g.forEach((letter, i) => {
    if (letter === a[i]) {
      states[i] = 'correct';
    } else {
      const answerLetter = a[i] as string;
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1);
    }
  });

  g.forEach((letter, i) => {
    if (states[i] === 'correct') return;
    const left = remaining.get(letter) ?? 0;
    if (left > 0) {
      states[i] = 'present';
      remaining.set(letter, left - 1);
    }
  });

  return states;
}
