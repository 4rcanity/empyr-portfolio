import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { CELLS, NEST, TILE, TRACK_PATH, cellAt, pawnSpot } from './board';
import { counts, fill, logText, place, type Copy } from './copy';
import {
  GOAL,
  isPenalty,
  type LogLine,
  type PlayerView,
  type RoomView,
  type SquareKind,
  type TurnReport,
} from './protocol';

/** Heritage inks — game pieces, deliberately outside the single-accent UI palette. */
export const PAWN_INKS = ['#b3401f', '#2f4f6e', '#4b6b34', '#8a6a1f', '#6b3a5c', '#3f4a52'];

export function inkFor(seat: number): string {
  return PAWN_INKS[seat % PAWN_INKS.length];
}

/* ------------------------------------------------------------------ glyphs */

/** Engraved linework, drawn in a 20 x 20 box so it can be scaled anywhere. */
export function Glyph({ kind }: { kind: SquareKind }) {
  switch (kind) {
    case 'goose':
    case 'goal':
      return (
        <g className="gl">
          <ellipse cx="8.6" cy="13.2" rx="5.4" ry="3.7" className="gl-fill" />
          <path d="M12.2 10.8C13.6 8.4 12.4 5.2 14.3 4" className="gl-line gl-thick" />
          <circle cx="14.6" cy="3.5" r="1.8" className="gl-fill" />
          <path d="M16.2 3.1 18.9 4 16.2 4.9Z" className="gl-fill" />
          <path d="M5.4 12.2C7.2 9.8 10.4 10 11.6 12.4" className="gl-line" />
          <path d="M3.4 12.4 0.9 10.7" className="gl-line" />
          <path d="M6.6 16.6 6 18.6M10.4 16.8 10 18.7" className="gl-line" />
        </g>
      );
    case 'bridge':
      return (
        <g className="gl">
          <path d="M1.5 13.5C4 6.5 16 6.5 18.5 13.5" className="gl-line gl-thick" />
          <path d="M0.8 13.6H19.2" className="gl-line gl-thick" />
          <path d="M4.4 13.5V10.2M10 13.5V8.4M15.6 13.5V10.2" className="gl-line" />
          <path d="M1 16.6C3 15.6 4.4 17.4 6.4 16.4M7.4 16.6c2-1 3.4.8 5.4-.2M13.8 16.6c2-1 3.4.8 5.4-.2" className="gl-line" />
        </g>
      );
    case 'inn':
      return (
        <g className="gl">
          <path d="M4.6 7.4h8.6v8.2a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2Z" className="gl-fill" />
          <path d="M13.4 9.4h2.4a2.2 2.2 0 0 1 0 4.4h-2.4" className="gl-line gl-thick" />
          <path d="M5.2 6.6c1.2-1.4 2.4.6 3.6-.6s2.4 1.2 3.8-.2" className="gl-line" />
          <path d="M6.8 10.4v4.4M9.4 10.4v4.4" className="gl-line gl-pale" />
        </g>
      );
    case 'well':
      return (
        <g className="gl">
          <path d="M2.6 6.6 10 2.4l7.4 4.2" className="gl-line gl-thick" />
          <path d="M5 9.4h10v6.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" className="gl-fill" />
          <ellipse cx="10" cy="9.4" rx="5" ry="1.7" className="gl-line gl-thick" />
          <path d="M10 3.4v5" className="gl-line" />
          <path d="M8.4 12.2h3.2v2.4H8.4Z" className="gl-line" />
        </g>
      );
    case 'maze':
      return (
        <g className="gl">
          <path
            d="M18 18H2V2h16v12.4H5.6V5.6h9v6.2H8.4v2.4"
            className="gl-line gl-thick"
            fill="none"
          />
        </g>
      );
    case 'prison':
      return (
        <g className="gl">
          <path d="M2.6 5.4h14.8v12.2H2.6Z" className="gl-fill" />
          <path d="M1.6 4.2h16.8" className="gl-line gl-thick" />
          <path d="M6.2 6.4v10M10 6.4v10M13.8 6.4v10" className="gl-line gl-thick gl-cut" />
        </g>
      );
    case 'death':
      return (
        <g className="gl">
          <path d="M10 2.2c4.2 0 6.6 3 6.6 6.6 0 2.4-1 3.6-1 5H4.4c0-1.4-1-2.6-1-5C3.4 5.2 5.8 2.2 10 2.2Z" className="gl-fill" />
          <circle cx="7.2" cy="8.4" r="1.9" className="gl-cut" />
          <circle cx="12.8" cy="8.4" r="1.9" className="gl-cut" />
          <path d="M10 10.6 8.8 13h2.4Z" className="gl-cut" />
          <path d="M5.6 15.2h8.8v2.4H5.6Z" className="gl-fill" />
          <path d="M8 15.4v2.2M10 15.4v2.2M12 15.4v2.2" className="gl-line gl-cut" />
        </g>
      );
    case 'start':
      return (
        <g className="gl">
          <path d="M2.6 11.4c1.6 4.4 5.2 6 7.4 6s5.8-1.6 7.4-6" className="gl-line gl-thick" />
          <ellipse cx="7" cy="10.6" rx="2.2" ry="2.6" className="gl-fill" />
          <ellipse cx="12.4" cy="10.8" rx="2.2" ry="2.6" className="gl-fill" />
          <path d="M1.6 10.4c3-1.6 5-2.6 8.4-2.6s5.4 1 8.4 2.6" className="gl-line" />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------- board */

interface BoardProps {
  copy: Copy;
  players: PlayerView[];
  /** Square each pawn is drawn on right now — mid-animation this trails the truth. */
  shown: Map<string, number>;
  activeId: string | null;
  youId: string;
  /** Zoomed camera following the pawn in play, for small screens. */
  follow: boolean;
  focusSquare: number;
  highlight: number | null;
}

export function Board({
  copy,
  players,
  shown,
  activeId,
  youId,
  follow,
  focusSquare,
  highlight,
}: BoardProps) {
  const camera = useMemo<CSSProperties>(() => {
    if (!follow) return { transform: 'translate(0px, 0px) scale(1)' };
    const cell = cellAt(focusSquare);
    const k = 2.4;
    // Keep the zoom window inside the sheet so the paper never shows a void.
    const clamp = (v: number) => Math.min(100 * (k - 1), Math.max(0, v));
    const tx = clamp(k * cell.x - 50);
    const ty = clamp(k * cell.y - 50);
    return { transform: `translate(${-tx}px, ${-ty}px) scale(${k})` };
  }, [follow, focusSquare]);

  const crowds = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const player of players) {
      const square = shown.get(player.id) ?? player.pos;
      const list = map.get(square) ?? [];
      list.push(player.id);
      map.set(square, list);
    }
    return map;
  }, [players, shown]);

  return (
    <svg
      className="gb-sheet"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${copy.boardTitle} — 63`}
    >
      <defs>
        <radialGradient id="gb-paper" cx="42%" cy="34%" r="82%">
          <stop offset="0%" stopColor="#f6ead0" />
          <stop offset="58%" stopColor="#ecdcbb" />
          <stop offset="100%" stopColor="#d8c39c" />
        </radialGradient>
        <filter id="gb-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.36  0 0 0 0 0.26  0 0 0 0 0.14  0 0 0 0.42 0"
          />
        </filter>
        <filter id="gb-fibre" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="turbulence" baseFrequency="0.04 0.6" numOctaves="2" seed="19" />
          <feDisplacementMap in="SourceGraphic" scale="0.5" />
        </filter>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#gb-paper)" />
      <rect x="0" y="0" width="100" height="100" filter="url(#gb-grain)" className="gb-grain" />

      <g className="gb-camera" style={camera}>
        <g filter="url(#gb-fibre)">
          <path d={TRACK_PATH} className="gb-track-under" />
          <path d={TRACK_PATH} className="gb-track" />
        </g>

        {/* the nest, outside square 1 */}
        <g className="gb-tile is-start" transform={`translate(${NEST.x} ${NEST.y})`}>
          <circle r={TILE * 0.66} className="gb-nest" />
          <g transform={`translate(-1.75 -1.9) scale(0.175)`}>
            <Glyph kind="start" />
          </g>
        </g>

        {CELLS.map((cell) => {
          const special = cell.kind !== 'plain';
          return (
            <g
              key={cell.n}
              className={`gb-tile is-${cell.kind}${highlight === cell.n ? ' is-lit' : ''}`}
              transform={`translate(${cell.x.toFixed(2)} ${cell.y.toFixed(2)})`}
            >
              <g transform={`rotate(${cell.angle.toFixed(1)})`}>
                <rect
                  x={-TILE / 2}
                  y={-TILE / 2}
                  width={TILE}
                  height={TILE}
                  rx="0.7"
                  className="gb-face"
                />
              </g>
              {special && (
                <g transform={`translate(-1.85 ${cell.n === GOAL ? -2.3 : -2.5}) scale(0.185)`}>
                  <Glyph kind={cell.kind} />
                </g>
              )}
              <text
                className={`gb-num${special ? ' is-small' : ''}`}
                x="0"
                y={special ? 2.55 : 0.95}
              >
                {cell.n}
              </text>
            </g>
          );
        })}

        <g className="gb-heart">
          <circle cx="50" cy="50" r="3.5" className="gb-heart-ring" />
          <g transform="translate(47.8 47.8) scale(0.22)">
            <Glyph kind="goose" />
          </g>
        </g>

        {players.map((player) => {
          const square = shown.get(player.id) ?? player.pos;
          const crowd = crowds.get(square) ?? [player.id];
          const spot = pawnSpot(square, crowd.indexOf(player.id), crowd.length);
          const ink = inkFor(player.seat);
          return (
            <g
              key={player.id}
              className={`gb-pawn${player.id === activeId ? ' is-active' : ''}${
                player.id === youId ? ' is-you' : ''
              }${player.stuck ? ' is-stuck' : ''}`}
              style={{ transform: `translate(${spot.x.toFixed(2)}px, ${spot.y.toFixed(2)}px)` }}
            >
              <ellipse cy="1.5" rx="1.5" ry="0.5" className="gb-pawn-shadow" />
              <path
                d="M0 -3.1a1.05 1.05 0 0 1 0.62 1.9c0.9 0.5 1.5 1.7 1.62 2.9h-4.48c0.12 -1.2 0.72 -2.4 1.62 -2.9A1.05 1.05 0 0 1 0 -3.1Z"
                fill={ink}
                className="gb-pawn-body"
              />
              <title>{`${player.name} — ${square === 0 ? copy.nest : `${copy.square} ${square}`}`}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------- dice */

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [30, 26],
    [70, 26],
    [30, 50],
    [70, 50],
    [30, 74],
    [70, 74],
  ],
};

export function Die({ face, rolling }: { face: number; rolling: boolean }) {
  return (
    <svg className={`gb-die${rolling ? ' is-rolling' : ''}`} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="4" y="4" width="92" height="92" rx="16" className="gb-die-face" />
      {(PIPS[face] ?? PIPS[1]).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8.5" className="gb-pip" />
      ))}
    </svg>
  );
}

export function Dice({
  dice,
  rolling,
  label,
}: {
  dice: [number, number] | null;
  rolling: boolean;
  label: string;
}) {
  const shown = dice ?? [1, 1];
  return (
    <div className="gb-dice">
      <span className="gb-dice-label">{label}</span>
      <Die face={shown[0]} rolling={rolling} />
      <Die face={shown[1]} rolling={rolling} />
      <span className="gb-dice-total">{dice ? dice[0] + dice[1] : '—'}</span>
    </div>
  );
}

/* -------------------------------------------------------------------- rail */

export function Rail({
  copy,
  room,
  youId,
  shown,
}: {
  copy: Copy;
  room: RoomView;
  youId: string;
  shown: Map<string, number>;
}) {
  return (
    <ul className="gb-rail">
      {room.players.map((player) => {
        const square = shown.get(player.id) ?? player.pos;
        return (
          <li
            key={player.id}
            className={`gb-seat${player.id === room.activeId ? ' is-active' : ''}${
              player.online ? '' : ' is-away'
            }`}
          >
            <span className="gb-chip" style={{ background: inkFor(player.seat) }} aria-hidden="true" />
            <span className="gb-seat-name">
              {player.name}
              {player.id === youId && <em> · {copy.you}</em>}
              {player.host && <b> {copy.hostTag}</b>}
            </span>
            <span className="gb-seat-pos">{square === 0 ? copy.nest : square}</span>
            {player.stuck && <span className="gb-tag is-bad">{copy.held}</span>}
            {player.skips > 0 && (
              <span className="gb-tag is-warn">
                {copy.waits} {player.skips}
              </span>
            )}
            {!player.online && <span className="gb-tag">{copy.away}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------- feed */

export function Feed({ copy, log }: { copy: Copy; log: LogLine[] }) {
  const box = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <div className="gb-feed">
      <h3>{copy.feed}</h3>
      <ol ref={box} aria-live="polite">
        {log.map((line) => (
          <li key={line.id} className={`tone-${line.tone}`}>
            {logText(line, copy)}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ legend */

const LEGEND: { kind: SquareKind; squares: string }[] = [
  { kind: 'goose', squares: '5 · 9 · 14 · 18 · 23 · 27 · 32 · 36 · 41 · 45 · 50 · 54' },
  { kind: 'bridge', squares: '6' },
  { kind: 'inn', squares: '19' },
  { kind: 'well', squares: '31' },
  { kind: 'maze', squares: '42' },
  { kind: 'prison', squares: '52' },
  { kind: 'death', squares: '58' },
  { kind: 'goal', squares: '63' },
];

export function Legend({ copy }: { copy: Copy }) {
  return (
    <div className="gb-legend">
      <h3>{copy.legend}</h3>
      <ul>
        {LEGEND.map((row) => (
          <li key={row.kind}>
            <svg viewBox="0 0 20 20" className={`gb-mini is-${row.kind}`} aria-hidden="true">
              <Glyph kind={row.kind} />
            </svg>
            <span>
              <b>{copy.squares[row.kind].name}</b>
              <i>{copy.squares[row.kind].other}</i>
            </span>
            <em>{row.squares}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------- the punishment window */

export interface PunishView {
  turn: TurnReport;
  /** True when the pawn that got hit is the reader's own. */
  mine: boolean;
}

export function PunishWindow({
  copy,
  view,
  onClose,
}: {
  copy: Copy;
  view: PunishView;
  onClose: () => void;
}) {
  const punish = view.turn.punishment;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!punish || !isPenalty(punish.kind)) return null;
  const event = copy.events[punish.kind as keyof Copy['events']];
  const from = view.turn.hops.find((hop) => hop.to === punish.square)?.to ?? punish.square;
  const args = {
    a: view.turn.playerName,
    n: punish.kind === 'inn' ? (punish.turns ?? 1) : place(copy, punish.landsOn),
    m: Math.abs(punish.square - punish.landsOn),
    ...counts(copy, punish.turns ?? 1),
  };

  return (
    <div className="gb-scrim" role="presentation" onClick={onClose}>
      <div
        className={`gb-window is-${punish.kind}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="gb-window-title"
        onClick={(event_) => event_.stopPropagation()}
      >
        <div className="gb-window-plate">
          <svg viewBox="0 0 20 20" className="gb-plate-art" aria-hidden="true">
            <Glyph kind={punish.kind} />
          </svg>
          <span className="gb-plate-no">{punish.square}</span>
        </div>

        <div className="gb-window-body">
          <p className="gb-window-eyebrow">
            {copy.punishTitle} · {fill(copy.punishFor, { n: punish.square })}
          </p>
          <h2 id="gb-window-title">{event.name}</h2>
          <p className="gb-window-other">{event.other}</p>
          <p className="gb-window-head">{fill(event.head, args)}</p>

          <dl className="gb-window-facts">
            <dt>{copy.whatHappens}</dt>
            <dd>{fill(event.what, args)}</dd>
            <dt>{copy.howLong}</dt>
            <dd>{fill(event.how, args)}</dd>
            <dt>{view.mine ? copy.yourPawn : fill(copy.theirPawn, { a: view.turn.playerName })}</dt>
            <dd>
              {punish.landsOn === from
                ? fill(copy.pawnStays, { a: punish.square })
                : fill(copy.pawnMoved, { a: punish.square, b: place(copy, punish.landsOn) })}
              {punish.landsOn !== from && (
                <span className="gb-hop">
                  <b>{punish.square}</b>
                  <i aria-hidden="true">→</i>
                  <b>{punish.landsOn === 0 ? copy.nest : punish.landsOn}</b>
                </span>
              )}
            </dd>
            {punish.company && punish.company.length > 0 && (
              <>
                <dt>{copy.company}</dt>
                <dd>
                  {punish.company.join(', ')}
                  {view.turn.rescue ? ` — ${copy.freedNow}` : ''}
                </dd>
              </>
            )}
          </dl>

          <p className="gb-window-flavour">{event.flavour}</p>

          <div className="gb-window-foot">
            <button type="button" className="gb-btn" ref={closeRef} onClick={onClose}>
              {copy.dismiss}
            </button>
            <span className="gb-window-note">{copy.autoClose}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The compact version everybody else sees. */
export function Ticker({
  copy,
  items,
}: {
  copy: Copy;
  items: { id: string; kind: SquareKind | 'rescue' | 'goose' | 'bridge' | 'bounce' | 'opening' | 'swap'; text: string; onOpen?: () => void }[];
}) {
  return (
    <div className="gb-ticker" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`gb-news is-${item.kind}`}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <Glyph kind={(item.kind === 'rescue' ? 'well' : item.kind) as SquareKind} />
          </svg>
          <p>{item.text}</p>
          {item.onOpen && (
            <button type="button" className="gb-btn is-ghost is-tiny" onClick={item.onOpen}>
              {copy.details}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}