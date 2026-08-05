import type { Copy } from './copy';
import { Feed, SeatRail, TableCardDisplay, ringSeats } from './parts';
import type { Claim, RoomView } from './protocol';

interface BoardProps {
  room: RoomView;
  youId: string;
  copy: Copy;
  remaining: number | null;
  error: string | null;
  canPlay: boolean;
  canLiar: boolean;
  onLiar: () => void;
}

export function Board({ room, youId, copy, remaining, error, canPlay, canLiar, onLiar }: BoardProps) {
  const me = room.players.find((p) => p.id === youId) ?? null;
  const active = room.players.find((p) => p.id === room.activeId) ?? null;
  const myTurn = Boolean(room.activeId === youId && me && !me.dead);
  const slots = ringSeats(room.players, youId);

  return (
    <div className="lb-main">
      <section className="lb-board">
        <div className="lb-board-head">
          <div>
            <div className="lb-eyebrow">
              {copy.round} {room.round} · {copy.turn} {room.turn}
            </div>
            <div className="lb-stats">
              <span>{copy.buried} {room.buried}</span>
              <span>{copy.deckLeft} {room.deckLeft}</span>
            </div>
          </div>
          {remaining !== null && (
            <div className="lb-clock-wrap">
              <div
                className="lb-clock"
                data-warn={remaining < 8000}
                style={{ width: `${Math.min(100, (remaining / (room.rules.turnSeconds * 1000)) * 100)}%` }}
              />
              <span className="lb-clock-text">
                {copy.clock} {Math.ceil(remaining / 1000)}s
              </span>
            </div>
          )}
        </div>

        <div className="lb-arena">
          <SeatRail slots={slots} activeId={room.activeId} youId={youId} copy={copy} lobby={false} />
          <div className="lb-felt-center">
            <TableCardDisplay table={room.table} copy={copy} />
            <ClaimPile claim={room.claim} copy={copy} />
          </div>
        </div>

        <div className="lb-turnline">
          {myTurn ? (
            <b>{copy.yourTurn}</b>
          ) : (
            <>
              {copy.waitingFor} <b>{active?.name ?? '—'}</b>
            </>
          )}
          {me?.dead && <span className="lb-hint"> · {copy.spectating}</span>}
        </div>

        {error && <div className="lb-error">{error}</div>}

        <div className="lb-actions">
          {canLiar && (
            <button type="button" className="lb-btn lb-btn--danger" onClick={onLiar}>
              {copy.callLiar}
            </button>
          )}
          {canPlay && !myTurn && <p className="lb-hint">{copy.selectCards}</p>}
        </div>
      </section>

      <Feed log={room.log} copy={copy} />
    </div>
  );
}

function ClaimPile({ claim, copy }: { claim: Claim | null; copy: Copy }) {
  if (!claim) {
    return (
      <div className="lb-claim lb-claim--empty">
        <span className="lb-eyebrow">{copy.claim}</span>
        <span>{copy.noClaim}</span>
      </div>
    );
  }

  return (
    <div className="lb-claim" data-auto={claim.auto ? 'true' : 'false'}>
      <span className="lb-eyebrow">{copy.claim}</span>
      <div className="lb-claim-pile">
        {Array.from({ length: claim.count }).map((_, i) => (
          <span key={i} className="lb-claim-card" />
        ))}
      </div>
      <span className="lb-claim-meta">
        {claim.playerName} · {claim.count}
        {claim.auto ? ' · ⏱' : ''}
      </span>
    </div>
  );
}
