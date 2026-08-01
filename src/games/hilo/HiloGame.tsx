import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import './hilo.css';
import { copyFor, type Lang } from './copy';
import { TableLink, playerKey, tableUrl, type LinkStatus } from './net';
import { Feed, HandTray, RangeMeter, SeatRail, fmt } from './parts';
import { play, setMuted, type Sfx } from './sfx';
import type { Call, Card, Outbound, RoomView, Rules } from './protocol';

const ENV = import.meta.env as unknown as Record<string, string | boolean | undefined>;
const HOST =
  (ENV.PUBLIC_HILO_HOST as string | undefined) ||
  (ENV.DEV ? 'localhost:8787' : 'empyr-hilo.arcanearthenden.workers.dev');

const FX_SOUND: Record<string, Sfx> = {
  reverse: 'wild',
  skip: 'wild',
  shield: 'wild',
  bluff: 'wild',
  narrow: 'wild',
  blindfold: 'wild',
  out: 'out',
  mine: 'mine',
  deal: 'deal',
  shuffle: 'shuffle',
  win: 'win',
};

const FX_TONE: Record<string, 'good' | 'bad' | 'wild'> = {
  out: 'bad',
  mine: 'bad',
  win: 'good',
};

interface Flash {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'wild';
}

export default function HiloGame({ lang, code: given }: { lang: Lang; code?: string }) {
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
  const [flash, setFlash] = useState<Flash | null>(null);
  const [value, setValue] = useState('');
  const [secret, setSecret] = useState('');
  const [pending, setPending] = useState<'blindfold' | 'bluff' | null>(null);
  const [copiedAt, setCopiedAt] = useState(0);
  const [quiet, setQuiet] = useState(false);
  const [tick, setTick] = useState(0);

  const linkRef = useRef<TableLink | null>(null);
  const skewRef = useRef(0);
  const tickRef = useRef(0);
  const fxSeq = useRef(0);

  useEffect(() => {
    try {
      setName(localStorage.getItem('hilo.name') ?? '');
    } catch {
      /* private mode */
    }
  }, []);

  const receive = useCallback((message: Outbound) => {
    if (message.t === 'sync') {
      skewRef.current = message.room.now - Date.now();
      setRoom(message.room);
      setHand(message.hand);
      setYouId(message.youId);
      return;
    }
    if (message.t === 'nope') {
      setError(message.msg);
      play('bad');
      window.setTimeout(() => setError(null), 3200);
      return;
    }
    if (message.t === 'fx') {
      const sound = FX_SOUND[message.kind];
      if (sound) play(sound);
      if (message.kind === 'deal') return;
      const label = copyFor(lang).fx[message.kind] ?? message.kind;
      setFlash({
        id: ++fxSeq.current,
        text: message.text ? `${label} · ${message.text}` : label,
        tone: FX_TONE[message.kind] ?? 'wild',
      });
    }
  }, [lang]);

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
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 950);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (room?.phase === 'secrets') setSecret('');
  }, [room?.phase]);

  const send = linkRef.current?.send.bind(linkRef.current) ?? (() => {});

  const me = room?.seats.find((seat) => seat.id === youId) ?? null;
  const isHost = Boolean(me?.host);
  const blind = (me?.blind ?? 0) > 0;
  const myTurn = Boolean(room && room.phase === 'turn' && room.activeId === youId && me?.alive);
  const opening = room?.probe === null;
  const active = room?.seats.find((seat) => seat.id === room.activeId) ?? null;
  const hunted = room?.seats.find((seat) => seat.id === room.targetId) ?? null;

  const remaining = useMemo(() => {
    if (!room?.turnEndsAt) return null;
    return Math.max(0, room.turnEndsAt - (Date.now() + skewRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.turnEndsAt, tick]);

  useEffect(() => {
    if (!myTurn || remaining === null) return;
    const seconds = Math.ceil(remaining / 1000);
    if (seconds <= 5 && seconds > 0 && tickRef.current !== seconds) {
      tickRef.current = seconds;
      play('tick');
    }
  }, [myTurn, remaining]);

  /* The server commits the call and narrows the window to the *true* bounds before
     the client ever picks a number, so there is nothing to predict client-side. */
  const window_ = useMemo(() => (room ? { low: room.low, high: room.high } : { low: 0, high: 0 }), [room]);

  const turnKey = `${room?.activeId ?? ''}:${room?.probe ?? ''}:${room?.low ?? ''}:${room?.high ?? ''}`;
  useEffect(() => {
    if (!myTurn) return;
    setValue(String(Math.floor((window_.low + window_.high) / 2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey, myTurn]);

  const checkIn = (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim().slice(0, 16);
    if (!clean) return;
    try {
      localStorage.setItem('hilo.name', clean);
    } catch {
      /* ignore */
    }
    setName(clean);
    setSeated(true);
    play('tap');
  };

  const playCard = (card: Card) => {
    if (!myTurn) return;
    if (card === 'blindfold' || card === 'bluff') {
      setPending(card);
      return;
    }
    play('tap');
    send({ t: 'card', card });
  };

  const invite = () => {
    const url = `${location.origin}/${lang}/minigames/frenzy/play?code=${encodeURIComponent(code)}`;
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

  /* ------------------------------------------------------------- check-in */

  if (!code) {
    return (
      <main className="hl">
        <div className="hl-wrap" style={{ paddingTop: '5rem' }}>
          <div className="hl-panel" style={{ maxWidth: '30rem', margin: '0 auto', textAlign: 'center' }}>
            <h1 className="hl-title">404 · no room</h1>
            <a className="hl-btn" style={{ display: 'inline-block', marginTop: '1rem' }} href={`/${lang}/minigames/frenzy`}>
              {copy.leave}
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!seated) {
    return (
      <main className="hl">
        <div className="hl-wrap" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="hl-panel" style={{ maxWidth: '30rem', margin: '0 auto' }}>
            <div className="hl-eyebrow">
              {copy.room} {code.toUpperCase()}
            </div>
            <h1 className="hl-title" style={{ marginTop: '0.5rem' }}>
              {copy.checkinTitle}
            </h1>
            <p className="hl-sub">{copy.checkinSub}</p>
            <form onSubmit={checkIn} style={{ marginTop: '1.2rem' }}>
              <label className="hl-eyebrow" htmlFor="hl-name">
                {copy.nameLabel}
              </label>
              <input
                id="hl-name"
                className="hl-input"
                style={{ marginTop: '0.4rem' }}
                value={name}
                maxLength={16}
                placeholder={copy.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
              <button type="submit" className="hl-btn" style={{ marginTop: '0.8rem', width: '100%' }} disabled={!name.trim()}>
                {copy.enter}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------ shell */

  return (
    <main className="hl">
      <div className="hl-wrap">
        <header className="hl-bar">
          <div className="hl-logo">
            {copy.brand}<span> / {copy.tagline}</span>
          </div>
          <button type="button" className="hl-chip" onClick={invite}>
            <strong>{code.toUpperCase()}</strong>
            <span className="hl-wide">{Date.now() - copiedAt < 1800 ? copy.copied : copy.copyLink}</span>
          </button>
          <span className="hl-spacer" />
          <button type="button" className="hl-chip" onClick={toggleSound}>
            <span className="hl-wide">{copy.sound}</span> {quiet ? '✕' : '♪'}
          </button>
          <span className="hl-chip" style={{ cursor: 'default' }}>
            <i className="hl-led" data-s={status} />
            <span className="hl-wide">{copy.status[status]}</span>
          </span>
          <a className="hl-chip" href={`/${lang}/minigames/frenzy`}>
            {copy.leave}
          </a>
        </header>

        {room && (
          <SeatRail
            seats={room.seats}
            activeId={room.activeId}
            targetId={room.targetId}
            youId={youId}
            copy={copy}
            lobby={room.phase === 'lobby'}
            secrets={room.phase === 'secrets'}
          />
        )}

        {!room && <p className="hl-hint" style={{ padding: '2rem 0' }}>{copy.status[status]}…</p>}

        {room?.phase === 'lobby' && (
          <Lobby
            room={room}
            copy={copy}
            isHost={isHost}
            ready={Boolean(me?.ready)}
            onRules={(patch) => send({ t: 'rules', patch })}
            onReady={(on) => {
              play('tap');
              send({ t: 'ready', on });
            }}
            onBegin={() => send({ t: 'begin' })}
            onInvite={invite}
            copied={Date.now() - copiedAt < 1800}
          />
        )}

        {room?.phase === 'secrets' && (
          <div className="hl-main">
            <section className="hl-panel">
              <div className="hl-eyebrow">{copy.room} {room.code.toUpperCase()}</div>
              <h1 className="hl-title" style={{ marginTop: '0.45rem' }}>{copy.secretsTitle}</h1>
              <p className="hl-sub">{copy.secretsSub}</p>

              {me?.alive && !me?.locked ? (
                <>
                  <label className="hl-eyebrow" htmlFor="hl-secret" style={{ display: 'block', marginTop: '1rem' }}>
                    {copy.secretsInput}
                  </label>
                  <input
                    id="hl-secret"
                    className="hl-input"
                    style={{ marginTop: '0.4rem' }}
                    inputMode="numeric"
                    value={secret}
                    placeholder={`${room.rules.min.toLocaleString()} – ${room.rules.max.toLocaleString()}`}
                    onChange={(event) => setSecret(event.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button
                    type="button"
                    className="hl-btn"
                    style={{ marginTop: '0.8rem', width: '100%' }}
                    disabled={!secret}
                    onClick={() => {
                      play('tap');
                      send({ t: 'secret', value: Number(secret) });
                    }}
                  >
                    {copy.secretsLock}
                  </button>
                </>
              ) : (
                <p className="hl-hint" style={{ marginTop: '1rem' }}>
                  {me?.locked ? copy.secretsLocked : copy.spectating}
                </p>
              )}
              {error && <div className="hl-error" style={{ marginTop: '0.8rem' }}>{error}</div>}
            </section>

            <Feed log={room.log} copy={copy} />
          </div>
        )}

        {room && room.phase !== 'lobby' && room.phase !== 'secrets' && (
          <div className="hl-main">
            <section className="hl-board">
              {remaining !== null && room.phase === 'turn' && (
                <div
                  className="hl-clock"
                  data-warn={remaining < 8000}
                  style={{ width: `${Math.min(100, (remaining / (room.rules.turnSeconds * 1000)) * 100)}%` }}
                />
              )}

              <RangeMeter
                min={room.rules.min}
                max={room.rules.max}
                low={window_.low}
                high={window_.high}
                probe={room.probe}
                hidden={blind}
                copy={copy}
              />

              <div className="hl-readout">
                <div>
                  <div className="hl-eyebrow">{copy.lastCall}</div>
                  {room.probe === null ? (
                    <div className="hl-number" data-empty="true" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.7rem)' }}>
                      {copy.noCall}
                    </div>
                  ) : (
                    <div className="hl-number">{fmt(room.probe, blind)}</div>
                  )}
                </div>
                <div className="hl-turnline">
                  {room.phase === 'turn' &&
                    (myTurn ? (
                      <b>{copy.yourTurn}</b>
                    ) : (
                      <>
                        {copy.waitingFor} <b>{active?.name ?? '—'}</b>
                      </>
                    ))}
                  {room.phase === 'turn' && hunted && (
                    <div style={{ marginTop: '0.3rem' }}>
                      {copy.hunting} <b>{hunted.name}</b>
                    </div>
                  )}
                  {remaining !== null && room.phase === 'turn' && (
                    <div style={{ marginTop: '0.3rem' }}>
                      {copy.clock} <b>{Math.ceil(remaining / 1000)}s</b>
                    </div>
                  )}
                  <div style={{ marginTop: '0.3rem' }}>
                    {room.direction === 1 ? '→ clockwise' : '← counter'}
                  </div>
                </div>
              </div>

              {room.bluff && (
                <div className="hl-bluff">
                  {active?.name} {copy.bluffClaim} <b>{room.bluff === 'higher' ? copy.higher : copy.lower}</b>
                </div>
              )}

              {blind && <p className="hl-hint" style={{ marginTop: '0.8rem' }}>{copy.blinded}</p>}
              {error && <div className="hl-error" style={{ marginTop: '0.8rem' }}>{error}</div>}

              {room.phase === 'turn' && (
                <div className="hl-actions">
                  {!me?.alive && <p className="hl-hint">{copy.spectating}</p>}

                  {myTurn && (
                    <>
                      {!opening && !room.calling ? (
                        <>
                          <p className="hl-hint">{copy.callPrompt}</p>
                          <div className="hl-calls">
                            <button
                              type="button"
                              className="hl-call"
                              data-c="lower"
                              onClick={() => {
                                play('tap');
                                send({ t: 'call', call: 'lower' });
                              }}
                            >
                              ▼ {copy.lower}
                            </button>
                            <button
                              type="button"
                              className="hl-call"
                              data-c="higher"
                              onClick={() => {
                                play('tap');
                                send({ t: 'call', call: 'higher' });
                              }}
                            >
                              ▲ {copy.higher}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="hl-hint">
                            {opening ? copy.openPrompt : copy.numberPrompt}{' '}
                            <b style={{ color: 'var(--amber)' }}>
                              {copy.nowRange} {fmt(window_.low, blind)} – {fmt(window_.high, blind)}
                            </b>
                          </p>
                          <input
                            className="hl-input"
                            inputMode="numeric"
                            value={value}
                            onChange={(event) => setValue(event.target.value.replace(/[^0-9]/g, ''))}
                          />
                          <div className="hl-quick">
                            <button type="button" onClick={() => setValue(String(window_.low))}>
                              {copy.quickLow}
                            </button>
                            <button
                              type="button"
                              onClick={() => setValue(String(Math.floor((window_.low + window_.high) / 2)))}
                            >
                              {copy.quickMid}
                            </button>
                            <button type="button" onClick={() => setValue(String(window_.high))}>
                              {copy.quickHigh}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setValue(
                                  String(window_.low + Math.floor(Math.random() * (window_.high - window_.low + 1))),
                                )
                              }
                            >
                              {copy.quickRandom}
                            </button>
                          </div>
                          <button
                            type="button"
                            className="hl-btn"
                            disabled={!value}
                            onClick={() => {
                              play('tap');
                              send({ t: 'probe', value: Number(value) });
                            }}
                          >
                            {opening
                              ? copy.openAction
                              : `${room.calling === 'higher' ? `▲ ${copy.higher}` : `▼ ${copy.lower}`} · ${copy.confirm}`}
                          </button>
                        </>
                      )}

                      {room.shielded && (
                        <>
                          <p className="hl-hint">{copy.passHint}</p>
                          <button
                            type="button"
                            className="hl-btn"
                            data-ghost="true"
                            onClick={() => {
                              play('tap');
                              send({ t: 'pass' });
                            }}
                          >
                            {copy.pass}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            <Feed log={room.log} copy={copy} />
          </div>
        )}
      </div>

      {room && room.phase !== 'lobby' && room.phase !== 'secrets' && (
        <HandTray hand={hand} disabled={!myTurn} onPlay={playCard} copy={copy} />
      )}

      {/* --------------------------------------------------------- overlays */}

      {flash && (
        <div className="hl-flash" data-tone={flash.tone} key={flash.id}>
          {flash.text}
        </div>
      )}

      {pending && room && (
        <div className="hl-veil" onClick={() => setPending(null)}>
          <div className="hl-modal" onClick={(event) => event.stopPropagation()}>
            <div className="hl-eyebrow">{pending === 'blindfold' ? copy.pickTarget : copy.pickBluff}</div>
            <div className="hl-row">
              {pending === 'blindfold'
                ? room.seats
                    .filter((seat) => seat.alive && seat.id !== youId)
                    .map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        className="hl-btn"
                        data-ghost="true"
                        onClick={() => {
                          send({ t: 'card', card: 'blindfold', target: seat.id });
                          setPending(null);
                        }}
                      >
                        {seat.name}
                      </button>
                    ))
                : (['higher', 'lower'] as Call[]).map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      className="hl-btn"
                      data-ghost="true"
                      onClick={() => {
                        send({ t: 'card', card: 'bluff', bluff: direction });
                        setPending(null);
                      }}
                    >
                      {direction === 'higher' ? copy.higher : copy.lower}
                    </button>
                  ))}
            </div>
            <button type="button" className="hl-btn" data-ghost="true" style={{ marginTop: '0.8rem' }} onClick={() => setPending(null)}>
              {copy.cancel}
            </button>
          </div>
        </div>
      )}

      {room?.phase === 'vote' && me?.alive && (
        <div className="hl-veil">
          <div className="hl-modal">
            <h2 className="hl-title" style={{ fontSize: '1.2rem' }}>
              {copy.voteTitle}
            </h2>
            <p className="hl-sub">{copy.voteSub}</p>
            <p className="hl-hint" style={{ marginTop: '0.6rem' }}>
              {room.voteCast}/{room.voteNeeded} · ✓ {room.voteYes}
            </p>
            {room.youVoted ? (
              <p className="hl-hint" style={{ marginTop: '0.8rem' }}>{copy.voteWaiting}…</p>
            ) : (
              <div className="hl-row">
                <button type="button" className="hl-btn" onClick={() => send({ t: 'vote', yes: true })}>
                  {copy.voteYes}
                </button>
                <button type="button" className="hl-btn" data-ghost="true" onClick={() => send({ t: 'vote', yes: false })}>
                  {copy.voteNo}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {room?.phase === 'over' && (
        <div className="hl-veil">
          <div className="hl-modal" style={{ textAlign: 'center' }}>
            <div className="hl-eyebrow">{copy.winnerTitle}</div>
            <h2 className="hl-title" style={{ marginTop: '0.4rem', color: 'var(--amber)' }}>
              {room.winnerId === youId
                ? copy.youWin
                : (room.seats.find((seat) => seat.id === room.winnerId)?.name ?? '—')}
            </h2>
            {isHost ? (
              <button type="button" className="hl-btn" style={{ marginTop: '1rem' }} onClick={() => send({ t: 'again' })}>
                {copy.again}
              </button>
            ) : (
              <p className="hl-hint" style={{ marginTop: '1rem' }}>{copy.voteWaiting}…</p>
            )}
            <a className="hl-btn" data-ghost="true" style={{ display: 'inline-block', marginTop: '0.6rem' }} href={`/${lang}/minigames/frenzy`}>
              {copy.leave}
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- lobby view */

function Lobby({
  room,
  copy,
  isHost,
  ready,
  onRules,
  onReady,
  onBegin,
  onInvite,
  copied,
}: {
  room: RoomView;
  copy: ReturnType<typeof copyFor>;
  isHost: boolean;
  ready: boolean;
  onRules: (patch: Partial<Rules>) => void;
  onReady: (on: boolean) => void;
  onBegin: () => void;
  onInvite: () => void;
  copied: boolean;
}) {
  const [draft, setDraft] = useState(room.rules);

  useEffect(() => setDraft(room.rules), [room.rules]);

  const commit = (patch: Partial<Rules>) => {
    setDraft((current) => ({ ...current, ...patch }));
    onRules(patch);
  };

  const seated = room.seats.length;

  return (
    <div className="hl-main">
      <section className="hl-panel">
        <div className="hl-eyebrow">
          {copy.room} {room.code.toUpperCase()} · {seated}/{room.rules.capacity}
        </div>
        <h1 className="hl-title" style={{ marginTop: '0.45rem' }}>
          {copy.lobbyTitle}
        </h1>
        <p className="hl-sub">{copy.lobbySub}</p>

        <div className="hl-dials">
          <div className="hl-dial" data-locked={!isHost}>
            <label htmlFor="hl-min">{copy.dialRange} ↓</label>
            <input
              id="hl-min"
              inputMode="numeric"
              disabled={!isHost}
              value={draft.min}
              onChange={(event) => setDraft({ ...draft, min: Number(event.target.value.replace(/[^0-9]/g, '') || 0) })}
              onBlur={() => commit({ min: draft.min })}
            />
          </div>
          <div className="hl-dial" data-locked={!isHost}>
            <label htmlFor="hl-max">{copy.dialRange} ↑</label>
            <input
              id="hl-max"
              inputMode="numeric"
              disabled={!isHost}
              value={draft.max}
              onChange={(event) => setDraft({ ...draft, max: Number(event.target.value.replace(/[^0-9]/g, '') || 0) })}
              onBlur={() => commit({ max: draft.max })}
            />
          </div>
          <div className="hl-dial" data-locked={!isHost}>
            <label htmlFor="hl-cap">{copy.dialSeats}</label>
            <select
              id="hl-cap"
              disabled={!isHost}
              value={draft.capacity}
              onChange={(event) => commit({ capacity: Number(event.target.value) })}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="hl-dial" data-locked={!isHost}>
            <label htmlFor="hl-clock">{copy.dialClock}</label>
            <select
              id="hl-clock"
              disabled={!isHost}
              value={draft.turnSeconds}
              onChange={(event) => commit({ turnSeconds: Number(event.target.value) })}
            >
              {[20, 30, 40, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n}s
                </option>
              ))}
            </select>
          </div>
          <div className="hl-dial" data-locked={!isHost}>
            <label htmlFor="hl-votes">{copy.dialVotes}</label>
            <select
              id="hl-votes"
              disabled={!isHost}
              value={draft.shuffleVotes ? 'on' : 'off'}
              onChange={(event) => commit({ shuffleVotes: event.target.value === 'on' })}
            >
              <option value="on">{copy.on}</option>
              <option value="off">{copy.off}</option>
            </select>
          </div>
        </div>

        {!isHost && <p className="hl-hint" style={{ marginTop: '0.8rem' }}>{copy.hostOnly}</p>}

        <div className="hl-row">
          <button type="button" className="hl-btn" data-ghost={!ready} onClick={() => onReady(!ready)}>
            {ready ? copy.unready : copy.ready}
          </button>
          {isHost && (
            <button type="button" className="hl-btn" data-ghost={seated < 3} disabled={seated < 3} onClick={onBegin}>
              {seated < 3 ? copy.needThree : copy.start}
            </button>
          )}
          <button type="button" className="hl-btn" data-ghost="true" onClick={onInvite}>
            {copied ? copy.copied : copy.copyLink}
          </button>
        </div>
      </section>

      <Feed log={room.log} copy={copy} />
    </div>
  );
}
