import { sixLimitName, type Copy } from './copy';
import { SIX_LIMITS, type RoomView, type Rules, type SixLimit } from './protocol';
import { PlayerRail } from './parts';

interface LobbyProps {
  room: RoomView;
  youId: string;
  isHost: boolean;
  ready: boolean;
  copy: Copy;
  onRules: (patch: Partial<Rules>) => void;
  onReady: (on: boolean) => void;
  onBegin: () => void;
}

function Switch({
  on,
  disabled,
  name,
  desc,
  badge,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  name: string;
  desc: string;
  badge: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="mn-switch"
      data-on={on ? 'true' : 'false'}
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={on}
    >
      <span className="mn-switch-knob" aria-hidden="true" />
      <span className="mn-switch-text">
        <b>
          {name}
          {on && <i className="mn-switch-badge">{badge}</i>}
        </b>
        <span>{desc}</span>
      </span>
    </button>
  );
}

export function Lobby({ room, youId, isHost, ready, copy, onRules, onReady, onBegin }: LobbyProps) {
  const { rules } = room;
  const count = room.players.length;
  const enough = count >= 2;
  const allReady = room.players.every((p) => p.ready || p.host);
  const shape = count <= 2 ? copy.boardTwo : count === 3 ? copy.boardThree : copy.boardFour;

  return (
    <div className="mn-lobby">
      <div className="mn-card">
        <p className="mn-eyebrow">
          {copy.room} <b>{room.code.toUpperCase()}</b>
        </p>
        <h1 className="mn-title">{copy.lobbyTitle}</h1>
        <p className="mn-sub">{copy.lobbySub}</p>

        <p className="mn-eyebrow mn-mt">{copy.playersHeading}</p>
        <PlayerRail players={room.players} activeId={null} youId={youId} copy={copy} lobby />
        <p className="mn-note">{shape}</p>

        <div className="mn-row">
          <button
            type="button"
            className="mn-btn"
            data-tone={ready ? 'ghost' : 'go'}
            onClick={() => onReady(!ready)}
          >
            {ready ? copy.unready : copy.ready}
          </button>
          {isHost && (
            <button
              type="button"
              className="mn-btn"
              data-tone="hot"
              disabled={!enough || !allReady}
              onClick={onBegin}
            >
              {copy.start}
            </button>
          )}
        </div>
        <p className="mn-note">{!enough ? copy.needTwo : isHost ? '' : copy.hostOnly}</p>
      </div>

      <div className="mn-card">
        <p className="mn-eyebrow">{copy.variantTitle}</p>
        <p className="mn-sub mn-sub-sm">{copy.variantSub}</p>

        <div className="mn-switches">
          <Switch
            on={rules.blockOnStart}
            disabled={!isHost}
            name={copy.blockOnStart.name}
            desc={copy.blockOnStart.desc}
            badge={copy.variantBadge}
            onToggle={() => onRules({ blockOnStart: !rules.blockOnStart })}
          />
          <Switch
            on={rules.mustCapture}
            disabled={!isHost}
            name={copy.mustCapture.name}
            desc={copy.mustCapture.desc}
            badge={copy.variantBadge}
            onToggle={() => onRules({ mustCapture: !rules.mustCapture })}
          />
          <Switch
            on={rules.autoSingle}
            disabled={!isHost}
            name={copy.autoSingle.name}
            desc={copy.autoSingle.desc}
            badge={copy.variantBadge}
            onToggle={() => onRules({ autoSingle: !rules.autoSingle })}
          />
        </div>

        <p className="mn-eyebrow mn-mt">{copy.settingsTitle}</p>
        <div className="mn-dials">
          <div className="mn-dial">
            <label htmlFor="mn-sixes">{copy.sixLimitLabel}</label>
            <select
              id="mn-sixes"
              value={rules.sixLimit}
              disabled={!isHost}
              onChange={(event) => onRules({ sixLimit: Number(event.target.value) as SixLimit })}
            >
              {SIX_LIMITS.map((limit) => (
                <option key={limit} value={limit}>
                  {sixLimitName(limit, copy)}
                </option>
              ))}
            </select>
            <span className="mn-dial-hint">{copy.sixLimitHint}</span>
          </div>

          <div className="mn-dial">
            <label htmlFor="mn-tries">{copy.yardTriesLabel}</label>
            <select
              id="mn-tries"
              value={rules.yardTries}
              disabled={!isHost}
              onChange={(event) => onRules({ yardTries: Number(event.target.value) })}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="mn-dial-hint">{copy.yardTriesHint}</span>
          </div>

          <div className="mn-dial">
            <label htmlFor="mn-clock">{copy.turnClock}</label>
            <select
              id="mn-clock"
              value={rules.turnSeconds}
              disabled={!isHost}
              onChange={(event) => onRules({ turnSeconds: Number(event.target.value) })}
            >
              {[20, 30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n}s
                </option>
              ))}
            </select>
          </div>

          <div className="mn-dial">
            <label htmlFor="mn-seats">{copy.maxSeats}</label>
            <select
              id="mn-seats"
              value={rules.capacity}
              disabled={!isHost}
              onChange={(event) => onRules({ capacity: Number(event.target.value) })}
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mn-eyebrow mn-mt">{copy.ruleSheet}</p>
        <ul className="mn-rules">
          {copy.rules.map(([head, text]) => (
            <li key={head}>
              <b>{head}</b>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
