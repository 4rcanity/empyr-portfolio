import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Copy } from './copy';
import {
  inkFor,
  pathBetween,
  snap,
  type Cell,
  type LogLine,
  type PlayerView,
  type RoomView,
  type WordView,
} from './protocol';

/* --------------------------------------------------------------------- board */

interface BoardProps {
  room: RoomView;
  /** Cell index → the highlighter colour of whoever claimed it. */
  marks: Map<number, string>;
  busy: boolean;
  shake: boolean;
  copy: Copy;
  onClaim: (from: Cell, to: Cell) => void;
}

export function Board({ room, marks, busy, shake, copy, onClaim }: BoardProps) {
  const size = room.rules.size;
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [end, setEnd] = useState<Cell | null>(null);
  const dragging = useRef(false);
  const grid = useRef<HTMLDivElement | null>(null);

  const clear = useCallback(() => {
    dragging.current = false;
    setAnchor(null);
    setEnd(null);
  }, []);

  const cellAt = useCallback((x: number, y: number): Cell | null => {
    const found = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = found?.closest('[data-r]') as HTMLElement | null;
    if (!cell || !grid.current?.contains(cell)) return null;
    return { r: Number(cell.dataset.r), c: Number(cell.dataset.c) };
  }, []);

  const commit = useCallback(
    (from: Cell, to: Cell) => {
      clear();
      onClaim(from, to);
    },
    [clear, onClaim],
  );

  /** Tap a cell, then tap another — the keyboard and slow-hands path. */
  const poke = useCallback(
    (at: Cell) => {
      if (busy) return;
      if (anchor && (anchor.r !== at.r || anchor.c !== at.c)) {
        commit(anchor, snap(anchor, at, size));
        return;
      }
      if (anchor && anchor.r === at.r && anchor.c === at.c) {
        clear();
        return;
      }
      setAnchor(at);
      setEnd(at);
    },
    [anchor, busy, clear, commit, size],
  );

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy) return;
    const at = cellAt(event.clientX, event.clientY);
    if (!at) return;
    event.preventDefault();
    if (anchor && (anchor.r !== at.r || anchor.c !== at.c)) {
      commit(anchor, snap(anchor, at, size));
      return;
    }
    // Capture on the grid so a finger that slides off a cell keeps reporting.
    try {
      grid.current?.setPointerCapture(event.pointerId);
    } catch {
      /* capture is a nicety, not a requirement */
    }
    dragging.current = true;
    setAnchor(at);
    setEnd(at);
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !anchor) return;
    const at = cellAt(event.clientX, event.clientY);
    if (!at) return;
    const target = snap(anchor, at, size);
    setEnd((prev) => (prev && prev.r === target.r && prev.c === target.c ? prev : target));
  };

  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      grid.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (anchor && end && (end.r !== anchor.r || end.c !== anchor.c)) commit(anchor, end);
  };

  const trace = anchor && end ? pathBetween(anchor, end, size) : [];
  const traced = new Set(trace);
  const anchorCell = anchor ? anchor.r * size + anchor.c : -1;

  const cells = [];
  for (let i = 0; i < size * size; i++) {
    const mark = marks.get(i);
    cells.push(
      <button
        key={i}
        type="button"
        className="ws-cell"
        data-r={Math.floor(i / size)}
        data-c={i % size}
        data-mark={mark ? 'true' : 'false'}
        data-trace={traced.has(i) ? 'true' : 'false'}
        data-anchor={i === anchorCell ? 'true' : 'false'}
        style={mark ? ({ ['--mark' as string]: mark }) : undefined}
        tabIndex={-1}
        aria-label={room.cells[i]}
        onClick={(event) => {
          // Only the keyboard path lands here; pointers are handled above.
          if (event.detail === 0) poke({ r: Math.floor(i / size), c: i % size });
        }}
      >
        {room.cells[i]}
      </button>,
    );
  }

  return (
    <div className="ws-board" data-shake={shake ? 'true' : 'false'}>
      <div
        ref={grid}
        className="ws-grid"
        style={{ ['--n' as string]: String(size) }}
        data-busy={busy ? 'true' : 'false'}
        role="grid"
        aria-label={copy.wordsHeading}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={clear}
        onKeyDown={(event) => {
          if (event.key === 'Escape') clear();
        }}
      >
        {cells}
      </div>

      <div className="ws-board-foot">
        <p className="ws-hint">{copy.boardHint}</p>
        <span className="ws-grow" />
        {anchor && (
          <button type="button" className="ws-btn" data-tone="ghost" data-small="true" onClick={clear}>
            {copy.clearTrace}
          </button>
        )}
        <span className="ws-seed ws-num">
          {copy.seedLabel} {room.seed.toString(16)}
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- word list */

interface WordListProps {
  words: WordView[];
  players: PlayerView[];
  youId: string;
  copy: Copy;
}

export function WordList({ words, players, youId, copy }: WordListProps) {
  const pen = new Map(players.map((player) => [player.id, inkFor(player.seat)]));
  const sorted = [...words].sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
  const done = words.filter((word) => word.by).length;

  return (
    <div className="ws-card">
      <p className="ws-heading">{copy.wordsHeading}</p>
      <ul className="ws-words">
        {sorted.map((word) => (
          <li
            key={word.i}
            className="ws-word"
            data-done={word.by ? 'true' : 'false'}
            data-mine={word.by && word.by === youId ? 'true' : 'false'}
            style={word.by ? ({ ['--mark' as string]: pen.get(word.by) ?? '#ddd' }) : undefined}
          >
            {word.word}
            {word.by && <small className="ws-num">+{word.points}</small>}
          </li>
        ))}
      </ul>
      <p className="ws-progress ws-num">
        {done} / {words.length} {copy.found}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- scoreboard */

export function Scoreboard({
  players,
  youId,
  copy,
}: {
  players: PlayerView[];
  youId: string;
  copy: Copy;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score || a.seat - b.seat);
  return (
    <div className="ws-card">
      <p className="ws-heading">{copy.scoreHeading}</p>
      <ul className="ws-scores">
        {ranked.map((player) => (
          <li
            key={player.id}
            className="ws-score"
            data-you={player.id === youId ? 'true' : 'false'}
            data-off={player.online ? 'false' : 'true'}
            style={{ ['--pen' as string]: inkFor(player.seat) }}
          >
            <span className="ws-score-name">{player.name}</span>
            <span className="ws-score-found ws-num">
              {player.found} {copy.found}
            </span>
            <span className="ws-score-pts ws-num">
              {player.score}
              <small>{copy.points}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------- feed */

export function Feed({ log, copy }: { log: LogLine[]; copy: Copy }) {
  return (
    <div className="ws-card">
      <p className="ws-heading">{copy.feedHeading}</p>
      <ul className="ws-feed">
        {[...log].reverse().slice(0, 7).map((line) => (
          <li key={line.id} data-tone={line.tone}>
            {copy.line(line)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- results */

interface ResultsProps {
  room: RoomView;
  youId: string;
  isHost: boolean;
  copy: Copy;
  secondsToNext: number | null;
  onNext: () => void;
  onLobby: () => void;
}

export function Results({ room, youId, isHost, copy, secondsToNext, onNext, onLobby }: ResultsProps) {
  const final = room.phase === 'over';
  const ranked = [...room.players].sort((a, b) => b.score - a.score || a.seat - b.seat);
  const missed = room.words.filter((word) => !word.by);
  const champion = ranked[0];
  const tie = ranked.length > 1 && ranked[1].score === champion?.score;

  return (
    <div className="ws-sheet-over">
      <div className="ws-results" role="dialog" aria-modal="true">
        <p className="ws-eyebrow">
          {final ? copy.finalTitle : copy.roundOf(room.round, room.rules.rounds)}
        </p>
        <h2 className="ws-title">
          {final
            ? tie
              ? copy.tied
              : copy.wonBy(champion?.name ?? '')
            : missed.length === 0
              ? copy.clearedBoard
              : copy.resultsTitle}
        </h2>

        <ul className="ws-podium">
          {ranked.map((player, index) => (
            <li
              key={player.id}
              data-top={index === 0 ? 'true' : 'false'}
              style={{ ['--pen' as string]: inkFor(player.seat) }}
            >
              <span className="ws-rank ws-num">{index + 1}</span>
              <span className="ws-podium-name">
                {player.name}
                {player.id === youId ? ` (${copy.youBadge})` : ''}
              </span>
              <span className="ws-podium-pts ws-num">
                +{player.round}
                <small>{copy.roundPoints}</small>
              </span>
              <span className="ws-podium-pts ws-num">
                {player.score}
                <small>{copy.totalPoints}</small>
              </span>
            </li>
          ))}
        </ul>

        <p className="ws-heading">{copy.missed}</p>
        {missed.length === 0 ? (
          <p className="ws-hint">{copy.nothingMissed}</p>
        ) : (
          <ul className="ws-words">
            {missed.map((word) => (
              <li key={word.i} className="ws-word">
                {word.word}
              </li>
            ))}
          </ul>
        )}

        <div className="ws-row">
          {!final && secondsToNext !== null && (
            <span className="ws-chip ws-num">{copy.nextIn(secondsToNext)}</span>
          )}
          {!final && isHost && (
            <button type="button" className="ws-btn" data-tone="hot" onClick={onNext}>
              {copy.nextNow}
            </button>
          )}
          {final && isHost && (
            <button type="button" className="ws-btn" data-tone="hot" onClick={onLobby}>
              {copy.backToLobby}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
