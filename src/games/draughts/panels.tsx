import { useState } from 'react';
import { Piece } from './board';
import type { Copy } from './copy';
import {
  notation,
  type HistoryEntry,
  type Inbound,
  type MoveOption,
  type PlayerView,
  type RoomView,
  type Rules,
  type Side,
} from './protocol';

/* -------------------------------------------------------------------- lobby */

export function Lobby({
  room,
  you,
  youId,
  copy,
  send,
}: {
  room: RoomView;
  you: Side | null;
  youId: string;
  copy: Copy;
  send: (message: Inbound) => void;
}) {
  const [fen, setFen] = useState('');
  const me = room.players.find((p) => p.id === youId);
  const host = Boolean(me?.host);
  const seatOf = (side: Side) => room.players.find((p) => p.side === side) ?? null;
  const onlookers = room.players.filter((p) => p.side === null);
  const bothSeated = Boolean(seatOf('w') && seatOf('b'));
  const allReady = room.players.filter((p) => p.side).every((p) => p.ready || p.host);

  const patch = (next: Partial<Rules>) => send({ t: 'rules', patch: next });

  return (
    <div className="dc-lobby">
      <div className="dc-panel dc-seats">
        <h2>{copy.lobbyTitle}</h2>
        <p className="dc-sub">{copy.lobbySub}</p>

        <div className="dc-seatrow">
          {(['w', 'b'] as Side[]).map((side) => {
            const seat = seatOf(side);
            const mine = you === side;
            return (
              <div key={side} className={`dc-seat ${mine ? 'is-mine' : ''}`}>
                <span className="dc-seatdisc">
                  <Piece side={side} king={false} />
                </span>
                <b>{side === 'w' ? copy.seatWhite : copy.seatBlack}</b>
                <span className="dc-seatname">{seat ? seat.name : '—'}</span>
                {seat ? (
                  mine ? (
                    <button className="dc-btn dc-ghostbtn" type="button" onClick={() => send({ t: 'stand' })}>
                      {copy.stand}
                    </button>
                  ) : (
                    <span className="dc-tag">{copy.seatTaken}</span>
                  )
                ) : (
                  <button className="dc-btn" type="button" onClick={() => send({ t: 'sit', side })}>
                    {copy.takeSeat}
                  </button>
                )}
                {seat?.ready ? <span className="dc-tag is-good">✓</span> : null}
              </div>
            );
          })}
        </div>

        {onlookers.length > 0 ? (
          <p className="dc-onlookers">
            <span>{copy.stands}:</span> {onlookers.map((p) => p.name).join(', ')}
          </p>
        ) : null}

        <div className="dc-actions">
          {you ? (
            <button
              className={`dc-btn ${me?.ready ? 'dc-ghostbtn' : 'dc-primary'}`}
              type="button"
              onClick={() => send({ t: 'ready', on: !me?.ready })}
            >
              {me?.ready ? copy.unready : copy.ready}
            </button>
          ) : null}
          {host ? (
            <button
              className="dc-btn dc-primary"
              type="button"
              disabled={!bothSeated || !allReady}
              onClick={() => send({ t: 'begin' })}
            >
              {copy.begin}
            </button>
          ) : null}
        </div>
        {host && !bothSeated ? <p className="dc-hint">{copy.needBoth}</p> : null}
        {host && bothSeated && !allReady ? <p className="dc-hint">{copy.waitingReady}</p> : null}
        {!host ? <p className="dc-hint">{copy.hostOnly}</p> : null}
      </div>

      <div className="dc-panel">
        <h3>{copy.clockTitle}</h3>
        <div className="dc-toggle" role="group">
          <button
            className={`dc-chip ${room.rules.clock ? 'is-on' : ''}`}
            type="button"
            disabled={!host}
            onClick={() => patch({ clock: true })}
          >
            {copy.clockOn}
          </button>
          <button
            className={`dc-chip ${room.rules.clock ? '' : 'is-on'}`}
            type="button"
            disabled={!host}
            onClick={() => patch({ clock: false })}
          >
            {copy.clockOff}
          </button>
        </div>
        {room.rules.clock ? (
          <div className="dc-fields">
            <label>
              {copy.minutes}
              <input
                type="number"
                min={1}
                max={90}
                value={room.rules.minutes}
                disabled={!host}
                onChange={(event) => patch({ minutes: Number(event.target.value) })}
              />
            </label>
            <label>
              {copy.increment}
              <input
                type="number"
                min={0}
                max={60}
                value={room.rules.increment}
                disabled={!host}
                onChange={(event) => patch({ increment: Number(event.target.value) })}
              />
            </label>
          </div>
        ) : (
          <p className="dc-hint">{copy.noClock}</p>
        )}

        {host ? (
          <>
            <h3 className="dc-spaced">{copy.positionTitle}</h3>
            <p className="dc-hint">{copy.positionSub}</p>
            <form
              className="dc-fen"
              onSubmit={(event) => {
                event.preventDefault();
                if (fen.trim()) send({ t: 'setup', fen: fen.trim() });
              }}
            >
              <input
                value={fen}
                onChange={(event) => setFen(event.target.value)}
                placeholder={copy.positionPlaceholder}
                spellCheck={false}
              />
              <button className="dc-btn dc-ghostbtn" type="submit">
                {copy.positionLoad}
              </button>
            </form>
          </>
        ) : null}
      </div>

      <div className="dc-panel dc-rules">
        <h3>{copy.rulesTitle}</h3>
        <ul>
          {copy.rulesList.map(([head, text]) => (
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

/* ------------------------------------------------------------------- clocks */

function clockText(ms: number): string {
  const safe = Math.max(0, ms);
  const total = Math.floor(safe / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (safe < 20_000) {
    const tenths = Math.floor((safe % 1000) / 100);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function SeatCard({
  side,
  player,
  copy,
  active,
  ms,
  taken,
  kings,
  you,
}: {
  side: Side;
  player: PlayerView | null;
  copy: Copy;
  active: boolean;
  ms: number | null;
  taken: number;
  kings: number;
  you: boolean;
}) {
  const low = ms !== null && ms < 20_000;
  return (
    <div className={`dc-seatcard ${active ? 'is-active' : ''} ${side === 'w' ? 'is-wit' : 'is-zwart'}`}>
      <span className="dc-seatdisc">
        <Piece side={side} king={false} />
      </span>
      <div className="dc-seatmeta">
        <b>
          {player?.name ?? copy.sideName(side)}
          {you ? <span className="dc-tag">{copy.yourSeat}</span> : null}
          {player && !player.online ? <span className="dc-tag is-bad">●</span> : null}
        </b>
        <span className="dc-seatstats">
          {copy.captured(taken)} · {copy.kings(kings)}
        </span>
      </div>
      {ms !== null ? (
        <span className={`dc-clock ${low ? 'is-low' : ''} ${active ? 'is-running' : ''}`}>
          {clockText(ms)}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- move list */

export function MoveList({
  history,
  copy,
  reviewPly,
  onSet,
}: {
  history: HistoryEntry[];
  copy: Copy;
  /** `null` is live, `-1` the opening position, otherwise a ply index. */
  reviewPly: number | null;
  onSet: (ply: number | null) => void;
}) {
  const rows: Array<[HistoryEntry | null, HistoryEntry | null]> = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push([history[i] ?? null, history[i + 1] ?? null]);
  }
  const at = reviewPly ?? history.length - 1;
  const step = (delta: number) => {
    const next = Math.max(-1, Math.min(history.length - 1, at + delta));
    onSet(next === history.length - 1 ? null : next);
  };

  return (
    <div className="dc-panel dc-movelist">
      <div className="dc-panelhead">
        <h3>{copy.moves}</h3>
        <div className="dc-nav">
          <button
            type="button"
            aria-label={copy.navStart}
            title={copy.navStart}
            onClick={() => onSet(-1)}
            disabled={history.length === 0}
          >
            ⏮
          </button>
          <button
            type="button"
            aria-label={copy.navBack}
            title={copy.navBack}
            onClick={() => step(-1)}
            disabled={at < 0}
          >
            ◀
          </button>
          <button
            type="button"
            aria-label={copy.navForward}
            title={copy.navForward}
            onClick={() => step(1)}
            disabled={reviewPly === null || history.length === 0}
          >
            ▶
          </button>
          <button
            type="button"
            className={reviewPly !== null ? 'is-on' : ''}
            aria-label={copy.navLive}
            title={copy.navLive}
            onClick={() => onSet(null)}
            disabled={reviewPly === null}
          >
            {copy.live}
          </button>
        </div>
      </div>
      {history.length === 0 ? (
        <p className="dc-hint">{copy.noMoves}</p>
      ) : (
        <ol className="dc-moves">
          {rows.map(([left, right], index) => (
            <li key={index}>
              <span className="dc-movenum">{index + 1}.</span>
              {[left, right].map((entry, half) =>
                entry ? (
                  <button
                    key={half}
                    type="button"
                    className={`dc-move ${at === entry.ply ? 'is-here' : ''} ${
                      entry.captures.length > 0 ? 'is-take' : ''
                    }`}
                    onClick={() => onSet(entry.ply === history.length - 1 ? null : entry.ply)}
                  >
                    {notation(entry)}
                    {entry.captures.length > 1 ? <sup>{entry.captures.length}</sup> : null}
                    {entry.promote ? <span className="dc-crownmark">♛</span> : null}
                  </button>
                ) : (
                  <span key={half} className="dc-move is-blank" />
                ),
              )}
            </li>
          ))}
        </ol>
      )}
      {reviewPly !== null ? <p className="dc-reviewing">{copy.reviewing}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------ route chooser */

/**
 * The tie-breaker. Every remaining route is drawn as a chain of numbered
 * landings, so two ways round the same four men read as two visibly different
 * paths rather than two similar lists of digits.
 */
export function RouteChooser({
  routes,
  chain,
  copy,
  onPreview,
  onPlay,
  onReset,
}: {
  routes: MoveOption[];
  chain: number[];
  copy: Copy;
  onPreview: (route: MoveOption | null) => void;
  onPlay: (route: MoveOption) => void;
  onReset: () => void;
}) {
  if (routes.length < 2) return null;
  const count = routes[0].captures.length;
  return (
    <div className="dc-panel dc-chooser">
      <div className="dc-panelhead">
        <h3>{copy.pickRoute}</h3>
        <span className="dc-tag is-warm">{copy.routeCount(routes.length)}</span>
      </div>
      <p className="dc-hint">{copy.pickRouteSub}</p>
      <ul className="dc-routes">
        {routes.map((route) => (
          <li key={route.path.join('.')}>
            <button
              type="button"
              onMouseEnter={() => onPreview(route)}
              onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview(route)}
              onBlur={() => onPreview(null)}
              onClick={() => onPlay(route)}
            >
              <span className="dc-routechain">
                <b>{route.from}</b>
                {route.path.map((square, index) => (
                  <span key={index} className={index < chain.length ? 'is-done' : ''}>
                    <i aria-hidden="true">×</i>
                    {square}
                  </span>
                ))}
              </span>
              <span className="dc-routecount">{count}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="dc-btn dc-ghostbtn dc-tiny" type="button" onClick={onReset}>
        {copy.cancelPick}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------- feed */

export function Feed({ room, copy }: { room: RoomView; copy: Copy }) {
  return (
    <div className="dc-panel dc-feed">
      <ul>
        {[...room.log].reverse().map((line) => (
          <li key={line.id} className={`is-${line.tone}`}>
            {copy.logLine(line.code, line.args ?? {})}
          </li>
        ))}
      </ul>
    </div>
  );
}
