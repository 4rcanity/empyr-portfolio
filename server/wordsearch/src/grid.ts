/**
 * Grid generation. Everything here is a pure function of the seed, so any grid
 * a player complains about can be rebuilt exactly from `seed` in the room view.
 */

import { DIRECTIONS, type Bank, type Category, type Step } from './protocol';
import { FREQUENCY, wordsFor } from './words';

export interface Placed {
  word: string;
  /** Row-major cell indices, first letter first. */
  path: number[];
}

export interface Grid {
  size: number;
  /** Row-major letters, `size * size` of them. */
  cells: string;
  words: Placed[];
  seed: number;
}

/** mulberry32 — small, fast, and identical on every runtime. */
export function rngFor(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Cumulative weight table for one language's filler letters. */
function fillerTable(bank: Bank): { letters: string[]; totals: number[] } {
  const table = FREQUENCY[bank] ?? FREQUENCY.en;
  const letters = Object.keys(table);
  const totals: number[] = [];
  let running = 0;
  for (const letter of letters) {
    running += table[letter];
    totals.push(running);
  }
  return { letters, totals };
}

function pickFiller(table: { letters: string[]; totals: number[] }, rng: () => number): string {
  const total = table.totals[table.totals.length - 1];
  const roll = rng() * total;
  for (let i = 0; i < table.totals.length; i++) {
    if (roll < table.totals[i]) return table.letters[i];
  }
  return table.letters[table.letters.length - 1];
}

interface Candidate {
  path: number[];
  /** Letters already on the board that this placement reuses. */
  overlaps: number;
}

/** Every legal spot for one word, with its overlap count. */
function spotsFor(word: string, board: (string | null)[], size: number, dirs: Step[]): Candidate[] {
  const found: Candidate[] = [];
  const span = word.length - 1;

  for (const { dr, dc } of dirs) {
    const rowLo = dr < 0 ? span : 0;
    const rowHi = dr > 0 ? size - 1 - span : size - 1;
    const colLo = dc < 0 ? span : 0;
    const colHi = dc > 0 ? size - 1 - span : size - 1;

    for (let row = rowLo; row <= rowHi; row++) {
      for (let col = colLo; col <= colHi; col++) {
        const path: number[] = [];
        let overlaps = 0;
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const cell = (row + dr * i) * size + (col + dc * i);
          const sitting = board[cell];
          if (sitting !== null && sitting !== word[i]) {
            ok = false;
            break;
          }
          if (sitting !== null) overlaps++;
          path.push(cell);
        }
        if (ok) found.push({ path, overlaps });
      }
    }
  }
  return found;
}

export interface GridRequest {
  size: number;
  /** How many words to aim for. Fewer are returned if the board runs out of room. */
  count: number;
  bank: Bank;
  category: Category;
  seed: number;
}

/**
 * Build a grid. The returned `words` list is derived from the placements that
 * actually landed, never from the requested list — so a word can never appear in
 * the players' list without being traceable on the board. Candidates that will
 * not fit are silently skipped and the next word from the bank is tried, which
 * is why a request for 12 words on a 10x10 grid still returns 12 findable ones.
 */
export function buildGrid({ size, count, bank, category, seed }: GridRequest): Grid {
  const rng = rngFor(seed);
  const board: (string | null)[] = new Array(size * size).fill(null);
  const placed: Placed[] = [];

  const pool = shuffled(
    wordsFor(bank, category).filter((word) => word.length >= 3 && word.length <= size),
    rng,
  );

  // Long words first: they have the fewest legal spots, so placing them while the
  // board is empty is what makes the requested word count actually achievable.
  const head = pool.slice(0, Math.max(count * 4, 24)).sort((a, b) => b.length - a.length);
  const candidates = [...head, ...pool.slice(head.length)];

  for (const word of candidates) {
    if (placed.length >= count) break;
    const spots = spotsFor(word, board, size, DIRECTIONS);
    if (spots.length === 0) continue;

    // Prefer crossings when there are any — an interlocked grid is much harder
    // to skim than a set of parallel words sitting in their own lanes.
    const crossing = spots.filter((spot) => spot.overlaps > 0);
    const bag = crossing.length > 0 && rng() < 0.75 ? crossing : spots;
    const spot = bag[Math.floor(rng() * bag.length)];

    for (let i = 0; i < word.length; i++) board[spot.path[i]] = word[i];
    placed.push({ word, path: spot.path });
  }

  const table = fillerTable(bank);
  let cells = '';
  for (let i = 0; i < board.length; i++) {
    cells += board[i] ?? pickFiller(table, rng);
  }

  return { size, cells, words: placed, seed };
}

/**
 * Read the letters along a straight trace, or `null` if the two endpoints do not
 * form one of the eight legal directions.
 */
export function readTrace(
  cells: string,
  size: number,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): { letters: string; path: number[] } | null {
  const inside = (v: number) => Number.isInteger(v) && v >= 0 && v < size;
  if (!inside(r1) || !inside(c1) || !inside(r2) || !inside(c2)) return null;

  const dRow = r2 - r1;
  const dCol = c2 - c1;
  const straight = dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol);
  if (!straight) return null;

  const length = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
  if (length < 3) return null;

  const dr = Math.sign(dRow);
  const dc = Math.sign(dCol);
  const path: number[] = [];
  let letters = '';
  for (let i = 0; i < length; i++) {
    const cell = (r1 + dr * i) * size + (c1 + dc * i);
    path.push(cell);
    letters += cells[cell];
  }
  return { letters, path };
}

export function reverse(text: string): string {
  return [...text].reverse().join('');
}
