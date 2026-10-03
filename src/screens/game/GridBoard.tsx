import { useMemo, type CSSProperties, type Dispatch } from 'react';
import { GuessRow } from '@/components/GuessRow';
import { useT } from '@/features/settings/settingsContext';
import {
  cellKey,
  getSlot,
  numberSlots,
  slotsInCrosswordOrder,
  type Cell,
  type Slot,
} from '@/game/board';
import { inputRow, openPositions, type PlayAction, type PlayState } from '@/game/reducer';
import styles from './GridBoard.module.css';

interface GridBoardProps {
  state: PlayState;
  dispatch: Dispatch<PlayAction>;
  revealFrom: number;
}

export function GridBoard({ state, dispatch, revealFrom }: GridBoardProps) {
  const t = useT();
  const { board, progress, selectedSlotId, game } = state;
  const numbering = useMemo(() => numberSlots(board), [board]);
  const orderedSlots = useMemo(() => slotsInCrosswordOrder(board), [board]);
  const selected = selectedSlotId ? getSlot(board, selectedSlotId) : undefined;
  const finished = game.status !== 'in-progress';

  const slotLabel = (slot: Slot) =>
    t('game.wordLabel', { n: numbering.bySlot.get(slot.id) ?? 0, dir: t(`dir.${slot.dir}`) });

  const typedByCell = new Map<string, string>();
  if (selected) {
    inputRow(state, selected).forEach((letter, i) => {
      const key = selected.cellKeys[i];
      if (key && letter) typedByCell.set(key, letter);
    });
  }
  const selectedCells = new Set(selected?.cellKeys);

  const onCellClick = (cell: Cell) => {
    const candidates = cell.slotIds.filter((id) => !progress.solvedSlots.has(id));
    if (candidates.length === 0) return;
    const current = selectedSlotId && candidates.includes(selectedSlotId) ? selectedSlotId : null;
    // Clicking a crossing cell of the selected word switches direction.
    const next = current ? (candidates.find((id) => id !== current) ?? current) : candidates[0];
    if (next) dispatch({ type: 'select', slotId: next });
  };

  const rows = Array.from({ length: board.rows }, (_, r) =>
    Array.from({ length: board.cols }, (_, c) => board.cells.get(cellKey(r, c))),
  );

  const lockedPositions = selected
    ? new Set(
        selected.cellKeys
          .map((_, i) => i)
          .filter((i) => !openPositions(state, selected).includes(i)),
      )
    : undefined;

  const history = selected
    ? game.guesses
        .map((guess, index) => ({ guess, index }))
        .filter(({ guess }) => guess.slotId === selected.id)
    : [];

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.grid}
        role="group"
        aria-label={t('game.board')}
        style={{ '--rows': board.rows, '--cols': board.cols } as CSSProperties}
      >
        {rows.flatMap((row, r) =>
          row.map((cell, c) => {
            if (!cell)
              return <span key={`${r},${c}`} className={styles.block} aria-hidden="true" />;
            const locked = progress.lockedCells.has(cell.key);
            const revealed = locked || finished;
            const letter = revealed ? cell.letter : (typedByCell.get(cell.key) ?? '');
            const number = numbering.byCell.get(cell.key);
            return (
              <button
                key={cell.key}
                type="button"
                tabIndex={-1}
                className={styles.cell}
                data-grid-cell
                data-locked={locked || undefined}
                data-missed={(finished && !locked) || undefined}
                data-selected={selectedCells.has(cell.key) || undefined}
                onClick={() => onCellClick(cell)}
                disabled={finished}
                aria-label={`${t('game.cell', { row: r + 1, col: c + 1 })}${locked ? `: ${cell.letter}` : ''}`}
              >
                {number !== undefined && <span className={styles.number}>{number}</span>}
                <span className={styles.letter}>{letter}</span>
              </button>
            );
          }),
        )}
      </div>

      <div className={styles.words} role="group" aria-label={t('game.words')}>
        {orderedSlots.map((slot) => {
          const solved = progress.solvedSlots.has(slot.id);
          return (
            <button
              key={slot.id}
              type="button"
              className={styles.word}
              data-slot-chip={slot.id}
              data-solved={solved || undefined}
              aria-pressed={slot.id === selectedSlotId}
              disabled={solved || finished}
              onClick={() => dispatch({ type: 'select', slotId: slot.id })}
            >
              <span>{slotLabel(slot)}</span>
              <span className={styles.wordMeta} aria-hidden="true">
                {solved ? '✓' : slot.answer.length}
              </span>
              <span className="visually-hidden">
                {solved ? t('game.solved') : t('game.wordLength', { n: slot.answer.length })}
              </span>
            </button>
          );
        })}
      </div>

      {selected && !finished && (
        <section
          className={styles.selected}
          aria-label={t('game.selectedWord', { label: slotLabel(selected) })}
        >
          <p className={styles.selectedTitle}>
            {slotLabel(selected)} · {t('game.wordLength', { n: selected.answer.length })}
          </p>
          {selected.clue && (
            <p className={styles.clue}>{t('game.hint', { clue: selected.clue })}</p>
          )}
          <div className={styles.rows}>
            {history.map(({ guess, index }) => (
              <GuessRow
                key={index}
                letters={[...guess.letters]}
                states={guess.states}
                reveal={index >= revealFrom}
                label={t('game.guessN', { n: index + 1 })}
              />
            ))}
            <GuessRow
              letters={inputRow(state, selected)}
              {...(lockedPositions ? { locked: lockedPositions } : {})}
              active
              shakeKey={state.notice?.seq}
              label={t('game.guessN', { n: game.guesses.length + 1 })}
            />
          </div>
        </section>
      )}
    </div>
  );
}
