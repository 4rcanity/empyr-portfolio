import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './mens.css';
import {
  BoardLink,
  MENS_HOST,
  boardUrl,
  playerKey,
  recallName,
  rememberName,
  type LinkStatus,
} from './net';
import { copyFor, logText, sixLimitName, type Lang } from './copy';
import { Board, type Walker } from './board';
import { ChoiceList, Die, Feed, HomeTrack, PlayerRail, ShoutLayer, type Shout } from './parts';
import { Lobby } from './lobby';
import {
  pathFor,
  type Fx,
  type Inbound,
  type MoveOption,
  type Outbound,
  type RoomView,
  type Rules,
} from './protocol';
import { play as playSfx, setMuted } from './sfx';

/** Milliseconds a pawn spends on each square it walks across. */
const STEP_MS = 118;
const BOOT_MS = 620;

interface WalkJob {
  k: 'walk';
  id: string;
  pawn: number;
  path: number[];
  entering: boolean;
  boot: { id: string; pawn: number; by: string; who: string } | null;
  homed: boolean;
}
interface ShoutJob {
  k: 'shout';
  shout: Omit<Shout, 'id'>;
  life: number;
}
type Job = WalkJob | ShoutJob;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function MensGame({ lang, code: codeProp }: { lang: Lang; code?: string }) {
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
  const [quiet, setQuiet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const [queue, setQueue] = useState<Job[]>([]);
  const [walker, setWalker] = useState<Walker | null>(null);
  const [booted, setBooted] = useState<{ id: string; pawn: number } | null>(null);
  const [landed, setLanded] = useState<{ id: string; pawn: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [rolling, setRolling] = useState(false);

  const link = useRef<BoardLink | null>(null);
  const skew = useRef(0);
  const shoutSeq = useRef(0);
  const running = useRef(false);
  /** A capture arrives just before the move that caused it. */
  const pendingBoot = useRef<WalkJob['boot']>(null);
  const namesRef = useRef(new Map<string, string>());
  const calm = useRef(false);

  useEffect(() => {
    calm.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const send = useCallback((message: Inbound) => link.current?.send(message), []);

  const pushShout = useCallback((shout: Omit<Shout, 'id'>, life: number) => {
    const id = ++shoutSeq.current;
    setShouts((prev) => [...prev.slice(-2), { ...shout, id }]);
    window.setTimeout(() => setShouts((prev) => prev.filter((item) => item.id !== id)), life);
  }, []);

  /* ------------------------------------------------------------ animation */

  const enqueue = useCallback((job: Job) => setQueue((prev) => [...prev, job]), []);

  const onFx = useCallback(
    (message: Fx) => {
      const who = message.playerId ? (namesRef.current.get(message.playerId) ?? '?') : '?';

      if (message.kind === 'roll' || message.kind === 'six') {
        setRolling(true);
        window.setTimeout(() => setRolling(false), 420);
        playSfx(message.kind === 'six' ? 'six' : 'roll');
        if (message.kind === 'six') enqueue({ k: 'shout', shout: { kind: 'six', text: copy.sixShout }, life: 760 });
        return;
      }

      if (message.kind === 'capture') {
        pendingBoot.current = {
          id: message.victimId ?? '',
          pawn: message.victimPawn ?? 0,
          by: who,
          who: namesRef.current.get(message.victimId ?? '') ?? '?',
        };
        return;
      }

      if (message.kind === 'enter' || message.kind === 'hop' || message.kind === 'homed') {
        const from = message.from ?? -1;
        const to = message.to ?? 0;
        enqueue({
          k: 'walk',
          id: message.playerId ?? '',
          pawn: message.pawn ?? 0,
          path: pathFor(from, to),
          entering: message.kind === 'enter',
          homed: message.kind === 'homed',
          boot: pendingBoot.current,
        });
        pendingBoot.current = null;
        return;
      }

      if (message.kind === 'stuck') {
        enqueue({ k: 'shout', shout: { kind: 'stuck', text: copy.stuckShout }, life: 760 });
        playSfx('stuck');
        return;
      }

      if (message.kind === 'win') {
        enqueue({ k: 'shout', shout: { kind: 'win', text: message.text ?? who }, life: 2600 });
        playSfx('win');
      }
    },
    [copy.sixShout, copy.stuckShout, enqueue],
  );

  useEffect(() => {
    if (running.current || queue.length === 0) return;
    running.current = true;
    const job = queue[0];

    void (async () => {
      if (job.k === 'shout') {
        pushShout(job.shout, job.life);
        await sleep(calm.current ? 60 : 220);
      } else {
        const quick = calm.current;
        const path = quick ? job.path.slice(-1) : job.path;
        for (const pos of path) {
          setWalker({ id: job.id, pawn: job.pawn, pos });
          if (!quick) playSfx('step');
          await sleep(quick ? 30 : STEP_MS);
        }
        if (job.entering) playSfx('enter');
        if (job.homed) {
          playSfx('home');
          pushShout({ kind: 'home', text: copy.homeShout }, 820);
        }
        setLanded({ id: job.id, pawn: job.pawn });
        window.setTimeout(() => setLanded(null), 280);

        if (job.boot) {
          playSfx('capture');
          setBooted({ id: job.boot.id, pawn: job.boot.pawn });
          pushShout(
            {
              kind: 'capture',
              text: copy.captureShout,
              sub: copy.captureSub.replace('{a}', job.boot.by).replace('{b}', job.boot.who),
            },
            1500,
          );
          if (!quick) {
            setShake(true);
            window.setTimeout(() => setShake(false), 420);
          }
          await sleep(quick ? 80 : BOOT_MS);
          setBooted(null);
        }
        setWalker(null);
      }

      setQueue((prev) => prev.slice(1));
      running.current = false;
    })();
  }, [queue, pushShout, copy.captureShout, copy.captureSub, copy.homeShout]);

  /* ------------------------------------------------------------ connection */

  useEffect(() => {
    if (!seated || !code) return;

    const socket = new BoardLink(boardUrl(MENS_HOST, code), {
      onStatus: setStatus,
      onOpen: () => socket.send({ t: 'hello', key: playerKey(), name }),
      onMessage: (message: Outbound) => {
        if (message.t === 'sync') {
          skew.current = message.room.now - Date.now();
          for (const player of message.room.players) namesRef.current.set(player.id, player.name);
          setRoom(message.room);
          setYouId(message.youId);
          setError('');
          return;
        }
        if (message.t === 'nope') {
          setError(message.msg);
          playSfx('bad');
          return;
        }
        onFx(message);
      },
    });

    link.current = socket;
    socket.open();
    return () => {
      socket.dispose();
      link.current = null;
    };
  }, [seated, code, name, onFx]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => setMuted(quiet), [quiet]);

  /* ------------------------------------------------------------------ state */

  const me = useMemo(() => room?.players.find((p) => p.id === youId) ?? null, [room, youId]);
  const isHost = Boolean(me?.host);
  const myTurn = Boolean(room && room.activeId === youId);
  const active = room?.players.find((p) => p.id === room.activeId) ?? null;
  const busy = queue.length > 0 || walker !== null;

  const options: MoveOption[] =
    room && myTurn && room.turnState === 'move' && !busy ? room.options : [];

  useEffect(() => {
    if (options.length === 0) setHint(null);
  }, [options.length]);

  const remaining = room?.turnEndsAt
    ? Math.max(0, room.turnEndsAt - (Date.now() + skew.current))
    : 0;
  const clockPct =
    room && room.turnEndsAt
      ? Math.max(0, Math.min(100, (remaining / (room.rules.turnSeconds * 1000)) * 100))
      : 0;
  const seconds = Math.ceil(remaining / 1000);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      playSfx('tap');
      setHint(null);
      send({ t: 'move', pawn: option.pawn, to: option.to });
    },
    [options, send],
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
    const url = `${window.location.origin}/${lang}/minigames/mens/play?code=${encodeURIComponent(code)}`;
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
    <header className="mn-top">
      <span className="mn-logo">
        <b>{copy.brand}</b>
        <i>{copy.tagline}</i>
      </span>
      <span className="mn-spacer" />
      {code && (
        <>
          <span className="mn-chip">
            {copy.room} <strong>{code.toUpperCase()}</strong>
          </span>
          <button type="button" className="mn-chip" onClick={invite}>
            {copied ? copy.copied : copy.copyLink}
          </button>
        </>
      )}
      <button type="button" className="mn-chip" onClick={() => setQuiet((q) => !q)}>
        {copy.sound} {quiet ? '✕' : '♪'}
      </button>
      <span className="mn-chip">
        <i className="mn-dot" data-s={status} />
        <span className="mn-hide-sm">{copy.status[status]}</span>
      </span>
      <a className="mn-chip" href={`/${lang}/minigames/mens`}>
        {copy.leave}
      </a>
    </header>
  );

  /* ----------------------------------------------------------------- gates */

  if (!code) {
    return (
      <div className="mn">
        <div className="mn-wrap">
          {header}
          <div className="mn-card">
            <h1 className="mn-title">{copy.noRoom}</h1>
            <div className="mn-row">
              <a className="mn-btn" href={`/${lang}/minigames/mens`}>
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
      <div className="mn">
        <div className="mn-wrap">
          {header}
          <div className="mn-card mn-card-slim">
            <p className="mn-eyebrow">
              {copy.room} <b>{code.toUpperCase()}</b>
            </p>
            <h1 className="mn-title">{copy.checkinTitle}</h1>
            <p className="mn-sub">{copy.checkinSub}</p>
            <label className="mn-label" htmlFor="mn-name">
              {copy.nameLabel}
            </label>
            <input
              id="mn-name"
              className="mn-input"
              value={name}
              maxLength={14}
              placeholder={copy.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && enter()}
            />
            <div className="mn-row">
              <button type="button" className="mn-btn" data-tone="go" disabled={!name.trim()} onClick={enter}>
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
      <div className="mn">
        <div className="mn-wrap">
          {header}
          <div className="mn-card">
            <h1 className="mn-title">{copy.status[status]}…</h1>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ board */

  const variants = [
    `${copy.sixLimitLabel}: ${sixLimitName(room.rules.sixLimit, copy)}`,
    room.rules.blockOnStart ? copy.blockOnStart.name : null,
    room.rules.mustCapture ? copy.mustCapture.name : null,
    room.rules.autoSingle ? copy.autoSingle.name : null,
  ].filter((line): line is string => Boolean(line));

  const lastLine = room.log[room.log.length - 1];
  const canRoll = myTurn && room.turnState === 'roll' && !busy && room.phase === 'play';

  let prompt = '';
  if (room.phase === 'play') {
    if (!myTurn) prompt = '';
    else if (room.turnState === 'move') prompt = copy.pickOne;
    else if (room.sixes > 0) prompt = copy.extraRoll;
    else if (room.triesLeft > 1) prompt = `${room.triesLeft} ${copy.triesLeft}`;
    else if (lastLine?.code === 'forced') prompt = copy.autoPlayed;
    else if (lastLine?.code === 'noMove') prompt = copy.noMoveHint;
  }

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
      <div className="mn-stage">
        <div className="mn-play">
          <Board
            players={room.players}
            corners={room.corners}
            youId={youId}
            activeId={room.activeId}
            copy={copy}
            options={options}
            hint={hint}
            onHint={setHint}
            onChoose={choose}
            walker={walker}
            booted={booted}
            landed={landed}
            shake={shake}
          />
          <ShoutLayer shouts={shouts} />

          <section className="mn-console" data-mine={myTurn ? 'true' : 'false'}>
            <div className="mn-console-head">
              <p className="mn-turnline" aria-live="polite">
                {myTurn ? <b>{copy.yourTurn}</b> : <>{copy.waitingFor} <b>{active?.name ?? '—'}</b></>}
              </p>
              {room.turnEndsAt && (
                <span className="mn-clock" aria-hidden="true">
                  <span className="mn-clock-bar" style={{ width: `${clockPct}%` }} />
                  <b className="mn-num">{seconds}</b>
                </span>
              )}
            </div>

            <div className="mn-console-body">
              <Die
                value={room.dice}
                rolling={rolling}
                disabled={!canRoll}
                onRoll={() => send({ t: 'roll' })}
                label={copy.rollBtn}
                color={me?.color ?? 'red'}
              />

              <div className="mn-console-side">
                {canRoll && (
                  <button type="button" className="mn-btn" data-tone="go" onClick={() => send({ t: 'roll' })}>
                    {copy.rollBtn}
                  </button>
                )}
                {options.length > 0 && <p className="mn-prompt">{copy.pickOne}</p>}
                {options.length === 0 && prompt && <p className="mn-prompt">{prompt}</p>}
                {lastLine && <p className="mn-last">{logText(lastLine, copy)}</p>}
              </div>
            </div>

            {options.length > 0 && (
              <ChoiceList
                options={options}
                players={room.players}
                copy={copy}
                hint={hint}
                onHint={setHint}
                onChoose={choose}
              />
            )}
          </section>
        </div>

        <aside className="mn-side">
          <div className="mn-card mn-card-tight">
            <p className="mn-eyebrow">{copy.playersHeading}</p>
            <PlayerRail
              players={room.players}
              activeId={room.activeId}
              youId={youId}
              copy={copy}
              clockPct={clockPct}
              seconds={seconds}
            />
          </div>

          <div className="mn-card mn-card-tight">
            <p className="mn-eyebrow">{copy.standings}</p>
            <HomeTrack players={room.players} copy={copy} />
          </div>

          <div className="mn-card mn-card-tight">
            <p className="mn-eyebrow">{copy.variantTitle}</p>
            <ul className="mn-chips">
              {variants.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="mn-card mn-card-tight">
            <Feed log={room.log} copy={copy} />
          </div>
        </aside>
      </div>
    );

  const winner = room.players.find((player) => player.id === room.winnerId) ?? null;
  const endModal = room.phase === 'over' && winner && (
    <div className="mn-veil" role="dialog" aria-modal="true">
      <div className="mn-modal" data-c={winner.color}>
        <p className="mn-eyebrow">{copy.winnerTitle}</p>
        <h2 className="mn-title">{winner.id === youId ? copy.youWin : winner.name}</h2>
        <ul className="mn-tally">
          {room.players.map((player) => (
            <li key={player.id} data-c={player.color}>
              <span>{player.name}</span>
              <b className="mn-num">
                {player.home}/4 {copy.homeShort}
              </b>
              <i className="mn-num">
                {player.hits} {copy.hits}
              </i>
            </li>
          ))}
        </ul>
        <div className="mn-row">
          {isHost ? (
            <button type="button" className="mn-btn" data-tone="go" onClick={() => send({ t: 'again' })}>
              {copy.again}
            </button>
          ) : (
            <p className="mn-note">{copy.waitingHost}</p>
          )}
          <a className="mn-btn" data-tone="ghost" href={`/${lang}/minigames/mens`}>
            {copy.leave}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mn">
      <div className="mn-wrap">
        {header}
        {error && <p className="mn-error">{error}</p>}
        {body}
      </div>
      {endModal}
    </div>
  );
}