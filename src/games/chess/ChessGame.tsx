import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './chess.css';
import { Board } from './board';
import { COPY, renderLog, type Lang } from './copy';
import { Lobby } from './lobby';
import {
  BoardLink,
  CHESS_HOST,
  boardUrl,
  formatClock,
  playerKey,
  recallName,
  rememberName,
  type LinkStatus,
} from './net';
import { PieceGlyph } from './pieces';
import {
  PIECE_VALUE,
  turnFromFen,
  type Color,
  type Inbound,
  type Outbound,
  type PieceLetter,
  type RoomView,
  type Seat,
} from './protocol';

interface Toast {
  id: number;
  text: string;
}

const PROMO_CHOICES: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

export default function ChessGame({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  const code = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const raw = new URLSearchParams(window.location.search).get('code') ?? '';
    return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  }, []);

  const [name, setName] = useState(() => recallName());
  const [intent, setIntent] = useState<'play' | 'watch' | null>(null);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [youId, setYouId] = useState('');
  const [seat, setSeat] = useState<Seat>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [reviewPly, setReviewPly] = useState<number | null>(null);
  const [pending, setPending] = useState<{ from: number; to: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState<'link' | 'pgn' | null>(null);
  /** Local stopwatch so the clocks tick smoothly between syncs. */
  const [, setTick] = useState(0);

  const linkRef = useRef<BoardLink | null>(null);
  const syncAtRef = useRef<number>(Date.now());
  const toastSeq = useRef(0);

  const send = useCallback((message: Inbound) => linkRef.current?.send(message), []);

  const pushToast = useCallback((text: string) => {
    const id = ++toastSeq.current;
    setToasts((list) => [...list, { id, text }].slice(-3));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3400);
  }, []);

  useEffect(() => {
    if (!intent || !code) return;
    const link = new BoardLink(boardUrl(CHESS_HOST, code), {
      onStatus: setStatus,
      onOpen: () => link.send({ t: 'hello', key: playerKey(), name, as: intent }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          syncAtRef.current = Date.now();
          setRoom(message.room);
          setYouId(message.youId);
          setSeat(message.seat);
        } else if (message.t === 'nope') {
          pushToast(message.msg);
        }
      },
    });
    linkRef.current = link;
    link.open();
    return () => {
      link.dispose();
      linkRef.current = null;
    };
  }, [intent, code, name, pushToast]);

  // A ten-per-second repaint is plenty for a clock and cheap enough to ignore.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, []);

  // Leaving review whenever a new move lands keeps the board honest.
  const plies = room?.history.length ?? 0;
  useEffect(() => {
    setReviewPly(null);
    setPending(null);
    setConfirming(false);
  }, [plies, room?.phase]);

  const orientation: Color = useMemo(() => {
    const base: Color = seat === 'b' ? 'b' : 'w';
    return flipped ? (base === 'w' ? 'b' : 'w') : base;
  }, [seat, flipped]);

  /** Captured pieces, worked out from the scoresheet. */
  const trays = useMemo(() => {
    const out: Record<Color, PieceLetter[]> = { w: [], b: [] };
    if (!room) return out;
    const first = turnFromFen(room.startFen);
    for (const entry of room.history) {
      if (!entry.captured) continue;
      const mover: Color = entry.ply % 2 === 1 ? first : first === 'w' ? 'b' : 'w';
      out[mover].push(entry.captured as PieceLetter);
    }
    return out;
  }, [room]);

  const balance = useMemo(() => {
    const value = (list: PieceLetter[]) => list.reduce((sum, piece) => sum + PIECE_VALUE[piece], 0);
    return value(trays.w) - value(trays.b);
  }, [trays]);

  const shownFen = useMemo(() => {
    if (!room) return '';
    if (reviewPly === null) return room.fen;
    if (reviewPly === 0) return room.startFen;
    return room.history[reviewPly - 1]?.fen ?? room.fen;
  }, [room, reviewPly]);

  const shownLast = useMemo(() => {
    if (!room) return null;
    if (reviewPly === null) return room.lastMove;
    if (reviewPly === 0) return null;
    const entry = room.history[reviewPly - 1];
    return entry ? { from: entry.from, to: entry.to } : null;
  }, [room, reviewPly]);

  if (!code) {
    return (
      <main className="cx-shell cx-shell--gate">
        <p className="cx-gate">{copy.noRoom}</p>
      </main>
    );
  }

  if (!intent) {
    return (
      <main className="cx-shell cx-shell--gate">
        <div className="cx-card cx-checkin">
          <p className="cx-eyebrow">{copy.brand}</p>
          <h1>{copy.checkinTitle}</h1>
          <p className="cx-sub">{copy.checkinSub}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              rememberName(name.trim());
              setIntent('play');
            }}
          >
            <label className="cx-field cx-field--wide">
              <span>{copy.nameLabel}</span>
              <input
                value={name}
                maxLength={14}
                placeholder={copy.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </label>
            <div className="cx-row">
              <button type="submit" className="cx-btn cx-btn--go">
                {copy.enter}
              </button>
              <button
                type="button"
                className="cx-btn cx-btn--quiet"
                onClick={() => {
                  rememberName(name.trim());
                  setIntent('watch');
                }}
              >
                {copy.watchInstead}
              </button>
            </div>
          </form>
          <p className="cx-note">
            {copy.room} <b>{code}</b>
          </p>
        </div>
      </main>
    );
  }

  const elapsed = Date.now() - syncAtRef.current;

  function clockOf(color: Color): number {
    const player = room?.players.find((p) => p.seat === color);
    if (!player) return 0;
    return room?.ticking === color ? player.msLeft - elapsed : player.msLeft;
  }

  const live = room?.phase === 'play' && !room.result;
  const interactive = Boolean(live && seat && room?.turn === seat && reviewPly === null && !pending);

  function attemptMove(from: number, to: number) {
    const rank = to >> 3;
    if (room?.promoFrom.includes(from) && (rank === 0 || rank === 7)) {
      setPending({ from, to });
      return;
    }
    send({ t: 'move', from, to });
  }

  async function copyText(text: string, which: 'link' | 'pgn') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      pushToast(text);
    }
  }

  const opponentColor: Color = orientation === 'w' ? 'b' : 'w';

  function PlayerBar({ color, side }: { color: Color; side: 'top' | 'bottom' }) {
    const player = room?.players.find((p) => p.seat === color);
    const ms = clockOf(color);
    const low = ms < 20_000;
    return (
      <div className={`cx-bar cx-bar--${side}${room?.ticking === color ? ' is-ticking' : ''}`}>
        <span className={`cx-mark cx-mark--${color}`} aria-hidden="true" />
        <span className="cx-who">
          {player?.name ?? copy.colors[color]}
          {player && !player.online && <em> · {copy.offlineTag}</em>}
        </span>
        <span className="cx-tray" aria-label={copy.capturedTitle}>
          {trays[color].map((type, index) => (
            <PieceGlyph key={`${type}${index}`} color={color === 'w' ? 'b' : 'w'} type={type} />
          ))}
          {((color === 'w' && balance > 0) || (color === 'b' && balance < 0)) && (
            <b className="cx-balance">+{Math.abs(balance)}</b>
          )}
        </span>
        <span className={`cx-clock${low ? ' is-low' : ''}${room?.ticking === color ? ' is-run' : ''}`}>
          {formatClock(ms)}
        </span>
      </div>
    );
  }

  const resultLine = (() => {
    if (!room?.result) return null;
    const winner = room.result.winner;
    const who = winner ? room.players.find((p) => p.seat === winner)?.name ?? copy.colors[winner] : '';
    return {
      head: winner ? copy.winLine(who) : copy.drawLine,
      why: copy.reasons[room.result.reason],
      score: room.result.score,
    };
  })();

  const offerToAnswer = room?.drawOfferBy && seat && room.drawOfferBy !== seat ? room.drawOfferBy : null;

  return (
    <main className="cx-shell">
      <header className="cx-top">
        <span className="cx-brand">{copy.brand}</span>
        <span className="cx-roomcode">
          {copy.room} <b>{code}</b>
        </span>
        <button
          type="button"
          className="cx-btn cx-btn--tiny"
          onClick={() => copyText(window.location.href, 'link')}
        >
          {copied === 'link' ? copy.copied : copy.copyLink}
        </button>
        <span className="cx-grow" />
        <span className={`cx-status is-${status}`}>{copy.status[status]}</span>
        <a className="cx-leave" href={`/${lang}/minigames/chess`}>
          {copy.leave}
        </a>
      </header>

      {!room ? (
        <p className="cx-gate">{copy.status[status]}…</p>
      ) : room.phase === 'lobby' ? (
        <Lobby room={room} copy={copy} seat={seat} youId={youId} send={send} />
      ) : (
        <div className="cx-play">
          <section className="cx-boardside">
            <PlayerBar color={opponentColor} side="top" />
            <Board
              fen={shownFen}
              orientation={orientation}
              legal={interactive ? room.legal : {}}
              lastMove={shownLast}
              checkSquare={reviewPly === null ? room.checkSquare : -1}
              interactive={interactive}
              onMove={attemptMove}
              pending={pending}
            />
            <PlayerBar color={orientation} side="bottom" />

            <div className="cx-underboard">
              <button type="button" className="cx-btn cx-btn--tiny" onClick={() => setFlipped((f) => !f)}>
                {copy.flip}
              </button>
              {reviewPly !== null && (
                <button type="button" className="cx-btn cx-btn--tiny cx-btn--go" onClick={() => setReviewPly(null)}>
                  {copy.backToLive}
                </button>
              )}
              {room.checkSquare !== -1 && reviewPly === null && !room.result && (
                <span className="cx-flag">{copy.checkTag}</span>
              )}
            </div>
          </section>

          <section className="cx-side">
            {resultLine ? (
              <div className="cx-banner is-over">
                <b>{resultLine.head}</b>
                <span>{resultLine.why}</span>
                <span className="cx-score">{resultLine.score}</span>
              </div>
            ) : (
              <div className="cx-banner">
                <b>
                  {seat === null
                    ? copy.spectating
                    : room.turn === seat
                      ? copy.yourMove
                      : copy.theirMove}
                </b>
                <span>
                  {copy.colors[room.turn]}
                  {room.repeats > 1 ? ` · ${copy.repeats(room.repeats)}` : ''}
                  {room.halfmove >= 80 ? ` · ${copy.fiftyCount(room.halfmove)}` : ''}
                </span>
              </div>
            )}

            {offerToAnswer && (
              <div className="cx-banner is-offer">
                <b>{copy.drawOffered(room.players.find((p) => p.seat === offerToAnswer)?.name ?? '')}</b>
                <div className="cx-row">
                  <button
                    type="button"
                    className="cx-btn cx-btn--tiny cx-btn--go"
                    onClick={() => send({ t: 'answerDraw', accept: true })}
                  >
                    {copy.accept}
                  </button>
                  <button
                    type="button"
                    className="cx-btn cx-btn--tiny"
                    onClick={() => send({ t: 'answerDraw', accept: false })}
                  >
                    {copy.decline}
                  </button>
                </div>
              </div>
            )}

            {live && seat && (
              <div className="cx-controls">
                {confirming ? (
                  <button type="button" className="cx-btn cx-btn--danger" onClick={() => send({ t: 'resign' })}>
                    {copy.resignConfirm}
                  </button>
                ) : (
                  <button type="button" className="cx-btn cx-btn--quiet" onClick={() => setConfirming(true)}>
                    {copy.resign}
                  </button>
                )}
                <button
                  type="button"
                  className="cx-btn cx-btn--quiet"
                  disabled={room.drawOfferBy === seat}
                  onClick={() => send({ t: 'offerDraw' })}
                >
                  {room.drawOfferBy === seat ? copy.drawPending : copy.offerDraw}
                </button>
                {room.claimable.threefold && (
                  <button
                    type="button"
                    className="cx-btn"
                    onClick={() => send({ t: 'claimDraw', kind: 'threefold' })}
                  >
                    {copy.claimThreefold}
                  </button>
                )}
                {room.claimable.fifty && (
                  <button
                    type="button"
                    className="cx-btn"
                    onClick={() => send({ t: 'claimDraw', kind: 'fifty' })}
                  >
                    {copy.claimFifty}
                  </button>
                )}
                <p className="cx-note">
                  {copy.claimHint} {copy.autoDrawHint}
                </p>
              </div>
            )}

            {room.result && (
              <div className="cx-controls">
                <button
                  type="button"
                  className="cx-btn cx-btn--go"
                  onClick={() => send({ t: 'again' })}
                  disabled={!room.players.some((p) => p.id === youId && p.host)}
                >
                  {copy.rematch}
                </button>
                {room.pgn && (
                  <button type="button" className="cx-btn cx-btn--quiet" onClick={() => copyText(room.pgn!, 'pgn')}>
                    {copied === 'pgn' ? copy.pgnCopied : copy.copyPgn}
                  </button>
                )}
              </div>
            )}

            <div className="cx-sheet">
              <h2>{copy.movesTitle}</h2>
              {room.history.length === 0 ? (
                <p className="cx-note">{copy.noMoves}</p>
              ) : (
                <ol className="cx-moves">
                  {room.history.map((entry) => (
                    <li key={entry.ply}>
                      {turnFromFen(room.startFen) === 'w'
                        ? entry.ply % 2 === 1 && <span className="cx-num">{(entry.ply + 1) / 2}.</span>
                        : entry.ply % 2 === 0 && <span className="cx-num">{entry.ply / 2 + 1}.</span>}
                      <button
                        type="button"
                        className={`cx-move${reviewPly === entry.ply ? ' is-on' : ''}`}
                        onClick={() => setReviewPly(reviewPly === entry.ply ? null : entry.ply)}
                      >
                        {entry.san}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {reviewPly !== null && <p className="cx-note">{copy.reviewing(reviewPly)}</p>}
            </div>

            <ul className="cx-log">
              {[...room.log].reverse().map((line) => (
                <li key={line.id} className={`is-${line.tone}`}>
                  {renderLog(copy, line.code, line.args)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {pending && (
        <div className="cx-modal" role="dialog" aria-label={copy.promoteTitle}>
          <div className="cx-card cx-promo">
            <h2>{copy.promoteTitle}</h2>
            <div className="cx-promorow">
              {PROMO_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className="cx-promobtn"
                  aria-label={copy.pieceNames[choice]}
                  onClick={() => {
                    send({ t: 'move', from: pending.from, to: pending.to, promo: choice });
                    setPending(null);
                  }}
                >
                  <PieceGlyph color={seat ?? 'w'} type={choice} />
                  <span>{copy.pieceNames[choice]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="cx-toasts">
        {toasts.map((toast) => (
          <p key={toast.id}>{toast.text}</p>
        ))}
      </div>
    </main>
  );
}
