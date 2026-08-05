import { useCallback, useMemo, useRef, useState } from 'react';
import { PieceGlyph } from './pieces';
import { readFen, squareName, type Color, type PieceLetter } from './protocol';

interface BoardProps {
  fen: string;
  /** Which colour sits at the bottom. */
  orientation: Color;
  /** Legal targets keyed by origin, straight from the server. */
  legal: Record<number, number[]>;
  lastMove: { from: number; to: number } | null;
  checkSquare: number;
  /** False while reviewing history, watching, or between games. */
  interactive: boolean;
  onMove: (from: number, to: number) => void;
  /** Squares to mark while a promotion is being chosen. */
  pending: { from: number; to: number } | null;
}

const DRAG_SLOP = 5;

export function Board({
  fen,
  orientation,
  legal,
  lastMove,
  checkSquare,
  interactive,
  onMove,
  pending,
}: BoardProps) {
  const squares = useMemo(() => readFen(fen), [fen]);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; moved: boolean } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const order = useMemo(() => {
    const list: number[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        list.push(orientation === 'w' ? (7 - row) * 8 + col : row * 8 + (7 - col));
      }
    }
    return list;
  }, [orientation]);

  const squareAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return null;
      const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
      const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
      if (col < 0 || col > 7 || row < 0 || row > 7) return null;
      return orientation === 'w' ? (7 - row) * 8 + col : row * 8 + (7 - col);
    },
    [orientation],
  );

  const targets = selected === null ? [] : legal[selected] ?? [];

  const commit = useCallback(
    (from: number, to: number) => {
      setSelected(null);
      setDrag(null);
      setHover(null);
      onMove(from, to);
    },
    [onMove],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const index = squareAt(event.clientX, event.clientY);
    if (index === null) return;

    // Tap-tap: a second tap on a legal target plays the move.
    if (selected !== null && (legal[selected] ?? []).includes(index)) {
      commit(selected, index);
      return;
    }

    const mine = Boolean(legal[index]?.length);
    if (!mine) {
      setSelected(null);
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic or already-released pointers cannot be captured */
    }
    setSelected(index);
    setDrag({ from: index, x: event.clientX, y: event.clientY, moved: false });
    setHover(index);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const moved =
      drag.moved ||
      Math.abs(event.clientX - drag.x) > DRAG_SLOP ||
      Math.abs(event.clientY - drag.y) > DRAG_SLOP;
    setDrag({ ...drag, x: event.clientX, y: event.clientY, moved });
    if (moved) setHover(squareAt(event.clientX, event.clientY));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const target = squareAt(event.clientX, event.clientY);
    // A tap that never travelled keeps the selection so the second tap can land.
    if (!drag.moved) {
      setDrag(null);
      setHover(null);
      return;
    }
    setDrag(null);
    setHover(null);
    if (target !== null && target !== drag.from && (legal[drag.from] ?? []).includes(target)) {
      commit(drag.from, target);
      return;
    }
    setSelected(null);
  }

  const rect = boardRef.current?.getBoundingClientRect();
  const cell = rect ? rect.width / 8 : 0;

  return (
    <div className="cx-boardwrap">
      <div
        className={`cx-board${interactive ? ' is-live' : ''}`}
        ref={boardRef}
        data-movable={Object.keys(legal).length}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          setDrag(null);
          setHover(null);
        }}
      >
        {order.map((index, cellIndex) => {
          const file = index & 7;
          const rank = index >> 3;
          const dark = (file + rank) % 2 === 0;
          const piece = squares[index];
          const isTarget = targets.includes(index);
          const dragging = drag?.moved && drag.from === index;
          const row = Math.floor(cellIndex / 8);
          const col = cellIndex % 8;

          return (
            <div
              key={index}
              className={[
                'cx-sq',
                dark ? 'cx-sq--dark' : 'cx-sq--light',
                lastMove && (lastMove.from === index || lastMove.to === index) ? 'is-last' : '',
                selected === index ? 'is-selected' : '',
                isTarget ? 'is-target' : '',
                hover === index && isTarget ? 'is-hover' : '',
                checkSquare === index ? 'is-check' : '',
                pending && (pending.from === index || pending.to === index) ? 'is-pending' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-square={squareName(index)}
            >
              {col === 0 && <span className="cx-rank">{rank + 1}</span>}
              {row === 7 && <span className="cx-file">{'abcdefgh'[file]}</span>}
              {piece && !dragging && (
                <PieceGlyph color={piece.color} type={piece.type as PieceLetter} />
              )}
              {isTarget && <span className={piece ? 'cx-capture' : 'cx-dot'} />}
            </div>
          );
        })}
      </div>

      {drag?.moved && rect && squares[drag.from] && (
        <div
          className="cx-float"
          style={{
            width: cell,
            height: cell,
            transform: `translate(${drag.x - rect.left - cell / 2}px, ${drag.y - rect.top - cell / 2}px)`,
          }}
        >
          <PieceGlyph
            color={squares[drag.from]!.color}
            type={squares[drag.from]!.type as PieceLetter}
          />
        </div>
      )}
    </div>
  );
}
