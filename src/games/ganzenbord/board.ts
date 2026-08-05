/**
 * Geometry for the printed spiral. The 63 squares are laid out along a genuine
 * Archimedean spiral running inward, resampled to equal arc length so every
 * square is the same size no matter how tight the coil gets.
 *
 * All numbers are in a 100 x 100 viewBox, so the board scales to any width
 * without a single measured pixel.
 */

import { GOAL, squareKind, type SquareKind } from './protocol';

const CX = 50;
const CY = 50;
const R_OUT = 41;
const R_IN = 8.5;
const TURNS = 2.55;
const START_ANGLE = -Math.PI * 0.52;

/** Tile edge length, a touch under the square-to-square pitch. */
export const TILE = 5.9;

export interface Cell {
  n: number;
  x: number;
  y: number;
  /** Tangent direction in degrees, so a tile can sit square on the track. */
  angle: number;
  kind: SquareKind;
}

function point(u: number) {
  const th = START_ANGLE + TURNS * 2 * Math.PI * u;
  const r = R_OUT - (R_OUT - R_IN) * u;
  // Negating the sine walks the coil counter-clockwise, the way it is printed.
  return { x: CX + r * Math.cos(th), y: CY - r * Math.sin(th) };
}

const SAMPLES = 4000;
const samples: { u: number; x: number; y: number; len: number }[] = [];
{
  let len = 0;
  let prev = point(0);
  samples.push({ u: 0, ...prev, len: 0 });
  for (let i = 1; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const p = point(u);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    samples.push({ u, ...p, len });
    prev = p;
  }
}
const TOTAL = samples[samples.length - 1].len;

/** The point at a given fraction of the spiral's arc length. */
function atLength(len: number) {
  if (len <= 0) {
    // Extrapolate backwards along the opening tangent for the nest.
    const a = samples[0];
    const b = samples[8];
    const dx = (b.x - a.x) / b.len;
    const dy = (b.y - a.y) / b.len;
    return { x: a.x + dx * len, y: a.y + dy * len };
  }
  if (len >= TOTAL) return samples[samples.length - 1];
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].len < len) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const t = (len - a.len) / Math.max(1e-6, b.len - a.len);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

const PITCH = TOTAL / (GOAL - 1);

function angleAt(len: number): number {
  const a = atLength(Math.max(0, len - 1));
  const b = atLength(Math.min(TOTAL, len + 1));
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export const CELLS: Cell[] = Array.from({ length: GOAL }, (_, i) => {
  const n = i + 1;
  const len = i * PITCH;
  const p = atLength(len);
  return { n, x: p.x, y: p.y, angle: angleAt(len), kind: squareKind(n) };
});

/** The nest outside square 1, where every pawn starts. */
export const NEST = (() => {
  const p = atLength(-PITCH * 1.15);
  return { x: p.x, y: p.y, angle: angleAt(0), kind: 'start' as SquareKind, n: 0 };
})();

/** Ink channel the tiles sit on — the printed track itself. */
export const TRACK_PATH = (() => {
  const steps = 300;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = atLength((i / steps) * TOTAL);
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
})();

export function cellAt(n: number): { x: number; y: number; angle: number; kind: SquareKind } {
  if (n <= 0) return NEST;
  return CELLS[Math.min(GOAL, n) - 1];
}

/**
 * Where a pawn stands, fanned out when several pawns share a square so none of
 * them hides behind another.
 */
export function pawnSpot(square: number, index: number, crowd: number) {
  const cell = cellAt(square);
  if (crowd <= 1) return { x: cell.x, y: cell.y };
  const spread = TILE * 0.3;
  const step = (Math.PI * 2) / crowd;
  return {
    x: cell.x + Math.cos(step * index - Math.PI / 2) * spread,
    y: cell.y + Math.sin(step * index - Math.PI / 2) * spread,
  };
}
