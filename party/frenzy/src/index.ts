import { routePartykitRequest, Server, type Connection } from 'partyserver';
import {
  ACE_CARDS,
  DEFAULT_SETTINGS,
  REGULAR_CARDS,
  type CardId,
  type ClientMessage,
  type Direction,
  type LobbySettings,
  type PublicState,
  type ServerMessage,
} from './protocol';

interface Player {
  /** Stable identity across reconnects */
  key: string;
  connectionId: string | null;
  name: string;
  ready: boolean;
  eliminated: boolean;
  hand: CardId[];
  blindfoldRounds: number;
  connected: boolean;
}

type Env = {
  FrenzyRoom: DurableObjectNamespace<FrenzyRoom>;
};

function clampSettings(partial: Partial<LobbySettings>, base: LobbySettings): LobbySettings {
  const next = { ...base, ...partial };
  next.min = Math.max(1, Math.floor(next.min));
  next.max = Math.max(next.min + 10, Math.floor(next.max));
  next.maxPlayers = Math.min(10, Math.max(3, Math.floor(next.maxPlayers)));
  next.chooserCount = Math.min(next.maxPlayers - 1, Math.max(1, Math.floor(next.chooserCount)));
  next.shuffleVote = Boolean(next.shuffleVote);
  return next;
}

function dealStartingHand(): CardId[] {
  const regular = [...REGULAR_CARDS].sort(() => Math.random() - 0.5).slice(0, 3);
  const ace = ACE_CARDS[Math.floor(Math.random() * ACE_CARDS.length)];
  return [...regular, ace];
}

function randomCard(): CardId {
  const pool = [...REGULAR_CARDS, ...ACE_CARDS];
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitizePlayerKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

export class FrenzyRoom extends Server<Env> {
  // Keep lobby state in memory — hibernation was wiping players between joins.
  static options = { hibernate: false };

  players = new Map<string, Player>();
  connectionToKey = new Map<string, string>();
  settings: LobbySettings = { ...DEFAULT_SETTINGS };
  phase: PublicState['phase'] = 'lobby';
  hostKey: string | null = null;
  direction: Direction = 1;
  turnOrder: string[] = [];
  currentTurnId: string | null = null;
  low = 1;
  high = 100_000;
  lastGuess: number | null = null;
  lastBluff: 'higher' | 'lower' | null = null;
  winnerId: string | null = null;
  chooserIds: string[] = [];
  secrets = new Map<string, number>();
  target: number | null = null;
  event: string | null = null;
  guessesThisRotation = 0;
  voteYes = new Set<string>();
  voted = new Set<string>();
  pendingCard: CardId | null = null;

  onConnect(connection: Connection) {
    this.send(connection, {
      type: 'state',
      state: this.publicState(),
      hand: [],
    });
  }

  onClose(connection: Connection) {
    const key = this.connectionToKey.get(connection.id);
    if (!key) return;
    const player = this.players.get(key);
    this.connectionToKey.delete(connection.id);
    if (!player) return;

    if (player.connectionId === connection.id) {
      player.connectionId = null;
      player.connected = false;
    }

    // Do NOT delete the player or reassign host immediately — invite joins / tab
    // refreshes briefly drop sockets and were stealing host + emptying the list.
    this.event = `${player.name} disconnected`;
    this.broadcastState();
    void this.ctx.storage.setAlarm(Date.now() + 45_000);
  }

  async onAlarm() {
    if (this.phase !== 'lobby') return;
    let changed = false;
    for (const [key, player] of [...this.players.entries()]) {
      if (player.connected) continue;
      this.players.delete(key);
      this.secrets.delete(key);
      this.voteYes.delete(key);
      this.voted.delete(key);
      changed = true;
      if (this.hostKey === key) {
        this.hostKey =
          [...this.players.values()].find((p) => p.connected)?.key ??
          [...this.players.keys()][0] ??
          null;
      }
    }
    if (changed) {
      this.event = 'Cleaned inactive seats';
      this.broadcastState();
    }
  }

  onMessage(connection: Connection, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;
    let data: ClientMessage;
    try {
      data = JSON.parse(message) as ClientMessage;
    } catch {
      this.send(connection, { type: 'error', message: 'Invalid message' });
      return;
    }

    try {
      this.handle(connection, data);
    } catch (err) {
      this.send(connection, {
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed',
      });
    }
  }

  private handle(connection: Connection, data: ClientMessage) {
    switch (data.type) {
      case 'join':
        this.join(connection, data.name, data.playerKey);
        break;
      case 'update_settings':
        this.updateSettings(connection, data.settings);
        break;
      case 'set_ready':
        this.setReady(connection, data.ready);
        break;
      case 'start_game':
        this.startGame(connection);
        break;
      case 'submit_secret':
        this.submitSecret(connection, data.value);
        break;
      case 'play_card':
        this.playCard(connection, data.card, data.targetId, data.bluff);
        break;
      case 'opening_guess':
        this.openingGuess(connection, data.value);
        break;
      case 'guess':
        this.guess(connection, data.call, data.nextGuess);
        break;
      case 'pass_shield':
        this.passShield(connection);
        break;
      case 'vote_shuffle':
        this.voteShuffle(connection, data.yes);
        break;
      case 'rematch':
        this.rematch(connection);
        break;
    }
  }

  private bindConnection(connection: Connection, key: string) {
    const previous = this.connectionToKey.get(connection.id);
    if (previous && previous !== key) {
      const old = this.players.get(previous);
      if (old && old.connectionId === connection.id) {
        old.connectionId = null;
        old.connected = false;
      }
    }

    const player = this.players.get(key);
    if (player?.connectionId && player.connectionId !== connection.id) {
      this.connectionToKey.delete(player.connectionId);
    }

    this.connectionToKey.set(connection.id, key);
    if (player) {
      player.connectionId = connection.id;
      player.connected = true;
    }
  }

  private join(connection: Connection, name: string, playerKeyRaw: string) {
    const key = sanitizePlayerKey(playerKeyRaw);
    if (!key) throw new Error('Missing player key');

    const clean = name.trim().slice(0, 18) || `Player ${this.players.size + 1}`;
    const existing = this.players.get(key);

    if (existing) {
      this.bindConnection(connection, key);
      existing.name = clean;
      existing.connected = true;
      this.event = `${clean} reconnected`;
      this.broadcastState();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Game already started');

    const seated = [...this.players.values()].filter((p) => p.connected).length;
    if (seated >= this.settings.maxPlayers) throw new Error('Room is full');

    this.players.set(key, {
      key,
      connectionId: connection.id,
      name: clean,
      ready: false,
      eliminated: false,
      hand: [],
      blindfoldRounds: 0,
      connected: true,
    });
    this.bindConnection(connection, key);

    if (!this.hostKey || !this.players.has(this.hostKey)) {
      this.hostKey = key;
    }

    this.event = `${clean} joined`;
    this.broadcastState();
  }

  private updateSettings(connection: Connection, partial: Partial<LobbySettings>) {
    this.assertHost(connection);
    if (this.phase !== 'lobby') throw new Error('Settings locked');
    this.settings = clampSettings(partial, this.settings);
    this.event = 'Settings updated';
    this.broadcastState();
  }

  private setReady(connection: Connection, ready: boolean) {
    const p = this.requirePlayer(connection);
    if (this.phase !== 'lobby') throw new Error('Not in lobby');
    p.ready = ready;
    this.broadcastState();
  }

  private startGame(connection: Connection) {
    this.assertHost(connection);
    if (this.phase !== 'lobby') throw new Error('Already started');
    const connected = [...this.players.values()].filter((p) => p.connected);
    if (connected.length < 3) throw new Error('Need at least 3 players');
    if (!connected.every((p) => p.ready || p.key === this.hostKey)) {
      throw new Error('All players must be ready');
    }

    // Drop seats that never came back
    for (const [key, p] of [...this.players.entries()]) {
      if (!p.connected) this.players.delete(key);
    }

    for (const p of connected) {
      p.eliminated = false;
      p.hand = dealStartingHand();
      p.blindfoldRounds = 0;
      p.ready = false;
    }

    this.turnOrder = shuffle(connected.map((p) => p.key));
    this.chooserIds = this.turnOrder.slice(0, this.settings.chooserCount);
    this.secrets.clear();
    this.target = null;
    this.low = this.settings.min;
    this.high = this.settings.max;
    this.lastGuess = null;
    this.lastBluff = null;
    this.winnerId = null;
    this.direction = 1;
    this.guessesThisRotation = 0;
    this.voteYes.clear();
    this.voted.clear();
    this.pendingCard = null;
    this.phase = 'choose_secret';
    this.event = 'Choose secret numbers';
    this.broadcastFx('deal');
    this.broadcastState();
  }

  private submitSecret(connection: Connection, value: number) {
    const p = this.requirePlayer(connection);
    if (this.phase !== 'choose_secret') throw new Error('Not choosing secrets');
    if (!this.chooserIds.includes(p.key)) throw new Error('You are not a chooser');
    if (value < this.settings.min || value > this.settings.max) {
      throw new Error('Number out of range');
    }
    this.secrets.set(p.key, Math.floor(value));
    this.event = `${p.name} locked a secret`;
    if (this.secrets.size >= this.chooserIds.length) {
      const values = [...this.secrets.values()];
      this.target = values[Math.floor(Math.random() * values.length)];
      this.phase = 'playing';
      this.currentTurnId = this.turnOrder[0];
      this.event = 'Round begins — first player sets the opening number';
    }
    this.broadcastState();
  }

  private playCard(
    connection: Connection,
    card: CardId,
    targetId?: string,
    bluff?: 'higher' | 'lower',
  ) {
    const p = this.requirePlayer(connection);
    this.assertTurn(p);
    if (this.phase !== 'playing') throw new Error('Not playing');
    if (this.pendingCard) throw new Error('Already played a card this turn');
    const idx = p.hand.indexOf(card);
    if (idx === -1) throw new Error('Card not in hand');

    p.hand.splice(idx, 1);
    this.pendingCard = card;

    switch (card) {
      case 'reverse':
        this.direction = (this.direction === 1 ? -1 : 1) as Direction;
        this.event = `${p.name} reversed play`;
        this.broadcastFx('reverse');
        break;
      case 'skip': {
        const skipped = this.nextAlive(p.key);
        this.event = `${p.name} skipped ${this.players.get(skipped)?.name ?? 'someone'}`;
        this.currentTurnId = this.nextAlive(skipped);
        this.pendingCard = null;
        break;
      }
      case 'shield':
        this.event = `${p.name} raised a Shield — may pass safely`;
        break;
      case 'bluff':
        if (bluff !== 'higher' && bluff !== 'lower') throw new Error('Pick a bluff direction');
        this.lastBluff = bluff;
        this.event = `${p.name} bluffed ${bluff.toUpperCase()}`;
        break;
      case 'narrow': {
        const span = this.high - this.low;
        const mid = (this.low + this.high) / 2;
        const half = Math.max(1, Math.floor(span / 4));
        this.low = Math.max(this.low, Math.floor(mid - half));
        this.high = Math.min(this.high, Math.ceil(mid + half));
        if (this.target != null) {
          this.low = Math.min(this.low, this.target);
          this.high = Math.max(this.high, this.target);
        }
        this.event = `${p.name} narrowed the window`;
        this.broadcastFx('narrow');
        break;
      }
      case 'blindfold': {
        if (!targetId || !this.players.has(targetId)) throw new Error('Pick a target');
        const target = this.players.get(targetId)!;
        if (target.eliminated || target.key === p.key) throw new Error('Invalid target');
        target.blindfoldRounds = Math.max(target.blindfoldRounds, 2);
        this.event = `${p.name} blindfolded ${target.name}`;
        this.broadcastFx('blindfold');
        break;
      }
    }

    this.broadcastState();
  }

  private openingGuess(connection: Connection, value: number) {
    const p = this.requirePlayer(connection);
    this.assertTurn(p);
    if (this.phase !== 'playing') throw new Error('Not playing');
    if (this.lastGuess != null) throw new Error('Opening already set');
    const n = Math.floor(value);
    if (n < this.low || n > this.high) throw new Error('Out of window');
    this.lastGuess = n;
    this.lastBluff = null;
    this.pendingCard = null;
    this.event = `${p.name} opened at ${n}`;
    this.advanceTurn(p.key);
    this.broadcastState();
  }

  private guess(connection: Connection, call: 'higher' | 'lower', nextGuess: number) {
    const p = this.requirePlayer(connection);
    this.assertTurn(p);
    if (this.phase !== 'playing') throw new Error('Not playing');
    if (this.lastGuess == null || this.target == null) throw new Error('No opening guess yet');
    if (this.pendingCard === 'shield') throw new Error('Use pass with Shield, or guess without Shield');

    const correct =
      call === 'higher' ? this.target > this.lastGuess : this.target < this.lastGuess;

    if (!correct) {
      this.eliminate(p, `${p.name} guessed ${call.toUpperCase()} — eliminated!`);
      return;
    }

    if (call === 'higher') this.low = Math.min(this.high, this.lastGuess + 1);
    else this.high = Math.max(this.low, this.lastGuess - 1);

    const next = Math.floor(nextGuess);
    if (next < this.low || next > this.high) throw new Error('Next number must stay in the window');
    this.lastGuess = next;
    this.lastBluff = null;
    this.pendingCard = null;
    this.guessesThisRotation += 1;
    this.event = `${p.name} ${call} → ${next}`;

    const alive = this.aliveIds();
    if (this.guessesThisRotation >= alive.length) {
      this.guessesThisRotation = 0;
      for (const id of alive) {
        const pl = this.players.get(id);
        if (pl && pl.blindfoldRounds > 0) pl.blindfoldRounds -= 1;
      }
      if (this.settings.shuffleVote && alive.length > 1) {
        this.phase = 'vote_shuffle';
        this.voteYes.clear();
        this.voted.clear();
        this.event = 'Full rotation — vote to shuffle?';
        this.broadcastState();
        return;
      }
    }

    this.advanceTurn(p.key);
    this.broadcastState();
  }

  private passShield(connection: Connection) {
    const p = this.requirePlayer(connection);
    this.assertTurn(p);
    if (this.pendingCard !== 'shield') throw new Error('Shield not active');
    this.pendingCard = null;
    this.event = `${p.name} passed with Shield`;
    this.advanceTurn(p.key);
    this.broadcastState();
  }

  private voteShuffle(connection: Connection, yes: boolean) {
    const p = this.requirePlayer(connection);
    if (this.phase !== 'vote_shuffle') throw new Error('No vote active');
    if (p.eliminated) throw new Error('Eliminated');
    if (this.voted.has(p.key)) throw new Error('Already voted');
    this.voted.add(p.key);
    if (yes) this.voteYes.add(p.key);

    const alive = this.aliveIds();
    if (this.voted.size >= alive.length) {
      if (this.voteYes.size === alive.length) {
        this.turnOrder = shuffle(alive);
        this.currentTurnId = this.turnOrder[0];
        this.event = 'Turn order shuffled!';
        this.broadcastFx('shuffle');
      } else {
        this.event = 'Shuffle vote failed';
        if (!this.currentTurnId || !alive.includes(this.currentTurnId)) {
          this.currentTurnId = alive[0];
        }
      }
      this.phase = 'playing';
      this.voteYes.clear();
      this.voted.clear();
    }
    this.broadcastState();
  }

  private rematch(connection: Connection) {
    this.assertHost(connection);
    for (const p of this.players.values()) {
      p.ready = false;
      p.eliminated = false;
      p.hand = [];
      p.blindfoldRounds = 0;
    }
    this.phase = 'lobby';
    this.turnOrder = [];
    this.currentTurnId = null;
    this.winnerId = null;
    this.target = null;
    this.secrets.clear();
    this.chooserIds = [];
    this.lastGuess = null;
    this.event = 'Lobby reset';
    this.broadcastState();
  }

  private eliminate(player: Player, message: string) {
    player.eliminated = true;
    this.pendingCard = null;
    this.event = message;
    this.broadcastFx('eliminate');
    this.broadcast({ type: 'eliminated', playerId: player.key, name: player.name });

    const alive = this.aliveIds();
    for (const id of alive) {
      const survivor = this.players.get(id)!;
      survivor.hand.push(randomCard());
    }

    if (alive.length <= 1) {
      this.winnerId = alive[0] ?? null;
      this.phase = 'ended';
      this.currentTurnId = null;
      this.event = this.winnerId
        ? `${this.players.get(this.winnerId)?.name} wins!`
        : 'Game over';
      this.broadcastState();
      return;
    }

    this.currentTurnId = this.nextAlive(player.key);
    this.broadcastState();
  }

  private advanceTurn(fromId: string) {
    this.currentTurnId = this.nextAlive(fromId);
  }

  private nextAlive(fromId: string): string {
    const alive = this.aliveIds();
    if (alive.length === 0) return fromId;
    const order = this.turnOrder.filter((id) => alive.includes(id));
    const idx = order.indexOf(fromId);
    if (idx === -1) return order[0];
    const step = this.direction;
    const next = (idx + step + order.length * 10) % order.length;
    return order[next];
  }

  private aliveIds(): string[] {
    return [...this.players.values()]
      .filter((p) => !p.eliminated && p.connected)
      .map((p) => p.key);
  }

  private playerKeyFor(connection: Connection): string | null {
    return this.connectionToKey.get(connection.id) ?? null;
  }

  private assertHost(connection: Connection) {
    const key = this.playerKeyFor(connection);
    if (!key || key !== this.hostKey) throw new Error('Host only');
  }

  private assertTurn(p: Player) {
    if (p.eliminated) throw new Error('You are eliminated');
    if (this.currentTurnId !== p.key) throw new Error('Not your turn');
  }

  private requirePlayer(connection: Connection): Player {
    const key = this.playerKeyFor(connection);
    const p = key ? this.players.get(key) : undefined;
    if (!p) throw new Error('Join the lobby first');
    return p;
  }

  private publicState(viewerKey?: string | null): PublicState {
    const alive = this.aliveIds();
    return {
      roomId: this.name,
      phase: this.phase,
      settings: this.settings,
      players: [...this.players.values()].map((p) => ({
        id: p.key,
        name: p.name,
        ready: p.ready,
        eliminated: p.eliminated,
        connected: p.connected,
        isHost: p.key === this.hostKey,
        cardCount: p.hand.length,
        blindfoldRounds: p.blindfoldRounds,
        isChooser: this.chooserIds.includes(p.key),
      })),
      hostId: this.hostKey,
      direction: this.direction,
      turnOrder: this.turnOrder,
      currentTurnId: this.currentTurnId,
      low: this.low,
      high: this.high,
      lastGuess: this.lastGuess,
      lastBluff: this.lastBluff,
      winnerId: this.winnerId,
      chooserIds: this.chooserIds,
      secretsSubmitted: [...this.secrets.keys()],
      voteYesCount: this.voteYes.size,
      voteTotal: this.voted.size,
      youVoted: viewerKey ? this.voted.has(viewerKey) : false,
      event: this.event,
      survivorsNeeded: Math.max(0, 3 - alive.length),
    };
  }

  private send(connection: Connection, msg: ServerMessage) {
    connection.send(JSON.stringify(msg));
  }

  private broadcastState() {
    for (const connection of this.getConnections()) {
      const key = this.connectionToKey.get(connection.id);
      const hand = key ? (this.players.get(key)?.hand ?? []) : [];
      this.send(connection, {
        type: 'state',
        state: this.publicState(key),
        hand,
      });
    }
  }

  private broadcastFx(kind: Extract<ServerMessage, { type: 'fx' }>['kind']) {
    this.broadcast(JSON.stringify({ type: 'fx', kind } satisfies ServerMessage));
  }

  private broadcast(msg: ServerMessage | string) {
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    for (const connection of this.getConnections()) {
      connection.send(payload);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json({ ok: true, game: 'Higher or Lower: Frenzy!' });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    return (
      (await routePartykitRequest(request, env)) ||
      new Response('Not Found', { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
