/**
 * International draughts rules engine. No dependencies, no state — every
 * function takes a board and gives back a fresh answer.
 *
 * Geometry: squares 1-50 run left-to-right, top-to-bottom over the dark squares
 * of a 10x10 board. Row 0 (squares 1-5) is black's back row; row 9 (46-50) is
 * white's. White moves towards row 0, black towards row 9.
 */

import {
  B_KING,
  B_MAN,
  EMPTY,
  SQUARES,
  W_KING,
  W_MAN,
  isKing,
  other,
  sideOf,
  type Cell,
  type MoveOption,
  type Side,
} from './protocol.ts';

/* ----------------------------------------------------------------- geometry */

export const ROW: number[] = [];
export const COL: number[] = [];

for (let sq = 1; sq <= SQUARES; sq++) {
  const index = sq - 1;
  const row = Math.floor(index / 5);
  const file = index % 5;
  ROW[sq] = row;
  // Even rows carry their dark squares on the odd columns, odd rows the reverse.
  COL[sq] = file * 2 + (row % 2 === 0 ? 1 : 0);
}

const AT: number[][] = [];
for (let row = 0; row < 10; row++) {
  AT[row] = new Array(10).fill(0);
}
for (let sq = 1; sq <= SQUARES; sq++) AT[ROW[sq]][COL[sq]] = sq;

/** Diagonal steps, in the order up-left, up-right, down-left, down-right. */
const STEPS: Array<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * `RAYS[square][direction]` is every square along that diagonal, nearest first.
 * Built once so move generation never touches row/column arithmetic again.
 */
export const RAYS: number[][][] = [];
for (let sq = 1; sq <= SQUARES; sq++) {
  RAYS[sq] = STEPS.map(([dr, dc]) => {
    const ray: number[] = [];
    let row = ROW[sq] + dr;
    let col = COL[sq] + dc;
    while (row >= 0 && row < 10 && col >= 0 && col < 10) {
      ray.push(AT[row][col]);
      row += dr;
      col += dc;
    }
    return ray;
  });
}

/** Directions a man of this side may move and land in, quietly. */
const FORWARD: Record<Side, number[]> = { w: [0, 1], b: [2, 3] };

export function promotionRow(side: Side): number {
  return side === 'w' ? 0 : 9;
}

export function isPromoting(square: number, side: Side): boolean {
  return ROW[square] === promotionRow(side);
}

export function squareName(square: number): string {
  return String(square);
}

/* ----------------------------------------------------------- move generation */

interface Hop {
  victim: number;
  land: number;
}

/**
 * Captures available to a man standing on `at`. A man captures in all four
 * directions, forwards and backwards.
 */
function manHops(board: Cell[], side: Side, at: number, taken: number[]): Hop[] {
  const hops: Hop[] = [];
  const enemy = other(side);
  for (let dir = 0; dir < 4; dir++) {
    const ray = RAYS[at][dir];
    if (ray.length < 2) continue;
    const victim = ray[0];
    const land = ray[1];
    if (sideOf(board[victim - 1]) !== enemy) continue;
    // Already jumped this game piece in this sequence — it is now a wall.
    if (taken.indexOf(victim) !== -1) continue;
    if (board[land - 1] !== EMPTY) continue;
    hops.push({ victim, land });
  }
  return hops;
}

/**
 * Captures available to a flying king: any number of empty squares before the
 * victim, any number of empty squares after it, each landing square its own
 * option. Anything non-empty blocks the scan — including pieces captured
 * earlier in this same sequence, which stay put until the move is finished.
 */
function kingHops(board: Cell[], side: Side, at: number, taken: number[]): Hop[] {
  const hops: Hop[] = [];
  const enemy = other(side);
  for (let dir = 0; dir < 4; dir++) {
    const ray = RAYS[at][dir];
    let i = 0;
    while (i < ray.length && board[ray[i] - 1] === EMPTY) i++;
    if (i >= ray.length) continue;
    const victim = ray[i];
    if (sideOf(board[victim - 1]) !== enemy) continue;
    if (taken.indexOf(victim) !== -1) continue;
    for (let j = i + 1; j < ray.length && board[ray[j] - 1] === EMPTY; j++) {
      hops.push({ victim, land: ray[j] });
    }
  }
  return hops;
}

/**
 * Walk every capture continuation from `at`, recording a move wherever the
 * chain runs dry. The moving piece is lifted off `board` by the caller, which is
 * what lets a sequence cross its own starting square — and any square it has
 * already flown over — more than once.
 */
function walk(
  board: Cell[],
  side: Side,
  king: boolean,
  from: number,
  at: number,
  taken: number[],
  path: number[],
  out: MoveOption[],
): void {
  const hops = king ? kingHops(board, side, at, taken) : manHops(board, side, at, taken);
  if (hops.length === 0) {
    if (taken.length > 0) {
      out.push({
        from,
        to: at,
        captures: [...taken].sort((a, b) => a - b),
        path: [...path],
        // A man promotes only because the sequence *ended* here.
        promote: !king && isPromoting(at, side),
      });
    }
    return;
  }
  for (const hop of hops) {
    taken.push(hop.victim);
    path.push(hop.land);
    walk(board, side, king, from, hop.land, taken, path, out);
    path.pop();
    taken.pop();
  }
}

/** Every capture sequence for `side`, before the maximum rule is applied. */
export function captureMoves(board: Cell[], side: Side): MoveOption[] {
  const out: MoveOption[] = [];
  const work = board.slice();
  for (let sq = 1; sq <= SQUARES; sq++) {
    const cell = work[sq - 1];
    if (sideOf(cell) !== side) continue;
    work[sq - 1] = EMPTY;
    walk(work, side, isKing(cell), sq, sq, [], [], out);
    work[sq - 1] = cell;
  }
  return out;
}

/** Every non-capturing move for `side`. */
export function quietMoves(board: Cell[], side: Side): MoveOption[] {
  const out: MoveOption[] = [];
  for (let sq = 1; sq <= SQUARES; sq++) {
    const cell = board[sq - 1];
    if (sideOf(cell) !== side) continue;
    if (isKing(cell)) {
      for (let dir = 0; dir < 4; dir++) {
        for (const land of RAYS[sq][dir]) {
          if (board[land - 1] !== EMPTY) break;
          out.push({ from: sq, to: land, captures: [], path: [land], promote: false });
        }
      }
    } else {
      for (const dir of FORWARD[side]) {
        const ray = RAYS[sq][dir];
        if (ray.length === 0) continue;
        const land = ray[0];
        if (board[land - 1] !== EMPTY) continue;
        out.push({
          from: sq,
          to: land,
          captures: [],
          path: [land],
          promote: isPromoting(land, side),
        });
      }
    }
  }
  return out;
}

/** Drop routes that are literally the same hop-for-hop. */
function dedupeRoutes(moves: MoveOption[]): MoveOption[] {
  const seen = new Set<string>();
  const out: MoveOption[] = [];
  for (const move of moves) {
    const key = `${move.from}:${move.path.join('.')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(move);
  }
  return out;
}

/**
 * The legal move list. Captures are compulsory, and among them only the
 * sequences taking the greatest number of pieces survive — every one of the
 * tied sequences is legal and the player picks.
 *
 * One entry per distinct *route*, so the client can offer a choice between two
 * ways round the same haul as well as between different landing squares.
 */
export function generate(board: Cell[], side: Side): MoveOption[] {
  const caps = captureMoves(board, side);
  if (caps.length > 0) {
    let best = 0;
    for (const move of caps) best = Math.max(best, move.captures.length);
    return dedupeRoutes(caps.filter((move) => move.captures.length === best));
  }
  return dedupeRoutes(quietMoves(board, side));
}

/**
 * Collapse routes to distinct *moves* in the FMJD sense: same origin, same
 * landing square and same set of captured pieces is one and the same move,
 * however you fly it. Used for perft and for the move list.
 */
export function distinctMoves(moves: MoveOption[]): MoveOption[] {
  const seen = new Set<string>();
  const out: MoveOption[] = [];
  for (const move of moves) {
    const key = `${move.from}>${move.to}|${move.captures.join('.')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(move);
  }
  return out;
}

/** Legal moves, one per distinct move rather than per route. */
export function legalMoves(board: Cell[], side: Side): MoveOption[] {
  return distinctMoves(generate(board, side));
}

/** Apply a move to a copy of the board. Captured pieces come off here, at the end. */
export function apply(board: Cell[], move: MoveOption): Cell[] {
  const next = board.slice();
  const cell = next[move.from - 1];
  next[move.from - 1] = EMPTY;
  for (const victim of move.captures) next[victim - 1] = EMPTY;
  const side = sideOf(cell);
  if (move.promote && side) {
    next[move.to - 1] = side === 'w' ? W_KING : B_KING;
  } else {
    next[move.to - 1] = cell;
  }
  return next;
}

/* ------------------------------------------------------------------- counting */

/** Node count at `depth`, counting distinct moves the way published perft does. */
export function perft(board: Cell[], side: Side, depth: number): number {
  const moves = legalMoves(board, side);
  if (depth <= 1) return moves.length;
  let total = 0;
  for (const move of moves) {
    total += perft(apply(board, move), other(side), depth - 1);
  }
  return total;
}

/* -------------------------------------------------------------------- material */

export interface Material {
  men: number;
  kings: number;
  total: number;
}

export function material(board: Cell[], side: Side): Material {
  let men = 0;
  let kings = 0;
  for (let i = 0; i < SQUARES; i++) {
    const cell = board[i];
    if (sideOf(cell) !== side) continue;
    if (isKing(cell)) kings++;
    else men++;
  }
  return { men, kings, total: men + kings };
}

/* ------------------------------------------------------------------- position */

/** `W:W31,K35:B12,K19` — PDN-style FEN, tolerant about whitespace and case. */
export function parseFen(fen: string): { board: Cell[]; turn: Side } {
  const clean = String(fen).replace(/\s+/g, '').replace(/^\[?FEN"?|"?\]?$/g, '');
  const parts = clean.split(':');
  const turn: Side = parts[0]?.toUpperCase().startsWith('B') ? 'b' : 'w';
  const board: Cell[] = new Array(SQUARES).fill(EMPTY) as Cell[];

  for (const group of parts.slice(1)) {
    if (!group) continue;
    const owner = group[0].toUpperCase();
    if (owner !== 'W' && owner !== 'B') continue;
    for (const token of group.slice(1).split(',')) {
      if (!token) continue;
      const king = token[0].toUpperCase() === 'K';
      const square = Number(king ? token.slice(1) : token);
      if (!Number.isInteger(square) || square < 1 || square > SQUARES) {
        throw new Error(`Bad square "${token}" in position`);
      }
      board[square - 1] = owner === 'W' ? (king ? W_KING : W_MAN) : king ? B_KING : B_MAN;
    }
  }
  return { board, turn };
}

export function toFen(board: Cell[], turn: Side): string {
  const white: string[] = [];
  const black: string[] = [];
  for (let sq = 1; sq <= SQUARES; sq++) {
    const cell = board[sq - 1];
    if (cell === W_MAN) white.push(String(sq));
    else if (cell === W_KING) white.push(`K${sq}`);
    else if (cell === B_MAN) black.push(String(sq));
    else if (cell === B_KING) black.push(`K${sq}`);
  }
  return `${turn.toUpperCase()}:W${white.join(',')}:B${black.join(',')}`;
}
