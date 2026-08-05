import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './wordsearch.css';
import { RoomLink, playerKey, recallName, rememberName, roomUrl, type LinkStatus } from './net';
import { copyFor, type Lang } from './copy';
import { Board, Feed, Results, Scoreboard, WordList } from './parts';
import {
  inkFor,
  pathBetween,
  type Cell,
  type Inbound,
  type Outbound,
  type RoomView,
  type Rules,
} from './protocol';
import { Lobby } from './lobby';

const HOST =
  (import.meta.env.PUBLIC_WORDSEARCH_HOST as string | undefined) ||
  (import.meta.env.DEV ? 'localhost:8790' : 'empyr-wordsearch.arcanearthenden.workers.dev');

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'bad';
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function WordsearchGame({ lang, code: codeProp }: { lang: Lang; code?: string }) {
  const copy = copyFor(lang);

  const [code] = useState(
    () => codeProp ?? new URLSearchParams(window.location.search).get('code')?.toLowerCase() ?? '',
  );
  const [name, setName] = useState(() => recallName());
  const [seated, setSeated] = useState(false);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [youId, setYouId] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  const link = useRef<RoomLink | null>(null);
  const skew = useRef(0);
  const toastSeq = useRef(0);
  /** Latest names, so socket callbacks can label effects without re-subscribing. */
  const roster = useRef(new Map<string, string>());
  const meRef = useRef('');

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  const toast = useCallback((text: string, tone: Toast['tone']) => {
    const entry = { id: ++toastSeq.current, text, tone };
    setToasts((prev) => [...prev.slice(-2), entry]);
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== entry.id)), 2600);
  }, []);

  const rattle = useCallback(() => {
    setShake(true);
    window.setTimeout(() => setShake(false), 340);
  }, []);

  /* ------------------------------------------------------------- connection */

  useEffect(() => {
    if (!seated || !code) return;

    const socket = new RoomLink(roomUrl(HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          skew.current = message.room.now - Date.now();
          roster.current = new Map(message.room.players.map((p) => [p.id, p.name]));
          meRef.current = message.youId;
          setRoom(message.room);
          setYouId(message.youId);
          return;
        }

        if (message.t === 'nope') {
          // The two claim refusals players actually hit arrive as effects with
          // translated copy; anything else is a genuine surprise worth showing.
          if (!/already went to|not on the list/i.test(message.msg)) {
            toast(message.msg, 'bad');
          }
          return;
        }

        if (message.t === 'fx') {
          const who = message.playerId ? roster.current.get(message.playerId) ?? '' : '';
          if (message.kind === 'claim' && message.word) {
            if (message.playerId === meRef.current) toast(copy.gotIt(message.word), 'good');
            else toast(copy.claimedBy(who || message.text || '', message.word), 'info');
          } else if (message.kind === 'steal' && message.word) {
            toast(copy.tooSlow(message.word, who), 'bad');
            rattle();
          } else if (message.kind === 'miss') {
            toast(copy.notAWord, 'bad');
            rattle();
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
    // `name` is read once at hello time; re-dialling on every keystroke would be wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seated, code, copy, rattle, toast]);

  /* ------------------------------------------------------------------ clock */

  useEffect(() => {
    if (!room || (room.roundEndsAt === null && room.nextAt === null)) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 500);
    return () => window.clearInterval(timer);
  }, [room]);

  const now = Date.now() + skew.current;
  const msLeft = room?.roundEndsAt ? Math.max(0, room.roundEndsAt - now) : 0;
  const totalMs = (room?.rules.roundSeconds ?? 1) * 1000;
  const secondsToNext = room?.nextAt ? Math.max(0, Math.ceil((room.nextAt - now) / 1000)) : null;

  /* ----------------------------------------------------------------- derived */

  const me = room?.players.find((player) => player.id === youId) ?? null;
  const isHost = Boolean(me?.host);

  const marks = useMemo(() => {
    const out = new Map<number, string>();
    if (!room) return out;
    const pen = new Map(room.players.map((player) => [player.id, inkFor(player.seat)]));
    for (const word of room.words) {
      if (!word.by || !word.path) continue;
      const colour = pen.get(word.by) ?? '#ccc';
      for (const cell of word.path) out.set(cell, colour);
    }
    return out;
  }, [room]);

  const onClaim = useCallback(
    (from: Cell, to: Cell) => {
      if (!room) return;
      const path = pathBetween(from, to, room.rules.size);
      if (path.length < 3) {
        toast(copy.tooShort, 'bad');
        return;
      }
      send({ t: 'claim', r1: from.r, c1: from.c, r2: to.r, c2: to.c });
    },
    [copy.tooShort, room, send, toast],
  );

  const shareLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => toast(window.location.href, 'info'),
    );
  }, [toast]);

  /* ------------------------------------------------------------------ gates */

  if (!code) {
    return (
      <div className="ws-app">
        <div className="ws-wrap ws-gate">
          <div className="ws-panel">
            <p className="ws-eyebrow">{copy.brand}</p>
            <h1 className="ws-title">{copy.noRoom}</h1>
            <p className="ws-sub">{copy.noRoomSub}</p>
            <div className="ws-row">
              <a className="ws-btn" data-tone="hot" href={`/${lang}/minigames/wordsearch`}>
                {copy.brand}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seated) {
    return (
      <div className="ws-app">
        <div className="ws-wrap ws-gate">
          <form
            className="ws-panel"
            onSubmit={(event) => {
              event.preventDefault();
              const clean = name.trim().slice(0, 14);
              if (!clean) return;
              rememberName(clean);
              setName(clean);
              setSeated(true);
            }}
          >
            <p className="ws-eyebrow">
              {copy.room} {code.toUpperCase()}
            </p>
            <h1 className="ws-title">{copy.checkinTitle}</h1>
            <p className="ws-sub">{copy.checkinSub}</p>

            <div style={{ marginTop: '1.2rem' }}>
              <label className="ws-label" htmlFor="ws-name">
                {copy.nameLabel}
              </label>
              <input
                id="ws-name"
                className="ws-field"
                value={name}
                maxLength={14}
                placeholder={copy.namePlaceholder}
                autoComplete="off"
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="ws-row">
              <button type="submit" className="ws-btn" data-tone="hot" disabled={!name.trim()}>
                {copy.enter}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------- table */

  const urgent = room?.phase === 'play' && msLeft <= 20_000;

  return (
    <div className="ws-app">
      <div className="ws-wrap">
        <header className="ws-bar">
          <div className="ws-logo">
            <b>{copy.brand}</b>
            <span>{copy.tagline}</span>
          </div>
          <span className="ws-grow" />
          <span className="ws-chip ws-num">
            {copy.room} {code.toUpperCase()}
          </span>
          <span className="ws-chip" data-live={status}>
            <span className="ws-dot" />
            {copy.status[status]}
          </span>
          <button type="button" className="ws-btn" data-small="true" onClick={shareLink}>
            {copied ? copy.copied : copy.copyLink}
          </button>
          <a className="ws-btn" data-tone="ghost" data-small="true" href={`/${lang}/minigames/wordsearch`}>
            {copy.leave}
          </a>
        </header>

        {!room ? (
          <div className="ws-panel">
            <p className="ws-eyebrow">{copy.brand}</p>
            <h1 className="ws-title">{copy.status[status]}</h1>
          </div>
        ) : room.phase === 'lobby' ? (
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
          <>
            <div className="ws-table">
              <div style={{ minWidth: 0 }}>
                <div className="ws-status">
                  <span className="ws-round">{copy.roundOf(room.round, room.rules.rounds)}</span>
                  <span className="ws-chip">{copy.categories[room.rules.category]}</span>
                  <span className="ws-chip ws-num">
                    {room.rules.size} × {room.rules.size}
                  </span>
                  <span className="ws-clock" data-urgent={urgent ? 'true' : 'false'}>
                    <i>{copy.timeLeft}</i>
                    <b className="ws-num">{mmss(msLeft)}</b>
                  </span>
                  <div className="ws-meter" style={{ flexBasis: '100%' }}>
                    <span style={{ width: `${Math.min(100, (msLeft / totalMs) * 100)}%` }} />
                  </div>
                </div>

                <div style={{ marginTop: '0.8rem' }}>
                  <Board
                    room={room}
                    marks={marks}
                    busy={room.phase !== 'play'}
                    shake={shake}
                    copy={copy}
                    onClaim={onClaim}
                  />
                </div>
              </div>

              <div className="ws-side">
                <WordList words={room.words} players={room.players} youId={youId} copy={copy} />
                <Scoreboard players={room.players} youId={youId} copy={copy} />
                <Feed log={room.log} copy={copy} />
              </div>
            </div>

            {(room.phase === 'roundOver' || room.phase === 'over') && (
              <Results
                room={room}
                youId={youId}
                isHost={isHost}
                copy={copy}
                secondsToNext={secondsToNext}
                onNext={() => send({ t: 'next' })}
                onLobby={() => send({ t: 'again' })}
              />
            )}
          </>
        )}
      </div>

      <div className="ws-toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="ws-toast" data-tone={item.tone}>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
