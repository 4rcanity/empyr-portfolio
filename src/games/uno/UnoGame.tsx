import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './uno.css';
import { TableLink, playerKey, recallName, rememberName, tableUrl, type LinkStatus } from './net';
import { copyFor, type Lang } from './copy';
import {
  Deck,
  Discard,
  DirectionArrows,
  Feed,
  FxLayer,
  Hand,
  Scores,
  Seat,
  ringSeats,
  type FxEvent,
  type PileCard,
} from './parts';
import { Lobby } from './lobby';
import {
  canPlay,
  faceOf,
  isWildFace,
  paletteFor,
  type Card,
  type Color,
  type FxKind,
  type Inbound,
  type Outbound,
  type RoomView,
  type Rules,
  type Side,
} from './protocol';
import { play as playSfx, setMuted, type Sfx } from './sfx';

const HOST =
  (import.meta.env.PUBLIC_UNO_HOST as string | undefined) ||
  (import.meta.env.DEV ? 'localhost:8788' : 'empyr-uno.arcanearthenden.workers.dev');

const COLOR_HEX: Record<Color, string> = {
  red: '#ef2b3c',
  yellow: '#ffb703',
  green: '#22bd52',
  blue: '#1f7ae0',
  pink: '#ff5bb0',
  teal: '#17c7c0',
  orange: '#ff8b21',
  purple: '#9b4dff',
  wild: '#9b4dff',
};

/** Where the middle of the table sits, in percent of the felt box. */
const PILE = { x: 54, y: 48 };
const DECK = { x: 30, y: 36 };
const FALLBACK = { x: 50, y: 48 };

/** How long each effect stays mounted, in ms. */
const FX_LIFE: Record<FxKind, number> = {
  play: 680,
  draw: 700,
  skip: 780,
  reverse: 1000,
  wild: 900,
  flip: 1050,
  blast: 1000,
  uno: 1150,
  caught: 950,
  swap: 950,
  out: 1100,
  round: 1800,
  win: 2400,
};

const FX_SOUND: Record<FxKind, Sfx> = {
  play: 'play',
  draw: 'draw',
  skip: 'skip',
  reverse: 'reverse',
  wild: 'wild',
  flip: 'flip',
  blast: 'blast',
  uno: 'uno',
  caught: 'caught',
  swap: 'swap',
  out: 'out',
  round: 'win',
  win: 'fanfare',
};

export default function UnoGame({ lang, code: codeProp }: { lang: Lang; code?: string }) {
  const copy = copyFor(lang);

  const [code] = useState(
    () => codeProp ?? new URLSearchParams(window.location.search).get('code')?.toLowerCase() ?? '',
  );
  const [name, setName] = useState(() => recallName());
  const [seated, setSeated] = useState(false);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [youId, setYouId] = useState('');
  const [error, setError] = useState('');
  const [quiet, setQuiet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wildFor, setWildFor] = useState<Card | null>(null);
  const [swapFor, setSwapFor] = useState<Card | null>(null);
  const [fxEvents, setFxEvents] = useState<FxEvent[]>([]);
  const [spin, setSpin] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [pile, setPile] = useState<PileCard[]>([]);
  const [, setTick] = useState(0);

  const link = useRef<TableLink | null>(null);
  const skew = useRef(0);
  const fxSeq = useRef(0);
  const pileSeq = useRef(0);
  const lastDiscard = useRef(-1);
  const lastPending = useRef(0);
  /** Latest seat anchors, so the socket callback can place effects without re-subscribing. */
  const anchors = useRef(new Map<string, { x: number; y: number }>());
  const topRef = useRef<Side | null>(null);

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  /* ------------------------------------------------------------------- fx */

  const pushFx = useCallback((kind: FxKind, playerId?: string, text?: string) => {
    const seat = (playerId && anchors.current.get(playerId)) || FALLBACK;
    let origin = seat;
    let target = seat;

    if (kind === 'play') {
      origin = seat;
      target = PILE;
    } else if (kind === 'draw') {
      origin = DECK;
      target = seat;
    } else if (kind === 'round' || kind === 'win' || kind === 'wild' || kind === 'reverse') {
      origin = PILE;
      target = PILE;
    }

    const event: FxEvent = {
      id: ++fxSeq.current,
      kind,
      playerId,
      text,
      x: origin.x,
      y: origin.y,
      dx: target.x - origin.x,
      dy: target.y - origin.y,
      card: kind === 'play' ? topRef.current ?? undefined : undefined,
    };

    setFxEvents((prev) => [...prev.slice(-7), event]);
    window.setTimeout(
      () => setFxEvents((prev) => prev.filter((item) => item.id !== event.id)),
      FX_LIFE[kind],
    );

    if (kind === 'reverse') {
      setSpin(true);
      window.setTimeout(() => setSpin(false), FX_LIFE.reverse);
    }
  }, []);

  /* ------------------------------------------------------------- connection */

  useEffect(() => {
    if (!seated || !code) return;

    const socket = new TableLink(tableUrl(HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          skew.current = message.room.now - Date.now();
          topRef.current = message.room.top;
          setRoom(message.room);
          setHand(message.hand);
          setYouId(message.youId);
          setError('');
          return;
        }
        if (message.t === 'nope') {
          setError(message.msg);
          playSfx('bad');
          return;
        }
        if (message.t === 'fx') {
          pushFx(message.kind, message.playerId, message.text);
          playSfx(FX_SOUND[message.kind] ?? 'tap');
        }
      },
    });

    link.current = socket;
    socket.open();
    return () => {
      socket.dispose();
      link.current = null;
    };
  }, [seated, code, name, pushFx]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => setMuted(quiet), [quiet]);

  /* ------------------------------------------------------------------ state */

  const me = useMemo(
    () => room?.players.find((player) => player.id === youId) ?? null,
    [room, youId],
  );
  const isHost = Boolean(me?.host);
  const myTurn = Boolean(room && room.activeId === youId && !me?.out);
  const active = room?.players.find((player) => player.id === room.activeId) ?? null;

  const seats = useMemo(
    () => (room ? ringSeats(room.players, youId, room.direction) : []),
    [room, youId],
  );

  useEffect(() => {
    const next = new Map<string, { x: number; y: number }>();
    for (const slot of seats) next.set(slot.player.id, { x: slot.x, y: slot.y });
    anchors.current = next;
  }, [seats]);

  /* Rebuild the visible discard scatter from the authoritative discard count. */
  const discardCount = room?.discardCount ?? 0;
  const topCard = room?.top ?? null;
  useEffect(() => {
    if (discardCount === lastDiscard.current) return;
    const grew = discardCount > lastDiscard.current;
    lastDiscard.current = discardCount;
    if (!topCard) {
      setPile([]);
      return;
    }
    const seq = ++pileSeq.current;
    const fresh: PileCard = {
      key: seq,
      side: topCard,
      rot: ((seq * 37) % 27) - 13,
      dx: ((seq * 53) % 19) - 9,
      dy: ((seq * 29) % 19) - 9,
    };
    setPile((prev) => (grew ? [...prev, fresh].slice(-5) : [fresh]));
  }, [discardCount, topCard]);

  /* Let the celebration land on the table before the scoreboard covers it. */
  const phase = room?.phase;
  useEffect(() => {
    if (phase !== 'roundOver' && phase !== 'over') {
      setShowEnd(false);
      return;
    }
    const timer = window.setTimeout(() => setShowEnd(true), 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  /* A growing stacked penalty gets its own rising tone. */
  const pending = room?.pendingDraw ?? 0;
  useEffect(() => {
    if (pending > lastPending.current) playSfx('threat');
    lastPending.current = pending;
  }, [pending]);

  const remaining = room?.turnEndsAt
    ? Math.max(0, room.turnEndsAt - (Date.now() + skew.current))
    : 0;
  const clockPct = room && room.turnEndsAt
    ? Math.max(0, Math.min(100, (remaining / (room.rules.turnSeconds * 1000)) * 100))
    : 0;
  const seconds = Math.ceil(remaining / 1000);

  const isPlayable = useCallback(
    (card: Card) => {
      if (!room || !myTurn) return false;
      // Once you draw, the drawn card is your only legal play.
      if (room.drewThisTurn) return room.drawnId === card.id;
      return canPlay(card, room);
    },
    [room, myTurn],
  );

  /* ---------------------------------------------------------------- actions */

  const throwCard = useCallback(
    (card: Card, color?: Color, target?: string) => {
      send({ t: 'play', cardId: card.id, color, target });
      setWildFor(null);
      setSwapFor(null);
    },
    [send],
  );

  const onPlay = useCallback(
    (card: Card) => {
      if (!room || !isPlayable(card)) return;
      const shown = faceOf(card, room.side);

      if (isWildFace(shown.face) && room.rules.pack !== 'allwild') {
        setWildFor(card);
        playSfx('tap');
        return;
      }
      if (room.rules.sevenZero && shown.face === '7') {
        const others = room.players.filter((p) => p.id !== youId && !p.out);
        if (others.length > 1) {
          setSwapFor(card);
          playSfx('tap');
          return;
        }
        throwCard(card, undefined, others[0]?.id);
        return;
      }
      throwCard(card);
    },
    [room, isPlayable, youId, throwCard],
  );

  const enter = useCallback(() => {
    const clean = name.trim().slice(0, 14);
    if (!clean) return;
    rememberName(clean);
    setName(clean);
    setSeated(true);
    playSfx('tap');
  }, [name]);

  const invite = useCallback(() => {
    const url = `${window.location.origin}/${lang}/minigames/uno/play?code=${encodeURIComponent(code)}`;
    void navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }, [lang, code]);

  /* ------------------------------------------------------------------ chrome */

  const header = (
    <header className="un-top">
      <span className="un-logo">
        <b>{copy.brand}</b> {copy.tagline}
      </span>
      <span className="un-spacer" />
      {code && (
        <>
          <span className="un-chip">
            {copy.room} <strong>{code.toUpperCase()}</strong>
          </span>
          <button type="button" className="un-chip" onClick={invite}>
            {copied ? copy.copied : copy.copyLink}
          </button>
        </>
      )}
      <button type="button" className="un-chip" onClick={() => setQuiet((q) => !q)}>
        {copy.sound} {quiet ? '✕' : '♪'}
      </button>
      <span className="un-chip">
        <i className="un-dot" data-s={status} />
        <span className="un-hide-sm">{copy.status[status]}</span>
      </span>
      <a className="un-chip" href={`/${lang}/minigames/uno`}>
        {copy.leave}
      </a>
    </header>
  );

  /* ----------------------------------------------------------------- gates */

  if (!code) {
    return (
      <div className="un">
        <div className="un-wrap">
          {header}
          <div className="un-panel">
            <h1 className="un-title">{copy.noRoom}</h1>
            <div className="un-row">
              <a className="un-btn" href={`/${lang}/minigames/uno`}>
                {copy.leave}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seated) {
    return (
      <div className="un">
        <div className="un-wrap">
          {header}
          <div className="un-panel" style={{ maxWidth: '26rem' }}>
            <p className="un-eyebrow">{copy.room} {code.toUpperCase()}</p>
            <h1 className="un-title">{copy.checkinTitle}</h1>
            <p className="un-sub">{copy.checkinSub}</p>
            <label className="un-eyebrow" htmlFor="un-name" style={{ display: 'block', marginTop: '1.1rem', color: 'var(--dim)' }}>
              {copy.nameLabel}
            </label>
            <input
              id="un-name"
              className="un-input"
              style={{ marginTop: '0.4rem' }}
              value={name}
              maxLength={14}
              placeholder={copy.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && enter()}
            />
            <div className="un-row">
              <button type="button" className="un-btn" disabled={!name.trim()} onClick={enter}>
                {copy.enter}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="un">
        <div className="un-wrap">
          {header}
          <div className="un-panel">
            <h1 className="un-title">{copy.status[status]}…</h1>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ table */

  const tint = COLOR_HEX[room.activeColor];
  const palette = paletteFor(room.side);
  const canShout = Boolean(me && !me.out && hand.length <= 2 && hand.length > 0 && !me.uno);

  const body =
    room.phase === 'lobby' ? (
      <Lobby
        room={room}
        youId={youId}
        isHost={isHost}
        ready={Boolean(me?.ready)}
        copy={copy}
        onRules={(patch: Partial<Rules>) => send({ t: 'rules', patch })}
        onReady={(on) => send({ t: 'ready', on })}
        onBegin={() => send({ t: 'begin' })}
      />
    ) : (
      <div className="un-stage">
        <div className="un-arena">
          <div
            className="un-ring"
            data-side={room.side}
            data-seats={room.players.length}
            style={{ '--tint': tint } as CSSProperties}
          >
            <div className="un-felt-zone">
              <div className="un-table" aria-hidden="true">
                <span className="un-table-felt" />
                <span className="un-table-wash" />
                <span className="un-table-rim" />
                <span className="un-table-grain" />
              </div>

              <DirectionArrows direction={room.direction} spin={spin} />

              <div className="un-center">
                <div className="un-slot un-slot-deck">
                  <button
                    type="button"
                    className="un-deck-btn"
                    disabled={!myTurn || room.drewThisTurn}
                    onClick={() => send({ t: 'draw' })}
                    aria-label={`${copy.drawBtn} — ${room.deckLeft}`}
                  >
                    <Deck left={room.deckLeft} width="clamp(2.9rem, 6.5vw, 4.4rem)" />
                  </button>
                  <span className="un-slot-label">
                    {copy.drawPile} · {room.deckLeft}
                  </span>
                </div>

                <div className="un-slot un-slot-discard">
                  <Discard
                    pile={pile}
                    width="clamp(4rem, 9vw, 6.2rem)"
                    label={
                      room.top
                        ? `${copy.discardPile}: ${copy.colors[room.top.color] ?? room.top.color} ${
                            copy.faces[room.top.face] ?? room.top.face
                          }`
                        : copy.discardPile
                    }
                  />
                </div>
              </div>

              {room.pendingDraw > 0 && (
                <div className="un-threat" data-heavy={room.pendingDraw >= 8}>
                  <span className="un-threat-label">{copy.incoming}</span>
                  <b>+{room.pendingDraw}</b>
                </div>
              )}
            </div>

            <p className="un-turnline" aria-live="polite">
              {myTurn ? (
                <b>{copy.yourTurn}</b>
              ) : (
                <>
                  {copy.waitingFor} <b>{active?.name ?? '—'}</b>
                </>
              )}
              {room.rules.pack === 'flip' && (
                <span className="un-badge" data-k="side">
                  {room.side === 'dark' ? copy.darkSide : copy.lightSide}
                </span>
              )}
              <span className="un-badge" data-k="dir">
                {room.direction === 1 ? `↻ ${copy.clockwise}` : `↺ ${copy.counter}`}
              </span>
            </p>

            <div className="un-seats">
              {seats.map((slot) => (
                <Seat
                  key={slot.player.id}
                  slot={slot}
                  activeId={room.activeId}
                  copy={copy}
                  clockPct={clockPct}
                  seconds={seconds}
                  onCatch={(id) => send({ t: 'catch', playerId: id })}
                />
              ))}
            </div>

            <FxLayer events={fxEvents} copy={copy} />
          </div>

          <section className="un-tray">
            <div className="un-tray-head">
              <span className="un-eyebrow">{copy.yourHand}</span>
              <span className="un-hint">{hand.length}</span>
              <span className="un-spacer" />
              {me?.out && <span className="un-tag" data-k="off">{copy.knockedOut}</span>}
              {myTurn && room.drewThisTurn && <span className="un-hint">{copy.playDrawn}</span>}
            </div>

            <Hand hand={hand} side={room.side} playable={isPlayable} onPlay={onPlay} copy={copy} />

            <div className="un-actions">
              <button
                type="button"
                className="un-btn"
                disabled={!myTurn || room.drewThisTurn}
                onClick={() => send({ t: 'draw' })}
              >
                {room.pendingDraw > 0 ? `${copy.takeStack} +${room.pendingDraw}` : copy.drawBtn}
              </button>
              <button
                type="button"
                className="un-btn"
                data-tone="ghost"
                disabled={!myTurn || !room.drewThisTurn}
                onClick={() => send({ t: 'pass' })}
              >
                {copy.passBtn}
              </button>
              <span className="un-spacer" />
              {canShout && (
                <button type="button" className="un-shout" onClick={() => send({ t: 'uno' })}>
                  {copy.unoBtn}
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="un-side">
          <Feed log={room.log} copy={copy} />
          <div className="un-panel" style={{ padding: '0.9rem' }}>
            <p className="un-eyebrow" style={{ color: 'var(--dim)' }}>{copy.scoreboard}</p>
            <Scores players={room.players} copy={copy} winnerId={room.winnerId} />
          </div>
        </div>
      </div>
    );

  /* --------------------------------------------------------------- overlays */

  const colorModal = wildFor && (
    <div className="un-veil" role="dialog" aria-modal="true">
      <div className="un-modal">
        <h2 className="un-title" style={{ fontSize: '1.5rem' }}>{copy.pickColor}</h2>
        <div className="un-wheel">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              className="un-swatch"
              style={{ background: COLOR_HEX[color] }}
              onClick={() => throwCard(wildFor, color)}
            >
              {copy.colors[color]}
            </button>
          ))}
        </div>
        <div className="un-row">
          <button type="button" className="un-btn" data-tone="ghost" onClick={() => setWildFor(null)}>
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );

  const swapModal = swapFor && (
    <div className="un-veil" role="dialog" aria-modal="true">
      <div className="un-modal">
        <h2 className="un-title" style={{ fontSize: '1.5rem' }}>{copy.pickTarget}</h2>
        <ul className="un-scores">
          {room.players
            .filter((player) => player.id !== youId && !player.out)
            .map((player) => (
              <li key={player.id}>
                <span>{player.name}</span>
                <button
                  type="button"
                  className="un-btn"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                  onClick={() => throwCard(swapFor, undefined, player.id)}
                >
                  {player.cards}
                </button>
              </li>
            ))}
        </ul>
        <div className="un-row">
          <button type="button" className="un-btn" data-tone="ghost" onClick={() => setSwapFor(null)}>
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );

  const endModal = showEnd && (room.phase === 'roundOver' || room.phase === 'over') && (
    <div className="un-veil" role="dialog" aria-modal="true">
      <div className="un-modal">
        <p className="un-eyebrow">
          {room.phase === 'over' ? copy.winnerTitle : copy.roundTitle}
        </p>
        <h2 className="un-title">
          {room.phase === 'over'
            ? room.winnerId === youId
              ? copy.youWin
              : (room.players.find((p) => p.id === room.winnerId)?.name ?? '—')
            : (room.players.find((p) => p.id === room.roundWinnerId)?.name ?? '—')}
        </h2>
        {room.phase === 'roundOver' && <p className="un-sub">{copy.roundSub}</p>}

        <Scores players={room.players} copy={copy} winnerId={room.winnerId ?? room.roundWinnerId} />

        <div className="un-row">
          {isHost ? (
            <button
              type="button"
              className="un-btn"
              onClick={() => send(room.phase === 'over' ? { t: 'again' } : { t: 'next' })}
            >
              {room.phase === 'over' ? copy.again : copy.nextRound}
            </button>
          ) : (
            <p className="un-hint">{copy.waitingHost}</p>
          )}
          <a className="un-btn" data-tone="ghost" href={`/${lang}/minigames/uno`}>
            {copy.leave}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="un">
      <div className="un-wrap">
        {header}
        {error && <p className="un-error">{error}</p>}
        {body}
      </div>
      {colorModal}
      {swapModal}
      {endModal}
    </div>
  );
}
