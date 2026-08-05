import { useCallback, useEffect, useRef, useState } from 'react';
import './monopoly.css';
import BoardView from './BoardView';
import { ActionPanel, DeedManager, LogFeed, SeatRail, SettingsPanel } from './panels';
import { AuctionModal, DeedModal, OfferModal, TradeModal, WinnerOverlay } from './modals';
import { copyFor, money, type Lang } from './copy';
import {
  LEDGER_HOST,
  LedgerLink,
  playerKey,
  recallName,
  rememberName,
  roomUrl,
  type LinkStatus,
} from './net';
import type { Inbound, Outbound, RoomView } from './protocol';

interface Flash {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'deal';
}

const FX_TONE: Record<string, Flash['tone']> = {
  buy: 'good',
  build: 'good',
  trade: 'deal',
  auction: 'deal',
  card: 'deal',
  rent: 'bad',
  jail: 'bad',
  bust: 'bad',
  win: 'good',
};

export default function MonopolyGame({ lang, code: given }: { lang: Lang; code?: string }) {
  const copy = copyFor(lang);

  const [code] = useState(() => {
    if (given) return given;
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('code') ?? params.get('room') ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 24);
  });

  const [name, setName] = useState('');
  const [seated, setSeated] = useState(false);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [youId, setYouId] = useState('');
  const [flash, setFlash] = useState<Flash | null>(null);
  const [inspect, setInspect] = useState<number | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [copiedAt, setCopiedAt] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [, setTick] = useState(0);

  const linkRef = useRef<LedgerLink | null>(null);
  const skewRef = useRef(0);
  const flashSeq = useRef(0);
  const diceRef = useRef<string>('');

  useEffect(() => {
    setName(recallName());
  }, []);

  const receive = useCallback(
    (message: Outbound) => {
      if (message.t === 'sync') {
        skewRef.current = message.room.now - Date.now();
        setRoom(message.room);
        setYouId(message.youId);
        return;
      }
      if (message.t === 'nope') {
        setFlash({ id: ++flashSeq.current, text: message.msg, tone: 'bad' });
        return;
      }
      if (message.t === 'fx') {
        if (message.kind === 'dice') {
          if (diceRef.current !== message.text) {
            diceRef.current = message.text ?? '';
            setRolling(true);
            window.setTimeout(() => setRolling(false), 460);
          }
          return;
        }
        const label =
          message.kind === 'card' && message.text
            ? (copyFor(lang).cards[message.text] ?? message.text)
            : message.text;
        if (!label) return;
        setFlash({ id: ++flashSeq.current, text: label, tone: FX_TONE[message.kind] ?? 'deal' });
      }
    },
    [lang],
  );

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 3600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!seated || !code) return;
    const link = new LedgerLink(roomUrl(LEDGER_HOST, code), {
      onStatus: setStatus,
      onMessage: receive,
      onOpen: () => link.send({ t: 'hello', key: playerKey(), name }),
    });
    linkRef.current = link;
    link.open();
    return () => {
      link.dispose();
      linkRef.current = null;
      setStatus('idle');
    };
    // `name` is captured once at seat time on purpose — renaming mid-game is not a thing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seated, code, receive]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const send = useCallback((message: Inbound) => linkRef.current?.send(message), []);

  const you = room?.players.find((p) => p.id === youId) ?? null;
  const isHost = Boolean(you?.host);

  // Recomputed on every one-second tick as well as every sync.
  const turnSeconds = room?.turnEndsAt
    ? Math.max(0, Math.round((room.turnEndsAt - (Date.now() + skewRef.current)) / 1000))
    : 0;

  const auctionSeconds = room?.auction
    ? Math.max(0, Math.round((room.auction.endsAt - (Date.now() + skewRef.current)) / 1000))
    : 0;

  const invite = typeof window === 'undefined' ? '' : window.location.href;

  const enter = () => {
    const clean = name.trim().slice(0, 14);
    if (!clean) return;
    rememberName(clean);
    setName(clean);
    setSeated(true);
  };

  /* ------------------------------------------------------------ no room code */

  if (!code) {
    return (
      <div className="mp">
        <div className="mp-shell">
          <div className="mp-gate">
            <div className="mp-gate-card">
              <p className="mp-label">{copy.brand}</p>
              <h1>{copy.noRoomTitle}</h1>
              <p className="mp-note" style={{ margin: '0.5rem 0 1.1rem' }}>
                {copy.noRoomBody}
              </p>
              <a className="mp-btn" href={`/${lang}/minigames/monopoly`}>
                {copy.noRoomAction}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- check-in */

  if (!seated) {
    return (
      <div className="mp">
        <div className="mp-shell">
          <div className="mp-gate">
            <form
              className="mp-gate-card"
              onSubmit={(event) => {
                event.preventDefault();
                enter();
              }}
            >
              <p className="mp-label">
                {copy.brand} · {copy.roomLabel} {code}
              </p>
              <h1>{copy.checkinTitle}</h1>
              <p className="mp-note" style={{ margin: '0.5rem 0 1.1rem' }}>
                {copy.checkinSub}
              </p>
              <div className="mp-field">
                <span className="mp-label">{copy.nameLabel}</span>
                <input
                  className="mp-input"
                  value={name}
                  maxLength={14}
                  autoFocus
                  placeholder={copy.namePlaceholder}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <button type="submit" className="mp-btn" disabled={!name.trim()}>
                {copy.enter}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- shell */

  const header = (
    <header className="mp-top">
      <span className="mp-word">
        Empyr<span> · </span>Ledger
      </span>
      <span className="mp-grow" />
      <span className="mp-chip">
        {copy.roomLabel} {code}
      </span>
      <button
        type="button"
        className="mp-chip"
        onClick={() => {
          navigator.clipboard?.writeText(invite).then(() => setCopiedAt(Date.now()));
        }}
      >
        {Date.now() - copiedAt < 2000 ? copy.copied : copy.copyLink}
      </button>
      <span className="mp-chip" data-live={status === 'live'}>
        {copy.status[status]}
      </span>
      <a className="mp-chip" href={`/${lang}/minigames/monopoly`}>
        {copy.leave}
      </a>
    </header>
  );

  if (!room) {
    return (
      <div className="mp">
        <div className="mp-shell">
          {header}
          <p className="mp-note" style={{ marginTop: '2rem' }}>
            {copy.status[status]}…
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- lobby */

  if (room.phase === 'lobby') {
    const enough = room.players.length >= 2;
    const allReady = room.players.every((p) => p.ready || p.host);

    return (
      <div className="mp">
        <div className="mp-shell">
          {header}
          {flash && (
            <div className="mp-flash" data-tone={flash.tone}>
              {flash.text}
            </div>
          )}

          <div className="mp-stage">
            <div>
              <div className="mp-panel">
                <p className="mp-head">{copy.lobbyTitle}</p>
                <p className="mp-note">{copy.lobbySub}</p>
                <div className="mp-row" style={{ marginTop: '0.9rem' }}>
                  <button
                    type="button"
                    className="mp-btn"
                    data-tone={you?.ready ? 'green' : 'ghost'}
                    onClick={() => send({ t: 'ready', on: !you?.ready })}
                  >
                    {copy.ready}
                    {you?.ready ? ' ✓' : ''}
                  </button>
                  <button
                    type="button"
                    className="mp-btn"
                    disabled={!isHost || !enough || !allReady}
                    onClick={() => send({ t: 'begin' })}
                  >
                    {copy.start}
                  </button>
                </div>
                <p className="mp-note" style={{ marginTop: '0.6rem' }}>
                  {!enough ? copy.needTwo : !isHost ? copy.waitingHost : copy.hostOnly}
                </p>
              </div>

              <SettingsPanel room={room} copy={copy} canEdit={isHost} send={send} />
            </div>

            <div className="mp-side">
              <SeatRail room={room} copy={copy} youId={youId} showMoney={false} />
              <LogFeed room={room} copy={copy} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------- play */

  return (
    <div className="mp">
      <div className="mp-shell">
        {header}
        {flash && (
          <div className="mp-flash" data-tone={flash.tone}>
            {flash.text}
          </div>
        )}

        <div className="mp-stage">
          <BoardView room={room} copy={copy} rolling={rolling} onOpen={setInspect} />

          <div className="mp-side">
            <ActionPanel
              room={room}
              copy={copy}
              youId={youId}
              seconds={turnSeconds}
              send={send}
              onTrade={() => setTradeOpen(true)}
            />
            <SeatRail room={room} copy={copy} youId={youId} showMoney />
            {you && <DeedManager room={room} copy={copy} youId={youId} send={send} onInspect={setInspect} />}
            <div className="mp-panel">
              <p className="mp-head">{copy.bankTitle}</p>
              <div className="mp-deed-stat">
                <span>{copy.housesLeft}</span>
                <span>{room.housesLeft}</span>
              </div>
              <div className="mp-deed-stat">
                <span>{copy.hotelsLeft}</span>
                <span>{room.hotelsLeft}</span>
              </div>
              {room.settings.vacationCash && (
                <div className="mp-deed-stat">
                  <span>{copy.vacationPot}</span>
                  <span>{money(room.vacationPot)}</span>
                </div>
              )}
              {room.lastCard && (
                <div className="mp-cardface" data-kicker={copy.drawnCard} style={{ marginTop: '1rem' }}>
                  {copy.cards[room.lastCard] ?? room.lastCard}
                </div>
              )}
            </div>
            <LogFeed room={room} copy={copy} />
          </div>
        </div>
      </div>

      {room.auction && (
        <AuctionModal room={room} copy={copy} youId={youId} seconds={auctionSeconds} send={send} />
      )}
      {room.trade && (room.trade.toId === youId || room.trade.fromId === youId) && (
        <OfferModal room={room} copy={copy} youId={youId} send={send} />
      )}
      {tradeOpen && !room.trade && (
        <TradeModal room={room} copy={copy} youId={youId} send={send} onClose={() => setTradeOpen(false)} />
      )}
      {inspect !== null && (
        <DeedModal tile={inspect} room={room} copy={copy} onClose={() => setInspect(null)} />
      )}
      {room.phase === 'over' && (
        <WinnerOverlay room={room} copy={copy} youId={youId} isHost={isHost} send={send} />
      )}
    </div>
  );
}
