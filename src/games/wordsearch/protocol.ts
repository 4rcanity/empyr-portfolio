/**
 * Browser-side mirror of `server/wordsearch/src/protocol.ts`. Kept as a copy
 * rather than an import so the Astro build never reaches into the worker.
 */

export type Bank = 'en' | 'nl';
export const BANKS: Bank[] = ['en', 'nl'];

export type Category =
  | 'mixed'
  | 'animals'
  | 'food'
  | 'countries'
  | 'sport'
  | 'nature'
  | 'house'
  | 'travel'
  | 'tech';

export const CATEGORIES: Category[] = [
  'mixed',
  'animals',
  'food',
  'countries',
  'sport',
  'nature',
  'house',
  'travel',
  'tech',
];

export type Phase = 'lobby' | 'play' | 'roundOver' | 'over';

export interface Rules {
  size: number;
  words: number;
  roundSeconds: number;
  category: Category;
  bank: Bank;
  rounds: number;
  capacity: number;
}

export const MIN_SIZE = 10;
export const MAX_SIZE = 20;

export const SIZES = [10, 12, 13, 14, 16, 18, 20];
export const ROUND_CLOCKS = [60, 120, 180, 240, 300];

/** Mirrors the server ceiling so the picker never offers an impossible count. */
export function wordCeiling(size: number): number {
  return Math.min(24, Math.max(6, Math.floor((size * size) / 12)));
}

export interface WordView {
  i: number;
  word: string;
  by: string | null;
  points: number;
  path: number[] | null;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  score: number;
  round: number;
  found: number;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'hot';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  players: PlayerView[];
  cells: string;
  words: WordView[];
  seed: number;
  round: number;
  roundEndsAt: number | null;
  nextAt: number | null;
  now: number;
  winnerId: string | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'claim'; r1: number; c1: number; r2: number; c2: number }
  | { t: 'next' }
  | { t: 'again' };

export type FxKind = 'claim' | 'steal' | 'miss' | 'round' | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; playerId?: string; text?: string; word?: string };

/* ------------------------------------------------------------- grid helpers */

export interface Cell {
  r: number;
  c: number;
}

/**
 * Pull a loose finger onto the nearest legal line from the anchor. Without this
 * a diagonal drag on a phone almost never lands on an exact diagonal.
 */
export function snap(anchor: Cell, loose: Cell, size: number): Cell {
  const dRow = loose.r - anchor.r;
  const dCol = loose.c - anchor.c;
  if (dRow === 0 && dCol === 0) return { ...anchor };

  const aRow = Math.abs(dRow);
  const aCol = Math.abs(dCol);
  if (aRow === 0 || aCol === 0 || aRow === aCol) return { ...loose };

  if (aRow > aCol * 2) return { r: loose.r, c: anchor.c };
  if (aCol > aRow * 2) return { r: anchor.r, c: loose.c };

  const reach = Math.min(
    Math.round((aRow + aCol) / 2),
    Math.abs(dRow > 0 ? size - 1 - anchor.r : anchor.r),
    Math.abs(dCol > 0 ? size - 1 - anchor.c : anchor.c),
  );
  return { r: anchor.r + Math.sign(dRow) * reach, c: anchor.c + Math.sign(dCol) * reach };
}

/** Cell indices along a straight trace, or an empty list if it is not straight. */
export function pathBetween(from: Cell, to: Cell, size: number): number[] {
  const dRow = to.r - from.r;
  const dCol = to.c - from.c;
  if (!(dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol))) return [];

  const length = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
  const dr = Math.sign(dRow);
  const dc = Math.sign(dCol);
  const path: number[] = [];
  for (let i = 0; i < length; i++) {
    path.push((from.r + dr * i) * size + (from.c + dc * i));
  }
  return path;
}

/** Highlighter colours, handed out by seat order. */
export const HIGHLIGHTERS = [
  '#f2c53d',
  '#59c2d6',
  '#ef7fa6',
  '#8fc44f',
  '#f08a3c',
  '#9d8ae0',
  '#4fb994',
  '#e0645c',
];

export function inkFor(seat: number): string {
  return HIGHLIGHTERS[seat % HIGHLIGHTERS.length];
}
