import { useState } from 'react';
import { Board } from './board';
import type { Copy } from './copy';
import { PRESETS, START_FEN, type Inbound, type Preset, type RoomView, type Seat } from './protocol';

interface LobbyProps {
  room: RoomView;
  copy: Copy;
  seat: Seat;
  youId: string;
  send: (message: Inbound) => void;
}

export function Lobby({ room, copy, seat, youId, send }: LobbyProps) {
  const me = room.players.find((p) => p.id === youId);
  const isHost = Boolean(me?.host) || (!room.players.some((p) => p.host && p.online) && seat !== null);
  const [fen, setFen] = useState(room.rules.startFen);
  const white = room.players.find((p) => p.seat === 'w');
  const black = room.players.find((p) => p.seat === 'b');
  const bothSeated = Boolean(white && black);
  const setup = room.rules.startFen !== START_FEN;

  function choosePreset(preset: Preset) {
    if (!isHost) return;
    const named = PRESETS.find((p) => p.id === preset);
    send({
      t: 'rules',
      patch: named
        ? { preset, minutes: named.minutes, increment: named.increment }
        : { preset: 'custom', minutes: room.rules.minutes, increment: room.rules.increment },
    });
  }

  return (
    <div className="cx-lobby">
      <section className="cx-card cx-card--preview">
        <h2>{copy.previewTitle}</h2>
        <p className="cx-sub">{copy.previewSub}</p>
        <div className="cx-preview">
          <Board
            fen={room.rules.startFen}
            orientation={seat ?? 'w'}
            legal={{}}
            lastMove={null}
            checkSquare={-1}
            interactive={false}
            onMove={() => {}}
            pending={null}
          />
        </div>
      </section>

      <section className="cx-card">
        <h2>{copy.timeTitle}</h2>
        <p className="cx-sub">{copy.timeSub}</p>
        <div className="cx-presets">
          {[...PRESETS.map((p) => p.id), 'custom' as Preset].map((preset) => (
            <button
              key={preset}
              type="button"
              className={`cx-chip${room.rules.preset === preset ? ' is-on' : ''}`}
              disabled={!isHost}
              aria-pressed={room.rules.preset === preset}
              onClick={() => choosePreset(preset)}
            >
              {copy.presets[preset]}
            </button>
          ))}
        </div>

        {room.rules.preset === 'custom' && (
          <div className="cx-fields">
            <label className="cx-field">
              <span>{copy.minutesLabel}</span>
              <input
                type="number"
                min="1"
                max="180"
                value={Math.max(1, Math.round(room.rules.minutes))}
                disabled={!isHost}
                onChange={(event) =>
                  send({ t: 'rules', patch: { preset: 'custom', minutes: Number(event.target.value) } })
                }
              />
            </label>
            <label className="cx-field">
              <span>{copy.incrementLabel}</span>
              <input
                type="number"
                min="0"
                max="120"
                value={room.rules.increment}
                disabled={!isHost}
                onChange={(event) =>
                  send({ t: 'rules', patch: { preset: 'custom', increment: Number(event.target.value) } })
                }
              />
            </label>
          </div>
        )}
      </section>

      <section className="cx-card">
        <h2>{copy.positionTitle}</h2>
        <p className="cx-sub">{copy.positionSub}</p>
        <label className="cx-field cx-field--wide">
          <span>{copy.fenLabel}</span>
          <input
            className="cx-fen"
            value={fen}
            spellCheck={false}
            disabled={!isHost}
            onChange={(event) => setFen(event.target.value)}
            onBlur={() => send({ t: 'rules', patch: { startFen: fen.trim() || START_FEN } })}
          />
        </label>
        <div className="cx-row">
          <button
            type="button"
            className="cx-btn"
            disabled={!isHost}
            onClick={() => send({ t: 'rules', patch: { startFen: fen.trim() || START_FEN } })}
          >
            {copy.fenApply}
          </button>
          <button
            type="button"
            className="cx-btn cx-btn--quiet"
            disabled={!isHost || !setup}
            onClick={() => {
              setFen(START_FEN);
              send({ t: 'rules', patch: { startFen: START_FEN } });
            }}
          >
            {copy.fenReset}
          </button>
        </div>
      </section>

      <section className="cx-card">
        <h2>{copy.playersTitle}</h2>
        <ul className="cx-seats">
          {(['w', 'b'] as const).map((color) => {
            const player = color === 'w' ? white : black;
            return (
              <li key={color} className={`cx-seat cx-seat--${color}`}>
                <span className="cx-seatdot" aria-hidden="true" />
                <span className="cx-seatname">
                  {player ? player.name : <em>{copy.seatOpen}</em>}
                </span>
                <span className="cx-tags">
                  {player?.id === youId && <span className="cx-tag">{copy.youTag}</span>}
                  {player?.host && <span className="cx-tag">{copy.hostTag}</span>}
                  {player && !player.online && <span className="cx-tag is-bad">{copy.offlineTag}</span>}
                  {player?.ready && <span className="cx-tag is-good">{copy.readyTag}</span>}
                </span>
                <span className="cx-seatcolor">{copy.colors[color]}</span>
              </li>
            );
          })}
        </ul>
        {room.spectators > 0 && <p className="cx-sub">{copy.watchers(room.spectators)}</p>}
        {!bothSeated && <p className="cx-sub">{copy.waitingForOpponent}</p>}

        <div className="cx-row">
          {seat === null ? (
            <button type="button" className="cx-btn" disabled={bothSeated} onClick={() => send({ t: 'sit' })}>
              {copy.sitDown}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`cx-btn${me?.ready ? ' cx-btn--quiet' : ''}`}
                onClick={() => send({ t: 'ready', on: !me?.ready })}
              >
                {me?.ready ? copy.unready : copy.ready}
              </button>
              <button type="button" className="cx-btn cx-btn--quiet" onClick={() => send({ t: 'watch' })}>
                {copy.standUp}
              </button>
            </>
          )}
          {isHost && (
            <button type="button" className="cx-btn cx-btn--quiet" onClick={() => send({ t: 'swap' })}>
              {copy.swap}
            </button>
          )}
        </div>

        <div className="cx-row">
          <button
            type="button"
            className="cx-btn cx-btn--go"
            disabled={!isHost || !bothSeated}
            onClick={() => send({ t: 'begin' })}
          >
            {copy.start}
          </button>
        </div>
        {!bothSeated && <p className="cx-note">{copy.needBoth}</p>}
        {!isHost && <p className="cx-note">{copy.hostOnly}</p>}
      </section>
    </div>
  );
}
