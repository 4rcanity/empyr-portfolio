import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { isKing, sideOf, type Cell, type Side } from './protocol';

/* ----------------------------------------------------------------- geometry */

export const rowOf = (square: number) => Math.floor((square - 1) / 5);
export const colOf = (square: number) => ((square - 1) % 5) * 2 + (rowOf(square) % 2 === 0 ? 1 : 0);

/** The playable square at a grid cell, or `null` for a light square. */
export function squareAt(row: number, col: number): number | null {
  if ((row + col) % 2 !== 1) return null;
  return row * 5 + Math.floor(col / 2) + 1;
}

/** Board-relative position of a square in grid steps, honouring the flip. */
export function spotOf(square: number, flipped: boolean) {
  const row = flipped ? 9 - rowOf(square) : rowOf(square);
  const col = flipped ? 9 - colOf(square) : colOf(square);
  return { row, col };
}

/** Every square a route passes over, landings included. */
export function routeSquares(from: number, path: number[]): number[] {
  const out: number[] = [];
  let at = from;
  for (const land of path) {
    const dr = Math.sign(rowOf(land) - rowOf(at));
    const dc = Math.sign(colOf(land) - colOf(at));
    let row = rowOf(at) + dr;
    let col = colOf(at) + dc;
    while (row !== rowOf(land) || col !== colOf(land)) {
      const square = squareAt(row, col);
      if (square) out.push(square);
      row += dr;
      col += dc;
    }
    out.push(land);
    at = land;
  }
  return out;
}

/* -------------------------------------------------------------------- piece */

export function Piece({
  side,
  king,
  className = '',
  style,
}: {
  side: Side;
  king: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`dc-piece ${side === 'w' ? 'is-wit' : 'is-zwart'} ${king ? 'is-dam' : ''} ${className}`}
      style={style}
    >
      {king ? <span className="dc-under" aria-hidden="true" /> : null}
      <span className="dc-disc">
        <span className="dc-turn" aria-hidden="true" />
        {king ? (
          <svg className="dc-crown" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M5 22.2h22l-2-11.4-5.1 4.2L16 6.8l-3.9 8.2-5.1-4.2z" />
            <rect x="5" y="23.6" width="22" height="2.8" rx="1.4" />
          </svg>
        ) : null}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------- board */

export interface BoardMarks {
  /** The piece the player has picked up. */
  selected: number | null;
  /** Landing squares available for the next hop. */
  hops: number[];
  /** Landings already chosen in the sequence being built. */
  chain: number[];
  /** Squares on the route currently being previewed. */
  route: number[];
  /** Pieces the previewed route would take. */
  doomed: number[];
  /** Pieces of yours that have a legal move — a hint of where to look. */
  movers: number[];
  lastFrom: number | null;
  lastTo: number | null;
  lastPath: number[];
}

export interface FlyerState {
  side: Side;
  king: boolean;
  from: number;
  at: number;
  /** Pieces already lifted visually because the sequence is finishing. */
  fading: number[];
}

export function Board({
  board,
  flipped,
  marks,
  flyer,
  interactive,
  onPick,
  label,
}: {
  board: Cell[];
  flipped: boolean;
  marks: BoardMarks;
  flyer: FlyerState | null;
  interactive: boolean;
  onPick: (square: number) => void;
  label: string;
}) {
  const [drag, setDrag] = useState<{
    square: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      setDrag((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
              moved:
                current.moved ||
                Math.abs(event.clientX - current.ox) + Math.abs(event.clientY - current.oy) > 6,
            }
          : current,
      );
    };
    const stop = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [drag !== null]);

  const cells = useMemo(() => {
    const list: Array<{ key: string; square: number | null }> = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const r = flipped ? 9 - row : row;
        const c = flipped ? 9 - col : col;
        list.push({ key: `${row}-${col}`, square: squareAt(r, c) });
      }
    }
    return list;
  }, [flipped]);

  const hops = new Set(marks.hops);
  const chain = new Set(marks.chain);
  const route = new Set(marks.route);
  const doomed = new Set(marks.doomed);
  const movers = new Set(marks.movers);
  const fading = new Set(flyer?.fading ?? []);
  const dragged = drag?.moved ? drag.square : null;

  /** Which playable square the pointer was released over. */
  const released = (event: ReactPointerEvent, fallback: number) => {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const holder = el?.closest<HTMLElement>('[data-square]');
    const value = Number(holder?.dataset.square ?? 0);
    return Number.isInteger(value) && value >= 1 && value <= 50 ? value : fallback;
  };

  const flyerAt = flyer ? spotOf(flyer.at, flipped) : null;
  const flyerFrom = flyer ? spotOf(flyer.from, flipped) : null;

  return (
    <div className="dc-board" role="grid" aria-label={label}>
      <div className="dc-plane">
      <div className="dc-grid">
        {cells.map(({ key, square }) => {
          if (square === null) {
            return <div key={key} className="dc-cell is-light" aria-hidden="true" />;
          }
          const cell = board[square - 1] ?? 0;
          const side = sideOf(cell);
          const grab = interactive && (movers.has(square) || hops.has(square));
          const classes = ['dc-cell', 'is-dark'];
          if (grab) classes.push('is-grab');
          if (square === marks.selected) classes.push('is-picked');
          if (hops.has(square)) classes.push('is-hop');
          if (chain.has(square)) classes.push('is-step');
          if (route.has(square)) classes.push('is-route');
          if (doomed.has(square)) classes.push('is-doomed');
          if (square === marks.lastFrom) classes.push('is-lastfrom');
          if (square === marks.lastTo) classes.push('is-lastto');
          if (movers.has(square)) classes.push('is-mover');

          const hidden = (flyer !== null && square === flyer.from) || square === dragged;
          return (
            <div
              key={key}
              className={classes.join(' ')}
              data-square={square}
              role="gridcell"
              aria-label={String(square)}
              onPointerDown={(event) => {
                if (!interactive || !side) return;
                setDrag({
                  square,
                  x: event.clientX,
                  y: event.clientY,
                  ox: event.clientX,
                  oy: event.clientY,
                  moved: false,
                });
              }}
              onPointerUp={(event) => {
                if (!interactive) return;
                onPick(released(event, square));
              }}
            >
              <span className="dc-num" aria-hidden="true">
                {square}
              </span>
              {side && !hidden ? (
                <Piece
                  side={side}
                  king={isKing(cell)}
                  className={fading.has(square) ? 'is-taken' : ''}
                />
              ) : null}
              {hops.has(square) ? <span className="dc-target" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>

      {flyer && flyerAt && flyerFrom ? (
        <span
          className="dc-flyer"
          style={
            {
              left: `${flyerFrom.col * 10}%`,
              top: `${flyerFrom.row * 10}%`,
              '--dx': `${(flyerAt.col - flyerFrom.col) * 100}%`,
              '--dy': `${(flyerAt.row - flyerFrom.row) * 100}%`,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <Piece side={flyer.side} king={flyer.king} />
        </span>
      ) : null}
      </div>

      {dragged !== null && drag ? (
        <span className="dc-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Piece side={sideOf(board[dragged - 1] ?? 0) ?? 'w'} king={isKing(board[dragged - 1] ?? 0)} />
        </span>
      ) : null}
    </div>
  );
}
