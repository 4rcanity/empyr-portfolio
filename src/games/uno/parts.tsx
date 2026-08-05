import type { CSSProperties, ReactNode } from 'react';
import { logText, type Copy } from './copy';
import {
  FACE_GLYPH,
  type Card,
  type Color,
  type FxKind,
  type LogLine,
  type PlayerView,
  type Side,
} from './protocol';

/** Deterministic hue so each seat keeps a stable identity colour. */
export function hueFor(seat: number): number {
  return (seat * 47 + 12) % 360;
}

export function initials(name: string): string {
  const clean = name.trim();
  return clean ? clean.slice(0, 2).toUpperCase() : '??';
}

/* -------------------------------------------------------------------- cards */

export function CardFace({
  side,
  width,
  live,
  onClick,
  label,
  style,
  className,
}: {
  side: Side;
  width?: string;
  live?: boolean;
  onClick?: () => void;
  label?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const glyph = FACE_GLYPH[side.face] ?? side.face;
  const box = { '--w': width ?? '4.6rem', ...style } as CSSProperties;
  const body = (
    <>
      <span className="un-corner" data-at="tl">{glyph}</span>
      <span className="un-glyph">{glyph}</span>
      <span className="un-corner" data-at="br">{glyph}</span>
    </>
  );
  const classes = `un-card${className ? ` ${className}` : ''}`;

  if (!onClick) {
    return (
      <div className={classes} data-color={side.color} style={box} aria-label={label} role={label ? 'img' : undefined}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      data-color={side.color}
      data-live={live ? 'true' : 'false'}
      style={box}
      disabled={!live}
      onClick={onClick}
      aria-label={label}
    >
      {body}
    </button>
  );
}

export function CardBack({
  width,
  style,
  className,
}: {
  width?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`un-card un-back${className ? ` ${className}` : ''}`}
      style={{ '--w': width ?? '4.6rem', ...style } as CSSProperties}
      aria-hidden="true"
    >
      <span className="un-glyph">E</span>
    </div>
  );
}

/* ----------------------------------------------------------------- seating */

export interface SeatSlot {
  player: PlayerView;
  /** Percent of the arena box. */
  x: number;
  y: number;
  /** Signed offset from the bottom of the ring, -180..180. */
  lean: number;
  me: boolean;
  /** Turn distance from you: 0 = you, 1 = acts next. */
  step: number;
}

/**
 * Seats everybody around an ellipse with you pinned to the bottom-left plate
 * and the remaining players laid out in true turn order.
 *
 * The arc deliberately narrows for small tables so three players read as a
 * triangle rather than two lonely chairs at the far ends of a ten-seat ring.
 */
export function ringSeats(
  players: PlayerView[],
  youId: string,
  direction: 1 | -1,
): SeatSlot[] {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const count = ordered.length;
  if (count === 0) return [];

  const mine = Math.max(0, ordered.findIndex((p) => p.id === youId));
  const others: PlayerView[] = [];
  for (let step = 1; step < count; step += 1) {
    const index = (mine + step * direction + count * count) % count;
    others.push(ordered[index]);
  }

  const k = others.length;
  // Widen the arc as the table fills; never wrap into the bottom hand zone.
  const span = Math.min(300, k * 70 + 60);
  const stepDeg = k > 0 ? span / k : 0;

  const RX = 41;
  const RY = 33;
  const CY = 45;

  const slots: SeatSlot[] = others.map((player, i) => {
    const lean = 180 - span / 2 + (i + 0.5) * stepDeg;
    const screen = ((90 + direction * lean) * Math.PI) / 180;
    return {
      player,
      x: Math.max(10, Math.min(90, 50 + RX * Math.cos(screen))),
      y: CY + RY * Math.sin(screen),
      lean: direction * (lean > 180 ? lean - 360 : lean),
      me: false,
      step: i + 1,
    };
  });

  const you = ordered[mine];
  if (you) {
    slots.unshift({ player: you, x: 11, y: 84, lean: 0, me: true, step: 0 });
  }
  return slots;
}

/** How many backs we actually draw for a hand of `n` — No Mercy hands get huge. */
export function fanCount(n: number): number {
  return Math.min(n, 7);
}

function Avatar({ player, hue }: { player: PlayerView; hue: number }) {
  return (
    <span className="un-avatar" style={{ '--hue': String(hue) } as CSSProperties} aria-hidden="true">
      <span className="un-avatar-visor" />
      <span className="un-avatar-ink">{initials(player.name)}</span>
    </span>
  );
}

export function Seat({
  slot,
  activeId,
  copy,
  clockPct,
  seconds,
  onCatch,
}: {
  slot: SeatSlot;
  activeId: string | null;
  copy: Copy;
  clockPct: number;
  seconds: number;
  onCatch?: (id: string) => void;
}) {
  const player = slot.player;
  const active = player.id === activeId && !player.out;
  const hue = hueFor(player.seat);
  const half = slot.y < 46 ? 'top' : 'bottom';
  const backs = fanCount(player.cards);

  const state = [
    active ? copy.seatActive : null,
    player.out ? copy.knockedOut : null,
    player.uno ? 'UNO' : null,
    player.exposed ? copy.seatExposed : null,
    !player.online ? copy.seatAway : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article
      className="un-seat"
      data-active={active}
      data-out={player.out}
      data-you={slot.me}
      data-half={half}
      data-uno={player.uno}
      data-exposed={player.exposed && !player.out}
      data-away={!player.online}
      style={
        {
          '--xn': slot.x.toFixed(2),
          '--yn': slot.y.toFixed(2),
          '--hue': String(hue),
          '--lean': `${Math.max(-26, Math.min(26, slot.lean * 0.22))}deg`,
        } as CSSProperties
      }
      aria-label={`${player.name}, ${player.cards} ${copy.seatCards}${state ? `, ${state}` : ''}`}
    >
      <span className="un-fan3d" aria-hidden="true">
        {Array.from({ length: backs }).map((_, i) => (
          <i key={i} style={{ '--i': String(i - (backs - 1) / 2) } as CSSProperties} />
        ))}
      </span>

      <div className="un-plate">
        <Avatar player={player} hue={hue} />
        <span className="un-plate-body">
          <span className="un-nametab">
            {player.name}
            {slot.me && <b> · {copy.seatYou}</b>}
          </span>
          <span className="un-plate-meta">
            {player.host && <span className="un-tag" data-k="host">{copy.hostTag}</span>}
            {!player.online && <span className="un-tag" data-k="off">{copy.seatAway}</span>}
            {player.score > 0 && (
              <span className="un-tag" data-k="score">
                {player.score} {copy.points}
              </span>
            )}
          </span>
        </span>
        <span className="un-count" data-uno={player.cards === 1}>
          {player.cards}
        </span>

        {active && (
          <span className="un-seat-clock" aria-hidden="true">
            <i style={{ '--pct': `${clockPct}%` } as CSSProperties} data-warn={seconds <= 7} />
          </span>
        )}
      </div>

      {player.out && <span className="un-stamp" data-k="out">{copy.knockedOut}</span>}
      {player.uno && !player.out && <span className="un-stamp" data-k="uno">UNO</span>}

      {onCatch && player.exposed && !slot.me && !player.out && (
        <button type="button" className="un-catch" onClick={() => onCatch(player.id)}>
          {copy.catchBtn}
        </button>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------- table */

/** The draw pile, drawn as a real stack with visible thickness. */
export function Deck({ left, width }: { left: number; width: string }) {
  const layers = Math.max(1, Math.min(6, Math.ceil(left / 12)));
  return (
    <span className="un-deck3d" aria-hidden="true">
      {Array.from({ length: layers }).map((_, i) => (
        <CardBack
          key={i}
          width={width}
          className="un-deck-layer"
          style={{ '--d': String(layers - 1 - i) } as CSSProperties}
        />
      ))}
    </span>
  );
}

export interface PileCard {
  key: number;
  side: Side;
  rot: number;
  dx: number;
  dy: number;
}

/** The discard pile: earlier cards scattered at angles beneath the live one. */
export function Discard({ pile, width, label }: { pile: PileCard[]; width: string; label: string }) {
  if (pile.length === 0) {
    return <CardBack width={width} className="un-pile-card" />;
  }
  return (
    <span className="un-discard3d">
      {pile.map((card, i) => {
        const top = i === pile.length - 1;
        return (
          <CardFace
            key={card.key}
            side={card.side}
            width={width}
            className={top ? 'un-pile-card un-pile-top' : 'un-pile-card'}
            label={top ? label : undefined}
            style={
              {
                '--rot': `${card.rot}deg`,
                '--dx': `${card.dx}px`,
                '--dy': `${card.dy}px`,
                '--z': String(i),
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

/** The two sweeping arrows that show whose way play is going. */
export function DirectionArrows({ direction, spin }: { direction: 1 | -1; spin: boolean }) {
  return (
    <span className="un-arrows" data-dir={direction} data-spin={spin} aria-hidden="true">
      <svg viewBox="0 0 200 200" role="presentation" focusable="false">
        <defs>
          <linearGradient id="un-arrow-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff9ecb" />
            <stop offset="100%" stopColor="#ff3d8b" />
          </linearGradient>
          <linearGradient id="un-arrow-b" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#9b4dff" />
            <stop offset="100%" stopColor="#6fd7ff" />
          </linearGradient>
        </defs>
        <g className="un-arrow-g">
          <path
            d="M 73.3 26.7 A 78 78 0 0 1 173.3 73.3"
            fill="none"
            stroke="url(#un-arrow-a)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path d="M 180.8 93.9 L 184.6 69.2 L 162.0 77.4 Z" fill="#ff3d8b" />
          <path
            d="M 126.7 173.3 A 78 78 0 0 1 26.7 126.7"
            fill="none"
            stroke="url(#un-arrow-b)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path d="M 19.2 106.1 L 15.4 130.8 L 38.0 122.6 Z" fill="#6fd7ff" />
        </g>
      </svg>
    </span>
  );
}

/* ---------------------------------------------------------------- fx layer */

export interface FxEvent {
  id: number;
  kind: FxKind;
  playerId?: string;
  text?: string;
  /** Origin in ring percent — resolved when the event is queued. */
  x: number;
  y: number;
  /** Travel vector to the effect's destination, also in ring percent. */
  dx: number;
  dy: number;
  card?: Side;
}

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function FxBody({ event, copy }: { event: FxEvent; copy: Copy }): ReactNode {
  switch (event.kind) {
    case 'play':
      return (
        <>
          {event.card ? (
            <CardFace side={event.card} width="clamp(3.4rem, 7vw, 4.6rem)" className="un-fx-card" />
          ) : (
            <CardBack width="clamp(3.4rem, 7vw, 4.6rem)" className="un-fx-card" />
          )}
          <span className="un-fx-impact" />
        </>
      );
    case 'draw':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <CardBack
              key={i}
              width="clamp(2.6rem, 5vw, 3.4rem)"
              className="un-fx-drawcard"
              style={{ '--i': String(i) } as CSSProperties}
            />
          ))}
        </>
      );
    case 'skip':
      return (
        <>
          <span className="un-fx-slash" />
          <span className="un-fx-word">{copy.fx.skip}</span>
        </>
      );
    case 'reverse':
      return (
        <>
          <span className="un-fx-ring" />
          <span className="un-fx-word">{copy.fx.reverse}</span>
        </>
      );
    case 'wild':
      return <span className="un-fx-bloom" />;
    case 'flip':
      return (
        <>
          <span className="un-fx-flipcard" />
          <span className="un-fx-word">{copy.fx.flip}</span>
        </>
      );
    case 'blast':
      return (
        <>
          <span className="un-fx-burst" />
          {SPARKS.slice(0, 10).map((i) => (
            <i key={i} className="un-fx-shard" style={{ '--i': String(i) } as CSSProperties} />
          ))}
          <span className="un-fx-word">{copy.fx.blast}</span>
        </>
      );
    case 'uno':
      return (
        <>
          <span className="un-fx-ring" data-k="uno" />
          <span className="un-fx-shout">UNO</span>
        </>
      );
    case 'caught':
      return (
        <>
          <span className="un-fx-crack" />
          <span className="un-fx-word" data-k="bad">{copy.fx.caught}</span>
        </>
      );
    case 'swap':
      return (
        <>
          <span className="un-fx-swap" />
          <span className="un-fx-word">{copy.fx.swap}</span>
        </>
      );
    case 'out':
      return (
        <>
          <span className="un-fx-crack" data-k="hard" />
          <span className="un-fx-word" data-k="bad">{copy.fx.out}</span>
        </>
      );
    case 'round':
    case 'win':
      return (
        <>
          <span className="un-fx-rays" />
          {SPARKS.map((i) => (
            <i key={i} className="un-fx-confetti" style={{ '--i': String(i) } as CSSProperties} />
          ))}
          <span className="un-fx-shout" data-k="good">
            {event.text ?? (event.kind === 'win' ? copy.fx.win : copy.fx.round)}
          </span>
        </>
      );
    default:
      return null;
  }
}

export function FxLayer({ events, copy }: { events: FxEvent[]; copy: Copy }) {
  return (
    <div className="un-fxlayer" aria-hidden="true">
      {events.map((event) => (
        <span
          key={event.id}
          className="un-fx"
          data-k={event.kind}
          style={
            {
              '--fx-x': `${event.x}%`,
              '--fx-y': `${event.y}%`,
              '--dx': `${event.dx}cqw`,
              '--dy': `${event.dy}cqh`,
            } as CSSProperties
          }
        >
          <FxBody event={event} copy={copy} />
        </span>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- pods */

export function PlayerRail({
  players,
  activeId,
  youId,
  copy,
  lobby,
  onCatch,
}: {
  players: PlayerView[];
  activeId: string | null;
  youId: string;
  copy: Copy;
  lobby: boolean;
  onCatch?: (id: string) => void;
}) {
  return (
    <div className="un-rail" role="list">
      {players.map((player) => (
        <article
          key={player.id}
          role="listitem"
          className="un-pod"
          style={{ '--hue': String(hueFor(player.seat)) } as CSSProperties}
          data-active={player.id === activeId}
          data-out={player.out}
        >
          <div className="un-pod-top">
            <span className="un-face">{initials(player.name)}</span>
            <span className="un-pod-name">
              {player.name}
              {player.id === youId ? ' ·' : ''}
            </span>
          </div>

          <div className="un-pod-meta">
            {lobby ? (
              <span className="un-tag" data-k={player.ready ? 'ready' : 'wait'}>
                {player.ready ? copy.ready : '…'}
              </span>
            ) : player.out ? (
              <span className="un-tag" data-k="off">{copy.knockedOut}</span>
            ) : (
              <>
                <span className="un-fan" aria-hidden="true">
                  {Array.from({ length: Math.min(player.cards, 8) }).map((_, i) => (
                    <i key={i} />
                  ))}
                </span>
                <span>{player.cards}</span>
              </>
            )}
            {player.host && <span className="un-tag" data-k="host">Host</span>}
            {player.uno && <span className="un-tag" data-k="uno">UNO</span>}
            {!player.online && <span className="un-tag" data-k="off">off</span>}
            {!lobby && player.score > 0 && <span>{player.score} {copy.points}</span>}
          </div>

          {onCatch && player.exposed && player.id !== youId && !player.out && (
            <button type="button" className="un-catch" onClick={() => onCatch(player.id)}>
              {copy.catchBtn}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- feed */

export function Feed({ log, copy }: { log: LogLine[]; copy: Copy }) {
  return (
    <aside className="un-feed">
      <div className="un-eyebrow">{copy.feed}</div>
      <ul>
        {[...log].reverse().map((line) => (
          <li key={line.id} data-tone={line.tone}>
            {logText(line, copy)}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ------------------------------------------------------------------- scores */

export function Scores({
  players,
  copy,
  winnerId,
}: {
  players: PlayerView[];
  copy: Copy;
  winnerId: string | null;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <ul className="un-scores">
      {ranked.map((player) => (
        <li key={player.id} data-win={player.id === winnerId}>
          <span>{player.name}</span>
          <b>
            {player.score} {copy.points}
          </b>
        </li>
      ))}
    </ul>
  );
}

/** Your hand, arced along the bottom of the table. */
export function Hand({
  hand,
  side,
  playable,
  onPlay,
  copy,
}: {
  hand: Card[];
  side: 'light' | 'dark';
  playable: (card: Card) => boolean;
  onPlay: (card: Card) => void;
  copy: Copy;
}) {
  if (hand.length === 0) {
    return <p className="un-hint" style={{ padding: '1.4rem 0.2rem' }}>{copy.emptyHand}</p>;
  }

  const n = hand.length;
  // Tighten the fan as the hand grows, but never past the point where the
  // face is unreadable — a No Mercy hand scrolls instead.
  const spread = n <= 1 ? 0 : Math.min(3.4, 34 / n);
  const overlap = n <= 5 ? 0.1 : Math.min(1.15, (n - 5) * 0.14 + 0.1);
  const width =
    n <= 8
      ? 'clamp(3.9rem, 9.5vw, 5.6rem)'
      : n <= 14
        ? 'clamp(3.5rem, 8.2vw, 5rem)'
        : 'clamp(3.1rem, 7.2vw, 4.4rem)';

  return (
    <div className="un-hand" style={{ '--ov': `${overlap}rem` } as CSSProperties}>
      {hand.map((card, i) => {
        const face = side === 'dark' && card.b ? card.b : card.a;
        const offset = i - (n - 1) / 2;
        const rot = offset * spread;
        const lift = Math.abs(offset) * Math.abs(offset) * (spread * 0.06);
        const live = playable(card);
        return (
          <CardFace
            key={card.id}
            side={face}
            width={width}
            live={live}
            onClick={() => onPlay(card)}
            className="un-hand-card"
            label={`${copy.colors[face.color as Color] ?? face.color} ${
              copy.faces[face.face] ?? face.face
            }${live ? '' : ` — ${copy.notPlayable}`}`}
            style={
              {
                '--rot': `${rot}deg`,
                '--ty': `${lift}rem`,
                '--z': String(i),
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
