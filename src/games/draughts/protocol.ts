/**
 * Wire format shared by the DAMCAFÉ worker and its browser client.
 *
 * The game is international draughts (Dutch *dammen*): 10x10 board, 20 men a
 * side, played on the dark squares, numbered 1-50 from black's back row.
 */

export type Side = 'w' | 'b';

/** One playable square. Men are 1/3, kings 2/4. */
export const EMPTY = 0;
export const W_MAN = 1;
export const W_KING = 2;
export const B_MAN = 3;
export const B_KING = 4;
export type Cell = 0 | 1 | 2 | 3 | 4;

export const SQUARES = 50;

/** Board as a 50-character string of cell digits, square 1 first. */
export type BoardCode = string;

export function encodeBoard(board: Cell[]): BoardCode {
  let out = '';
  for (let i = 0; i < SQUARES; i++) out += String(board[i] ?? 0);
  return out;
}

export function decodeBoard(code: BoardCode): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < SQUARES; i++) {
    const digit = Number(code[i] ?? '0');
    out.push((digit >= 0 && digit <= 4 ? digit : 0) as Cell);
  }
  return out;
}

export function startBoard(): Cell[] {
  const board: Cell[] = new Array(SQUARES).fill(EMPTY) as Cell[];
  for (let sq = 1; sq <= 20; sq++) board[sq - 1] = B_MAN;
  for (let sq = 31; sq <= 50; sq++) board[sq - 1] = W_MAN;
  return board;
}

export function sideOf(cell: Cell): Side | null {
  if (cell === W_MAN || cell === W_KING) return 'w';
  if (cell === B_MAN || cell === B_KING) return 'b';
  return null;
}

export function isKing(cell: Cell): boolean {
  return cell === W_KING || cell === B_KING;
}

export function other(side: Side): Side {
  return side === 'w' ? 'b' : 'w';
}

/**
 * One fully-resolved legal move.
 *
 * `path` lists the squares the piece lands on in order, excluding `from`; for a
 * quiet move that is just `[to]`. `captures` is the set of squares whose pieces
 * come off the board — removed only once the whole sequence is finished.
 */
export interface MoveOption {
  from: number;
  to: number;
  /** Sorted ascending, so two orderings of the same haul compare equal. */
  captures: number[];
  path: number[];
  /** True only when a man *finishes* on its promotion row. */
  promote: boolean;
}

export function moveKey(move: MoveOption): string {
  return `${move.from}:${move.path.join('.')}`;
}

/** Standard draughts notation: `32-28` quiet, `32x23` capture. */
export function notation(move: MoveOption): string {
  return `${move.from}${move.captures.length > 0 ? '\u00d7' : '-'}${move.to}`;
}

export type Phase = 'lobby' | 'play' | 'over';

export interface Rules {
  /** Server-owned chess clock. Off means no time pressure at all. */
  clock: boolean;
  /** Starting time per player, in minutes. */
  minutes: number;
  /** Fischer increment added after every move, in seconds. */
  increment: number;
}

export const DEFAULT_RULES: Rules = { clock: true, minutes: 10, increment: 5 };

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  return {
    clock: Boolean(next.clock),
    minutes: Math.min(90, Math.max(1, Math.floor(Number(next.minutes) || 10))),
    increment: Math.min(60, Math.max(0, Math.floor(Number(next.increment) || 0))),
  };
}

export interface PlayerView {
  id: string;
  name: string;
  /** `null` while sitting in the stands. */
  side: Side | null;
  host: boolean;
  ready: boolean;
  online: boolean;
  wins: number;
}

export interface HistoryEntry {
  /** Ply index, 0-based. */
  ply: number;
  side: Side;
  from: number;
  to: number;
  captures: number[];
  path: number[];
  promote: boolean;
  /** Board after the move, so the client can scrub without replaying. */
  after: BoardCode;
}

export type EndReason =
  | 'captured'
  | 'blocked'
  | 'resign'
  | 'time'
  | 'agreement'
  | 'repetition'
  | 'kingIdle'
  | 'endgame16'
  | 'endgame5';

export interface Result {
  /** `null` is a draw. */
  winner: Side | null;
  reason: EndReason;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'warm';
  args?: Record<string, string | number>;
}

/** The draw counters, surfaced so players can see a draw coming. */
export interface Counters {
  /** Plies of king-only, capture-free play. 50 is a draw. */
  kingIdle: number;
  /** Active reduced-material count-down, if any. */
  endgame: { kind: 'k16' | 'k5'; plies: number; limit: number } | null;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  players: PlayerView[];
  spectators: number;
  /** Live board, or the reviewed board is rebuilt client-side from `history`. */
  board: BoardCode;
  /** Board before the first move of this game. */
  opening: BoardCode;
  turn: Side;
  /** Every legal move for `turn`, one entry per distinct route. */
  options: MoveOption[];
  /** True when at least one capture exists, so quiet moves are illegal. */
  mustCapture: boolean;
  history: HistoryEntry[];
  clock: { w: number; b: number } | null;
  turnEndsAt: number | null;
  now: number;
  result: Result | null;
  drawOfferFrom: Side | null;
  counters: Counters;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string; spectate?: boolean }
  | { t: 'sit'; side: Side }
  | { t: 'stand' }
  | { t: 'ready'; on: boolean }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'begin' }
  /** Host-only lobby position loader, PDN FEN style: `W:WK35,31:B12,K19`. */
  | { t: 'setup'; fen: string }
  | { t: 'move'; from: number; to: number; path?: number[] }
  | { t: 'resign' }
  | { t: 'offerDraw' }
  | { t: 'answerDraw'; accept: boolean }
  | { t: 'again' };

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string; you: Side | null }
  | { t: 'nope'; msg: string };
