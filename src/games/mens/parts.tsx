import type { CSSProperties } from 'react';
import { logText, type Copy } from './copy';
import type { LogLine, MoveOption, PlayerView } from './protocol';
import { moveLabel } from './board';

/** Which of the nine pip slots each face lights up. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function Die({
  value,
  rolling,
  disabled,
  onRoll,
  label,
  color,
}: {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
  label: string;
  color: string;
}) {
  const face = value ?? 6;
  return (
    <button
      type="button"
      className="mn-die"
      data-c={color}
      data-rolling={rolling ? 'true' : 'false'}
      data-blank={value === null ? 'true' : 'false'}
      data-six={value === 6 ? 'true' : 'false'}
      disabled={disabled}
      onClick={onRoll}
      aria-label={value === null ? label : `${label} — ${value}`}
    >
      <span className="mn-die-face" aria-hidden="true">
        {Array.from({ length: 9 }, (_, slot) => (
          <span key={slot} className="mn-pip" data-on={PIPS[face].includes(slot) ? 'true' : 'false'} />
        ))}
      </span>
    </button>
  );
}

export function ChoiceList({
  options,
  players,
  copy,
  hint,
  onHint,
  onChoose,
}: {
  options: MoveOption[];
  players: PlayerView[];
  copy: Copy;
  hint: number | null;
  onHint: (index: number | null) => void;
  onChoose: (index: number) => void;
}) {
  return (
    <ul className="mn-choices">
      {options.map((option, index) => (
        <li key={`${option.pawn}-${option.to}`}>
          <button
            type="button"
            className="mn-choice"
            data-hit={option.capture ? 'true' : 'false'}
            data-lit={hint === index ? 'true' : 'false'}
            onClick={() => onChoose(index)}
            onMouseEnter={() => onHint(index)}
            onMouseLeave={() => onHint(null)}
            onFocus={() => onHint(index)}
            onBlur={() => onHint(null)}
          >
            <span className="mn-choice-pin">{option.pawn + 1}</span>
            <span className="mn-choice-text">{moveLabel(option, players, copy)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PlayerRail({
  players,
  activeId,
  youId,
  copy,
  clockPct,
  seconds,
  lobby,
}: {
  players: PlayerView[];
  activeId: string | null;
  youId: string;
  copy: Copy;
  clockPct?: number;
  seconds?: number;
  lobby?: boolean;
}) {
  return (
    <ul className="mn-rail">
      {players.map((player) => {
        const active = player.id === activeId;
        return (
          <li
            key={player.id}
            className="mn-seat"
            data-c={player.color}
            data-active={active ? 'true' : 'false'}
            data-away={player.online ? 'false' : 'true'}
          >
            <span className="mn-seat-chip" aria-hidden="true">
              <span className="mn-seat-pawn" />
            </span>
            <span className="mn-seat-body">
              <span className="mn-seat-name">
                {player.name}
                {player.id === youId && <i className="mn-seat-you">{copy.seatYou}</i>}
                {player.host && <i className="mn-seat-tag">{copy.hostTag}</i>}
                {!player.online && <i className="mn-seat-tag" data-k="away">{copy.seatAway}</i>}
              </span>
              {lobby ? (
                <span className="mn-seat-meta">
                  {player.ready || player.host ? copy.ready : copy.unready} · {copy.colors[player.color]}
                </span>
              ) : (
                <span className="mn-seat-meta">
                  <b className="mn-num">{player.home}</b>/4 {copy.homeShort} · {copy.yard}{' '}
                  <b className="mn-num">{player.yard}</b> · {copy.hits}{' '}
                  <b className="mn-num">{player.hits}</b>
                </span>
              )}
            </span>
            {active && clockPct !== undefined && (
              <span className="mn-seat-clock" aria-hidden="true">
                <span className="mn-seat-bar" style={{ '--pct': `${clockPct}%` } as CSSProperties} />
                <b className="mn-num">{seconds}</b>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function HomeTrack({ players, copy }: { players: PlayerView[]; copy: Copy }) {
  return (
    <ul className="mn-track">
      {players.map((player) => (
        <li key={player.id} data-c={player.color}>
          <span className="mn-track-name">{player.name}</span>
          <span className="mn-track-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((slot) => (
              <i key={slot} data-on={slot < player.home ? 'true' : 'false'} />
            ))}
          </span>
          <span className="mn-track-num mn-num">
            {player.home}/4 {copy.homeShort}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Feed({ log, copy }: { log: LogLine[]; copy: Copy }) {
  return (
    <div className="mn-feed">
      <p className="mn-eyebrow">{copy.feed}</p>
      <ul>
        {[...log].reverse().map((line) => (
          <li key={line.id} data-tone={line.tone}>
            {logText(line, copy)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface Shout {
  id: number;
  kind: 'capture' | 'six' | 'home' | 'stuck' | 'win';
  text: string;
  sub?: string;
}

export function ShoutLayer({ shouts }: { shouts: Shout[] }) {
  return (
    <div className="mn-shouts" aria-live="polite">
      {shouts.map((shout) => (
        <div key={shout.id} className="mn-shout" data-k={shout.kind}>
          <b>{shout.text}</b>
          {shout.sub && <span>{shout.sub}</span>}
        </div>
      ))}
    </div>
  );
}
