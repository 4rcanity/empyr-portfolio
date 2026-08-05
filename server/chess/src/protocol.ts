/** Wire format shared by the Empyr Gambit chess worker and its browser client. */

import { START_FEN, type Color, type Termination } from './engine';

export type { Color, Termination };

/** A seated colour, or `null` for a spectator. */
export type Seat = Color | null;

export type Phase = 'lobby' | 'play' | 'over';

export type Preset = 'bullet1' | 'bullet2' | 'blitz3' | 'blitz5' | 'rapid10' | 'rapid15' | 'custom';

export const PRESETS: Array<{ id: Preset; minutes: number; increment: number }> = [
  { id: 'bullet1', minutes: 1, increment: 0 },
  { id: 'bullet2', minutes: 2, increment: 1 },
  { id: 'blitz3', minutes: 3, increment: 2 },
  { id: 'blitz5', minutes: 5, increment: 0 },
  { id: 'rapid10', minutes: 10, increment: 0 },
  { id: 'rapid15', minutes: 15, increment: 10 },
];

export interface Rules {
  preset: Preset;
  /** Base thinking time per side. */
  minutes: number;
  /** Seconds added after each move (Fischer increment). */
  increment: number;
  /** Opening position. Anything other than the standard start is a setup game. */
  startFen: string;
}

export const DEFAULT_RULES: Rules = {
  preset: 'blitz5',
  minutes: 5,
  increment: 0,
  startFen: START_FEN,
};

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const preset: Preset =
    next.preset === 'custom' || PRESETS.some((p) => p.id === next.preset) ? next.preset : 'blitz5';

  // A named preset owns its own numbers; only "custom" reads the sliders. Custom
  // minutes keep one decimal so the test harness can run six-second clocks.
  const named = PRESETS.find((p) => p.id === preset);
  const minutes = named
    ? named.minutes
    : Math.min(180, Math.max(0.1, Math.round((Number(next.minutes) || 5) * 10) / 10));
  const increment = named
    ? named.increment
    : Math.min(120, Math.max(0, Math.round(Number(next.increment) || 0)));

  return {
    preset,
    minutes,
    increment,
    startFen: typeof next.startFen === 'string' && next.startFen.trim() ? next.startFen.trim() : START_FEN,
  };
}

/** PGN wants the base in seconds. */
export function timeControlLabel(rules: Rules): string {
  return `${Math.round(rules.minutes * 60)}+${rules.increment}`;
}

/** What a player would call it: `5+0`. */
export function humanTimeLabel(rules: Rules): string {
  return `${rules.minutes}+${rules.increment}`;
}

export interface PlayerView {
  id: string;
  name: string;
  /** `w`, `b`, or null while spectating. */
  seat: Seat;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Clock remaining in milliseconds, already net of the current think. */
  msLeft: number;
}

export interface HistoryEntry {
  /** Ply number, 1-based. */
  ply: number;
  san: string;
  /** Position *after* the move. */
  fen: string;
  from: number;
  to: number;
  /** Piece letter of anything captured, for the material tray. */
  captured: string | null;
  /** Clock remaining for the mover once the move landed. */
  msLeft: number;
}

export interface Result {
  /** Winning colour, or null for any kind of draw. */
  winner: Color | null;
  reason: Termination;
  /** PGN result token: 1-0, 0-1 or 1/2-1/2. */
  score: string;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'sharp';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  players: PlayerView[];
  spectators: number;
  /** Live position. */
  fen: string;
  turn: Color;
  /** Half-move counter towards the fifty-move rule. */
  halfmove: number;
  /** Square of the king in check, or -1. */
  checkSquare: number;
  lastMove: { from: number; to: number } | null;
  /** Legal moves for the viewer, keyed by origin square. Empty unless it is their turn. */
  legal: Record<number, number[]>;
  /** Origin squares whose move lands a promotion, so the client can ask. */
  promoFrom: number[];
  history: HistoryEntry[];
  /** Position the game started from. */
  startFen: string;
  /** Server clock reference so the client can tick without drifting. */
  now: number;
  /** When the running clock would flag, or null while the clock is parked. */
  turnEndsAt: number | null;
  /** Colour whose clock is ticking, or null when nothing is running. */
  ticking: Color | null;
  result: Result | null;
  /** Colour with a draw offer standing. */
  drawOfferBy: Color | null;
  /** Draws either side may claim right now. */
  claimable: { threefold: boolean; fifty: boolean };
  /** Times the live position has appeared. */
  repeats: number;
  pgn: string | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string; as?: 'play' | 'watch' }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'ready'; on: boolean }
  | { t: 'sit' }
  | { t: 'watch' }
  | { t: 'swap' }
  | { t: 'begin' }
  | { t: 'move'; from: number; to: number; promo?: string }
  | { t: 'resign' }
  | { t: 'offerDraw' }
  | { t: 'answerDraw'; accept: boolean }
  | { t: 'claimDraw'; kind: 'threefold' | 'fifty' }
  | { t: 'again' };

export type FxKind = 'move' | 'capture' | 'castle' | 'check' | 'promote' | 'mate' | 'draw' | 'flag' | 'start';

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string; seat: Seat }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; text?: string };
