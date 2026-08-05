import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './liars.css';
import { Board } from './board';
import { copyFor, type Lang } from './copy';
import { Lobby } from './lobby';
import { TableLink, playerKey, recallName, rememberName, tableUrl, type LinkStatus } from './net';
import { HandTray } from './parts';
import { ShowdownOverlay } from './showdown';
import { play, setMuted } from './sfx';
import type { Card, Outbound, RoomView } from './protocol';

const ENV = import.meta.env as unknown as Record<string, string | boolean | undefined>;
const HOST =
  (ENV.PUBLIC_LIARS_HOST as string | undefined) ||
  (ENV.DEV ? 'localhost:8795' : 'empyr-liars.arcanearthenden.workers.dev');

export default function LiarsGame({ lang, code: given }: { lang: Lang; code?: string }) {
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
  const [hand, setHand] = useState<Card[]>([]);
  const [youId, setYouId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedAt, setCopiedAt] = useState(0);
  const [quiet, setQuiet] = useState(false);
  const [tick, setTick] = useState(0);

  const linkRef = useRef<TableLink | null>(null);
  const skewRef = useRef(0);

  useEffect(() => {
    setName(recallName());
  }, []);

  const receive = useCallback((message: Outbound) => {
    if (message.t === 'sync') {
      skewRef.current = message.room.now - Date.now();
      setRoom(message.room);
      setHand(message.hand);
      setYouId(message.youId);
      if (message.room.phase !== 'play') setSelected(new Set());
      return;
    }
    if (message.t === 'nope') {
      setError(message.msg);
      play('bad');
      window.setTimeout(() => setError(null), 3200);
    }
  }, []);

  useEffect(() => {
    if (!seated || !code) return;
    const link = new TableLink(tableUrl(HOST, code), {
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
  }, [seated, code, name, receive]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  const send = linkRef.current?.send.bind(linkRef.current) ?? (() => {});

  const me = room?.players.find((p) => p.id === youId) ?? null;
  const isHost = Boolean(me?.host);
  const myTurn = Boolean(room?.phase === 'play' && room.activeId === youId && me && !me.dead);

  const remaining = useMemo(() => {
    if (!room?.turnEndsAt) return null;
    return Math.max(0, room.turnEndsAt - (Date.now() + skewRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.turnEndsAt, tick]);

  useEffect(() => {
    if (!myTurn || remaining === null) return;
    const seconds = Math.ceil(remaining / 1000);
    if (seconds <= 5 && seconds > 0) play('tick');
  }, [myTurn, remaining]);

  const canLiar = Boolean(
    myTurn &&
      room?.claim &&
      room.claim.playerId !== youId,
  );

  const checkIn = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = name.trim().slice(0, 14);
    if (!clean) return;
    rememberName(clean);
    setName(clean);
    setSeated(true);
    play('tap');
  };

  const invite = () => {
    const url = `${location.origin}/${lang}/minigames/liars/play?code=${encodeURIComponent(code)}`;
    void navigator.clipboard?.writeText(url);
    setCopiedAt(Date.now());
    play('tap');
  };

  const toggleSound = () => {
    const next = !quiet;
    setQuiet(next);
    setMuted(next);
    if (!next) play('tap');
  };

  const toggleCard = (id: string) => {
    if (!myTurn || !room) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < room.rules.maxPlay) next.add(id);
      return next;
    });
    play('tap');
  };

  const playSelected = () => {
    if (!myTurn || selected.size === 0) return;
    play('play');
    send({ t: 'play', cardIds: [...selected] });
    setSelected(new Set());
  };

  if (!code) {
    return (
      <main className="lb">
        <div className="lb-wrap" style={{ paddingTop: '5rem' }}>
          <div className="lb-panel" style={{ maxWidth: '30rem', margin: '0 auto', textAlign: 'center' }}>
            <h1 className="lb-title">404 · no room</h1>
            <a className="lb-btn" style={{ display: 'inline-block', marginTop: '1rem' }} href={`/${lang}/minigames/liars`}>
              {copy.leave}
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!seated) {
    return (
      <main className="lb">
        <div className="lb-wrap" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="lb-panel" style={{ maxWidth: '30rem', margin: '0 auto' }}>
            <div className="lb-eyebrow">
              {copy.room} {code.toUpperCase()}
            </div>
            <h1 className="lb-title" style={{ marginTop: '0.5rem' }}>{copy.checkinTitle}</h1>
            <p className="lb-sub">{copy.checkinSub}</p>
            <form onSubmit={checkIn} style={{ marginTop: '1.2rem' }}>
              <label className="lb-eyebrow" htmlFor="lb-name">{copy.nameLabel}</label>
              <input
                id="lb-name"
                className="lb-input"
                style={{ marginTop: '0.4rem' }}
                value={name}
                maxLength={14}
                placeholder={copy.namePlaceholder}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="lb-btn" style={{ marginTop: '0.8rem', width: '100%' }} disabled={!name.trim()}>
                {copy.enter}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const showHand = Boolean(room?.phase === 'play' && me && !me.dead);

  return (
    <main className="lb">
      <div className="lb-wrap">
        <header className="lb-bar">
          <div className="lb-logo">
            {copy.brand}<span> / {copy.tagline}</span>
          </div>
          <button type="button" className="lb-chip" onClick={invite}>
            <strong>{code.toUpperCase()}</strong>
            <span className="lb-wide">{Date.now() - copiedAt < 1800 ? copy.copied : copy.copyLink}</span>
          </button>
          <span className="lb-spacer" />
          <button type="button" className="lb-chip" onClick={toggleSound}>
            <span className="lb-wide">{copy.sound}</span> {quiet ? '✕' : '♪'}
          </button>
          <span className="lb-chip" style={{ cursor: 'default' }}>
            <i className="lb-led" data-s={status} />
            <span className="lb-wide">{copy.status[status]}</span>
          </span>
          <a className="lb-chip" href={`/${lang}/minigames/liars`}>{copy.leave}</a>
        </header>

        {!room && <p className="lb-hint" style={{ padding: '2rem 0' }}>{copy.status[status]}…</p>}

        {room?.phase === 'lobby' && (
          <Lobby
            room={room}
            youId={youId}
            isHost={isHost}
            ready={Boolean(me?.ready)}
            copy={copy}
            onRules={(patch) => send({ t: 'rules', patch })}
            onPreset={() => send({ t: 'preset', name: 'classic' })}
            onReady={(on) => {
              play('tap');
              send({ t: 'ready', on });
            }}
            onBegin={() => {
              play('deal');
              send({ t: 'begin' });
            }}
            onInvite={invite}
            copied={Date.now() - copiedAt < 1800}
          />
        )}

        {room?.phase === 'play' && (
          <Board
            room={room}
            youId={youId}
            copy={copy}
            remaining={remaining}
            error={error}
            canPlay={myTurn}
            canLiar={canLiar}
            onLiar={() => {
              play('liar');
              send({ t: 'liar' });
            }}
          />
        )}

        {room?.phase === 'showdown' && room.stage && (
          <ShowdownOverlay
            stage={room.stage}
            copy={copy}
            skewMs={skewRef.current}
            waiting={room.waiting}
            seated={room.seated}
            youWaiting={room.youWaiting}
            isHost={isHost}
            moveLabel={isHost ? copy.skipStage : copy.moveOn}
            onMoveOn={() => {
              play('tap');
              if (isHost) send({ t: 'begin' });
              else send({ t: 'onward' });
            }}
          />
        )}

        {room?.phase === 'over' && (
          <div className="lb-veil">
            <div className="lb-modal">
              <div className="lb-eyebrow">{copy.winnerTitle}</div>
              <h2 className="lb-title" style={{ marginTop: '0.4rem', color: 'var(--brass)' }}>
                {room.winnerId === youId
                  ? copy.youWin
                  : (room.players.find((p) => p.id === room.winnerId)?.name ?? '—')}
              </h2>
              {isHost ? (
                <button type="button" className="lb-btn" style={{ marginTop: '1rem' }} onClick={() => send({ t: 'again' })}>
                  {copy.again}
                </button>
              ) : (
                <p className="lb-hint" style={{ marginTop: '1rem' }}>{copy.waitingOn}…</p>
              )}
              <a className="lb-btn" data-ghost="true" style={{ display: 'inline-block', marginTop: '0.6rem' }} href={`/${lang}/minigames/liars`}>
                {copy.leave}
              </a>
            </div>
          </div>
        )}
      </div>

      {showHand && room && (
        <HandTray
          hand={hand}
          selected={selected}
          maxPlay={room.rules.maxPlay}
          disabled={!myTurn}
          copy={copy}
          onToggle={toggleCard}
          onPlay={playSelected}
        />
      )}
    </main>
  );
}
