/**
 * Rule engine for Mens erger je niet. Everything about legality lives here —
 * the client only ever renders the options this file produces.
 */

import {
  HOME_LAST,
  PAWNS,
  RING,
  ringSquare,
  type MoveKind,
  type MoveOption,
  type Rules,
} from './protocol';

export interface Racer {
  id: string;
  corner: number;
  /** Lap position of each pawn: -1 yard, 0..39 ring, 40..43 home column. */
  pawns: number[];
}

interface Occupant {
  id: string;
  pawn: number;
  /** Parked on its own start square, so a blockade under `blockOnStart`. */
  guard: boolean;
}

/** Which ring square every pawn on the board is standing on. */
export function occupancy(racers: Racer[]): Map<number, Occupant> {
  const map = new Map<number, Occupant>();
  for (const racer of racers) {
    for (let pawn = 0; pawn < racer.pawns.length; pawn++) {
      const pos = racer.pawns[pawn];
      if (pos < 0 || pos >= RING) continue;
      map.set(ringSquare(racer.corner, pos), { id: racer.id, pawn, guard: pos === 0 });
    }
  }
  return map;
}

function kindOf(from: number, to: number): MoveKind {
  if (from < 0) return 'enter';
  if (to === HOME_LAST) return 'finish';
  if (to >= RING) return 'home';
  return 'ring';
}

/**
 * Walk one pawn `dice` squares and decide what happens. Returns null when the
 * move is illegal: overshooting home, landing on your own pawn, or running into
 * a blockade.
 */
function tryMove(
  actor: Racer,
  pawn: number,
  dice: number,
  occ: Map<number, Occupant>,
  rules: Rules,
): MoveOption | null {
  const from = actor.pawns[pawn];

  if (from < 0) {
    // Only a six lifts a pawn out of the yard, and only onto a free start.
    if (dice !== 6) return null;
    const square = ringSquare(actor.corner, 0);
    const sitting = occ.get(square);
    if (sitting && sitting.id === actor.id) return null;
    if (sitting && rules.blockOnStart && sitting.guard) return null;
    return {
      pawn,
      from,
      to: 0,
      kind: 'enter',
      capture: sitting ? { playerId: sitting.id, pawn: sitting.pawn } : null,
    };
  }

  const to = from + dice;
  // The home column takes an exact count — you may not overshoot the last square.
  if (to > HOME_LAST) return null;

  let capture: MoveOption['capture'] = null;

  for (let step = from + 1; step <= to; step++) {
    if (step >= RING) {
      // Inside your own column nothing may be jumped and nothing may be shared.
      const blocked = actor.pawns.some((p, i) => i !== pawn && p === step);
      if (blocked) return null;
      continue;
    }

    const sitting = occ.get(ringSquare(actor.corner, step));
    if (!sitting) continue;

    if (step < to) {
      // Passing is normally free; a guarded start square is the exception.
      if (rules.blockOnStart && sitting.guard) return null;
      continue;
    }

    if (sitting.id === actor.id) return null;
    if (rules.blockOnStart && sitting.guard) return null;
    capture = { playerId: sitting.id, pawn: sitting.pawn };
  }

  return { pawn, from, to, kind: kindOf(from, to), capture };
}

/**
 * Every move the active player may make with this roll. An empty result means
 * the turn is dead and passes on.
 */
export function legalMoves(
  actor: Racer,
  racers: Racer[],
  dice: number,
  rules: Rules,
): MoveOption[] {
  const occ = occupancy(racers);
  const found: MoveOption[] = [];

  for (let pawn = 0; pawn < PAWNS; pawn++) {
    const move = tryMove(actor, pawn, dice, occ, rules);
    if (move) found.push(move);
  }

  // Two pawns sitting in the yard produce identical entries — offer one.
  const seen = new Set<string>();
  const unique = found.filter((move) => {
    const key = `${move.from}:${move.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (rules.mustCapture && unique.some((move) => move.capture)) {
    return unique.filter((move) => move.capture);
  }
  return unique;
}

/** Ordering used by the turn clock when it has to move for an absent player. */
export function bestMove(options: MoveOption[]): MoveOption {
  const score = (move: MoveOption) =>
    (move.capture ? 400 : 0) +
    (move.kind === 'finish' ? 300 : 0) +
    (move.kind === 'home' ? 180 : 0) +
    (move.kind === 'enter' ? 120 : 0) +
    move.to;
  return [...options].sort((a, b) => score(b) - score(a))[0];
}

export function allHome(pawns: number[]): boolean {
  return pawns.every((pos) => pos >= RING);
}

export function countHome(pawns: number[]): number {
  return pawns.filter((pos) => pos >= RING).length;
}

export function countYard(pawns: number[]): number {
  return pawns.filter((pos) => pos < 0).length;
}
