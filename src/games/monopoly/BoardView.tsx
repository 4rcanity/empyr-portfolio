import type { CSSProperties } from 'react';
import { GROUP_INK, TILES, TOKEN_GLYPH, TOKEN_INK, type TileMeta } from './board';
import { money, type Copy } from './copy';
import type { RoomView } from './protocol';

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
  if (houses === 5) return <i className="mp-hotel" />;
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
  const here = room.players.filter((p) => !p.bankrupt && p.pos === tile.i);
  const corner = tile.side === 'corner';

  const style: CSSProperties & Record<string, string> = {
    gridRow: String(tile.row),
    gridColumn: String(tile.col),
    ...(tile.group ? { ['--band']: GROUP_INK[tile.group] } : {}),
    ...(owner ? { ['--own']: TOKEN_INK[owner.token % TOKEN_INK.length] } : {}),
  } as CSSProperties & Record<string, string>;

  const showBand = tile.kind === 'street';

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
      {showBand && (
        <div className="mp-band">
          <Buildings houses={deed?.houses ?? 0} />
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
            {!showBand && <span className="mp-glyph">{KIND_GLYPH[tile.kind] ?? '◆'}</span>}
            <span className="mp-name">{tile.kind === 'fortune' || tile.kind === 'ledger' ? copy.kind[tile.kind] : tile.name}</span>
            {tile.price > 0 && <span className="mp-price">{money(tile.price)}</span>}
            {tile.tax > 0 && <span className="mp-price">{money(tile.tax)}</span>}
          </>
        )}
      </div>

      {here.length > 0 && (
        <div className="mp-tokens">
          {here.map((player) => (
            <span
              key={player.id}
              className="mp-token"
              data-turn={room.activeId === player.id}
              style={{ ['--tok']: TOKEN_INK[player.token % TOKEN_INK.length] } as CSSProperties}
            >
              {TOKEN_GLYPH[player.token % TOKEN_GLYPH.length]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface BoardProps {
  room: RoomView;
  copy: Copy;
  rolling: boolean;
  onOpen: (tile: number) => void;
}

export default function BoardView({ room, copy, rolling, onOpen }: BoardProps) {
  const active = room.players.find((p) => p.id === room.activeId) ?? null;

  return (
    <div className="mp-boardwrap">
      <div className="mp-board">
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
            <p className="mp-turnline">
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
      </div>
    </div>
  );
}
