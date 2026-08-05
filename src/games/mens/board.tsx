import type { CSSProperties } from 'react';
import type { Copy } from './copy';
import {
  CORNER_COLORS,
  HOME_CELLS,
  HOME_LAST,
  RING,
  RING_CELLS,
  START_SQUARE,
  YARD_CELLS,
  YARD_ORIGIN,
  cellFor,
  ringOwner,
  type Cell,
  type MoveOption,
  type PlayerView,
} from './protocol';

/** A pawn currently walking, so the board can hold it mid-journey. */
export interface Walker {
  id: string;
  pawn: number;
  pos: number;
}

interface BoardProps {
  players: PlayerView[];
  corners: number[];
  youId: string;
  activeId: string | null;
  copy: Copy;
  /** Moves the viewer may pick right now. Empty when it is not their choice. */
  options: MoveOption[];
  hint: number | null;
  onHint: (index: number | null) => void;
  onChoose: (index: number) => void;
  walker: Walker | null;
  /** Pawn being kicked back to its yard. */
  booted: { id: string; pawn: number } | null;
  /** Pawn that just finished a move, for the landing thump. */
  landed: { id: string; pawn: number } | null;
  shake: boolean;
}

function at(cell: Cell, extra?: CSSProperties): CSSProperties {
  return { '--x': cell.x, '--y': cell.y, ...extra } as CSSProperties;
}

export function Board({
  players,
  corners,
  youId,
  activeId,
  copy,
  options,
  hint,
  onHint,
  onChoose,
  walker,
  booted,
  landed,
  shake,
}: BoardProps) {
  const you = players.find((player) => player.id === youId) ?? null;
  const hinted = hint !== null ? options[hint] : null;

  return (
    <div className="mn-board-wrap" data-shake={shake ? 'true' : 'false'}>
      <div className="mn-board" role="group" aria-label={copy.tagline}>
        <div className="mn-tray" aria-hidden="true">
          <span className="mn-tray-face" />
          <span className="mn-tray-grain" />
        </div>

        {/* Yards ------------------------------------------------------- */}
        {CORNER_COLORS.map((color, corner) => {
          const open = corners.includes(corner);
          const owner = players.find((player) => player.corner === corner) ?? null;
          return (
            <div
              key={`yard-${corner}`}
              className="mn-yard"
              data-c={color}
              data-open={open ? 'true' : 'false'}
              data-corner={corner}
              style={at(YARD_ORIGIN[corner])}
            >
              <span className="mn-yard-face" aria-hidden="true" />
              {YARD_CELLS[corner].map((_, socket) => (
                <span key={socket} className="mn-socket" data-i={socket} aria-hidden="true" />
              ))}
              <span className="mn-yard-tag">
                {open ? (owner?.name ?? copy.yard) : copy.closedArm}
              </span>
            </div>
          );
        })}

        {/* Home columns ----------------------------------------------- */}
        {HOME_CELLS.map((cells, corner) =>
          cells.map((cell, depth) => (
            <span
              key={`home-${corner}-${depth}`}
              className="mn-home"
              data-c={CORNER_COLORS[corner]}
              data-open={corners.includes(corner) ? 'true' : 'false'}
              data-last={depth === cells.length - 1 ? 'true' : 'false'}
              style={at(cell)}
              aria-hidden="true"
            />
          )),
        )}

        {/* Shared ring ------------------------------------------------ */}
        {RING_CELLS.map((cell, square) => {
          const owner = ringOwner(square);
          const isStart = START_SQUARE.includes(square);
          const open = owner < 0 || corners.includes(owner);
          return (
            <span
              key={`ring-${square}`}
              className="mn-square"
              data-c={owner >= 0 && open ? CORNER_COLORS[owner] : 'none'}
              data-role={isStart ? 'start' : owner >= 0 ? 'gate' : 'plain'}
              style={at(cell)}
              aria-hidden="true"
            >
              <span className="mn-square-face" />
            </span>
          );
        })}

        <span className="mn-centre" style={at({ x: 5, y: 5 })} aria-hidden="true">
          <span className="mn-centre-face" />
        </span>

        {/* Pawns ------------------------------------------------------ */}
        {players.map((player) =>
          player.pawns.map((pos, pawn) => {
            const walking = walker && walker.id === player.id && walker.pawn === pawn;
            const shown = walking ? walker.pos : pos;
            const cell = cellFor(player.corner, shown, pawn);
            const mine = player.id === youId;
            const choice = options.findIndex((option) => option.pawn === pawn);
            const pickable = mine && choice >= 0;
            const isBooted = booted?.id === player.id && booted.pawn === pawn;
            const isLanded = landed?.id === player.id && landed.pawn === pawn;

            return (
              <button
                key={`${player.id}-${pawn}`}
                type="button"
                className="mn-pawn"
                data-c={player.color}
                data-mine={mine ? 'true' : 'false'}
                data-turn={player.id === activeId ? 'true' : 'false'}
                data-pick={pickable ? 'true' : 'false'}
                data-walk={walking ? 'true' : 'false'}
                data-boot={isBooted ? 'true' : 'false'}
                data-land={isLanded ? 'true' : 'false'}
                data-home={shown >= RING ? 'true' : 'false'}
                data-lit={hinted && pickable && options[choice] === hinted ? 'true' : 'false'}
                style={at(cell, { zIndex: walking || isBooted ? 40 : 20 })}
                disabled={!pickable}
                onClick={() => pickable && onChoose(choice)}
                onMouseEnter={() => pickable && onHint(choice)}
                onMouseLeave={() => pickable && onHint(null)}
                onFocus={() => pickable && onHint(choice)}
                onBlur={() => pickable && onHint(null)}
                aria-label={`${player.name} — ${copy.pawn} ${pawn + 1}`}
              >
                <span className="mn-pawn-cast" aria-hidden="true" />
                <span className="mn-pawn-body" aria-hidden="true">
                  <span className="mn-pawn-gloss" />
                  <span className="mn-pawn-num">{pawn + 1}</span>
                </span>
              </button>
            );
          }),
        )}

        {/* Destination markers --------------------------------------- */}
        {you &&
          options.map((option, index) => {
            const cell = cellFor(you.corner, option.to, option.pawn);
            return (
              <button
                key={`target-${option.pawn}-${option.to}`}
                type="button"
                className="mn-target"
                data-c={you.color}
                data-hit={option.capture ? 'true' : 'false'}
                data-lit={hint === index ? 'true' : 'false'}
                style={at(cell, { zIndex: 30 })}
                onClick={() => onChoose(index)}
                onMouseEnter={() => onHint(index)}
                onMouseLeave={() => onHint(null)}
                onFocus={() => onHint(index)}
                onBlur={() => onHint(null)}
                aria-label={`${copy.targetLabel} — ${copy.pawn} ${option.pawn + 1}`}
              >
                <span className="mn-target-ring" aria-hidden="true" />
                <span className="mn-target-num">{option.pawn + 1}</span>
                {option.capture && (
                  <span className="mn-target-hit" aria-hidden="true">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}

/** Human-readable description of a move, used by the choice buttons. */
export function moveLabel(option: MoveOption, players: PlayerView[], copy: Copy): string {
  const victim = option.capture
    ? players.find((player) => player.id === option.capture?.playerId)?.name
    : null;

  let base: string;
  if (option.kind === 'enter') base = copy.optEnter;
  else if (option.to === HOME_LAST) base = copy.optFinish;
  else if (option.to >= RING) base = copy.optHome;
  else base = copy.optSteps.replace('{n}', String(option.to - option.from));

  return victim ? `${base} ${copy.optCapture.replace('{name}', victim)}` : base;
}
