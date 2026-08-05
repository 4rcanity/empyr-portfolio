/**
 * A complete, dependency-free chess engine.
 *
 * Board is a 64-entry array indexed `rank * 8 + file`, so a1 = 0 and h8 = 63.
 * Pieces are packed into a small integer: the low three bits carry the type and
 * bit 3 carries the colour, which keeps make/unmake cheap enough for perft.
 *
 * Everything here is pure: `applyMove` returns a fresh position rather than
 * mutating, apart from the internal fast path used by move legality checks.
 */

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;
/** Colour bit: set for black. */
export const BLACK_BIT = 8;

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

const TYPE_CHARS = ['', 'p', 'n', 'b', 'r', 'q', 'k'] as const;
const CHAR_TYPES: Record<string, number> = {
  p: PAWN,
  n: KNIGHT,
  b: BISHOP,
  r: ROOK,
  q: QUEEN,
  k: KING,
};

export function pieceType(piece: number): number {
  return piece & 7;
}

export function pieceColor(piece: number): Color {
  return (piece & BLACK_BIT) === 0 ? 'w' : 'b';
}

export function makePiece(type: number, color: Color): number {
  return color === 'w' ? type : type | BLACK_BIT;
}

export function typeChar(piece: number): PieceType {
  return TYPE_CHARS[pieceType(piece)] as PieceType;
}

/** `e4` style name for a board index. */
export function squareName(index: number): string {
  return `${'abcdefgh'[index & 7]}${(index >> 3) + 1}`;
}

/** Board index for an `e4` style name, or -1. */
export function squareIndex(name: string): number {
  if (!/^[a-h][1-8]$/.test(name)) return -1;
  return (Number(name[1]) - 1) * 8 + (name.charCodeAt(0) - 97);
}

export interface Position {
  board: number[];
  turn: Color;
  /** Bit field of CASTLE_* flags. */
  castling: number;
  /** En-passant target square index, or -1. */
  ep: number;
  /** Halfmove clock for the fifty-move rule. */
  half: number;
  full: number;
}

export interface Move {
  from: number;
  to: number;
  /** Promotion choice, when the move lands a pawn on the last rank. */
  promo?: PieceType;
  /** Piece captured, 0 for a quiet move. Filled in by the generator. */
  captured?: number;
  /** True when this is an en-passant capture. */
  ep?: boolean;
  /** `k` or `q` when this is a castling move. */
  castle?: 'k' | 'q';
}

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

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// -------------------------------------------------------------------- geometry

const KNIGHT_STEPS: Array<[number, number]> = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const BISHOP_DIRS: Array<[number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
const ROOK_DIRS: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const KING_STEPS: Array<[number, number]> = [...BISHOP_DIRS, ...ROOK_DIRS];

function fileOf(index: number): number {
  return index & 7;
}

function rankOf(index: number): number {
  return index >> 3;
}

function offset(index: number, df: number, dr: number): number {
  const file = fileOf(index) + df;
  const rank = rankOf(index) + dr;
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return -1;
  return rank * 8 + file;
}

// ------------------------------------------------------------------------- FEN

export function emptyPosition(): Position {
  return { board: new Array<number>(64).fill(EMPTY), turn: 'w', castling: 0, ep: -1, half: 0, full: 1 };
}

export function clonePosition(pos: Position): Position {
  return { ...pos, board: pos.board.slice() };
}

export function parseFen(fen: string): Position {
  const parts = String(fen ?? '').trim().split(/\s+/);
  if (parts.length < 4) throw new Error('FEN needs at least four fields');
  const [placement, turn, castling, ep] = parts;

  const pos = emptyPosition();
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error('FEN placement needs eight ranks');

  for (let row = 0; row < 8; row++) {
    // FEN starts at rank 8, our index 0 is rank 1.
    const rank = 7 - row;
    let file = 0;
    for (const ch of rows[row]) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const type = CHAR_TYPES[ch.toLowerCase()];
      if (!type) throw new Error(`FEN has an unknown piece "${ch}"`);
      if (file > 7) throw new Error('FEN rank overflows');
      pos.board[rank * 8 + file] = makePiece(type, ch === ch.toLowerCase() ? 'b' : 'w');
      file++;
    }
    if (file !== 8) throw new Error('FEN rank does not add up to eight squares');
  }

  if (turn !== 'w' && turn !== 'b') throw new Error('FEN side to move must be w or b');
  pos.turn = turn;

  pos.castling = 0;
  if (castling !== '-') {
    for (const ch of castling) {
      if (ch === 'K') pos.castling |= CASTLE_WK;
      else if (ch === 'Q') pos.castling |= CASTLE_WQ;
      else if (ch === 'k') pos.castling |= CASTLE_BK;
      else if (ch === 'q') pos.castling |= CASTLE_BQ;
      else throw new Error('FEN castling field is malformed');
    }
  }

  pos.ep = ep === '-' ? -1 : squareIndex(ep);
  if (ep !== '-' && pos.ep === -1) throw new Error('FEN en-passant square is malformed');
  pos.half = Number(parts[4] ?? 0) || 0;
  pos.full = Number(parts[5] ?? 1) || 1;

  // Rights that no longer have their rook or king in place are meaningless, and
  // keeping them would let a crafted FEN castle out of thin air.
  pos.castling &= availableCastling(pos);

  for (const color of ['w', 'b'] as Color[]) {
    if (findKing(pos, color) === -1) throw new Error(`FEN is missing the ${color === 'w' ? 'white' : 'black'} king`);
  }
  // A position where the side that just moved is still attackable is illegal.
  if (inCheck(pos, pos.turn === 'w' ? 'b' : 'w')) throw new Error('FEN leaves the side not to move in check');

  return pos;
}

function availableCastling(pos: Position): number {
  let mask = 0;
  if (pos.board[4] === makePiece(KING, 'w')) {
    if (pos.board[7] === makePiece(ROOK, 'w')) mask |= CASTLE_WK;
    if (pos.board[0] === makePiece(ROOK, 'w')) mask |= CASTLE_WQ;
  }
  if (pos.board[60] === makePiece(KING, 'b')) {
    if (pos.board[63] === makePiece(ROOK, 'b')) mask |= CASTLE_BK;
    if (pos.board[56] === makePiece(ROOK, 'b')) mask |= CASTLE_BQ;
  }
  return mask;
}

export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let gap = 0;
    for (let file = 0; file < 8; file++) {
      const piece = pos.board[rank * 8 + file];
      if (piece === EMPTY) {
        gap++;
        continue;
      }
      if (gap > 0) {
        row += String(gap);
        gap = 0;
      }
      const ch = typeChar(piece);
      row += pieceColor(piece) === 'w' ? ch.toUpperCase() : ch;
    }
    if (gap > 0) row += String(gap);
    rows.push(row);
  }

  let rights = '';
  if (pos.castling & CASTLE_WK) rights += 'K';
  if (pos.castling & CASTLE_WQ) rights += 'Q';
  if (pos.castling & CASTLE_BK) rights += 'k';
  if (pos.castling & CASTLE_BQ) rights += 'q';

  return [
    rows.join('/'),
    pos.turn,
    rights || '-',
    pos.ep === -1 ? '-' : squareName(pos.ep),
    String(pos.half),
    String(pos.full),
  ].join(' ');
}

/**
 * Everything that has to match for two positions to repeat: placement, side to
 * move, castling rights and a *usable* en-passant file. Move counters are left
 * out on purpose.
 */
export function repetitionKey(pos: Position): string {
  const fen = toFen(pos);
  const parts = fen.split(' ');
  // Only advertise the en-passant square when a capture is genuinely available,
  // otherwise positions that are identical to play would never repeat.
  const epUsable = pos.ep !== -1 && legalMoves(pos).some((m) => m.ep);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${epUsable ? parts[3] : '-'}`;
}

// ------------------------------------------------------------------- attacks

export function findKing(pos: Position, color: Color): number {
  const want = makePiece(KING, color);
  for (let i = 0; i < 64; i++) if (pos.board[i] === want) return i;
  return -1;
}

/** Is `square` attacked by any piece of `by`? */
export function isAttacked(pos: Position, square: number, by: Color): boolean {
  const board = pos.board;

  // Pawns: a pawn of `by` attacks diagonally forwards, so look backwards.
  const pawnDir = by === 'w' ? -1 : 1;
  const pawn = makePiece(PAWN, by);
  for (const df of [-1, 1]) {
    const from = offset(square, df, pawnDir);
    if (from !== -1 && board[from] === pawn) return true;
  }

  const knight = makePiece(KNIGHT, by);
  for (const [df, dr] of KNIGHT_STEPS) {
    const from = offset(square, df, dr);
    if (from !== -1 && board[from] === knight) return true;
  }

  const king = makePiece(KING, by);
  for (const [df, dr] of KING_STEPS) {
    const from = offset(square, df, dr);
    if (from !== -1 && board[from] === king) return true;
  }

  const queen = makePiece(QUEEN, by);
  const bishop = makePiece(BISHOP, by);
  for (const [df, dr] of BISHOP_DIRS) {
    let at = offset(square, df, dr);
    while (at !== -1) {
      const piece = board[at];
      if (piece !== EMPTY) {
        if (piece === bishop || piece === queen) return true;
        break;
      }
      at = offset(at, df, dr);
    }
  }
  const rook = makePiece(ROOK, by);
  for (const [df, dr] of ROOK_DIRS) {
    let at = offset(square, df, dr);
    while (at !== -1) {
      const piece = board[at];
      if (piece !== EMPTY) {
        if (piece === rook || piece === queen) return true;
        break;
      }
      at = offset(at, df, dr);
    }
  }

  return false;
}

export function inCheck(pos: Position, color: Color): boolean {
  const king = findKing(pos, color);
  if (king === -1) return false;
  return isAttacked(pos, king, color === 'w' ? 'b' : 'w');
}

// ------------------------------------------------------------- move generation

const PROMO_ORDER: PieceType[] = ['q', 'r', 'b', 'n'];

/** Pseudo-legal moves: correct in shape, but may leave the king in check. */
export function pseudoMoves(pos: Position): Move[] {
  const moves: Move[] = [];
  const me = pos.turn;
  const them: Color = me === 'w' ? 'b' : 'w';
  const board = pos.board;

  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (piece === EMPTY || pieceColor(piece) !== me) continue;
    const type = pieceType(piece);

    if (type === PAWN) {
      const dir = me === 'w' ? 1 : -1;
      const startRank = me === 'w' ? 1 : 6;
      const lastRank = me === 'w' ? 7 : 0;

      const one = offset(from, 0, dir);
      if (one !== -1 && board[one] === EMPTY) {
        pushPawn(moves, from, one, 0, lastRank);
        if (rankOf(from) === startRank) {
          const two = offset(from, 0, dir * 2);
          if (two !== -1 && board[two] === EMPTY) moves.push({ from, to: two, captured: 0 });
        }
      }
      for (const df of [-1, 1]) {
        const target = offset(from, df, dir);
        if (target === -1) continue;
        const victim = board[target];
        if (victim !== EMPTY && pieceColor(victim) === them) {
          pushPawn(moves, from, target, victim, lastRank);
        } else if (victim === EMPTY && target === pos.ep) {
          moves.push({ from, to: target, captured: makePiece(PAWN, them), ep: true });
        }
      }
      continue;
    }

    if (type === KNIGHT) {
      for (const [df, dr] of KNIGHT_STEPS) {
        const to = offset(from, df, dr);
        if (to === -1) continue;
        const victim = board[to];
        if (victim === EMPTY || pieceColor(victim) === them) moves.push({ from, to, captured: victim });
      }
      continue;
    }

    if (type === KING) {
      for (const [df, dr] of KING_STEPS) {
        const to = offset(from, df, dr);
        if (to === -1) continue;
        const victim = board[to];
        if (victim === EMPTY || pieceColor(victim) === them) moves.push({ from, to, captured: victim });
      }
      addCastles(pos, moves);
      continue;
    }

    const dirs =
      type === BISHOP ? BISHOP_DIRS : type === ROOK ? ROOK_DIRS : KING_STEPS;
    for (const [df, dr] of dirs) {
      let to = offset(from, df, dr);
      while (to !== -1) {
        const victim = board[to];
        if (victim === EMPTY) {
          moves.push({ from, to, captured: 0 });
        } else {
          if (pieceColor(victim) === them) moves.push({ from, to, captured: victim });
          break;
        }
        to = offset(to, df, dr);
      }
    }
  }

  return moves;
}

function pushPawn(moves: Move[], from: number, to: number, captured: number, lastRank: number) {
  if (rankOf(to) === lastRank) {
    for (const promo of PROMO_ORDER) moves.push({ from, to, promo, captured });
  } else {
    moves.push({ from, to, captured });
  }
}

/**
 * Castling, with every condition checked: rights intact, the path clear, the
 * king not currently in check, and neither the square it crosses nor the square
 * it lands on attacked.
 */
function addCastles(pos: Position, moves: Move[]) {
  const me = pos.turn;
  const them: Color = me === 'w' ? 'b' : 'w';
  const home = me === 'w' ? 0 : 56;
  const kingSquare = home + 4;
  if (pos.board[kingSquare] !== makePiece(KING, me)) return;
  if (isAttacked(pos, kingSquare, them)) return;

  const shortRight = me === 'w' ? CASTLE_WK : CASTLE_BK;
  const longRight = me === 'w' ? CASTLE_WQ : CASTLE_BQ;

  if (pos.castling & shortRight && pos.board[home + 7] === makePiece(ROOK, me)) {
    if (
      pos.board[home + 5] === EMPTY &&
      pos.board[home + 6] === EMPTY &&
      !isAttacked(pos, home + 5, them) &&
      !isAttacked(pos, home + 6, them)
    ) {
      moves.push({ from: kingSquare, to: home + 6, captured: 0, castle: 'k' });
    }
  }
  if (pos.castling & longRight && pos.board[home] === makePiece(ROOK, me)) {
    if (
      pos.board[home + 1] === EMPTY &&
      pos.board[home + 2] === EMPTY &&
      pos.board[home + 3] === EMPTY &&
      !isAttacked(pos, home + 3, them) &&
      !isAttacked(pos, home + 2, them)
    ) {
      moves.push({ from: kingSquare, to: home + 2, captured: 0, castle: 'q' });
    }
  }
}

/**
 * Fully legal moves. Every pseudo-legal move is played out and the mover's king
 * checked, which handles pins, discovered checks and the awkward case of a pawn
 * pinned along the rank it would capture en passant on.
 */
export function legalMoves(pos: Position): Move[] {
  const out: Move[] = [];
  const me = pos.turn;
  for (const move of pseudoMoves(pos)) {
    const next = applyMove(pos, move);
    if (!inCheck(next, me)) out.push(move);
  }
  return out;
}

/** Play a move, returning a new position. Assumes the move is pseudo-legal. */
export function applyMove(pos: Position, move: Move): Position {
  const next = clonePosition(pos);
  const board = next.board;
  const me = pos.turn;
  const piece = board[move.from];
  const type = pieceType(piece);

  board[move.from] = EMPTY;

  if (move.ep) {
    // The captured pawn sits beside the landing square, not on it.
    const victim = move.to + (me === 'w' ? -8 : 8);
    board[victim] = EMPTY;
  }

  board[move.to] = move.promo ? makePiece(CHAR_TYPES[move.promo], me) : piece;

  if (move.castle) {
    const home = me === 'w' ? 0 : 56;
    if (move.castle === 'k') {
      board[home + 5] = board[home + 7];
      board[home + 7] = EMPTY;
    } else {
      board[home + 3] = board[home];
      board[home] = EMPTY;
    }
  }

  // Rights die when the king or a rook leaves home, or when a rook is captured
  // on its home square.
  let rights = next.castling;
  if (type === KING) {
    rights &= me === 'w' ? ~(CASTLE_WK | CASTLE_WQ) : ~(CASTLE_BK | CASTLE_BQ);
  }
  if (move.from === 0 || move.to === 0) rights &= ~CASTLE_WQ;
  if (move.from === 7 || move.to === 7) rights &= ~CASTLE_WK;
  if (move.from === 56 || move.to === 56) rights &= ~CASTLE_BQ;
  if (move.from === 63 || move.to === 63) rights &= ~CASTLE_BK;
  next.castling = rights;

  // The en-passant right lasts exactly one ply.
  next.ep = -1;
  if (type === PAWN && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2) {
    next.ep = (move.from + move.to) / 2;
  }

  next.half = type === PAWN || move.captured ? 0 : pos.half + 1;
  next.turn = me === 'w' ? 'b' : 'w';
  if (me === 'b') next.full = pos.full + 1;

  return next;
}

/** Find the legal move matching a from/to/promotion request, or null. */
export function findMove(pos: Position, from: number, to: number, promo?: string): Move | null {
  const candidates = legalMoves(pos).filter((m) => m.from === from && m.to === to);
  if (candidates.length === 0) return null;
  const promoting = candidates.some((m) => m.promo);
  if (!promoting) return candidates[0];
  const want = String(promo ?? '').toLowerCase();
  if (want !== 'q' && want !== 'r' && want !== 'b' && want !== 'n') return null;
  return candidates.find((m) => m.promo === want) ?? null;
}

// ------------------------------------------------------------------ endings

export function isCheckmate(pos: Position): boolean {
  return inCheck(pos, pos.turn) && legalMoves(pos).length === 0;
}

export function isStalemate(pos: Position): boolean {
  return !inCheck(pos, pos.turn) && legalMoves(pos).length === 0;
}

/**
 * Positions where no sequence of legal moves can produce a mate: bare kings,
 * king and a single minor either side, and king+bishop vs king+bishop when both
 * bishops live on the same colour complex.
 */
export function insufficientMaterial(pos: Position): boolean {
  const counts = { w: [0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0, 0, 0, 0, 0] };
  const bishops: Record<Color, number[]> = { w: [], b: [] };
  for (let i = 0; i < 64; i++) {
    const piece = pos.board[i];
    if (piece === EMPTY) continue;
    const color = pieceColor(piece);
    const type = pieceType(piece);
    counts[color][type]++;
    if (type === BISHOP) bishops[color].push((fileOf(i) + rankOf(i)) % 2);
  }
  for (const color of ['w', 'b'] as Color[]) {
    if (counts[color][PAWN] || counts[color][ROOK] || counts[color][QUEEN]) return false;
  }
  const minors = (c: Color) => counts[c][KNIGHT] + counts[c][BISHOP];
  if (minors('w') === 0 && minors('b') === 0) return true;
  if (minors('w') <= 1 && minors('b') === 0) return true;
  if (minors('b') <= 1 && minors('w') === 0) return true;
  if (
    counts.w[BISHOP] === 1 &&
    counts.b[BISHOP] === 1 &&
    counts.w[KNIGHT] === 0 &&
    counts.b[KNIGHT] === 0 &&
    bishops.w[0] === bishops.b[0]
  ) {
    return true;
  }
  return false;
}

/**
 * Can `color` still deliver mate with the material on the board? Used when a
 * clock flags: flagging against a lone king is a draw, not a loss.
 */
export function canMate(pos: Position, color: Color): boolean {
  let knights = 0;
  let bishops = 0;
  const complexes = new Set<number>();
  for (let i = 0; i < 64; i++) {
    const piece = pos.board[i];
    if (piece === EMPTY || pieceColor(piece) !== color) continue;
    const type = pieceType(piece);
    if (type === PAWN || type === ROOK || type === QUEEN) return true;
    if (type === KNIGHT) knights++;
    if (type === BISHOP) {
      bishops++;
      complexes.add((fileOf(i) + rankOf(i)) % 2);
    }
  }
  // Lone king, king+knight and king+bishop cannot force mate. Two knights or
  // bishops on both colours can (helpmates exist for KNN, and FIDE 6.9 asks only
  // whether mate is possible by any legal series of moves).
  if (bishops === 0 && knights <= 1) return false;
  if (bishops >= 1 && knights === 0 && complexes.size === 1 && bishops >= 1) {
    // Any number of same-colour bishops still cannot mate a lone king.
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------- SAN

/** Standard algebraic notation for a legal move, with disambiguation. */
export function toSan(pos: Position, move: Move): string {
  const piece = pos.board[move.from];
  const type = pieceType(piece);
  const next = applyMove(pos, move);
  const suffix = inCheck(next, next.turn)
    ? legalMoves(next).length === 0
      ? '#'
      : '+'
    : '';

  if (move.castle) return `${move.castle === 'k' ? 'O-O' : 'O-O-O'}${suffix}`;

  const target = squareName(move.to);
  const capture = Boolean(move.captured);

  if (type === PAWN) {
    const body = capture ? `${'abcdefgh'[fileOf(move.from)]}x${target}` : target;
    return `${body}${move.promo ? `=${move.promo.toUpperCase()}` : ''}${suffix}`;
  }

  const letter = typeChar(piece).toUpperCase();

  // Other identical pieces that could also legally land on this square.
  const rivals = legalMoves(pos).filter(
    (m) =>
      m.to === move.to &&
      m.from !== move.from &&
      pieceType(pos.board[m.from]) === type &&
      pieceColor(pos.board[m.from]) === pieceColor(piece),
  );
  let hint = '';
  if (rivals.length > 0) {
    const sameFile = rivals.some((m) => fileOf(m.from) === fileOf(move.from));
    const sameRank = rivals.some((m) => rankOf(m.from) === rankOf(move.from));
    if (!sameFile) hint = 'abcdefgh'[fileOf(move.from)];
    else if (!sameRank) hint = String(rankOf(move.from) + 1);
    else hint = squareName(move.from);
  }

  return `${letter}${hint}${capture ? 'x' : ''}${target}${suffix}`;
}

// ---------------------------------------------------------------------- PGN

export interface PgnMeta {
  white: string;
  black: string;
  result: string;
  date?: string;
  timeControl?: string;
  termination?: string;
  startFen?: string;
}

export function toPgn(meta: PgnMeta, sans: string[]): string {
  const date = meta.date ?? new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const tags = [
    ['Event', 'Empyr Gambit'],
    ['Site', 'empyr.dev'],
    ['Date', date],
    ['White', meta.white],
    ['Black', meta.black],
    ['Result', meta.result],
  ];
  if (meta.timeControl) tags.push(['TimeControl', meta.timeControl]);
  if (meta.termination) tags.push(['Termination', meta.termination]);
  if (meta.startFen && meta.startFen !== START_FEN) {
    tags.push(['SetUp', '1']);
    tags.push(['FEN', meta.startFen]);
  }

  const startPos = meta.startFen ? parseFen(meta.startFen) : parseFen(START_FEN);
  let moveNumber = startPos.full;
  let turn = startPos.turn;
  const chunks: string[] = [];
  for (const san of sans) {
    if (turn === 'w') {
      chunks.push(`${moveNumber}. ${san}`);
    } else {
      if (chunks.length === 0) chunks.push(`${moveNumber}... ${san}`);
      else chunks.push(san);
      moveNumber++;
    }
    turn = turn === 'w' ? 'b' : 'w';
  }
  chunks.push(meta.result);

  // Wrap at 80 columns like a real PGN writer.
  const lines: string[] = [];
  let line = '';
  for (const chunk of chunks) {
    if (line && line.length + chunk.length + 1 > 80) {
      lines.push(line);
      line = chunk;
    } else {
      line = line ? `${line} ${chunk}` : chunk;
    }
  }
  if (line) lines.push(line);

  return `${tags.map(([k, v]) => `[${k} "${v}"]`).join('\n')}\n\n${lines.join('\n')}\n`;
}

// -------------------------------------------------------------------- perft

/** Count leaf nodes of the legal move tree — the standard generator test. */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = pseudoMoves(pos);
  const me = pos.turn;
  if (depth === 1) {
    let count = 0;
    for (const move of moves) {
      if (!inCheck(applyMove(pos, move), me)) count++;
    }
    return count;
  }
  let nodes = 0;
  for (const move of moves) {
    const next = applyMove(pos, move);
    if (inCheck(next, me)) continue;
    nodes += perft(next, depth - 1);
  }
  return nodes;
}

/** Per-move split of a perft, handy when hunting a mismatch. */
export function perftDivide(pos: Position, depth: number): Array<[string, number]> {
  const out: Array<[string, number]> = [];
  for (const move of legalMoves(pos)) {
    const next = applyMove(pos, move);
    out.push([
      `${squareName(move.from)}${squareName(move.to)}${move.promo ?? ''}`,
      perft(next, depth - 1),
    ]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}
