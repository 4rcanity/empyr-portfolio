/** Wire format shared by the Ganzenbord worker and its browser client. */

/** What a square does to the pawn that lands on it. */
export type SquareKind =
  | 'start'
  | 'plain'
  | 'goose'
  | 'bridge'
  | 'inn'
  | 'well'
  | 'maze'
  | 'prison'
  | 'death'
  | 'goal';

/** The twelve geese of the traditional Dutch board. */
export const GEESE: readonly number[] = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54];

export const BRIDGE = 6;
export const INN = 19;
export const WELL = 31;
export const MAZE = 42;
export const PRISON = 52;
export const DEATH = 58;
export const GOAL = 63;

/** Where the bridge drops you. */
export const BRIDGE_TO = 12;

/** Squares that hold a pawn hostage until another player arrives. */
export const HOLDING: readonly number[] = [WELL, PRISON];

export function squareKind(n: number): SquareKind {
  if (n <= 0) return 'start';
  if (n === GOAL) return 'goal';
  if (GEESE.includes(n)) return 'goose';
  if (n === BRIDGE) return 'bridge';
  if (n === INN) return 'inn';
  if (n === WELL) return 'well';
  if (n === MAZE) return 'maze';
  if (n === PRISON) return 'prison';
  if (n === DEATH) return 'death';
  return 'plain';
}

/** A penalty square raises the punishment window. */
export function isPenalty(kind: SquareKind): boolean {
  return kind === 'inn' || kind === 'well' || kind === 'maze' || kind === 'prison' || kind === 'death';
}

export type Phase = 'lobby' | 'play' | 'over';

export interface Rules {
  /**
   * Traditional opening: a first-throw 9 rolled as 3+6 runs to 26, and as 4+5
   * runs to 53.
   */
  openingNines: boolean;
  /** Turns lost in the inn on 19. Tables argue between one, two and three. */
  innTurns: number;
  /** Where the maze on 42 spits you out. 39 is Dutch, 30 is the French variant. */
  mazeBack: number;
  /** Where death on 58 sends you: 0 is the nest, 1 is the first square. */
  deathTo: number;
  /** Does a rescue free everybody sitting in that well, or only the first? */
  wellFreesAll: boolean;
  /** 63 must be hit exactly; an overshoot bounces back by the excess. */
  exactFinish: boolean;
  /** House extra: landing on an occupied square trades places with them. */
  swapOnLanding: boolean;
  turnSeconds: number;
  capacity: number;
}

export const TRADITIONAL_RULES: Rules = {
  openingNines: true,
  innTurns: 2,
  mazeBack: 39,
  deathTo: 0,
  wellFreesAll: true,
  exactFinish: true,
  swapOnLanding: false,
  turnSeconds: 40,
  capacity: 6,
};

export const DEFAULT_RULES: Rules = { ...TRADITIONAL_RULES };

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const maze = Number(next.mazeBack);
  return {
    openingNines: Boolean(next.openingNines),
    innTurns: Math.min(3, Math.max(1, Math.floor(Number(next.innTurns) || 2))),
    mazeBack: maze === 30 ? 30 : 39,
    deathTo: Number(next.deathTo) === 1 ? 1 : 0,
    wellFreesAll: Boolean(next.wellFreesAll),
    exactFinish: Boolean(next.exactFinish),
    swapOnLanding: Boolean(next.swapOnLanding),
    turnSeconds: Math.min(180, Math.max(10, Math.floor(Number(next.turnSeconds) || 40))),
    capacity: Math.min(6, Math.max(2, Math.floor(Number(next.capacity) || 6))),
  };
}

/** Named for the UI so the table always knows which rule set is running. */
export type Variant = 'traditional' | 'house';

export function variantOf(rules: Rules): Variant {
  const keys: (keyof Rules)[] = [
    'openingNines',
    'innTurns',
    'mazeBack',
    'deathTo',
    'wellFreesAll',
    'exactFinish',
    'swapOnLanding',
  ];
  return keys.every((key) => rules[key] === TRADITIONAL_RULES[key]) ? 'traditional' : 'house';
}

/** One leg of a move, so the client can walk the pawn square by square. */
export interface Hop {
  from: number;
  to: number;
  why: 'roll' | 'opening' | 'bounce' | 'goose' | 'bridge' | 'maze' | 'death' | 'swap';
}

/** Everything the punishment window needs to explain itself. */
export interface Punishment {
  /** The square that fired, by number. */
  square: number;
  kind: SquareKind;
  /** Where the pawn ended up afterwards. */
  landsOn: number;
  /** Turns lost, for the inn. */
  turns?: number;
  /** Who is already sitting in this well or prison, if anybody. */
  company?: string[];
}

export interface Rescue {
  square: number;
  /** Names freed by the arrival. */
  freed: string[];
  /** Name of the player who took their place. */
  by: string;
}

/** The complete story of one turn, replayed by every client. */
export interface TurnReport {
  id: number;
  playerId: string;
  playerName: string;
  dice: [number, number];
  total: number;
  hops: Hop[];
  from: number;
  final: number;
  /** How many extra flights the geese granted. */
  gooseHops: number;
  bounced: boolean;
  punishment: Punishment | null;
  rescue: Rescue | null;
  /** House rule: whoever was standing on the landing square and got sent back. */
  swap: { playerId: string; name: string; to: number } | null;
  /** Resolved by the turn clock instead of by the player. */
  auto: boolean;
  win: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** 0 is the nest outside the board. */
  pos: number;
  /** Held by the well or the prison until somebody arrives. */
  stuck: boolean;
  /** Turns still owed to the inn. */
  skips: number;
  /** Squares travelled this game, for the little stat line. */
  rolls: number;
  finished: boolean;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'gold';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  variant: Variant;
  players: PlayerView[];
  activeId: string | null;
  /** Turn number, counted from the first roll of the game. */
  round: number;
  turnEndsAt: number | null;
  now: number;
  winnerId: string | null;
  /** The last resolved turn — drives animation, the punishment window and the ticker. */
  lastTurn: TurnReport | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'preset'; name: 'traditional' }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'roll' }
  | { t: 'again' };

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string };
