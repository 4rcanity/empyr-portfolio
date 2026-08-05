import type { Copy } from './copy';
import { PACKS, type Pack, type RoomView, type Rules } from './protocol';
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

function Toggle({
  on,
  disabled,
  title,
  hint,
  note,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  title: string;
  hint: string;
  note?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="un-toggle"
      data-on={on ? 'true' : 'false'}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="un-switch" aria-hidden="true" />
      <span className="un-toggle-text">
        <b>{title}</b>
        <span>{note ?? hint}</span>
      </span>
    </button>
  );
}

export function Lobby({ room, youId, isHost, ready, copy, onRules, onReady, onBegin }: LobbyProps) {
  const { rules } = room;
  const stackingLocked = rules.pack === 'nomercy';
  const enough = room.players.length >= 2;
  const allReady = room.players.every((p) => p.ready || p.host);

  return (
    <div className="un-panel">
      <p className="un-eyebrow">{copy.room} {room.code.toUpperCase()}</p>
      <h1 className="un-title">{copy.lobbyTitle}</h1>
      <p className="un-sub">{copy.lobbySub}</p>

      <div style={{ marginTop: '1.3rem' }}>
        <p className="un-eyebrow" style={{ color: 'var(--dim)' }}>{copy.playersHeading}</p>
        <PlayerRail
          players={room.players}
          activeId={null}
          youId={youId}
          copy={copy}
          lobby
        />
      </div>

      <div style={{ marginTop: '1.1rem' }}>
        <p className="un-eyebrow" style={{ color: 'var(--dim)' }}>{copy.dlcTitle}</p>
        <p className="un-hint" style={{ marginTop: '0.3rem' }}>{copy.dlcSub}</p>

        <div className="un-packs">
          {PACKS.map((pack: Pack) => {
            const meta = copy.packs[pack];
            const on = rules.pack === pack;
            return (
              <button
                key={pack}
                type="button"
                className="un-pack"
                data-on={on ? 'true' : 'false'}
                disabled={!isHost}
                onClick={() => onRules({ pack })}
              >
                <div className="un-pack-head">
                  <span className="un-pack-name">{meta.name}</span>
                  <span className="un-tag" data-k={on ? 'uno' : pack === 'classic' ? 'wait' : 'host'}>
                    {on ? copy.activeBadge : pack === 'classic' ? copy.baseGame : copy.dlcBadge}
                  </span>
                </div>
                <p className="un-pack-desc">{meta.desc}</p>
              </button>
            );
          })}

          <button
            type="button"
            className="un-pack"
            data-on={rules.houseRules ? 'true' : 'false'}
            disabled={!isHost}
            onClick={() => onRules({ houseRules: !rules.houseRules })}
          >
            <div className="un-pack-head">
              <span className="un-pack-name">{copy.house.name}</span>
              <span className="un-tag" data-k={rules.houseRules ? 'uno' : 'host'}>
                {rules.houseRules ? copy.activeBadge : copy.dlcBadge}
              </span>
            </div>
            <p className="un-pack-desc">{copy.house.desc}</p>
          </button>
        </div>
      </div>

      <div className="un-toggles">
        <Toggle
          on={rules.sevenZero}
          disabled={!isHost || !rules.houseRules}
          title={copy.sevenZero}
          hint={copy.sevenZeroHint}
          onToggle={() => onRules({ sevenZero: !rules.sevenZero })}
        />
        <Toggle
          on={rules.jumpIn}
          disabled={!isHost || !rules.houseRules}
          title={copy.jumpIn}
          hint={copy.jumpInHint}
          onToggle={() => onRules({ jumpIn: !rules.jumpIn })}
        />
        <Toggle
          on={rules.drawToMatch}
          disabled={!isHost || !rules.houseRules}
          title={copy.drawToMatch}
          hint={copy.drawToMatchHint}
          onToggle={() => onRules({ drawToMatch: !rules.drawToMatch })}
        />
        <Toggle
          on={stackingLocked || rules.stacking}
          disabled={!isHost || stackingLocked}
          title={copy.stacking}
          hint={copy.stackingHint}
          note={stackingLocked ? copy.forcedOn : undefined}
          onToggle={() => onRules({ stacking: !rules.stacking })}
        />
      </div>

      <div style={{ marginTop: '1.2rem' }}>
        <p className="un-eyebrow" style={{ color: 'var(--dim)' }}>{copy.settingsTitle}</p>
        <div className="un-dials">
          <div className="un-dial">
            <label htmlFor="un-hand-size">{copy.handSize}</label>
            <select
              id="un-hand-size"
              value={rules.startingHand}
              disabled={!isHost}
              onChange={(event) => onRules({ startingHand: Number(event.target.value) })}
            >
              {[5, 6, 7, 8, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="un-dial">
            <label htmlFor="un-target">{copy.targetScore}</label>
            <select
              id="un-target"
              value={rules.targetScore}
              disabled={!isHost}
              onChange={(event) => onRules({ targetScore: Number(event.target.value) })}
            >
              <option value={0}>{copy.singleRound}</option>
              {[200, 300, 500, 750].map((n) => (
                <option key={n} value={n}>{n} {copy.points}</option>
              ))}
            </select>
          </div>

          <div className="un-dial">
            <label htmlFor="un-clock">{copy.turnClock}</label>
            <select
              id="un-clock"
              value={rules.turnSeconds}
              disabled={!isHost}
              onChange={(event) => onRules({ turnSeconds: Number(event.target.value) })}
            >
              {[20, 30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>{n}s</option>
              ))}
            </select>
          </div>

          <div className="un-dial">
            <label htmlFor="un-seats">{copy.maxSeats}</label>
            <select
              id="un-seats"
              value={rules.capacity}
              disabled={!isHost}
              onChange={(event) => onRules({ capacity: Number(event.target.value) })}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="un-row">
        <button
          type="button"
          className="un-btn"
          data-tone={ready ? 'ghost' : undefined}
          onClick={() => onReady(!ready)}
        >
          {ready ? copy.unready : copy.ready}
        </button>

        {isHost && (
          <button type="button" className="un-btn" data-tone="hot" disabled={!enough || !allReady} onClick={onBegin}>
            {copy.start}
          </button>
        )}
      </div>

      <p className="un-hint" style={{ marginTop: '0.7rem' }}>
        {!enough ? copy.needTwo : isHost ? '' : copy.hostOnly}
      </p>
    </div>
  );
}
