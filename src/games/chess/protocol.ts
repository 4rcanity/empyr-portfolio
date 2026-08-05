/** Wire format mirror of `server/chess/src/protocol.ts`. Keep the two in step. */

export type Color = 'w' | 'b';
export type Seat = Color | null;
export type Phase = 'lobby' | 'play' | 'over';

export type Termination =
  | 'checkmate'
  | 'stalemate'
  | 'fifty'
  | 'threefold'
  | 'fivefold'
  | 'seventyfive'
  | 'insufficient'
  | 'resign'
  | 'agreement'
  | 'flag'
  | 'flagInsufficient'
  | 'abandoned';

export type Preset = 'bullet1' | 'bullet2' | 'blitz3' | 'blitz5' | 'rapid10' | 'rapid15' | 'custom';

export const PRESETS: Array<{ id: Preset; minutes: number; increment: number }> = [
  { id: 'bullet1', minutes: 1, increment: 0 },
  { id: 'bullet2', minutes: 2, increment: 1 },
  { id: 'blitz3', minutes: 3, increment: 2 },
  { id: 'blitz5', minutes: 5, increment: 0 },
  { id: 'rapid10', minutes: 10, increment: 0 },
  { id: 'rapid15', minutes: 15, increment: 10 },
];

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface Rules {
  preset: Preset;
  minutes: number;
  increment: number;
  startFen: string;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: Seat;
  host: boolean;
  ready: boolean;
  online: boolean;
  msLeft: number;
}

export interface HistoryEntry {
  ply: number;
  san: string;
  fen: string;
  from: number;
  to: number;
  captured: string | null;
  msLeft: number;
}

export interface Result {
  winner: Color | null;
  reason: Termination;
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
  fen: string;
  turn: Color;
  halfmove: number;
  checkSquare: number;
  lastMove: { from: number; to: number } | null;
  legal: Record<number, number[]>;
  promoFrom: number[];
  history: HistoryEntry[];
  startFen: string;
  now: number;
  turnEndsAt: number | null;
  ticking: Color | null;
  result: Result | null;
  drawOfferBy: Color | null;
  claimable: { threefold: boolean; fifty: boolean };
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

export type FxKind =
  | 'move'
  | 'capture'
  | 'castle'
  | 'check'
  | 'promote'
  | 'mate'
  | 'draw'
  | 'flag'
  | 'start';

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string; seat: Seat }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; text?: string };

// ------------------------------------------------------------------- board

export type PieceLetter = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Placed {
  color: Color;
  type: PieceLetter;
}

/**
 * Read a FEN into 64 squares indexed a1 = 0 … h8 = 63, purely so the board can
 * be drawn. Legality never happens here — the server owns every rule.
 */
export function readFen(fen: string): Array<Placed | null> {
  const squares = new Array<Placed | null>(64).fill(null);
  const placement = fen.split(/\s+/)[0] ?? '';
  const rows = placement.split('/');
  for (let row = 0; row < rows.length && row < 8; row++) {
    const rank = 7 - row;
    let file = 0;
    for (const ch of rows[row]) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
        continue;
      }
      if (file > 7) break;
      const lower = ch.toLowerCase() as PieceLetter;
      if ('pnbrqk'.includes(lower)) {
        squares[rank * 8 + file] = { color: ch === lower ? 'b' : 'w', type: lower };
      }
      file++;
    }
  }
  return squares;
}

export function turnFromFen(fen: string): Color {
  return fen.split(/\s+/)[1] === 'b' ? 'b' : 'w';
}

export function squareName(index: number): string {
  return `${'abcdefgh'[index & 7]}${(index >> 3) + 1}`;
}

export const PIECE_VALUE: Record<PieceLetter, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
