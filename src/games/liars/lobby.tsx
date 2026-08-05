import type { Copy } from './copy';
import type { RoomView, Rules } from './protocol';
import { Feed, SeatRail, ringSeats } from './parts';

interface LobbyProps {
  room: RoomView;
  youId: string;
  isHost: boolean;
  ready: boolean;
  copy: Copy;
  onRules: (patch: Partial<Rules>) => void;
  onPreset: () => void;
  onReady: (on: boolean) => void;
  onBegin: () => void;
  onInvite: () => void;
  copied: boolean;
}

export function Lobby({
  room,
  youId,
  isHost,
  ready,
  copy,
  onRules,
  onPreset,
  onReady,
  onBegin,
  onInvite,
  copied,
}: LobbyProps) {
  const seated = room.players.length;
  const allReady = room.players.every((p) => p.ready || p.host);
  const slots = ringSeats(room.players, youId);

  return (
    <div className="lb-main">
      <section className="lb-panel">
        <div className="lb-eyebrow">
          {copy.room} {room.code.toUpperCase()} · {seated}/{room.rules.capacity}
        </div>
        <h1 className="lb-title">{copy.lobbyTitle}</h1>
        <p className="lb-sub">{copy.lobbySub}</p>

        <div className="lb-arena lb-arena--lobby">
          <SeatRail slots={slots} activeId={null} youId={youId} copy={copy} lobby />
        </div>

        <div className="lb-dials">
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-chambers">{copy.dialChambers}</label>
            <select
              id="lb-chambers"
              disabled={!isHost}
              value={room.rules.chambers}
              onChange={(e) => onRules({ chambers: Number(e.target.value) })}
            >
              {[4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-bullets">{copy.dialBullets}</label>
            <select
              id="lb-bullets"
              disabled={!isHost}
              value={room.rules.bullets}
              onChange={(e) => onRules({ bullets: Number(e.target.value) })}
            >
              {Array.from({ length: room.rules.chambers - 1 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-hand">{copy.dialHand}</label>
            <select
              id="lb-hand"
              disabled={!isHost}
              value={room.rules.handSize}
              onChange={(e) => onRules({ handSize: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-max">{copy.dialMaxPlay}</label>
            <select
              id="lb-max"
              disabled={!isHost}
              value={room.rules.maxPlay}
              onChange={(e) => onRules({ maxPlay: Number(e.target.value) })}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-cap">{copy.dialSeats}</label>
            <select
              id="lb-cap"
              disabled={!isHost}
              value={room.rules.capacity}
              onChange={(e) => onRules({ capacity: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label htmlFor="lb-clock">{copy.dialClock}</label>
            <select
              id="lb-clock"
              disabled={!isHost}
              value={room.rules.turnSeconds}
              onChange={(e) => onRules({ turnSeconds: Number(e.target.value) })}
            >
              {[15, 20, 30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>{n}s</option>
              ))}
            </select>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label>{copy.dialJokers}</label>
            <button
              type="button"
              className="lb-toggle"
              data-on={room.rules.jokers}
              disabled={!isHost}
              onClick={() => onRules({ jokers: !room.rules.jokers })}
            >
              {room.rules.jokers ? copy.on : copy.off}
            </button>
          </div>
          <div className="lb-dial" data-locked={!isHost}>
            <label>{copy.dialFixedTable}</label>
            <button
              type="button"
              className="lb-toggle"
              data-on={room.rules.fixedTable}
              disabled={!isHost}
              onClick={() => onRules({ fixedTable: !room.rules.fixedTable })}
            >
              {room.rules.fixedTable ? copy.on : copy.off}
            </button>
          </div>
        </div>

        {isHost && (
          <button type="button" className="lb-btn lb-btn--ghost" onClick={onPreset}>
            {copy.classicPreset}
            {room.variant === 'classic' ? ' ✓' : ''}
          </button>
        )}

        {!isHost && <p className="lb-hint">{copy.hostOnly}</p>}

        <div className="lb-row">
          <button type="button" className="lb-btn" data-ghost={!ready} onClick={() => onReady(!ready)}>
            {ready ? copy.unready : copy.ready}
          </button>
          {isHost && (
            <button
              type="button"
              className="lb-btn"
              data-ghost={seated < 2 || !allReady}
              disabled={seated < 2 || !allReady}
              onClick={onBegin}
            >
              {seated < 2 ? copy.needTwo : copy.start}
            </button>
          )}
          <button type="button" className="lb-btn" data-ghost="true" onClick={onInvite}>
            {copied ? copy.copied : copy.copyLink}
          </button>
        </div>
      </section>

      <Feed log={room.log} copy={copy} />
    </div>
  );
}
