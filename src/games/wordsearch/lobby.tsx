import type { Copy } from './copy';
import {
  BANKS,
  CATEGORIES,
  ROUND_CLOCKS,
  SIZES,
  inkFor,
  wordCeiling,
  type Bank,
  type Category,
  type RoomView,
  type Rules,
} from './protocol';

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

/** Word-count options that actually fit the chosen grid. */
function wordOptions(size: number): number[] {
  const ceiling = wordCeiling(size);
  return [6, 8, 10, 12, 14, 16, 18, 20, 22, 24].filter((n) => n <= ceiling);
}

export function Lobby({ room, youId, isHost, ready, copy, onRules, onReady, onBegin }: LobbyProps) {
  const { rules } = room;
  const enough = room.players.length >= 2;
  const allReady = room.players.every((p) => p.ready || p.host);

  return (
    <div className="ws-panel">
      <p className="ws-eyebrow">
        {copy.room} {room.code.toUpperCase()}
      </p>
      <h1 className="ws-title">{copy.lobbyTitle}</h1>
      <p className="ws-sub">{copy.lobbySub}</p>

      <p className="ws-heading">{copy.playersHeading}</p>
      <div className="ws-seats">
        {room.players.map((player) => (
          <div
            key={player.id}
            className="ws-seat"
            data-off={player.online ? 'false' : 'true'}
            style={{ ['--pen' as string]: inkFor(player.seat) }}
          >
            <span className="ws-seat-name">{player.name}</span>
            {player.host && <span className="ws-tag">{copy.hostBadge}</span>}
            {player.id === youId && (
              <span className="ws-tag" data-k="you">
                {copy.youBadge}
              </span>
            )}
            {player.ready && !player.host && (
              <span className="ws-tag" data-k="ready">
                {copy.readyBadge}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="ws-heading">{copy.settingsHeading}</p>
      <div className="ws-dials">
        <div className="ws-dial">
          <label htmlFor="ws-size">{copy.gridSize}</label>
          <select
            id="ws-size"
            value={rules.size}
            disabled={!isHost}
            onChange={(event) => onRules({ size: Number(event.target.value) })}
          >
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n} × {n}
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-words">{copy.wordCount}</label>
          <select
            id="ws-words"
            value={rules.words}
            disabled={!isHost}
            onChange={(event) => onRules({ words: Number(event.target.value) })}
          >
            {wordOptions(rules.size).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-category">{copy.categoryLabel}</label>
          <select
            id="ws-category"
            value={rules.category}
            disabled={!isHost}
            onChange={(event) => onRules({ category: event.target.value as Category })}
          >
            {CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {copy.categories[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-bank">{copy.bankLabel}</label>
          <select
            id="ws-bank"
            value={rules.bank}
            disabled={!isHost}
            onChange={(event) => onRules({ bank: event.target.value as Bank })}
          >
            {BANKS.map((key) => (
              <option key={key} value={key}>
                {copy.banks[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-clock">{copy.roundClock}</label>
          <select
            id="ws-clock"
            value={rules.roundSeconds}
            disabled={!isHost}
            onChange={(event) => onRules({ roundSeconds: Number(event.target.value) })}
          >
            {ROUND_CLOCKS.map((n) => (
              <option key={n} value={n}>
                {Math.round(n / 60)} min
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-rounds">{copy.roundsLabel}</label>
          <select
            id="ws-rounds"
            value={rules.rounds}
            disabled={!isHost}
            onChange={(event) => onRules({ rounds: Number(event.target.value) })}
          >
            {[1, 2, 3, 4, 5, 7, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="ws-dial">
          <label htmlFor="ws-seats">{copy.seatsLabel}</label>
          <select
            id="ws-seats"
            value={rules.capacity}
            disabled={!isHost}
            onChange={(event) => onRules({ capacity: Number(event.target.value) })}
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ws-row">
        <button
          type="button"
          className="ws-btn"
          data-tone={ready ? 'ghost' : undefined}
          onClick={() => onReady(!ready)}
        >
          {ready ? copy.unready : copy.ready}
        </button>

        {isHost && (
          <button
            type="button"
            className="ws-btn"
            data-tone="hot"
            disabled={!enough || !allReady}
            onClick={onBegin}
          >
            {copy.start}
          </button>
        )}
      </div>

      <p className="ws-hint" style={{ marginTop: '0.6rem' }}>
        {!enough ? copy.needTwo : isHost ? '' : copy.hostOnly}
      </p>
    </div>
  );
}
