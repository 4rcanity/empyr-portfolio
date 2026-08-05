import type { CSSProperties } from 'react';
import { GROUP_INK, OWNABLE, TILES, TOKEN_GLYPH, TOKEN_INK } from './board';
import { fill, logText, money, type Copy } from './copy';
import type { Inbound, PlayerView, RoomView, Settings } from './protocol';

type Send = (message: Inbound) => void;

const tokenStyle = (token: number): CSSProperties =>
  ({ ['--tok']: TOKEN_INK[token % TOKEN_INK.length] }) as CSSProperties;

export function Pin({ player }: { player: PlayerView }) {
  return (
    <span className="mp-pin" style={tokenStyle(player.token)}>
      {TOKEN_GLYPH[player.token % TOKEN_GLYPH.length]}
    </span>
  );
}

/* ------------------------------------------------------------------- seats */

export function SeatRail({
  room,
  copy,
  youId,
  showMoney,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  showMoney: boolean;
}) {
  return (
    <div className="mp-panel">
      <p className="mp-head">{copy.seatsTitle}</p>
      {room.players.map((player) => (
        <div
          key={player.id}
          className="mp-seat"
          data-turn={room.activeId === player.id}
          data-out={player.bankrupt}
        >
          <Pin player={player} />
          <span className="mp-seat-name">
            {player.name}
            {player.host && <i className="mp-tag" data-tone="gold">{copy.hostTag}</i>}
            {player.id === youId && <i className="mp-tag">{copy.youTag}</i>}
            {!player.online && <i className="mp-tag" data-tone="red">{copy.offline}</i>}
            {player.jail !== null && <i className="mp-tag" data-tone="red">{copy.inJail}</i>}
            {player.bankrupt && <i className="mp-tag" data-tone="red">{copy.bankrupt}</i>}
            {room.phase === 'lobby' && player.ready && (
              <i className="mp-tag" data-tone="green">{copy.ready}</i>
            )}
          </span>
          {showMoney ? (
            <span className="mp-money">
              <b>{money(player.cash)}</b>
              <small>
                {copy.netWorth} {money(player.netWorth)}
              </small>
            </span>
          ) : (
            <span className="mp-money">
              <small>{player.ready ? copy.ready : copy.unready}</small>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- feed */

export function LogFeed({ room, copy }: { room: RoomView; copy: Copy }) {
  return (
    <div className="mp-panel">
      <p className="mp-head">{copy.feedTitle}</p>
      <div className="mp-feed">
        {room.log.length === 0 && <p className="mp-empty">—</p>}
        {[...room.log].reverse().map((line) => (
          <p key={line.id} className="mp-line" data-tone={line.tone}>
            {logText(copy, line)}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- settings */

const NUMBERS: (keyof Settings)[] = [
  'startCash',
  'salary',
  'mortgageInterest',
  'turnSeconds',
  'auctionSeconds',
  'maxHouses',
  'maxHotels',
  'capacity',
];

const FLAGS: (keyof Settings)[] = [
  'doubleRent',
  'auctions',
  'evenBuild',
  'vacationCash',
  'noRentInJail',
];

export function SettingsPanel({
  room,
  copy,
  canEdit,
  send,
}: {
  room: RoomView;
  copy: Copy;
  canEdit: boolean;
  send: Send;
}) {
  const patch = (key: keyof Settings, value: number | boolean) =>
    send({ t: 'settings', patch: { [key]: value } as Partial<Settings> });

  return (
    <div className="mp-panel">
      <p className="mp-head">{copy.settingsTitle}</p>
      <div className="mp-settings">
        {NUMBERS.map((key) => (
          <label className="mp-setting" key={key}>
            <span>{copy.setting[key]}</span>
            <input
              type="number"
              value={room.settings[key] as number}
              disabled={!canEdit}
              onChange={(event) => patch(key, Number(event.target.value))}
            />
          </label>
        ))}
        {FLAGS.map((key) => (
          <div className="mp-setting" key={key}>
            <span>{copy.setting[key]}</span>
            <button
              type="button"
              className="mp-toggle"
              data-on={Boolean(room.settings[key])}
              disabled={!canEdit}
              onClick={() => patch(key, !room.settings[key])}
            >
              {room.settings[key] ? copy.on : copy.off}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ deed manager */

export function DeedManager({
  room,
  copy,
  youId,
  send,
  onInspect,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  send: Send;
  onInspect: (tile: number) => void;
}) {
  const mine = OWNABLE.filter((tile) => room.deeds[tile]?.owner === youId);

  return (
    <div className="mp-panel">
      <p className="mp-head">{copy.deedsTitle}</p>
      {mine.length === 0 && <p className="mp-empty">{copy.noDeeds}</p>}
      <div className="mp-deeds">
        {mine.map((index) => {
          const tile = TILES[index];
          const deed = room.deeds[index]!;
          const band = GROUP_INK[tile.group ?? 'rail'];
          const canBuild = tile.kind === 'street' && deed.houses < 5 && !deed.mortgaged;
          return (
            <div
              className="mp-deed"
              key={index}
              data-mortgaged={deed.mortgaged}
              style={{ ['--band']: band } as CSSProperties}
            >
              <div className="mp-deed-top">
                <span onClick={() => onInspect(index)} style={{ cursor: 'pointer' }}>
                  {tile.name}
                </span>
                <span>
                  {deed.houses === 5
                    ? copy.hotelTag
                    : deed.houses > 0
                      ? fill(copy.housesTag, { n: deed.houses })
                      : ''}
                </span>
              </div>
              <div className="mp-deed-body">
                {deed.mortgaged && (
                  <span className="mp-tag" data-tone="red">
                    {copy.mortgagedTag}
                  </span>
                )}
                <div className="mp-deed-acts">
                  {canBuild && (
                    <button
                      type="button"
                      className="mp-btn"
                      data-size="sm"
                      data-tone="green"
                      onClick={() => send({ t: 'build', tile: index })}
                    >
                      {copy.build} {money(tile.houseCost)}
                    </button>
                  )}
                  {deed.houses > 0 && (
                    <button
                      type="button"
                      className="mp-btn"
                      data-size="sm"
                      data-tone="ghost"
                      onClick={() => send({ t: 'sell', tile: index })}
                    >
                      {copy.sellHouse} {money(Math.floor(tile.houseCost / 2))}
                    </button>
                  )}
                  {!deed.mortgaged && deed.houses === 0 && (
                    <button
                      type="button"
                      className="mp-btn"
                      data-size="sm"
                      data-tone="ghost"
                      onClick={() => send({ t: 'mortgage', tile: index })}
                    >
                      {copy.mortgage} {money(tile.mortgage)}
                    </button>
                  )}
                  {deed.mortgaged && (
                    <button
                      type="button"
                      className="mp-btn"
                      data-size="sm"
                      data-tone="gold"
                      onClick={() => send({ t: 'unmortgage', tile: index })}
                    >
                      {copy.unmortgage}{' '}
                      {money(Math.ceil(tile.mortgage * (1 + room.settings.mortgageInterest / 100)))}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- action deck */

export function ActionPanel({
  room,
  copy,
  youId,
  seconds,
  send,
  onTrade,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  seconds: number;
  send: Send;
  onTrade: () => void;
}) {
  const you = room.players.find((p) => p.id === youId) ?? null;
  const active = room.players.find((p) => p.id === room.activeId) ?? null;
  const yours = room.activeId === youId && !!you && !you.bankrupt;
  const offer = room.offerTile !== null ? TILES[room.offerTile] : null;
  const debt = room.debt && room.debt.playerId === youId ? room.debt : null;
  const creditor = debt?.toId ? room.players.find((p) => p.id === debt.toId) : null;
  const total = Math.max(1, room.settings.turnSeconds);
  const pct = Math.max(0, Math.min(100, (seconds / total) * 100));

  return (
    <div className="mp-panel">
      <p className="mp-head">{yours ? copy.yourTurn : fill(copy.turnOf, { a: active?.name ?? '—' })}</p>

      {room.turnEndsAt !== null && (
        <div className="mp-timer" data-low={seconds <= 10}>
          <i style={{ width: `${pct}%` }} />
        </div>
      )}

      {(!you || you.bankrupt) && (
        <p className="mp-note" style={{ marginTop: '0.6rem' }}>{copy.spectating}</p>
      )}

      {you && !yours && !you.bankrupt && (
        <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.45rem' }}>
          <button type="button" className="mp-btn" data-tone="ghost" onClick={onTrade}>
            {copy.tradeOpen}
          </button>
        </div>
      )}

      {yours && (
        <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.45rem' }}>
          {room.stage === 'roll' && (
            <button type="button" className="mp-btn" onClick={() => send({ t: 'roll' })}>
              {room.doubles > 0 ? copy.rollAgain : copy.roll}
            </button>
          )}

          {room.stage === 'jail' && (
            <>
              <p className="mp-note">{copy.jailSub}</p>
              <p className="mp-note">
                {fill(copy.jailAttempts, { n: Math.max(0, 3 - (you?.jail ?? 0)) })}
              </p>
              <div className="mp-row">
                <button
                  type="button"
                  className="mp-btn"
                  data-tone="gold"
                  data-size="sm"
                  disabled={(you?.cash ?? 0) < 50}
                  onClick={() => send({ t: 'jail', how: 'pay' })}
                >
                  {copy.jailPay}
                </button>
                <button
                  type="button"
                  className="mp-btn"
                  data-size="sm"
                  data-tone="green"
                  disabled={(you?.jailCards ?? 0) < 1}
                  onClick={() => send({ t: 'jail', how: 'card' })}
                >
                  {copy.jailCard}
                </button>
              </div>
              <button type="button" className="mp-btn" onClick={() => send({ t: 'jail', how: 'roll' })}>
                {copy.jailRoll}
              </button>
            </>
          )}

          {room.stage === 'buy' && offer && (
            <>
              <p className="mp-head" style={{ marginBottom: '0.35rem' }}>{copy.offerTitle}</p>
              <div
                className="mp-cardface"
                data-kicker={offer.group ? copy.groupName[offer.group] : copy.kind[offer.kind]}
              >
                {offer.name}
              </div>
              <p className="mp-note">{copy.offerSub}</p>
              <div className="mp-row">
                <button
                  type="button"
                  className="mp-btn"
                  data-tone="green"
                  disabled={(you?.cash ?? 0) < offer.price}
                  onClick={() => send({ t: 'buy' })}
                >
                  {fill(copy.buy, { n: money(offer.price) })}
                </button>
                <button
                  type="button"
                  className="mp-btn"
                  data-tone="ghost"
                  onClick={() => send({ t: 'decline' })}
                >
                  {copy.declineTile}
                </button>
              </div>
            </>
          )}

          {room.stage === 'manage' && (
            <>
              <div className="mp-row">
                <button type="button" className="mp-btn" data-tone="ghost" onClick={onTrade}>
                  {copy.tradeOpen}
                </button>
                <button type="button" className="mp-btn" onClick={() => send({ t: 'endTurn' })}>
                  {room.doubles > 0 ? copy.rollAgain : copy.endTurn}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {debt && (
        <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.45rem' }}>
          <p className="mp-head" style={{ color: 'var(--red)', marginBottom: 0 }}>
            {copy.debtTitle} — {money(debt.amount)}
          </p>
          <p className="mp-note">
            {creditor ? fill(copy.debtOwed, { a: creditor.name }) : copy.debtToBank}
          </p>
          <p className="mp-note">{copy.debtBody}</p>
          <button
            type="button"
            className="mp-btn"
            data-tone="red"
            onClick={() => send({ t: 'bankrupt' })}
          >
            {copy.declareBankrupt}
          </button>
        </div>
      )}
    </div>
  );
}
