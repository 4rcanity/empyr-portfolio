import type { ReactElement } from 'react';
import type { Color, PieceLetter } from './protocol';

/**
 * The pieces, drawn as inline SVG. No image files and no unicode chess glyphs —
 * those render differently on every platform and half the time not at all.
 *
 * The family is a geometric reduction of a Staunton set on a 45×45 field: each
 * piece stands on the same plinth, with one unmistakable identifying feature —
 * five orbs for the queen, a cross for the king, crenellations for the rook, a
 * mitre for the bishop, an angular horse for the knight, a sphere for the pawn.
 */

/** Common plinth: every piece stands on the same two-step base. */
function Plinth({ wide = 0 }: { wide?: number }) {
  return (
    <>
      <path d={`M ${13 - wide} 33.4 h ${19 + wide * 2} l 1.1 2.5 h ${-21.2 - wide * 2} z`} />
      <rect x={10 - wide} y="35.6" width={25 + wide * 2} height="3.6" rx="1.4" />
    </>
  );
}

function Pawn() {
  return (
    <>
      <circle cx="22.5" cy="13.4" r="5.1" />
      <path d="M 17.9 19.6 h 9.2 l -0.6 2.4 c 2.4 2.6 3.9 6.3 4.4 11 h -16.4 c 0.5 -4.7 2 -8.4 4.4 -11 z" />
      <Plinth wide={-1.6} />
    </>
  );
}

function Rook() {
  return (
    <>
      <path d="M 11.8 19.4 v -7.2 h 4.6 v 3.2 h 4 v -3.2 h 4.2 v 3.2 h 4 v -3.2 h 4.6 v 7.2 z" />
      <path d="M 14.2 20.6 h 16.6 l -1.4 2.6 h -13.8 z" />
      <path d="M 15.6 24.4 h 13.8 l 1.4 8.2 h -16.6 z" />
      <Plinth />
    </>
  );
}

function Bishop() {
  return (
    <>
      <circle cx="22.5" cy="7.6" r="2.1" />
      {/* Mitre: a pointed dome with the traditional slit. */}
      <path d="M 22.5 10.2 c 4.4 3 6.9 7 6.9 10.7 0 2.6 -1.4 4.6 -3.4 5.8 h -7 c -2 -1.2 -3.4 -3.2 -3.4 -5.8 0 -3.7 2.5 -7.7 6.9 -10.7 z" />
      <path d="M 20.4 17.4 h 6.4" fill="none" strokeWidth="1.7" strokeLinecap="round" className="cx-slit" />
      <path d="M 15.4 27.8 h 14.2 l 1 4.8 h -16.2 z" />
      <Plinth />
    </>
  );
}

function Knight() {
  return (
    <>
      {/* Angular horse head, muzzle to the left, one raised ear. */}
      <path d="M 10.6 24.6 L 11.7 19.2 L 16.2 13.8 L 18.6 12.3 L 19.7 12.8 L 20.6 6.4 L 23.2 11.9 L 26.7 14.4 L 30 21.9 L 31 33 L 17 33 L 16 27 L 12.6 26 Z" />
      <circle cx="17.4" cy="16.6" r="0.95" className="cx-eye" />
      <circle cx="12.4" cy="21.8" r="0.6" className="cx-eye" />
      <path d="M 22.6 12.6 L 25.4 15.4 L 27.9 20.4" strokeWidth="1.15" className="cx-mane" fill="none" />
      <Plinth />
    </>
  );
}

function Queen() {
  return (
    <>
      <circle cx="9.8" cy="10.4" r="2.1" />
      <circle cx="16.1" cy="7.4" r="2.1" />
      <circle cx="22.5" cy="6.2" r="2.3" />
      <circle cx="28.9" cy="7.4" r="2.1" />
      <circle cx="35.2" cy="10.4" r="2.1" />
      <path d="M 10.6 12.6 l 3.4 10.6 h 17 l 3.4 -10.6 -5.2 3.4 -2.4 -6.2 -1.9 6.6 h -4.8 l -1.9 -6.6 -2.4 6.2 z" />
      <path d="M 13.6 24.6 h 17.8 l -0.6 3 h -16.6 z" />
      <path d="M 14.4 29 h 16.2 l 0.9 3.6 h -18 z" />
      <Plinth />
    </>
  );
}

function King() {
  return (
    <>
      <path d="M 21.3 4.4 h 2.4 v 2.6 h 2.6 v 2.4 h -2.6 v 2.8 h -2.4 v -2.8 h -2.6 v -2.4 h 2.6 z" />
      <path d="M 22.5 13 c 5 0 8.4 3.2 8.4 6.8 0 2.4 -1.4 4.2 -3.2 5.4 h -10.4 c -1.8 -1.2 -3.2 -3 -3.2 -5.4 0 -3.6 3.4 -6.8 8.4 -6.8 z" />
      <path d="M 15.6 26.6 h 13.8 l 0.8 2.6 h -15.4 z" />
      <path d="M 14.6 30.4 h 15.8 l 0.6 2.2 h -17 z" />
      <Plinth />
    </>
  );
}

const SHAPES: Record<PieceLetter, () => ReactElement> = {
  p: Pawn,
  n: Knight,
  b: Bishop,
  r: Rook,
  q: Queen,
  k: King,
};

export function PieceGlyph({
  color,
  type,
  className,
}: {
  color: Color;
  type: PieceLetter;
  className?: string;
}) {
  const Shape = SHAPES[type];
  return (
    <svg
      viewBox="0 0 45 45"
      className={`cx-piece cx-piece--${color} cx-piece-t-${type}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      focusable="false"
    >
      <g strokeLinejoin="round">
        <Shape />
      </g>
    </svg>
  );
}
