import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { GROUP_INK, GROUP_SHADE, TILES, TOKEN_INK, seatIndex, tileBox, type TileMeta } from './board';
import { Seal } from './avatars';
import { money, type Copy } from './copy';
import type { PlayerView, RoomView } from './protocol';

const CORNER_GLYPH: Record<string, string> = {
  go: '➜',
  jail: '⛓',
  vacation: '⛱',
  arrest: '⚖',
};

const KIND_GLYPH: Record<string, string> = {
  fortune: '★',
  ledger: '✉',
  tax: '⚖',
  rail: '⛊',
  util: '⚙',
};

/** Standard-dice pip layout, indexed by face value. */
const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 3],
  ],
};

export function Die({ face, rolling }: { face: number; rolling: boolean }) {
  return (
    <div className="mp-die" data-rolling={rolling} aria-label={`die ${face}`}>
      {(PIPS[face] ?? PIPS[1]).map(([row, col], index) => (
        <i key={index} className="mp-pip" style={{ gridRow: row, gridColumn: col }} />
      ))}
    </div>
  );
}

function Buildings({ houses }: { houses: number }) {
  if (houses === 5) return <i className="mp-hotel" title="hotel" />;
  return (
    <>
      {Array.from({ length: houses }, (_, index) => (
        <i key={index} className="mp-house" />
      ))}
    </>
  );
}

interface TileProps {
  tile: TileMeta;
  room: RoomView;
  copy: Copy;
  onOpen: (tile: number) => void;
}

function Square({ tile, room, copy, onOpen }: TileProps) {
  const deed = room.deeds[tile.i] ?? null;
  const owner = deed?.owner ? room.players.find((p) => p.id === deed.owner) : null;
  const corner = tile.side === 'corner';
  const street = tile.kind === 'street';

  const style: CSSProperties & Record<string, string> = {
    gridRow: String(tile.row),
    gridColumn: String(tile.col),
    ...(tile.group ? { ['--band']: GROUP_INK[tile.group], ['--band-2']: GROUP_SHADE[tile.group] } : {}),
    ...(owner ? { ['--own']: TOKEN_INK[seatIndex(owner.token)] } : {}),
  } as CSSProperties & Record<string, string>;

  // Fortune and Ledger squares repeat around the board, so their own name is noise —
  // the kind reads better and is already translated.
  const label = tile.kind === 'fortune' || tile.kind === 'ledger' ? copy.kind[tile.kind] : tile.name;
  const amount = tile.price > 0 ? tile.price : tile.tax > 0 ? tile.tax : 0;

  return (
    <div
      className="mp-tile"
      style={style}
      data-side={tile.side}
      data-kind={tile.kind}
      data-corner={corner}
      data-owned={Boolean(owner)}
      data-mortgaged={Boolean(deed?.mortgaged)}
      data-active={room.offerTile === tile.i || room.auction?.tile === tile.i}
      onClick={() => onOpen(tile.i)}
      role="button"
      tabIndex={-1}
      title={tile.name}
    >
      {street && (
        <div className="mp-band">
          <span className="mp-builds">
            <Buildings houses={deed?.houses ?? 0} />
          </span>
        </div>
      )}

      <div className="mp-face">
        {corner ? (
          <>
            <span className="mp-glyph">{CORNER_GLYPH[tile.kind] ?? '◆'}</span>
            <span className="mp-corner-name">{copy.kind[tile.kind]}</span>
          </>
        ) : (
          <>
            {!street && (
              <span className="mp-seal-tile" aria-hidden="true">
                {KIND_GLYPH[tile.kind] ?? '◆'}
              </span>
            )}
            <span className="mp-name">{label}</span>
            {amount > 0 && <span className="mp-price">{money(amount)}</span>}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pawns */

/** Fans several pawns out inside one square without letting them leave it. */
function fan(index: number, count: number): { dx: number; dy: number } {
  if (count <= 1) return { dx: 0, dy: 0 };
  const perRow = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / perRow);
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const inRow = Math.min(perRow, count - row * perRow);
  return {
    dx: (col - (inRow - 1) / 2) * 0.62,
    dy: (row - (rows - 1) / 2) * 0.62,
  };
}

interface Metrics {
  /** Width of the grid's track space, gaps excluded. */
  span: number;
  gap: number;
}

function Pawns({ room, metrics }: { room: RoomView; metrics: Metrics }) {
  const live = room.players.filter((p) => !p.bankrupt);
  const byTile = new Map<number, PlayerView[]>();
  for (const player of live) {
    const list = byTile.get(player.pos) ?? [];
    list.push(player);
    byTile.set(player.pos, list);
  }

  const moved = useMoveFlags(live);

  return (
    <div className="mp-pawns" aria-hidden="true">
      {live.map((player) => {
        const here = byTile.get(player.pos)!;
        const box = tileBox(player.pos);
        const step = Math.min(box.w * metrics.span, box.h * metrics.span);
        const { dx, dy } = fan(here.indexOf(player), here.length);
        const x = box.cx * metrics.span + (box.col - 1) * metrics.gap + dx * step;
        const y = box.cy * metrics.span + (box.row - 1) * metrics.gap + dy * step;

        return (
          <span
            key={player.id}
            className="mp-pawn"
            data-turn={room.activeId === player.id}
            data-moving={moved.has(player.id)}
            style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
          >
            <Seal token={player.token} size="board" turn={room.activeId === player.id} />
          </span>
        );
      })}
    </div>
  );
}

/** Marks a pawn as in-flight for the length of the travel tween. */
function useMoveFlags(players: PlayerView[]): Set<string> {
  const previous = useRef(new Map<string, number>());
  const [moving, setMoving] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const started: string[] = [];
    for (const player of players) {
      const was = previous.current.get(player.id);
      if (was !== undefined && was !== player.pos) started.push(player.id);
      previous.current.set(player.id, player.pos);
    }
    if (started.length === 0) return;
    setMoving((current) => new Set([...current, ...started]));
    const timer = window.setTimeout(() => {
      setMoving((current) => {
        const next = new Set(current);
        for (const id of started) next.delete(id);
        return next;
      });
    }, 520);
    return () => window.clearTimeout(timer);
  }, [players]);

  return moving;
}

/* ------------------------------------------------------------------ board */

interface BoardProps {
  room: RoomView;
  copy: Copy;
  rolling: boolean;
  onOpen: (tile: number) => void;
}

export default function BoardView({ room, copy, rolling, onOpen }: BoardProps) {
  const active = room.players.find((p) => p.id === room.activeId) ?? null;
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useLayoutEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width <= 0) return;
      const gap = Number.parseFloat(getComputedStyle(node).columnGap) || 0;
      setMetrics({ span: width - gap * 10, gap });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mp-boardwrap">
      <div className="mp-board" ref={boardRef}>
        {TILES.map((tile) => (
          <Square key={tile.i} tile={tile} room={room} copy={copy} onOpen={onOpen} />
        ))}

        <div className="mp-centre">
          <div className="mp-emblem">
            Empyr
            <small>Ledger</small>
          </div>
          <div className="mp-emblem-rule" />

          <div className="mp-dicebox">
            {room.dice ? (
              <>
                <Die face={room.dice[0]} rolling={rolling} />
                <Die face={room.dice[1]} rolling={rolling} />
              </>
            ) : null}
          </div>

          {active && (
            <p className="mp-turnline" key={active.id}>
              <Seal token={active.token} size="board" turn />
              <span>{active.name}</span>
            </p>
          )}

          <div className="mp-centre-stats">
            <span>
              {copy.housesLeft} <b>{room.housesLeft}</b>
            </span>
            <span>
              {copy.hotelsLeft} <b>{room.hotelsLeft}</b>
            </span>
            {room.settings.vacationCash && (
              <span>
                {copy.vacationPot} <b>{money(room.vacationPot)}</b>
              </span>
            )}
          </div>
        </div>

        {metrics && <Pawns room={room} metrics={metrics} />}
      </div>
    </div>
  );
}
