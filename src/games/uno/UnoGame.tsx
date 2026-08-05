import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './uno.css';
import { TableLink, playerKey, recallName, rememberName, tableUrl, type LinkStatus } from './net';
import { copyFor, type Lang } from './copy';
import { CardBack, CardFace, Feed, Hand, PlayerRail, Scores } from './parts';
import { Lobby } from './lobby';
import {
  canPlay,
  faceOf,
  isWildFace,
  paletteFor,
  type Card,
  type Color,
  type Inbound,
  type Outbound,
  type RoomView,
  type Rules,
} from './protocol';
import { play as playSfx, setMuted } from './sfx';

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

interface Flash {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'wild';
}

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
  const [flash, setFlash] = useState<Flash | null>(null);
  const [wildFor, setWildFor] = useState<Card | null>(null);
  const [swapFor, setSwapFor] = useState<Card | null>(null);
  const [, setTick] = useState(0);

  const link = useRef<TableLink | null>(null);
  const skew = useRef(0);
  const flashSeq = useRef(0);

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  /* ------------------------------------------------------------- connection */

  useEffect(() => {
    if (!seated || !code) return;

    const socket = new TableLink(tableUrl(HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          skew.current = message.room.now - Date.now();
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
          const label = message.text ?? copy.fx[message.kind] ?? '';
          const tone: Flash['tone'] =
            message.kind === 'caught' || message.kind === 'blast' || message.kind === 'out'
              ? 'bad'
              : message.kind === 'win' || message.kind === 'round'
                ? 'good'
                : 'wild';
          if (label && message.kind !== 'play' && message.kind !== 'draw') {
            setFlash({ id: ++flashSeq.current, text: label, tone });
          }
          switch (message.kind) {
            case 'play':
              playSfx('play');
              break;
            case 'draw':
              playSfx('draw');
              break;
            case 'uno':
              playSfx('uno');
              break;
            case 'win':
            case 'round':
              playSfx('win');
              break;
            case 'caught':
            case 'blast':
            case 'out':
              playSfx('bad');
              break;
            default:
              playSfx('wild');
          }
        }
      },
    });

    link.current = socket;
    socket.open();
    return () => {
      socket.dispose();
      link.current = null;
    };
  }, [seated, code, name, copy]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => setMuted(quiet), [quiet]);

  /* ------------------------------------------------------------------ state */

  const me = useMemo(
    () => room?.players.find((player) => player.id === youId) ?? null,
    [room, youId],
  );
  const isHost = Boolean(me?.host);
  const myTurn = Boolean(room && room.activeId === youId && !me?.out);
  const active = room?.players.find((player) => player.id === room.activeId) ?? null;

  const remaining = room?.turnEndsAt
    ? Math.max(0, room.turnEndsAt - (Date.now() + skew.current))
    : 0;
  const clockPct = room && room.turnEndsAt
    ? Math.max(0, Math.min(100, (remaining / (room.rules.turnSeconds * 1000)) * 100))
    : 0;

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

  const wash = `radial-gradient(60% 60% at 50% 50%, ${COLOR_HEX[room.activeColor]}, transparent 72%)`;
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
          <PlayerRail
            players={room.players}
            activeId={room.activeId}
            youId={youId}
            copy={copy}
            lobby={false}
            onCatch={(id) => send({ t: 'catch', playerId: id })}
          />

          <section className="un-felt">
            <div className="un-wash" style={{ background: wash }} />

            <p className="un-turnline">
              {myTurn ? (
                <b>{copy.yourTurn}</b>
              ) : (
                <>
                  {copy.waitingFor} <b>{active?.name ?? '—'}</b>
                </>
              )}
              {room.pendingDraw > 0 && (
                <span className="un-badge">
                  {copy.stackWarn} +{room.pendingDraw}
                </span>
              )}
              {room.rules.pack === 'flip' && (
                <span className="un-badge">
                  {room.side === 'dark' ? copy.darkSide : copy.lightSide}
                </span>
              )}
            </p>

            <div className="un-piles">
              <div className="un-pile">
                <span className="un-pile-label">
                  {copy.drawPile} · {room.deckLeft}
                </span>
                <button
                  type="button"
                  className="un-deck-btn"
                  disabled={!myTurn || room.drewThisTurn}
                  onClick={() => send({ t: 'draw' })}
                  aria-label={copy.drawBtn}
                >
                  <CardBack width="clamp(4.4rem, 9vw, 6.2rem)" />
                </button>
              </div>

              <div className="un-pile un-discard">
                <span className="un-pile-label">{copy.discardPile}</span>
                {room.top ? (
                  <CardFace side={room.top} width="clamp(5.2rem, 11vw, 7.6rem)" />
                ) : (
                  <CardBack width="clamp(5.2rem, 11vw, 7.6rem)" />
                )}
              </div>
            </div>

            <span className="un-arrow">
              {room.direction === 1 ? `↻ ${copy.clockwise}` : `↺ ${copy.counter}`}
            </span>

            {room.turnEndsAt && (
              <span
                className="un-clockbar"
                data-warn={remaining < 8000 ? 'true' : 'false'}
                style={{ width: `${clockPct}%` }}
              />
            )}
          </section>

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

  const endModal = (room.phase === 'roundOver' || room.phase === 'over') && (
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
      {flash && (
        <span key={flash.id} className="un-flash" data-tone={flash.tone}>
          {flash.text}
        </span>
      )}
      {colorModal}
      {swapModal}
      {endModal}
    </div>
  );
}
