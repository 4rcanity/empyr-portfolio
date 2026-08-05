/** Wire format shared by the EMPYR WORDSEARCH worker and its browser client. */

/** Language the word bank is drawn from. Independent of the site's UI language. */
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
  /** Square grid edge length. */
  size: number;
  /** How many words the host asked for — the grid may hold fewer if it runs out of room. */
  words: number;
  /** Seconds on the round clock. */
  roundSeconds: number;
  category: Category;
  bank: Bank;
  rounds: number;
  capacity: number;
}

export const DEFAULT_RULES: Rules = {
  size: 13,
  words: 12,
  roundSeconds: 180,
  category: 'mixed',
  bank: 'en',
  rounds: 3,
  capacity: 6,
};

export const MIN_SIZE = 10;
export const MAX_SIZE = 20;

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.floor(Number(next.size) || DEFAULT_RULES.size)));
  return {
    size,
    // A 10x10 grid cannot swallow 20 long words, so the ceiling scales with area.
    words: Math.min(wordCeiling(size), Math.max(4, Math.floor(Number(next.words) || DEFAULT_RULES.words))),
    roundSeconds: Math.min(600, Math.max(20, Math.floor(Number(next.roundSeconds) || DEFAULT_RULES.roundSeconds))),
    category: CATEGORIES.includes(next.category) ? next.category : 'mixed',
    bank: BANKS.includes(next.bank) ? next.bank : 'en',
    rounds: Math.min(9, Math.max(1, Math.floor(Number(next.rounds) || DEFAULT_RULES.rounds))),
    capacity: Math.min(8, Math.max(2, Math.floor(Number(next.capacity) || DEFAULT_RULES.capacity))),
  };
}

/** Most words a grid of this size can comfortably hold. */
export function wordCeiling(size: number): number {
  return Math.min(24, Math.max(6, Math.floor((size * size) / 12)));
}

/** One of the eight tracing directions, as a row/column step. */
export interface Step {
  dr: -1 | 0 | 1;
  dc: -1 | 0 | 1;
}

export const DIRECTIONS: Step[] = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 },
];

/** A word as the players see it: never carries its coordinates until it is claimed. */
export interface WordView {
  /** Index into the round's word list — the id used by claims and the log. */
  i: number;
  word: string;
  /** Seat id of whoever traced it first, or null while it is still open. */
  by: string | null;
  /** Points awarded for the claim. */
  points: number;
  /** Cells of the winning trace, revealed only once claimed. */
  path: number[] | null;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Running total across every round. */
  score: number;
  /** Points scored in the round on screen. */
  round: number;
  /** Words claimed this round. */
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
  /** Row-major grid letters, `size * size` of them. Empty outside a round. */
  cells: string;
  words: WordView[];
  /** Seed the grid was generated from, so a bad grid can be reproduced. */
  seed: number;
  round: number;
  roundEndsAt: number | null;
  /** When the results screen rolls into the next round. */
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
  /** Trace from one cell to another. Coordinates, never a word. */
  | { t: 'claim'; r1: number; c1: number; r2: number; c2: number }
  | { t: 'next' }
  | { t: 'again' };

export type FxKind = 'claim' | 'steal' | 'miss' | 'round' | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; playerId?: string; text?: string; word?: string };

/**
 * Points for a claim: length pays the base, the clock pays the bonus. Finding
 * a seven-letter word in the first seconds is worth roughly double the same
 * word found as the clock runs out.
 */
export function claimScore(length: number, msLeft: number, totalMs: number): number {
  const base = length * 10;
  const left = totalMs > 0 ? Math.min(1, Math.max(0, msLeft / totalMs)) : 0;
  return base + Math.round(base * left);
}
