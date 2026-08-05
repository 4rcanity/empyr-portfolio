import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ganzenbord.css';
import {
  BoardLink,
  boardUrl,
  playerKey,
  recallName,
  rememberName,
  type LinkStatus,
} from './net';
import { copyFor, counts, fill, type Lang } from './copy';
import {
  Board,
  Dice,
  Feed,
  Legend,
  PunishWindow,
  Rail,
  Ticker,
  inkFor,
  type PunishView,
} from './parts';
import { Lobby } from './lobby';
import type { Inbound, RoomView, SquareKind, TurnReport } from './protocol';

const ENV = import.meta.env as Record<string, string | boolean | undefined>;
const HOST =
  (ENV.PUBLIC_GANZENBORD_HOST as string | undefined) ||
  (ENV.DEV ? 'localhost:8791' : 'empyr-ganzenbord.arcanearthenden.workers.dev');

/** How long a pawn takes to walk one hop. */
const HOP_MS = 460;
/** Dice tumble before the pawn sets off. */
const ROLL_MS = 420;
/** The punishment window gives up the screen on its own. */
const WINDOW_MS = 11_000;
const NEWS_MS = 7000;

type NewsKind = SquareKind | 'rescue' | 'goose' | 'bridge' | 'bounce' | 'opening' | 'swap';
interface News {
  id: string;
  kind: NewsKind;
  text: string;
  /** Carried along so "look" still works once the table has moved on. */
  turn?: TurnReport;
}

export default function GanzenbordGame({ lang, code: codeProp }: { lang: Lang; code?: string }) {
  const copy = copyFor(lang);

  const [code] = useState(
    () => codeProp ?? new URLSearchParams(window.location.search).get('code')?.toLowerCase() ?? '',
  );
  const [name, setName] = useState(() => recallName());
  const [seated, setSeated] = useState(false);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [youId, setYouId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [shown, setShown] = useState<Map<string, number>>(new Map());
  const [rolling, setRolling] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [punish, setPunish] = useState<PunishView | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [follow, setFollow] = useState(() => window.innerWidth < 760);
  /** Once the reader picks a view, stop second-guessing them on resize. */
  const [manualView, setManualView] = useState(false);
  const [, setTick] = useState(0);

  const link = useRef<BoardLink | null>(null);
  /** Pawn-walk timers, dropped the moment a newer turn arrives. */
  const walk = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Announcement timers — these must survive a fast next turn. */
  const keep = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seenTurn = useRef(0);
  const skew = useRef(0);
  const youRef = useRef('');

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  const stopWalk = () => {
    for (const timer of walk.current) clearTimeout(timer);
    walk.current = [];
  };

  useEffect(
    () => () => {
      for (const timer of keep.current) clearTimeout(timer);
      keep.current = [];
    },
    [],
  );

  /* ------------------------------------------------------------ connection */

  useEffect(() => {
    if (!seated || !code) return;
    const socket = new BoardLink(boardUrl(HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name }),
      onMessage: (message) => {
        if (message.t === 'nope') {
          setError(message.msg);
          setTimeout(() => setError(''), 3200);
          return;
        }
        if (message.t !== 'sync') return;
        skew.current = Date.now() - message.room.now;
        youRef.current = message.youId;
        setYouId(message.youId);
        setRoom(message.room);
      },
    });
    link.current = socket;
    socket.open();
    return () => {
      socket.dispose();
      link.current = null;
      stopWalk();
    };
  }, [seated, code, name]);

  /* ------------------------------------------------- turn replay + events */

  useEffect(() => {
    const turn = room?.lastTurn;
    if (!turn || turn.id === seenTurn.current) return;
    seenTurn.current = turn.id;
    // A newer turn abandons the previous walk, and every pawn snaps back to the
    // truth the server just sent.
    stopWalk();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const walkEnd = ROLL_MS + turn.hops.length * HOP_MS + 120;

    // The announcement is deliberately on its own clock: a quick next turn must
    // never swallow somebody's punishment window.
    keep.current.push(
      setTimeout(() => {
        setHighlight(turn.punishment ? turn.punishment.square : null);
        keep.current.push(setTimeout(() => setHighlight(null), 2400));
        raise(turn);
      }, reduce ? 0 : Math.min(walkEnd, 1250)),
    );

    if (reduce || turn.hops.length === 0) {
      setShown(new Map());
      setRolling(false);
      return;
    }

    setRolling(true);
    setShown(new Map([[turn.playerId, turn.from]]));
    walk.current.push(setTimeout(() => setRolling(false), ROLL_MS));

    turn.hops.forEach((hop, index) => {
      walk.current.push(
        setTimeout(
          () => setShown((current) => new Map(current).set(turn.playerId, hop.to)),
          ROLL_MS + index * HOP_MS + 60,
        ),
      );
    });

    walk.current.push(setTimeout(() => setShown(new Map()), walkEnd));
    // Replaying is keyed purely on the turn id, so the effect must not re-run
    // on unrelated room updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.lastTurn?.id]);

  /** Raise the punishment window for the victim and the ticker for everyone else. */
  const raise = useCallback(
    (turn: TurnReport) => {
      const mine = turn.playerId === youRef.current;
      const stamp = `${turn.id}`;
      const fresh: News[] = [];

      if (turn.punishment) {
        const event = copy.events[turn.punishment.kind as keyof typeof copy.events];
        if (event) {
          if (mine) {
            setPunish({ turn, mine: true });
          } else {
            fresh.push({
              id: `${stamp}-p`,
              kind: turn.punishment.kind,
              text: fill(event.head, { a: turn.playerName }),
              turn,
            });
          }
        }
      }
      if (turn.rescue) {
        fresh.push({
          id: `${stamp}-r`,
          kind: 'rescue',
          text: fill(copy.rescueHead, { a: turn.playerName, b: turn.rescue.freed.join(', ') }),
        });
      }
      if (turn.gooseHops >= 2 && !turn.punishment) {
        fresh.push({ id: `${stamp}-g`, kind: 'goose', text: fill(copy.gooseHead, { a: turn.playerName }) });
      }
      if (turn.hops.some((hop) => hop.why === 'bridge')) {
        fresh.push({ id: `${stamp}-b`, kind: 'bridge', text: fill(copy.bridgeHead, { a: turn.playerName }) });
      }
      if (turn.hops.some((hop) => hop.why === 'opening')) {
        fresh.push({ id: `${stamp}-o`, kind: 'opening', text: fill(copy.openingHead, { a: turn.playerName }) });
      }
      if (turn.bounced) {
        fresh.push({ id: `${stamp}-x`, kind: 'bounce', text: fill(copy.bounceHead, { a: turn.playerName }) });
      }
      if (turn.swap) {
        fresh.push({
          id: `${stamp}-s`,
          kind: 'swap',
          text: fill(copy.swapHead, { a: turn.playerName, b: turn.swap.name }),
        });
      }

      if (fresh.length === 0) return;
      setNews((current) => [...current, ...fresh].slice(-3));
      const ids = new Set(fresh.map((item) => item.id));
      keep.current.push(
        setTimeout(() => setNews((current) => current.filter((item) => !ids.has(item.id))), NEWS_MS),
      );
    },
    [copy],
  );

  /** The punishment window must never sit on the board forever. */
  useEffect(() => {
    if (!punish) return;
    const timer = setTimeout(() => setPunish(null), WINDOW_MS);
    return () => clearTimeout(timer);
  }, [punish]);

  /** A phone-sized sheet cannot show 63 readable squares at once, so it follows. */
  useEffect(() => {
    if (manualView) return;
    const narrow = window.matchMedia('(max-width: 760px)');
    const apply = () => setFollow(narrow.matches);
    apply();
    narrow.addEventListener('change', apply);
    return () => narrow.removeEventListener('change', apply);
  }, [manualView]);

  /* --------------------------------------------------------------- ticking */

  useEffect(() => {
    if (room?.phase !== 'play') return;
    const timer = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, [room?.phase]);

  /* ----------------------------------------------------------------- derived */

  const you = room?.players.find((player) => player.id === youId) ?? null;
  const active = room?.players.find((player) => player.id === room.activeId) ?? null;
  const myTurn = Boolean(room && room.phase === 'play' && room.activeId === youId);
  const winner = room?.players.find((player) => player.id === room.winnerId) ?? null;

  const focusSquare = useMemo(() => {
    if (!room) return 0;
    const moving = room.lastTurn?.playerId;
    if (moving && shown.has(moving)) return shown.get(moving) ?? 0;
    return active?.pos ?? you?.pos ?? 0;
  }, [room, shown, active, you]);

  const secondsLeft = (() => {
    if (!room?.turnEndsAt) return null;
    return Math.max(0, Math.ceil((room.turnEndsAt + skew.current - Date.now()) / 1000));
  })();

  const invite = typeof window === 'undefined' ? '' : window.location.href;

  /* -------------------------------------------------------------- check-in */

  if (!code) {
    return (
      <div className="gb-page gb-page-center">
        <div className="gb-card">
          <h1>{copy.noRoom}</h1>
          <p>{copy.noRoomSub}</p>
          <a className="gb-btn is-accent" href={`/${lang}/minigames/ganzenbord`}>
            {copy.toLanding}
          </a>
        </div>
      </div>
    );
  }

  if (!seated) {
    return (
      <div className="gb-page gb-page-center">
        <form
          className="gb-card"
          onSubmit={(event) => {
            event.preventDefault();
            const clean = name.trim().slice(0, 14);
            if (!clean) return;
            rememberName(clean);
            setName(clean);
            setSeated(true);
          }}
        >
          <p className="gb-eyebrow">
            {copy.brand} · {copy.tagline}
          </p>
          <h1>{copy.checkinTitle}</h1>
          <p>{copy.checkinSub}</p>
          <label className="gb-field">
            <span>{copy.nameLabel}</span>
            <input
              value={name}
              maxLength={14}
              placeholder={copy.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="gb-btn is-accent" disabled={!name.trim()}>
            {copy.enter}
          </button>
          <p className="gb-card-note">
            {copy.room} <b>{code}</b>
          </p>
        </form>
      </div>
    );
  }

  /* ------------------------------------------------------------------ table */

  return (
    <div className="gb-page">
      <header className="gb-top">
        <a className="gb-brand" href={`/${lang}/minigames/ganzenbord`}>
          <span>{copy.brand}</span>
          <b>{copy.tagline}</b>
        </a>
        <span className="gb-grow" />
        {room && (
          <span className={`gb-variant-pill is-${room.variant}`}>{copy.variantNames[room.variant]}</span>
        )}
        <span className={`gb-status is-${status}`}>{copy.status[status]}</span>
        <span className="gb-room">
          {copy.room} <b>{code}</b>
        </span>
        <button
          type="button"
          className="gb-btn is-ghost is-tiny"
          onClick={() => {
            void navigator.clipboard?.writeText(invite);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? copy.copied : copy.copyLink}
        </button>
      </header>

      {error && <p className="gb-error">{error}</p>}
      {status === 'lost' && <p className="gb-error">{copy.reconnecting}</p>}

      {!room && <p className="gb-loading">{copy.status.dialing}…</p>}

      {room && room.phase === 'lobby' && (
        <Lobby copy={copy} room={room} youId={youId} send={send} />
      )}

      {room && room.phase !== 'lobby' && (
        <main className="gb-table">
          <div className="gb-board-wrap">
            <div className="gb-board-head">
              <h2>{copy.boardTitle}</h2>
              <span className="gb-turnno">
                {copy.turnNo} <b>{room.round}</b>
              </span>
              <button
                type="button"
                className="gb-btn is-ghost is-tiny"
                aria-pressed={follow}
                onClick={() => {
                  setManualView(true);
                  setFollow((on) => !on);
                }}
              >
                {follow ? copy.fitView : copy.followView}
              </button>
            </div>

            <div className="gb-frame">
              <Board
                copy={copy}
                players={room.players}
                shown={shown}
                activeId={room.activeId}
                youId={youId}
                follow={follow}
                focusSquare={focusSquare}
                highlight={highlight}
              />
              <Ticker
                copy={copy}
                items={news.map((item) => ({
                  id: item.id,
                  kind: item.kind,
                  text: item.text,
                  onOpen: item.turn ? () => setPunish({ turn: item.turn as TurnReport, mine: false }) : undefined,
                }))}
              />
            </div>
          </div>

          <aside className="gb-side">
            <section className="gb-panel gb-turn">
              {room.phase === 'over' ? (
                <>
                  <p className="gb-eyebrow">{copy.winnerTitle}</p>
                  <h3>{winner?.id === youId ? copy.youWin : (winner?.name ?? '—')}</h3>
                  <p className="gb-turn-note">{copy.winnerSub}</p>
                  {you?.host && (
                    <button type="button" className="gb-btn is-accent" onClick={() => send({ t: 'again' })}>
                      {copy.again}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="gb-eyebrow">{myTurn ? copy.yourTurn : copy.waitingFor}</p>
                  <h3>
                    {active ? (
                      <>
                        <span className="gb-chip" style={{ background: inkFor(active.seat) }} aria-hidden="true" />
                        {myTurn ? copy.yourTurn : active.name}
                      </>
                    ) : (
                      '—'
                    )}
                  </h3>
                  <Dice
                    dice={room.lastTurn ? room.lastTurn.dice : null}
                    rolling={rolling}
                    label={copy.throwLabel}
                  />
                  <button
                    type="button"
                    className="gb-btn is-accent gb-roll"
                    disabled={!myTurn || rolling}
                    onClick={() => send({ t: 'roll' })}
                  >
                    {rolling ? copy.rolling : copy.rollBtn}
                  </button>
                  {secondsLeft !== null && (
                    <p className="gb-clock">
                      {copy.clock} <b>{secondsLeft}</b>s
                    </p>
                  )}
                  {you?.stuck && <p className="gb-turn-note is-bad">{copy.heldHint}</p>}
                  {you && you.skips > 0 && (
                    <p className="gb-turn-note is-bad">
                      {fill(copy.innHint, { n: you.skips, ...counts(copy, you.skips) })}
                    </p>
                  )}
                  {!you && <p className="gb-turn-note">{copy.spectating}</p>}
                </>
              )}
            </section>

            <section className="gb-panel">
              <h3>{copy.pawns}</h3>
              <Rail copy={copy} room={room} youId={youId} shown={shown} />
            </section>

            <Feed copy={copy} log={room.log} />
          </aside>

          <Legend copy={copy} />
        </main>
      )}

      {punish && <PunishWindow copy={copy} view={punish} onClose={() => setPunish(null)} />}
    </div>
  );
}
