import { PieceGlyph } from './pieces';
import { readFen, type PieceLetter } from './protocol';

/**
 * A static board for the landing page — rendered at build time, no client JS.
 * It exists so the page reads as chess, not as a generic checkered grid, before
 * a single word is read.
 */
export default function HeroBoard({ fen }: { fen: string }) {
  const squares = readFen(fen);
  const cells = [];

  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const index = rank * 8 + file;
      const piece = squares[index];
      cells.push(
        <div
          key={index}
          className={`cxh-sq cxh-sq--${(rank + file) % 2 === 1 ? 'l' : 'd'}`}
        >
          {piece && <PieceGlyph color={piece.color} type={piece.type as PieceLetter} />}
        </div>,
      );
    }
  }

  return (
    <div className="cxh-board" aria-hidden="true">
      {cells}
    </div>
  );
}
