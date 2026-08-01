import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { PartySocket } from 'partysocket';
import {
  DEFAULT_SETTINGS,
  REGULAR_CARDS,
  ACE_CARDS,
  type CardId,
  type ClientMessage,
  type PublicState,
  type ServerMessage,
} from '../../../party/frenzy/src/protocol';
import { playTone } from './audio';

interface Props {
  lang: 'nl' | 'en';
  roomId: string;
  host?: string;
}

const CARD_LABELS: Record<CardId, { en: string; nl: string; kind: 'wild' | 'ace' }> = {
  reverse: { en: 'Reverse', nl: 'Omkeren', kind: 'wild' },
  skip: { en: 'Skip', nl: 'Overslaan', kind: 'wild' },
  shield: { en: 'Shield', nl: 'Schild', kind: 'wild' },
  bluff: { en: 'Bluff', nl: 'Bluf', kind: 'wild' },
  narrow: { en: 'Narrow', nl: 'Inkorten', kind: 'ace' },
  blindfold: { en: 'Blindfold', nl: 'Blinddoek', kind: 'ace' },
};

function send(socket: PartySocket | null, msg: ClientMessage) {
  socket?.send(JSON.stringify(msg));
}

function getPlayerKey(roomId: string): string {
  const storageKey = `empyr-frenzy-player:${roomId}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
}

export default function FrenzyApp({ lang, roomId, host }: Props) {
  const isNl = lang === 'nl';
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<PublicState | null>(null);
  const [hand, setHand] = useState<CardId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fx, setFx] = useState<string | null>(null);
  const playerKeyRef = useRef(getPlayerKey(roomId));
  const [myId] = useState(() => playerKeyRef.current);
  const [secret, setSecret] = useState('');
  const [opening, setOpening] = useState('');
  const [nextGuess, setNextGuess] = useState('');
  const [call, setCall] = useState<'higher' | 'lower'>('higher');
  const [bluff, setBluff] = useState<'higher' | 'lower'>('higher');
  const [blindTarget, setBlindTarget] = useState('');
  const socketRef = useRef<PartySocket | null>(null);
  const joinedRef = useRef(false);
  const nameRef = useRef(name);

  const frenzyHost =
    host ||
    import.meta.env.PUBLIC_FRENZY_HOST ||
    (import.meta.env.DEV ? 'localhost:8787' : 'empyr-frenzy.arcanearthenden.workers.dev');

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    playerKeyRef.current = getPlayerKey(roomId);
    const socket = new PartySocket({
      host: frenzyHost,
      party: 'frenzy-room',
      room: roomId,
    });
    socketRef.current = socket;

    const rejoinIfNeeded = () => {
      if (!joinedRef.current) return;
      send(socket, {
        type: 'join',
        name: nameRef.current.trim() || (isNl ? 'Speler' : 'Player'),
        playerKey: playerKeyRef.current,
      });
    };

    socket.addEventListener('open', rejoinIfNeeded);

    socket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerMessage;
        if (msg.type === 'state') {
          setState(msg.state);
          setHand(msg.hand);
          setError(null);
        } else if (msg.type === 'error') {
          setError(msg.message);
          playTone('error');
        } else if (msg.type === 'fx') {
          setFx(msg.kind);
          playTone(msg.kind === 'eliminate' ? 'eliminate' : msg.kind === 'deal' ? 'deal' : 'swoosh');
          window.setTimeout(() => setFx(null), 900);
        } else if (msg.type === 'eliminated') {
          playTone('eliminate');
        }
      } catch {
        /* ignore */
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [frenzyHost, roomId, isNl]);

  const me = useMemo(
    () => state?.players.find((p) => p.id === myId) ?? null,
    [state, myId],
  );
  const isHost = me?.isHost ?? false;
  const isMyTurn = state?.currentTurnId === myId;
  const blindfolded = (me?.blindfoldRounds ?? 0) > 0;

  /** Seat everyone on an oval with "you" fixed at the bottom, like UNO. */
  const tableSeats = useMemo(() => {
    if (!state) return [];
    const order =
      state.turnOrder.length > 0
        ? state.turnOrder
            .map((id) => state.players.find((p) => p.id === id))
            .filter(Boolean)
        : state.players;
    const list = order as NonNullable<(typeof state.players)[number]>[];
    if (list.length === 0) return [];

    const myIndex = Math.max(
      0,
      list.findIndex((p) => p.id === myId),
    );
    const rotated = [...list.slice(myIndex), ...list.slice(0, myIndex)];
    const n = rotated.length;

    return rotated.map((player, i) => {
      // Put local player at bottom (90° in canvas coords → angle from top).
      const angle = (Math.PI / 2) + (i / n) * Math.PI * 2;
      const x = 50 + Math.cos(angle) * 42;
      const y = 52 + Math.sin(angle) * 38;
      const depth = (Math.sin(angle) + 1) / 2; // 0 far, 1 near
      return {
        player,
        x,
        y,
        depth,
        isSelf: player.id === myId,
        isActive: player.id === state.currentTurnId,
      };
    });
  }, [state, myId]);

  const activeName =
    state?.players.find((p) => p.id === state.currentTurnId)?.name ?? null;

  const onJoin = useCallback(() => {
    playTone('click');
    const playerKey = playerKeyRef.current;
    joinedRef.current = true;
    send(socketRef.current, {
      type: 'join',
      name: name.trim() || (isNl ? 'Speler' : 'Player'),
      playerKey,
    });
    setJoined(true);
  }, [name, isNl]);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${lang}/minigames/frenzy/play?room=${roomId}`
      : '';

  if (!joined) {
    return (
      <div className="frenzy-shell">
        <div className="frenzy-panel max-w-md mx-auto">
          <p className="frenzy-kicker">Higher or Lower: Frenzy!</p>
          <h1 className="frenzy-title">{isNl ? 'Betreed de lobby' : 'Enter the lobby'}</h1>
          <p className="frenzy-muted">
            {isNl ? 'Kamer' : 'Room'}: <code>{roomId}</code>
          </p>
          <label className="frenzy-label">
            {isNl ? 'Bijnaam' : 'Display name'}
            <input
              className="frenzy-input"
              value={name}
              maxLength={18}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onJoin()}
            />
          </label>
          <button type="button" className="frenzy-btn frenzy-btn-primary" onClick={onJoin}>
            {isNl ? 'Join kamer' : 'Join room'}
          </button>
          {error && <p className="frenzy-error">{error}</p>}
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="frenzy-shell">
        <div className="frenzy-panel">
          <p className="frenzy-muted">{isNl ? 'Verbinden…' : 'Connecting…'}</p>
          {error && <p className="frenzy-error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`frenzy-shell ${fx ? `fx-${fx}` : ''}`}>
      <header className="frenzy-top">
        <div>
          <p className="frenzy-kicker">Frenzy</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {state.phase === 'lobby'
              ? isNl
                ? 'Lobby'
                : 'Lobby'
              : state.phase === 'ended'
                ? isNl
                  ? 'Einde'
                  : 'Finished'
                : isNl
                  ? 'Live ronde'
                  : 'Live round'}
          </h1>
        </div>
        <div className="text-right">
          <p className="frenzy-muted text-xs uppercase tracking-widest">{isNl ? 'Uitnodiging' : 'Invite'}</p>
          <button
            type="button"
            className="frenzy-link"
            onClick={() => {
              playTone('click');
              void navigator.clipboard.writeText(inviteUrl);
            }}
          >
            {isNl ? 'Kopieer link' : 'Copy link'}
          </button>
        </div>
      </header>

      {state.event && <div className="frenzy-banner">{state.event}</div>}
      {error && <p className="frenzy-error px-4">{error}</p>}

      {state.phase === 'lobby' && (
        <section className="frenzy-grid">
          <div className="frenzy-panel">
            <h2 className="frenzy-h2">{isNl ? 'Spelers' : 'Players'}</h2>
            <ul className="space-y-2 mt-4">
              {state.players.map((p) => (
                <li key={p.id} className={`frenzy-player ${p.connected ? '' : 'opacity-50'}`}>
                  <span>
                    {p.name}
                    {p.isHost ? ' ★' : ''}
                    {p.id === myId ? (isNl ? ' (jij)' : ' (you)') : ''}
                    {!p.connected ? (isNl ? ' · offline' : ' · offline') : ''}
                  </span>
                  <span className={p.ready ? 'text-emerald-300' : 'text-zinc-500'}>
                    {p.ready ? (isNl ? 'Klaar' : 'Ready') : isNl ? 'Wacht' : 'Waiting'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="frenzy-muted text-xs mt-3">
              {isNl ? 'Kamer' : 'Room'}: <code>{state.roomId}</code> · {state.players.filter((p) => p.connected).length}/
              {state.settings.maxPlayers}
            </p>
            <button
              type="button"
              className="frenzy-btn mt-4"
              onClick={() => {
                playTone('click');
                send(socketRef.current, { type: 'set_ready', ready: !me?.ready });
              }}
            >
              {me?.ready ? (isNl ? 'Niet klaar' : 'Unready') : isNl ? 'Klaar' : 'Ready'}
            </button>
            {isHost && (
              <button
                type="button"
                className="frenzy-btn frenzy-btn-primary mt-3"
                onClick={() => {
                  playTone('click');
                  send(socketRef.current, { type: 'start_game' });
                }}
              >
                {isNl ? 'Start spel (min. 3)' : 'Start game (min 3)'}
              </button>
            )}
          </div>

          {isHost && (
            <div className="frenzy-panel">
              <h2 className="frenzy-h2">{isNl ? 'Instellingen' : 'Settings'}</h2>
              <div className="grid gap-3 mt-4 sm:grid-cols-2">
                {(
                  [
                    ['min', state.settings.min],
                    ['max', state.settings.max],
                    ['maxPlayers', state.settings.maxPlayers],
                    ['chooserCount', state.settings.chooserCount],
                  ] as const
                ).map(([key, value]) => (
                  <label key={key} className="frenzy-label">
                    {key}
                    <input
                      className="frenzy-input"
                      type="number"
                      value={value}
                      onChange={(e) =>
                        send(socketRef.current, {
                          type: 'update_settings',
                          settings: { [key]: Number(e.target.value) },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="frenzy-check mt-4">
                <input
                  type="checkbox"
                  checked={state.settings.shuffleVote}
                  onChange={(e) =>
                    send(socketRef.current, {
                      type: 'update_settings',
                      settings: { shuffleVote: e.target.checked },
                    })
                  }
                />
                {isNl ? 'Shuffle-stemming na volle rotatie' : 'Shuffle vote after full rotation'}
              </label>
            </div>
          )}
        </section>
      )}

      {state.phase === 'choose_secret' && (
        <section className="frenzy-panel max-w-lg mx-auto">
          <h2 className="frenzy-h2">{isNl ? 'Geheime getallen' : 'Secret numbers'}</h2>
          <p className="frenzy-muted mt-2">
            {isNl
              ? `${state.chooserIds.length} spelers kiezen een geheim getal (${state.settings.min}–${state.settings.max}).`
              : `${state.chooserIds.length} players each pick a secret (${state.settings.min}–${state.settings.max}).`}
          </p>
          {me?.isChooser && !state.secretsSubmitted.includes(myId!) ? (
            <div className="mt-4 flex gap-2">
              <input
                className="frenzy-input"
                type="number"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={`${state.settings.min} – ${state.settings.max}`}
              />
              <button
                type="button"
                className="frenzy-btn frenzy-btn-primary"
                onClick={() => {
                  playTone('click');
                  send(socketRef.current, { type: 'submit_secret', value: Number(secret) });
                }}
              >
                {isNl ? 'Vergrendel' : 'Lock in'}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-cyan-300">
              {isNl ? 'Wachten op kiezers…' : 'Waiting for choosers…'} ({state.secretsSubmitted.length}/
              {state.chooserIds.length})
            </p>
          )}
        </section>
      )}

      {(state.phase === 'playing' || state.phase === 'vote_shuffle' || state.phase === 'ended') && (
        <section className="frenzy-play">
          <div className={`frenzy-arena ${blindfolded ? 'is-blind' : ''}`}>
            <div className="frenzy-turn-callout">
              {isMyTurn
                ? isNl
                  ? 'JOUW BEURT'
                  : 'YOUR TURN'
                : activeName
                  ? `${activeName}${isNl ? ' is aan de beurt' : "'s turn"}`
                  : '—'}
            </div>

            <div className="frenzy-stage" style={{ '--dir-spin': state.direction === 1 ? '1' : '-1' } as CSSProperties}>
              <div className="frenzy-table-3d" aria-hidden="true">
                <div className="frenzy-table-felt">
                  <div className="frenzy-table-rim" />
                  <div className="frenzy-table-shine" />
                </div>
              </div>

              <div className="frenzy-center-pile">
                <div className="frenzy-ring" data-dir={state.direction === 1 ? 'cw' : 'ccw'}>
                  <span>{state.direction === 1 ? '↻' : '↺'}</span>
                </div>
                <p className="frenzy-muted text-[10px] uppercase tracking-[0.2em]">
                  {isNl ? 'Venster' : 'Window'}
                </p>
                {blindfolded ? (
                  <p className="frenzy-center-range">?? — ??</p>
                ) : (
                  <p className="frenzy-center-range">
                    {state.low.toLocaleString()} — {state.high.toLocaleString()}
                  </p>
                )}
                <p className="frenzy-center-guess">
                  {isNl ? 'Laatste' : 'Last'}:{' '}
                  {blindfolded ? '??' : (state.lastGuess?.toLocaleString() ?? '—')}
                </p>
                {state.lastBluff && (
                  <p className="text-amber-300 text-xs mt-1">Bluff {state.lastBluff.toUpperCase()}</p>
                )}
              </div>

              {tableSeats.map((seat) => {
                const initial = seat.player.name.trim().charAt(0).toUpperCase() || '?';
                const cardBacks = Math.min(seat.player.cardCount, 7);
                return (
                  <div
                    key={seat.player.id}
                    className={[
                      'frenzy-seat-3d',
                      seat.isSelf ? 'is-self' : '',
                      seat.isActive ? 'is-active' : '',
                      seat.player.eliminated ? 'is-out' : '',
                      !seat.player.connected ? 'is-offline' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      {
                        left: `${seat.x}%`,
                        top: `${seat.y}%`,
                        '--depth': String(seat.depth),
                        zIndex: Math.round(10 + seat.depth * 20) + (seat.isActive ? 30 : 0),
                      } as CSSProperties
                    }
                  >
                    {!seat.isSelf && (
                      <div className="frenzy-mini-hand" aria-hidden="true">
                        {Array.from({ length: Math.max(cardBacks, 1) }).map((_, ci) => (
                          <span
                            key={ci}
                            className="frenzy-mini-card"
                            style={{ '--i': String(ci - (cardBacks - 1) / 2) } as CSSProperties}
                          />
                        ))}
                      </div>
                    )}
                    <div className="frenzy-avatar">{initial}</div>
                    <div className="frenzy-seat-meta">
                      <strong>
                        {seat.isSelf ? (isNl ? 'Jij' : 'You') : seat.player.name}
                        {seat.player.isHost ? ' ★' : ''}
                      </strong>
                      <span>
                        {seat.player.cardCount} {isNl ? 'kaarten' : 'cards'}
                        {seat.player.blindfoldRounds > 0 ? ' · 👁' : ''}
                      </span>
                    </div>
                    {seat.isActive && (
                      <span className="frenzy-turn-badge">
                        {seat.isSelf ? (isNl ? 'Beurt' : 'Turn') : isNl ? 'Speelt' : 'Playing'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {state.phase === 'vote_shuffle' && (
            <div className="frenzy-panel max-w-md mx-auto">
              <h2 className="frenzy-h2">{isNl ? 'Shuffle stemmen' : 'Shuffle vote'}</h2>
              <p className="frenzy-muted mt-2">
                {state.voteYesCount}/{state.players.filter((p) => !p.eliminated).length} yes ·{' '}
                {state.voteTotal} voted
              </p>
              {!state.youVoted && !me?.eliminated && (
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    className="frenzy-btn frenzy-btn-primary"
                    onClick={() => send(socketRef.current, { type: 'vote_shuffle', yes: true })}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className="frenzy-btn"
                    onClick={() => send(socketRef.current, { type: 'vote_shuffle', yes: false })}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}

          {state.phase === 'ended' && (
            <div className="frenzy-panel max-w-md mx-auto text-center">
              <h2 className="frenzy-h2">
                {state.players.find((p) => p.id === state.winnerId)?.name ?? '—'}{' '}
                {isNl ? 'wint!' : 'wins!'}
              </h2>
              {isHost && (
                <button
                  type="button"
                  className="frenzy-btn frenzy-btn-primary mt-4"
                  onClick={() => send(socketRef.current, { type: 'rematch' })}
                >
                  {isNl ? 'Opnieuw' : 'Rematch lobby'}
                </button>
              )}
            </div>
          )}

          {state.phase === 'playing' && isMyTurn && !me?.eliminated && (
            <div className="frenzy-panel">
              <h2 className="frenzy-h2">{isNl ? 'Jouw beurt' : 'Your turn'}</h2>
              <div className="frenzy-hand mt-4">
                {hand.map((card, i) => (
                  <button
                    key={`${card}-${i}`}
                    type="button"
                    className={`frenzy-card ${CARD_LABELS[card].kind}`}
                    onClick={() => {
                      playTone('swoosh');
                      if (card === 'blindfold') {
                        const target =
                          blindTarget ||
                          state.players.find((p) => !p.eliminated && p.id !== myId)?.id;
                        if (!target) return;
                        send(socketRef.current, { type: 'play_card', card, targetId: target });
                      } else if (card === 'bluff') {
                        send(socketRef.current, { type: 'play_card', card, bluff });
                      } else {
                        send(socketRef.current, { type: 'play_card', card });
                      }
                    }}
                  >
                    {isNl ? CARD_LABELS[card].nl : CARD_LABELS[card].en}
                  </button>
                ))}
              </div>
              {hand.includes('blindfold') && (
                <label className="frenzy-label mt-3">
                  Blindfold target
                  <select
                    className="frenzy-input"
                    value={blindTarget}
                    onChange={(e) => setBlindTarget(e.target.value)}
                  >
                    <option value="">—</option>
                    {state.players
                      .filter((p) => !p.eliminated && p.id !== myId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {hand.includes('bluff') && (
                <div className="flex gap-2 mt-3">
                  <button type="button" className={`frenzy-btn ${bluff === 'higher' ? 'frenzy-btn-primary' : ''}`} onClick={() => setBluff('higher')}>
                    Bluff Higher
                  </button>
                  <button type="button" className={`frenzy-btn ${bluff === 'lower' ? 'frenzy-btn-primary' : ''}`} onClick={() => setBluff('lower')}>
                    Bluff Lower
                  </button>
                </div>
              )}

              {state.lastGuess == null ? (
                <div className="mt-4 flex gap-2">
                  <input
                    className="frenzy-input"
                    type="number"
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    placeholder={`${state.low} – ${state.high}`}
                  />
                  <button
                    type="button"
                    className="frenzy-btn frenzy-btn-primary"
                    onClick={() => {
                      playTone('click');
                      send(socketRef.current, { type: 'opening_guess', value: Number(opening) });
                    }}
                  >
                    {isNl ? 'Openingsgok' : 'Opening guess'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`frenzy-btn ${call === 'higher' ? 'frenzy-btn-primary' : ''}`}
                      onClick={() => setCall('higher')}
                    >
                      Higher
                    </button>
                    <button
                      type="button"
                      className={`frenzy-btn ${call === 'lower' ? 'frenzy-btn-primary' : ''}`}
                      onClick={() => setCall('lower')}
                    >
                      Lower
                    </button>
                    <button
                      type="button"
                      className="frenzy-btn"
                      onClick={() => send(socketRef.current, { type: 'pass_shield' })}
                    >
                      {isNl ? 'Pass (Schild)' : 'Pass (Shield)'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="frenzy-input"
                      type="number"
                      value={nextGuess}
                      onChange={(e) => setNextGuess(e.target.value)}
                      placeholder={isNl ? 'Nieuw getal in venster' : 'New number in window'}
                    />
                    <button
                      type="button"
                      className="frenzy-btn frenzy-btn-primary"
                      onClick={() => {
                        playTone('click');
                        send(socketRef.current, {
                          type: 'guess',
                          call,
                          nextGuess: Number(nextGuess),
                        });
                      }}
                    >
                      {isNl ? 'Bevestig' : 'Lock guess'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {state.phase === 'playing' && !isMyTurn && !me?.eliminated && (
            <p className="text-center frenzy-muted py-6">
              {isNl ? 'Wachten op andere spelers…' : 'Waiting for other players…'}
            </p>
          )}
        </section>
      )}

      <footer className="frenzy-foot">
        <a href={`/${lang}/minigames`}>{isNl ? '← Minigames' : '← Minigames'}</a>
        <span className="frenzy-muted text-xs">
          {REGULAR_CARDS.length} wilds · {ACE_CARDS.length} aces · max {DEFAULT_SETTINGS.maxPlayers}+
        </span>
      </footer>
    </div>
  );
}
