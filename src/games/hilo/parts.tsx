import type { CSSProperties } from 'react';
import { logText, type Copy } from './copy';
import { CARD_META, type Card, type LogLine, type SeatView } from './protocol';

const MASK = '▓▓▓▓';

export function fmt(value: number | null, hidden: boolean): string {
  if (value === null || value === undefined) return '—';
  if (hidden) return MASK;
  return value.toLocaleString('en-US');
}

/* ------------------------------------------------------------------ podiums */

export function SeatRail({
  seats,
  activeId,
  targetId,
  youId,
  copy,
  lobby,
  secrets,
}: {
  seats: SeatView[];
  activeId: string | null;
  targetId?: string | null;
  youId: string;
  copy: Copy;
  lobby: boolean;
  secrets?: boolean;
}) {
  return (
    <div className="hl-rail" role="list">
      {seats.map((seat) => (
        <article
          key={seat.id}
          role="listitem"
          className="hl-seat"
          style={{ '--hue': String(seat.hue) } as CSSProperties}
          data-active={seat.id === activeId}
          data-target={seat.id === targetId}
          data-dead={!seat.alive}
          data-self={seat.id === youId}
        >
          <div className="hl-seat-name">{seat.name}</div>

          <div className="hl-seat-meta">
            {lobby ? (
              <span className="hl-pip-more">{seat.online ? '● online' : '○ away'}</span>
            ) : secrets ? (
              <span className="hl-pip-more">{seat.locked ? '● locked' : '○ waiting'}</span>
            ) : (
              <>
                {Array.from({ length: Math.min(seat.cards, 6) }).map((_, i) => (
                  <i key={i} className="hl-pip" />
                ))}
                {seat.cards > 6 && <span className="hl-pip-more">+{seat.cards - 6}</span>}
                {seat.cards === 0 && <span className="hl-pip-more">—</span>}
              </>
            )}
          </div>

          <div>
            {seat.host && (
              <span className="hl-tag" data-k="host">
                Host
              </span>
            )}
            {lobby && (
              <span className="hl-tag" data-k={seat.ready ? 'ready' : 'wait'}>
                {seat.ready ? copy.ready : '…'}
              </span>
            )}
            {secrets && (
              <span className="hl-tag" data-k={seat.locked ? 'ready' : 'wait'}>
                {seat.locked ? '✓' : '…'}
              </span>
            )}
            {seat.blind > 0 && (
              <span className="hl-tag" data-k="blind">
                ◐{seat.blind}
              </span>
            )}
            {!seat.online && !lobby && (
              <span className="hl-tag" data-k="off">
                off
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- range meter */

export function RangeMeter({
  min,
  max,
  low,
  high,
  probe,
  hidden,
  copy,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
  probe: number | null;
  hidden: boolean;
  copy: Copy;
}) {
  const span = Math.max(1, max - min);
  const pct = (value: number) => Math.min(100, Math.max(0, ((value - min) / span) * 100));
  const left = pct(low);
  const width = Math.max(0.6, pct(high) - left);

  return (
    <div className="hl-meter">
      <div className="hl-eyebrow">{copy.windowLabel}</div>
      <div className="hl-track" style={{ marginTop: '0.4rem' }}>
        <div className="hl-window" style={{ left: `${left}%`, width: `${width}%` }} />
        {probe !== null && <div className="hl-needle" style={{ left: `${pct(probe)}%` }} />}
      </div>
      <div className="hl-scale">
        <span>{fmt(min, false)}</span>
        <span>
          <b>{fmt(low, hidden)}</b> – <b>{fmt(high, hidden)}</b>
        </span>
        <span>{fmt(max, false)}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- table feed */

export function Feed({ log, copy }: { log: LogLine[]; copy: Copy }) {
  return (
    <aside className="hl-feed">
      <div className="hl-eyebrow">{copy.feed}</div>
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

/* ----------------------------------------------------------------- hand tray */

export function HandTray({
  hand,
  disabled,
  onPlay,
  copy,
}: {
  hand: Card[];
  disabled: boolean;
  onPlay: (card: Card) => void;
  copy: Copy;
}) {
  return (
    <div className="hl-tray">
      <div className="hl-tray-inner">
        {hand.length === 0 && <span className="hl-tray-empty">{copy.handEmpty}</span>}
        {hand.map((card, index) => (
          <button
            key={`${card}-${index}`}
            type="button"
            className="hl-card"
            data-kind={CARD_META[card].kind}
            disabled={disabled}
            onClick={() => onPlay(card)}
          >
            <span className="hl-card-glyph">{CARD_META[card].glyph}</span>
            <span className="hl-card-name">{copy.cards[card].name}</span>
            <span className="hl-card-desc">{copy.cards[card].desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
