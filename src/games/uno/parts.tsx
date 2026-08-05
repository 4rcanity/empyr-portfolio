import type { CSSProperties } from 'react';
import { logText, type Copy } from './copy';
import { FACE_GLYPH, type Card, type LogLine, type PlayerView, type Side } from './protocol';

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
}: {
  side: Side;
  width?: string;
  live?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const glyph = FACE_GLYPH[side.face] ?? side.face;
  const style = { '--w': width ?? '4.6rem' } as CSSProperties;
  const body = (
    <>
      <span className="un-corner" data-at="tl">{glyph}</span>
      <span className="un-glyph">{glyph}</span>
      <span className="un-corner" data-at="br">{glyph}</span>
    </>
  );

  if (!onClick) {
    return (
      <div className="un-card" data-color={side.color} style={style} aria-label={label}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="un-card"
      data-color={side.color}
      data-live={live ? 'true' : 'false'}
      style={style}
      disabled={!live}
      onClick={onClick}
      aria-label={label}
    >
      {body}
    </button>
  );
}

export function CardBack({ width }: { width?: string }) {
  return (
    <div className="un-card un-back" style={{ '--w': width ?? '4.6rem' } as CSSProperties}>
      <span className="un-glyph">UNO</span>
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

/** Your hand, fanned out and scrollable. */
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
  return (
    <div className="un-hand">
      {hand.map((card) => {
        const face = side === 'dark' && card.b ? card.b : card.a;
        return (
          <CardFace
            key={card.id}
            side={face}
            width="clamp(4.2rem, 11vw, 5.4rem)"
            live={playable(card)}
            onClick={() => onPlay(card)}
            label={`${face.color} ${face.face}`}
          />
        );
      })}
    </div>
  );
}
