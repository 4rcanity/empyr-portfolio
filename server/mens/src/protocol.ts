/**
 * Wire format shared by the EMPYR MENS worker and its browser client.
 *
 * Board model
 * -----------
 * The cross is the boundary of a plus-shaped 11x11 grid: exactly 40 shared
 * squares. The 17 interior cells are the four private home columns of four
 * squares each, plus the decorative centre.
 *
 * A pawn's position is stored as progress along *its owner's* lap:
 *   -1        in the yard
 *   0 .. 39   on the shared ring; absolute square = (start + pos) % 40
 *   40 .. 43  in the home column, 43 being the square nearest the centre
 */

export const RING = 40;
export const HOME_DEPTH = 4;
export const PAWNS = 4;
/** First home-column position. */
export const HOME_FIRST = RING;
/** Last home-column position — a pawn here is as deep as it goes. */
export const HOME_LAST = RING + HOME_DEPTH - 1;

export type Color = 'red' | 'yellow' | 'green' | 'blue';
/** Corner index 0..3, clockwise from the top-left yard. */
export const CORNER_COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];

/** Ring square each corner's lap begins on. */
export const START_SQUARE = [0, 10, 20, 30];

/** Absolute ring square for a lap position. */
export function ringSquare(corner: number, pos: number): number {
  return (START_SQUARE[corner] + pos) % RING;
}

/**
 * Which corners are in play for a given headcount. Two players sit opposite
 * each other; three leave one arm deliberately closed.
 */
export function cornersFor(count: number): number[] {
  if (count <= 2) return [0, 2];
  if (count === 3) return [0, 1, 2];
  return [0, 1, 2, 3];
}

export type Phase = 'lobby' | 'play' | 'over';
/** Whether the active player owes us a die roll or a choice of pawn. */
export type TurnState = 'roll' | 'move';

/** How many consecutive sixes a player may roll before the extra roll is lost. */
export type SixLimit = 2 | 3 | 0;
export const SIX_LIMITS: SixLimit[] = [2, 3, 0];
/** Hard ceiling so an "unlimited" table can never loop forever. */
export const SIX_CEILING = 10;

export interface Rules {
  /** Consecutive sixes allowed. 0 means unlimited (capped at SIX_CEILING). */
  sixLimit: SixLimit;
  /** A pawn parked on its own start square cannot be passed or captured. */
  blockOnStart: boolean;
  /** If any legal move captures, the non-capturing options become illegal. */
  mustCapture: boolean;
  /** With every pawn still in the yard you get this many tries for a six. */
  yardTries: number;
  /** Play the move for the player when the roll leaves exactly one option. */
  autoSingle: boolean;
  turnSeconds: number;
  capacity: number;
}

export const DEFAULT_RULES: Rules = {
  sixLimit: 3,
  blockOnStart: true,
  mustCapture: false,
  yardTries: 3,
  autoSingle: true,
  turnSeconds: 45,
  capacity: 4,
};

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const sixLimit = SIX_LIMITS.includes(next.sixLimit as SixLimit)
    ? (next.sixLimit as SixLimit)
    : DEFAULT_RULES.sixLimit;
  return {
    sixLimit,
    blockOnStart: Boolean(next.blockOnStart),
    mustCapture: Boolean(next.mustCapture),
    yardTries: Math.min(3, Math.max(1, Math.floor(Number(next.yardTries) || 3))),
    autoSingle: Boolean(next.autoSingle),
    turnSeconds: Math.min(180, Math.max(15, Math.floor(Number(next.turnSeconds) || 45))),
    capacity: Math.min(4, Math.max(2, Math.floor(Number(next.capacity) || 4))),
  };
}

/** Why a move is interesting, used for both copy and effects. */
export type MoveKind = 'enter' | 'ring' | 'home' | 'finish';

export interface MoveOption {
  /** Index into the owner's pawn array. */
  pawn: number;
  from: number;
  to: number;
  kind: MoveKind;
  /** The pawn this move would boot back to its yard, if any. */
  capture: { playerId: string; pawn: number } | null;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  /** Board corner, or -1 while sitting in the lobby before the deal. */
  corner: number;
  color: Color;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Lap position of each of the four pawns. */
  pawns: number[];
  /** Pawns safely inside the home column. */
  home: number;
  /** Pawns still waiting in the yard. */
  yard: number;
  /** Opponent pawns this player has sent home. */
  hits: number;
  /** Own pawns sent home by opponents. */
  hurt: number;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'wild';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  players: PlayerView[];
  /** Corners actually in play this game. */
  corners: number[];
  activeId: string | null;
  turnState: TurnState;
  /** The die as it currently reads, or null before the first roll of a turn. */
  dice: number | null;
  /** Legal moves for the active player. Empty unless turnState is 'move'. */
  options: MoveOption[];
  /** Consecutive sixes the active player has rolled this turn. */
  sixes: number;
  /** Tries left to roll a six with every pawn still in the yard. */
  triesLeft: number;
  turnEndsAt: number | null;
  now: number;
  winnerId: string | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'roll' }
  | { t: 'move'; pawn: number; to: number }
  | { t: 'again' };

export type FxKind =
  | 'roll'
  | 'six'
  | 'enter'
  | 'hop'
  | 'capture'
  | 'homed'
  | 'blocked'
  | 'stuck'
  | 'timeout'
  | 'win';

export interface Fx {
  t: 'fx';
  kind: FxKind;
  /** Whose pawn / whose turn this belongs to. */
  playerId?: string;
  pawn?: number;
  from?: number;
  to?: number;
  dice?: number;
  /** The pawn sent back to its yard by a capture. */
  victimId?: string;
  victimPawn?: number;
  text?: string;
}

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string }
  | Fx;
