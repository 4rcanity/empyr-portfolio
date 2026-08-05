/**
 * Client-side mirror of the EMPYR MENS wire format, plus the board geometry the
 * renderer needs. The server owns every rule — nothing here decides legality.
 */

export const RING = 40;
export const HOME_DEPTH = 4;
export const PAWNS = 4;
export const HOME_FIRST = RING;
export const HOME_LAST = RING + HOME_DEPTH - 1;
/** The board is the boundary of a plus shape on an 11x11 grid. */
export const GRID = 11;

export type Color = 'red' | 'yellow' | 'green' | 'blue';
export const CORNER_COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
export const START_SQUARE = [0, 10, 20, 30];

export type Phase = 'lobby' | 'play' | 'over';
export type TurnState = 'roll' | 'move';
export type SixLimit = 2 | 3 | 0;
export const SIX_LIMITS: SixLimit[] = [2, 3, 0];

export interface Rules {
  sixLimit: SixLimit;
  blockOnStart: boolean;
  mustCapture: boolean;
  yardTries: number;
  autoSingle: boolean;
  turnSeconds: number;
  capacity: number;
}

export type MoveKind = 'enter' | 'ring' | 'home' | 'finish';

export interface MoveOption {
  pawn: number;
  from: number;
  to: number;
  kind: MoveKind;
  capture: { playerId: string; pawn: number } | null;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  corner: number;
  color: Color;
  host: boolean;
  ready: boolean;
  online: boolean;
  pawns: number[];
  home: number;
  yard: number;
  hits: number;
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
  corners: number[];
  activeId: string | null;
  turnState: TurnState;
  dice: number | null;
  options: MoveOption[];
  sixes: number;
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
  playerId?: string;
  pawn?: number;
  from?: number;
  to?: number;
  dice?: number;
  victimId?: string;
  victimPawn?: number;
  text?: string;
}

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string }
  | Fx;

/* ------------------------------------------------------------------ geometry */

export interface Cell {
  /** Grid column and row, 0-based, of the square's top-left corner. */
  x: number;
  y: number;
}

/** The 40 shared squares, clockwise, starting on red's start square. */
export const RING_CELLS: Cell[] = [
  { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
  { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
  { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 },
  { x: 10, y: 5 },
  { x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 6 }, { x: 7, y: 6 }, { x: 6, y: 6 },
  { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 }, { x: 6, y: 10 },
  { x: 5, y: 10 },
  { x: 4, y: 10 }, { x: 4, y: 9 }, { x: 4, y: 8 }, { x: 4, y: 7 }, { x: 4, y: 6 },
  { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 },
  { x: 0, y: 5 },
];

/** Private home columns, outer square first, deepest square last. */
export const HOME_CELLS: Cell[][] = [
  [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }],
  [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }],
  [{ x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }, { x: 6, y: 5 }],
  [{ x: 5, y: 9 }, { x: 5, y: 8 }, { x: 5, y: 7 }, { x: 5, y: 6 }],
];

/** Four resting spots per yard, tucked into the matching corner. */
export const YARD_CELLS: Cell[][] = [
  [{ x: 0.4, y: 0.4 }, { x: 2.1, y: 0.4 }, { x: 0.4, y: 2.1 }, { x: 2.1, y: 2.1 }],
  [{ x: 7.9, y: 0.4 }, { x: 9.6, y: 0.4 }, { x: 7.9, y: 2.1 }, { x: 9.6, y: 2.1 }],
  [{ x: 7.9, y: 7.9 }, { x: 9.6, y: 7.9 }, { x: 7.9, y: 9.6 }, { x: 9.6, y: 9.6 }],
  [{ x: 0.4, y: 7.9 }, { x: 2.1, y: 7.9 }, { x: 0.4, y: 9.6 }, { x: 2.1, y: 9.6 }],
];

/** Top-left corner and size, in cells, of each yard plate. */
export const YARD_PLATE = 3.5;
export const YARD_ORIGIN: Cell[] = [
  { x: 0, y: 0 },
  { x: 7.5, y: 0 },
  { x: 7.5, y: 7.5 },
  { x: 0, y: 7.5 },
];

export function ringSquare(corner: number, pos: number): number {
  return (START_SQUARE[corner] + pos) % RING;
}

/** Grid cell for a lap position. Yard positions need the pawn index too. */
export function cellFor(corner: number, pos: number, pawn: number): Cell {
  if (pos < 0) return YARD_CELLS[corner][pawn] ?? YARD_CELLS[corner][0];
  if (pos >= RING) return HOME_CELLS[corner][pos - RING] ?? HOME_CELLS[corner][0];
  return RING_CELLS[ringSquare(corner, pos)];
}

/**
 * Every lap position a pawn touches on its way, so the client can walk it
 * square by square instead of teleporting.
 */
export function pathFor(from: number, to: number): number[] {
  if (from < 0) return [0];
  const steps: number[] = [];
  for (let pos = from + 1; pos <= to; pos++) steps.push(pos);
  return steps.length > 0 ? steps : [to];
}

export function cornersFor(count: number): number[] {
  if (count <= 2) return [0, 2];
  if (count === 3) return [0, 1, 2];
  return [0, 1, 2, 3];
}

/** Which corner each ring square belongs to for its background tint, or -1. */
export function ringOwner(square: number): number {
  const corner = START_SQUARE.indexOf(square);
  if (corner >= 0) return corner;
  // The square just before a start is that player's home entry tip.
  const tip = START_SQUARE.indexOf((square + 1) % RING);
  return tip >= 0 ? tip : -1;
}
