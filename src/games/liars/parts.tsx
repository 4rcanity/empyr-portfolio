import type { CSSProperties } from 'react';
import { logText, rankLabel, tableLabel, type Copy } from './copy';
import type { Card, LogLine, PlayerView, Rank, TableCard } from './protocol';

const HUES = [38, 12, 145, 95, 210, 280];

export function hueFor(seat: number): number {
  return HUES[seat % HUES.length];
}

export interface SeatSlot {
  player: PlayerView;
  x: number;
  y: number;
  me: boolean;
}

/** Lay seats on a circular rail; you pinned to the bottom. */
export function ringSeats(players: PlayerView[], youId: string): SeatSlot[] {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const count = ordered.length;
  if (count === 0) return [];

  const mine = Math.max(0, ordered.findIndex((p) => p.id === youId));
  const rotated: PlayerView[] = [];
  for (let step = 0; step < count; step += 1) {
    rotated.push(ordered[(mine + step) % count]);
  }

  const you = rotated[0];
  const others = rotated.slice(1);
  const k = others.length;
  const span = Math.min(300, Math.max(120, k * 55 + 40));
  const stepDeg = k > 0 ? span / k : 0;
  const RX = 38;
  const RY = 30;
  const CY = 42;

  const slots: SeatSlot[] = others.map((player, i) => {
    const lean = 180 - span / 2 + (i + 0.5) * stepDeg;
    const screen = ((90 + lean) * Math.PI) / 180;
    return {
      player,
      x: Math.max(12, Math.min(88, 50 + RX * Math.cos(screen))),
      y: CY + RY * Math.sin(screen),
      me: false,
    };
  });

  if (you) slots.unshift({ player: you, x: 50, y: 88, me: true });
  return slots;
}

/* ------------------------------------------------------------------ rail */

export function SeatRail({
  slots,
  activeId,
  youId,
  copy,
  lobby,
}: {
  slots: SeatSlot[];
  activeId: string | null;
  youId: string;
  copy: Copy;
  lobby: boolean;
}) {
  return (
    <div className="lb-rail" aria-label={copy.room}>
      {slots.map(({ player, x, y }) => (
        <article
          key={player.id}
          className="lb-seat"
          style={{ '--x': `${x}%`, '--y': `${y}%`, '--hue': String(hueFor(player.seat)) } as CSSProperties}
          data-active={player.id === activeId}
          data-dead={player.dead}
          data-self={player.id === youId}
          data-away={!player.online}
        >
          <div className="lb-seat-name">{player.name}</div>
          <div className="lb-seat-meta">
            {lobby ? (
              <span>{player.online ? '● online' : '○ away'}</span>
            ) : player.dead ? (
              <span className="lb-epitaph">R{player.diedRound}</span>
            ) : (
              <>
                <RevolverPips spent={player.spent} chambers={player.chambers} />
                <span className="lb-card-count">{player.cards}c</span>
              </>
            )}
          </div>
          <div className="lb-seat-tags">
            {player.host && <span className="lb-tag" data-k="host">Host</span>}
            {lobby && (
              <span className="lb-tag" data-k={player.ready ? 'ready' : 'wait'}>
                {player.ready ? copy.ready : '…'}
              </span>
            )}
            {!player.online && !lobby && <span className="lb-tag" data-k="off">off</span>}
            {player.dead && !lobby && <span className="lb-tag" data-k="dead">{copy.dead}</span>}
          </div>
        </article>
      ))}
    </div>
  );
}

function RevolverPips({ spent, chambers }: { spent: number; chambers: number }) {
  return (
    <span className="lb-pips" aria-hidden="true">
      {Array.from({ length: chambers }).map((_, i) => (
        <i key={i} data-spent={i < spent} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------- cards */

export function PlayingCard({
  card,
  copy,
  selected,
  disabled,
  onToggle,
  faceDown,
}: {
  card: Card;
  copy: Copy;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  faceDown?: boolean;
}) {
  const rank = card.rank;
  const Tag = onToggle ? 'button' : 'div';
  return (
    <Tag
      type={onToggle ? 'button' : undefined}
      className="lb-card"
      data-rank={rank}
      data-selected={selected ? 'true' : 'false'}
      data-down={faceDown ? 'true' : 'false'}
      disabled={disabled}
      onClick={onToggle}
    >
      {faceDown ? (
        <span className="lb-card-back" aria-hidden="true" />
      ) : (
        <>
          <span className="lb-card-rank">{rankLabel(rank, copy)}</span>
          <span className="lb-card-glyph">{rankGlyph(rank)}</span>
        </>
      )}
    </Tag>
  );
}

export function TableCardDisplay({ table, copy }: { table: TableCard; copy: Copy }) {
  return (
    <div className="lb-table-card" data-table={table}>
      <span className="lb-table-label">{copy.tableCard}</span>
      <span className="lb-table-rank">{tableLabel(table, copy)}</span>
      <span className="lb-table-glyph">{rankGlyph(table)}</span>
    </div>
  );
}

function rankGlyph(rank: Rank | TableCard): string {
  if (rank === 'king') return '♚';
  if (rank === 'queen') return '♛';
  if (rank === 'ace') return '♠';
  return '★';
}

/* ------------------------------------------------------------------- gun */

export function Gun({
  chamber,
  chambersTotal,
  spinning,
  fired,
  fatal,
}: {
  chamber: number;
  chambersTotal: number;
  spinning?: boolean;
  fired?: boolean;
  fatal?: boolean;
}) {
  const angle = chambersTotal > 0 ? (chamber / chambersTotal) * 360 : 0;
  return (
    <div className="lb-gun-wrap" data-spin={spinning ? 'true' : 'false'} data-fired={fired ? 'true' : 'false'} data-fatal={fatal ? 'true' : 'false'}>
      <svg className="lb-gun" viewBox="0 0 120 48" aria-hidden="true">
        <g className="lb-gun-body">
          <path d="M8 28 L52 28 L58 22 L92 22 L96 18 L112 18 L112 24 L96 24 L92 28 L58 28 L52 34 L8 34 Z" />
          <circle cx="28" cy="31" r="10" className="lb-gun-drum" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '28px 31px' }} />
          <rect x="6" y="26" width="6" height="10" rx="1" />
        </g>
      </svg>
      {fired && (
        <span className="lb-gun-flash" data-fatal={fatal ? 'true' : 'false'}>
          {fatal ? '●' : '○'}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- feed */

export function Feed({ log, copy }: { log: LogLine[]; copy: Copy }) {
  return (
    <aside className="lb-feed">
      <div className="lb-eyebrow">{copy.feed}</div>
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

/* ---------------------------------------------------------------- hand tray */

export function HandTray({
  hand,
  selected,
  maxPlay,
  disabled,
  copy,
  onToggle,
  onPlay,
}: {
  hand: Card[];
  selected: Set<string>;
  maxPlay: number;
  disabled: boolean;
  copy: Copy;
  onToggle: (id: string) => void;
  onPlay: () => void;
}) {
  return (
    <div className="lb-tray">
      <div className="lb-tray-inner">
        {hand.length === 0 && <span className="lb-tray-empty">{copy.handEmpty}</span>}
        {hand.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            copy={copy}
            selected={selected.has(card.id)}
            disabled={disabled}
            onToggle={() => onToggle(card.id)}
          />
        ))}
      </div>
      {hand.length > 0 && (
        <div className="lb-tray-actions">
          <span className="lb-tray-count">
            {selected.size}/{maxPlay} {copy.cardsSelected}
          </span>
          <button type="button" className="lb-btn" disabled={disabled || selected.size === 0} onClick={onPlay}>
            {copy.playCards}
          </button>
        </div>
      )}
    </div>
  );
}
