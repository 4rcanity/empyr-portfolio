import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './draughts.css';
import { Board, routeSquares, type BoardMarks, type FlyerState } from './board';
import { Feed, Lobby, MoveList, RouteChooser, SeatCard } from './panels';
import { BoardLink, boardUrl, playerKey, recallName, rememberName, type LinkStatus } from './net';
import { copyFor, type Lang } from './copy';
import {
  decodeBoard,
  isKing,
  other,
  sideOf,
  type Cell,
  type Inbound,
  type MoveOption,
  type Outbound,
  type RoomView,
  type Side,
} from './protocol';

const HOST =
  (import.meta.env.PUBLIC_DRAUGHTS_HOST as string | undefined) ||
  (import.meta.env.DEV ? 'localhost:8794' : 'empyr-draughts.arcanearthenden.workers.dev');

/** One hop of a capture sequence, in ms. */
const HOP_MS = 200;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

interface Anim {
  from: number;
  at: number;
  side: Side;
  king: boolean;
  before: Cell[];
  fading: number[];
}

function countPieces(board: Cell[], side: Side) {
  let men = 0;
  let kings = 0;
  for (const cell of board) {
    if (sideOf(cell) !== side) continue;
    if (isKing(cell)) kings++;
    else men++;
  }
  return { men, kings, total: men + kings };
}

export default function DraughtsGame({ lang, code: codeProp }: { lang: Lang; code?: string }) {
  const copy = copyFor(lang);

  const [code] = useState(
    () => codeProp ?? new URLSearchParams(window.location.search).get('code')?.toLowerCase() ?? '',
  );
  const [name, setName] = useState(() => recallName());
  const [joined, setJoined] = useState<null | 'play' | 'watch'>(null);
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [you, setYou] = useState<Side | null>(null);
  const [youId, setYouId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [flipped, setFlipped] = useState(false);
  const [flipTouched, setFlipTouched] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [chain, setChain] = useState<number[]>([]);
  const [preview, setPreview] = useState<MoveOption | null>(null);
  const [reviewPly, setReviewPly] = useState<number | null>(null);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [askResign, setAskResign] = useState(false);
  const [, setTick] = useState(0);

  const link = useRef<BoardLink | null>(null);
  const skew = useRef(0);
  const seenPly = useRef(0);
  const animToken = useRef(0);

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  /* ------------------------------------------------------------- connection */

  useEffect(() => {
    if (!joined || !code) return;
    const spectate = joined === 'watch';

    const socket = new BoardLink(boardUrl(HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name, spectate }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          skew.current = message.room.now - Date.now();
          setRoom(message.room);
          setYou(message.you);
          setYouId(message.youId);
          setError('');
          return;
        }
        if (message.t === 'nope') {
          setError(message.msg);
          setSel(null);
          setChain([]);
        }
      },
    });

    link.current = socket;
    socket.open();
    return () => {
      socket.dispose();
      link.current = null;
    };
  }, [joined, code, name]);

  /** Sit the way round you are playing, until the player says otherwise. */
  useEffect(() => {
    if (!flipTouched) setFlipped(you === 'b');
  }, [you, flipTouched]);

  /* Keep the clocks moving between syncs. */
  useEffect(() => {
    if (room?.phase !== 'play' || room.turnEndsAt === null) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 200);
    return () => window.clearInterval(timer);
  }, [room?.phase, room?.turnEndsAt]);

  /* --------------------------------------------------------------- animation */

  useEffect(() => {
    if (!room) return;
    const history = room.history;
    if (history.length === seenPly.current) return;
    const jumped = history.length - seenPly.current;
    seenPly.current = history.length;

    const entry = history[history.length - 1];
    animToken.current++;
    if (!entry || jumped !== 1 || reviewPly !== null) {
      setAnim(null);
      return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduce) {
      setAnim(null);
      return;
    }

    const before = decodeBoard(history.length >= 2 ? history[history.length - 2].after : room.opening);
    const king = isKing(before[entry.from - 1] ?? 0);
    const token = animToken.current;

    void (async () => {
      const base: Anim = { from: entry.from, at: entry.from, side: entry.side, king, before, fading: [] };
      setAnim(base);
      await wait(30);
      for (const land of entry.path) {
        if (animToken.current !== token) return;
        setAnim({ ...base, at: land });
        await wait(HOP_MS);
      }
      if (animToken.current !== token) return;
      if (entry.captures.length > 0) {
        setAnim({ ...base, at: entry.to, fading: entry.captures });
        await wait(220);
      }
      if (animToken.current !== token) return;
      setAnim(null);
    })();
  }, [room, reviewPly]);

  /* Clear a half-built sequence whenever the position moves under it. */
  useEffect(() => {
    setSel(null);
    setChain([]);
    setPreview(null);
  }, [room?.board, room?.turn]);

  /* ----------------------------------------------------------------- derived */

  const live = room ? decodeBoard(room.board) : [];
  const shownBoard = useMemo(() => {
    if (!room) return [] as Cell[];
    if (anim) return anim.before;
    if (reviewPly !== null) {
      if (reviewPly < 0) return decodeBoard(room.opening);
      return decodeBoard(room.history[reviewPly]?.after ?? room.board);
    }
    return decodeBoard(room.board);
  }, [room, anim, reviewPly]);

  const myTurn = Boolean(
    room &&
      room.phase === 'play' &&
      !room.result &&
      you !== null &&
      you === room.turn &&
      reviewPly === null &&
      anim === null,
  );

  const candidates = useMemo(() => {
    if (!room || sel === null) return [] as MoveOption[];
    return room.options.filter(
      (move) => move.from === sel && chain.every((square, index) => move.path[index] === square),
    );
  }, [room, sel, chain]);

  const marks: BoardMarks = useMemo(() => {
    const lastEntry =
      reviewPly !== null
        ? reviewPly >= 0
          ? room?.history[reviewPly]
          : undefined
        : room?.history[room.history.length - 1];
    const hops = myTurn
      ? [...new Set(candidates.map((move) => move.path[chain.length]).filter((n): n is number => Boolean(n)))]
      : [];
    const shown = preview ?? (candidates.length === 1 ? candidates[0] : null);
    // Tied routes usually take the very same pieces — ring them even before a
    // route is chosen, so the size of the haul is visible on the board.
    const oneHaul =
      candidates.length > 1 &&
      new Set(candidates.map((move) => move.captures.join('.'))).size === 1
        ? candidates[0].captures
        : [];
    return {
      selected: sel,
      hops,
      chain,
      route: shown ? routeSquares(shown.from, shown.path) : [],
      doomed: shown ? shown.captures : oneHaul,
      movers: myTurn && sel === null ? [...new Set((room?.options ?? []).map((move) => move.from))] : [],
      lastFrom: lastEntry?.from ?? null,
      lastTo: lastEntry?.to ?? null,
      lastPath: lastEntry?.path ?? [],
    };
  }, [room, reviewPly, myTurn, candidates, chain, preview, sel]);

  const flyer: FlyerState | null = anim
    ? { side: anim.side, king: anim.king, from: anim.from, at: anim.at, fading: anim.fading }
    : null;

  /* ------------------------------------------------------------- interaction */

  const playRoute = useCallback(
    (route: MoveOption) => {
      send({ t: 'move', from: route.from, to: route.to, path: route.path });
      setSel(null);
      setChain([]);
      setPreview(null);
    },
    [send],
  );

  const onPick = useCallback(
    (square: number) => {
      if (!room || !myTurn) return;
      setError('');

      // Extending the sequence being built.
      if (sel !== null) {
        const next = [...chain, square];
        const still = candidates.filter((move) => move.path[chain.length] === square);
        if (still.length > 0) {
          const finished = still.filter((move) => move.path.length === next.length);
          if (finished.length === 1 && still.length === 1) {
            playRoute(finished[0]);
            return;
          }
          setChain(next);
          setPreview(null);
          return;
        }
      }

      // Otherwise, pick up a piece of your own that actually has a move.
      const movable = room.options.some((move) => move.from === square);
      if (movable) {
        setSel(square);
        setChain([]);
        setPreview(null);
        return;
      }
      setSel(null);
      setChain([]);
    },
    [room, myTurn, sel, chain, candidates, playRoute],
  );

  /* -------------------------------------------------------------- check-in */

  if (!code) {
    return (
      <main className="dc-shell">
        <div className="dc-panel dc-checkin">
          <h1>{copy.brand}</h1>
          <p className="dc-sub">{copy.noRoom}</p>
          <a className="dc-btn dc-primary" href={`/${lang}/minigames/draughts`}>
            ←
          </a>
        </div>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="dc-shell">
        <div className="dc-panel dc-checkin">
          <p className="dc-eyebrow">{copy.tagline}</p>
          <h1>{copy.brand}</h1>
          <h2>{copy.checkinTitle}</h2>
          <p className="dc-sub">{copy.checkinSub}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              rememberName(name.trim());
              setJoined('play');
            }}
          >
            <label className="dc-namefield">
              <span>{copy.nameLabel}</span>
              <input
                value={name}
                maxLength={14}
                onChange={(event) => setName(event.target.value)}
                placeholder={copy.namePlaceholder}
                autoFocus
              />
            </label>
            <div className="dc-actions">
              <button className="dc-btn dc-primary" type="submit" disabled={!name.trim()}>
                {copy.enter}
              </button>
              <button
                className="dc-btn dc-ghostbtn"
                type="button"
                onClick={() => {
                  rememberName(name.trim() || 'Kijker');
                  setJoined('watch');
                }}
              >
                {copy.watch}
              </button>
            </div>
          </form>
          <p className="dc-room">
            {copy.room} <b>{code}</b>
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------ frame */

  const header = (
    <header className="dc-bar">
      <span className="dc-mark">
        {copy.brand}
        <i>{copy.tagline}</i>
      </span>
      <span className="dc-grow" />
      <span className={`dc-status is-${status}`}>{copy.status[status]}</span>
      <button
        className="dc-btn dc-ghostbtn dc-tiny"
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? copy.copied : copy.copyLink}
      </button>
      <a className="dc-btn dc-ghostbtn dc-tiny" href={`/${lang}/minigames/draughts`}>
        {copy.leave}
      </a>
    </header>
  );

  if (!room) {
    return (
      <main className="dc-shell">
        {header}
        <div className="dc-panel dc-checkin">
          <p className="dc-sub">{copy.status[status]}</p>
        </div>
      </main>
    );
  }

  if (room.phase === 'lobby') {
    return (
      <main className="dc-shell">
        {header}
        {error ? <p className="dc-error">{error}</p> : null}
        <Lobby room={room} you={you} youId={youId} copy={copy} send={send} />
        <Feed room={room} copy={copy} />
      </main>
    );
  }

  const whiteSeat = room.players.find((p) => p.side === 'w') ?? null;
  const blackSeat = room.players.find((p) => p.side === 'b') ?? null;
  const openingCounts = { w: countPieces(decodeBoard(room.opening), 'w'), b: countPieces(decodeBoard(room.opening), 'b') };
  const nowCounts = { w: countPieces(live, 'w'), b: countPieces(live, 'b') };
  const clockFor = (side: Side): number | null => {
    if (!room.clock) return null;
    if (side === room.turn && room.turnEndsAt !== null && room.phase === 'play' && !room.result) {
      return room.turnEndsAt - (Date.now() + skew.current);
    }
    return room.clock[side];
  };

  const captureCount = room.options[0]?.captures.length ?? 0;
  const theirOffer = room.drawOfferFrom !== null && you !== null && room.drawOfferFrom !== you;
  const myOffer = room.drawOfferFrom !== null && room.drawOfferFrom === you;
  const playing = you !== null && room.phase === 'play' && !room.result;

  const seatOrder: Side[] = flipped ? ['w', 'b'] : ['b', 'w'];

  return (
    <main className="dc-shell is-game">
      {header}

      <div className="dc-table">
        <section className="dc-left">
          {seatOrder.map((side) => (
            <SeatCard
              key={side}
              side={side}
              player={side === 'w' ? whiteSeat : blackSeat}
              copy={copy}
              active={room.turn === side && room.phase === 'play' && !room.result}
              ms={clockFor(side)}
              taken={openingCounts[other(side)].total - nowCounts[other(side)].total}
              kings={nowCounts[side].kings}
              you={you === side}
            />
          ))}

          <div className="dc-turnline">
            {room.result ? (
              <b className="dc-verdict">
                {room.result.winner
                  ? copy.wins(copy.sideName(room.result.winner))
                  : copy.drawn}
                <i>{copy.reason[room.result.reason]}</i>
              </b>
            ) : myTurn ? (
              <b className="dc-yours">{copy.yourMove}</b>
            ) : you === null ? (
              <b>{copy.spectating}</b>
            ) : (
              <b>
                {copy.sideName(room.turn)} {copy.theirMove}
              </b>
            )}
            {room.spectators > 0 ? (
              <span className="dc-tag">
                {room.spectators} {copy.spectators}
              </span>
            ) : null}
          </div>

          {myTurn && room.mustCapture ? (
            <p className="dc-forced">
              <span className="dc-dot" aria-hidden="true" />
              {copy.mustCaptureCount(captureCount)}
            </p>
          ) : null}

          <div className="dc-actions">
            <button
              className="dc-btn dc-ghostbtn"
              type="button"
              onClick={() => {
                setFlipTouched(true);
                setFlipped((on) => !on);
              }}
            >
              {copy.flip}
            </button>
            {playing ? (
              <>
                {myOffer ? (
                  <span className="dc-tag is-warm">{copy.drawOffered}</span>
                ) : theirOffer ? null : (
                  <button className="dc-btn dc-ghostbtn" type="button" onClick={() => send({ t: 'offerDraw' })}>
                    {copy.offerDraw}
                  </button>
                )}
                {askResign ? (
                  <span className="dc-confirm">
                    {copy.confirmResign}
                    <button
                      className="dc-btn dc-danger dc-tiny"
                      type="button"
                      onClick={() => {
                        send({ t: 'resign' });
                        setAskResign(false);
                      }}
                    >
                      {copy.yes}
                    </button>
                    <button className="dc-btn dc-ghostbtn dc-tiny" type="button" onClick={() => setAskResign(false)}>
                      {copy.no}
                    </button>
                  </span>
                ) : (
                  <button className="dc-btn dc-ghostbtn" type="button" onClick={() => setAskResign(true)}>
                    {copy.resign}
                  </button>
                )}
              </>
            ) : null}
            {room.result && room.players.find((p) => p.id === youId)?.host ? (
              <button className="dc-btn dc-primary" type="button" onClick={() => send({ t: 'again' })}>
                {copy.again}
              </button>
            ) : null}
          </div>

          {theirOffer ? (
            <div className="dc-offer">
              <b>
                {copy.sideName(room.drawOfferFrom as Side)} {copy.drawFromThem}
              </b>
              <button
                className="dc-btn dc-primary dc-tiny"
                type="button"
                onClick={() => send({ t: 'answerDraw', accept: true })}
              >
                {copy.accept}
              </button>
              <button
                className="dc-btn dc-ghostbtn dc-tiny"
                type="button"
                onClick={() => send({ t: 'answerDraw', accept: false })}
              >
                {copy.decline}
              </button>
            </div>
          ) : null}

          {room.counters.kingIdle > 0 || room.counters.endgame ? (
            <div className="dc-counters">
              <span className="dc-countertitle">{copy.drawCounters}</span>
              {room.counters.kingIdle > 0 ? <span>{copy.kingIdle(room.counters.kingIdle, 50)}</span> : null}
              {room.counters.endgame ? (
                <span>{copy.endgame(room.counters.endgame.plies, room.counters.endgame.limit)}</span>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="dc-error">{error}</p> : null}
        </section>

        <section className="dc-middle">
          <Board
            board={shownBoard}
            flipped={flipped}
            marks={marks}
            flyer={flyer}
            interactive={myTurn}
            onPick={onPick}
            label={lang === 'nl' ? 'Dambord, 10 bij 10' : 'Draughts board, 10 by 10'}
          />
        </section>

        <section className="dc-right">
          <RouteChooser
            routes={candidates}
            chain={chain}
            copy={copy}
            onPreview={setPreview}
            onPlay={playRoute}
            onReset={() => {
              setSel(null);
              setChain([]);
              setPreview(null);
            }}
          />
          <MoveList history={room.history} copy={copy} reviewPly={reviewPly} onSet={setReviewPly} />
          <Feed room={room} copy={copy} />
        </section>
      </div>
    </main>
  );
}
