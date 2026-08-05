import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { GROUP_INK, GROUP_SHADE, OWNABLE, TILES } from './board';
import { Seal } from './avatars';
import { fill, logText, money, type Copy } from './copy';
import type { Inbound, PlayerView, RoomView, Settings, TradeBundle } from './protocol';

type Send = (message: Inbound) => void;

export function Pin({ player, turn = false }: { player: PlayerView; turn?: boolean }) {
  return <Seal token={player.token} label={player.name} turn={turn} out={player.bankrupt} />;
}

/** Cash with a one-shot tint whenever the balance moves, so money is felt, not just read. */
function Cash({ value }: { value: number }) {
  const previous = useRef(value);
  const [swing, setSwing] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previous.current === value) return;
    setSwing(value > previous.current ? 'up' : 'down');
    previous.current = value;
    const timer = window.setTimeout(() => setSwing(null), 900);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <b className="mp-cash" data-swing={swing ?? undefined}>
      {money(value)}
    </b>
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
    <section className="mp-panel">
      <p className="mp-head">{copy.seatsTitle}</p>
      {room.players.map((player) => (
        <div
          key={player.id}
          className="mp-seat"
          data-turn={room.activeId === player.id}
          data-out={player.bankrupt}
        >
          <Pin player={player} turn={room.activeId === player.id} />
          <span className="mp-seat-name">
            {player.name}
            {player.host && <i className="mp-tag" data-tone="gold">{copy.hostTag}</i>}
            {player.id === youId && <i className="mp-tag" data-tone="you">{copy.youTag}</i>}
            {!player.online && <i className="mp-tag" data-tone="red">{copy.offline}</i>}
            {player.jail !== null && <i className="mp-tag" data-tone="red">{copy.inJail}</i>}
            {player.bankrupt && <i className="mp-tag" data-tone="red">{copy.bankrupt}</i>}
            {room.phase === 'lobby' && player.ready && (
              <i className="mp-tag" data-tone="green">{copy.ready}</i>
            )}
          </span>
          {showMoney ? (
            <span className="mp-money">
              <Cash value={player.cash} />
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
    </section>
  );
}

/* -------------------------------------------------------------------- feed */

export function LogFeed({ room, copy }: { room: RoomView; copy: Copy }) {
  return (
    <section className="mp-panel">
      <p className="mp-head">{copy.feedTitle}</p>
      <div className="mp-feed">
        {room.log.length === 0 && <p className="mp-empty">{copy.feedEmpty}</p>}
        {[...room.log].reverse().map((line) => (
          <p key={line.id} className="mp-line" data-tone={line.tone}>
            {logText(copy, line)}
          </p>
        ))}
      </div>
    </section>
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
    <section className="mp-panel">
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
    </section>
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
    <section className="mp-panel">
      <p className="mp-head">{copy.deedsTitle}</p>
      {mine.length === 0 && <p className="mp-empty">{copy.noDeeds}</p>}
      <div className="mp-deeds">
        {mine.map((index) => {
          const tile = TILES[index];
          const deed = room.deeds[index]!;
          const group = tile.group ?? 'rail';
          const canBuild = tile.kind === 'street' && deed.houses < 5 && !deed.mortgaged;
          return (
            <div
              className="mp-deed"
              key={index}
              data-mortgaged={deed.mortgaged}
              style={
                {
                  ['--band']: GROUP_INK[group],
                  ['--band-2']: GROUP_SHADE[group],
                } as CSSProperties
              }
            >
              <div className="mp-deed-top">
                <button type="button" className="mp-deed-open" onClick={() => onInspect(index)}>
                  {tile.name}
                </button>
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
    </section>
  );
}

/* ------------------------------------------------------------------ trades */

function bundleLine(bundle: TradeBundle, copy: Copy): string {
  const parts = [
    bundle.cash > 0 ? money(bundle.cash) : null,
    ...bundle.tiles.map((tile) => TILES[tile].name),
    bundle.jailCards > 0 ? `${bundle.jailCards} × ${copy.tradeJailCards}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : copy.tradeNothing;
}

/**
 * Permanent home for trading. The wire format carries at most one live offer, so this
 * shows either the empty pitch or the single pending offer, always in the side rail.
 */
export function TradeRail({
  room,
  copy,
  youId,
  send,
  onCreate,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  send: Send;
  onCreate: () => void;
}) {
  const you = room.players.find((p) => p.id === youId) ?? null;
  const rivals = room.players.filter((p) => p.id !== youId && !p.bankrupt);
  const trade = room.trade;
  const involved = trade && (trade.fromId === youId || trade.toId === youId);
  const incoming = trade?.toId === youId;
  const from = trade ? (room.players.find((p) => p.id === trade.fromId) ?? null) : null;
  const to = trade ? (room.players.find((p) => p.id === trade.toId) ?? null) : null;
  const canCreate = Boolean(you) && !you?.bankrupt && !trade && rivals.length > 0;

  return (
    <section className="mp-panel" data-accent={incoming ? 'live' : undefined}>
      <p className="mp-head mp-head-row">
        {copy.tradesTitle}
        <button
          type="button"
          className="mp-btn"
          data-size="sm"
          data-tone="gold"
          data-auto="true"
          disabled={!canCreate}
          onClick={onCreate}
        >
          {copy.tradeCreate}
        </button>
      </p>

      {!trade && (
        <div className="mp-pitch">
          <span className="mp-pitch-mark" aria-hidden="true">
            ⇄
          </span>
          <p className="mp-note">{copy.tradesEmpty}</p>
          {rivals.length === 0 && <p className="mp-empty">{copy.tradeNoRivals}</p>}
        </div>
      )}

      {trade && !involved && (
        <p className="mp-empty">
          {fill(copy.tradeElsewhere, { a: from?.name ?? '?', b: to?.name ?? '?' })}
        </p>
      )}

      {trade && involved && from && to && (
        <div className="mp-offer" data-incoming={incoming}>
          <p className="mp-offer-head">
            {incoming ? copy.tradeIncoming : copy.tradeOutgoing}
          </p>
          <div className="mp-offer-side">
            <Pin player={from} />
            <div>
              <span className="mp-label">{fill(copy.tradeGives, { a: from.name })}</span>
              <p className="mp-offer-line">{bundleLine(trade.give, copy)}</p>
            </div>
          </div>
          <div className="mp-offer-side">
            <Pin player={to} />
            <div>
              <span className="mp-label">{fill(copy.tradeGives, { a: to.name })}</span>
              <p className="mp-offer-line">{bundleLine(trade.want, copy)}</p>
            </div>
          </div>

          {incoming ? (
            <div className="mp-row">
              <button
                type="button"
                className="mp-btn"
                data-size="sm"
                data-tone="ghost"
                onClick={() => send({ t: 'tradeRespond', accept: false })}
              >
                {copy.refuse}
              </button>
              <button
                type="button"
                className="mp-btn"
                data-size="sm"
                data-tone="green"
                onClick={() => send({ t: 'tradeRespond', accept: true })}
              >
                {copy.accept}
              </button>
            </div>
          ) : (
            <>
              <p className="mp-note">{copy.awaitingAnswer}</p>
              <button
                type="button"
                className="mp-btn"
                data-size="sm"
                data-tone="ghost"
                onClick={() => send({ t: 'tradeCancel' })}
              >
                {copy.tradeWithdraw}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- bankruptcy */

/** Two-step fold. The consequence is spelled out before the second press arms. */
export function FoldPanel({
  room,
  copy,
  youId,
  send,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  send: Send;
}) {
  const you = room.players.find((p) => p.id === youId) ?? null;
  const debt = room.debt && room.debt.playerId === youId ? room.debt : null;
  const creditor = debt?.toId ? (room.players.find((p) => p.id === debt.toId) ?? null) : null;
  const [arming, setArming] = useState(false);

  useEffect(() => {
    if (!debt) setArming(false);
  }, [debt]);

  if (!you || you.bankrupt) return null;

  return (
    <section className="mp-panel" data-accent={debt ? 'danger' : undefined}>
      <p className="mp-head">{copy.foldTitle}</p>

      {debt ? (
        <p className="mp-note">
          {creditor ? fill(copy.debtOwed, { a: creditor.name }) : copy.debtToBank} ·{' '}
          <b className="mp-num">{money(debt.amount)}</b>
        </p>
      ) : (
        !arming && <p className="mp-note">{copy.foldLocked}</p>
      )}

      {arming ? (
        <div className="mp-confirm">
          <p className="mp-confirm-body">
            {!debt
              ? copy.foldLocked
              : creditor
                ? fill(copy.foldConfirmTo, { a: creditor.name })
                : copy.foldConfirmBank}
          </p>
          <div className="mp-row">
            <button
              type="button"
              className="mp-btn"
              data-size="sm"
              data-tone="ghost"
              onClick={() => setArming(false)}
            >
              {copy.foldKeepPlaying}
            </button>
            <button
              type="button"
              className="mp-btn"
              data-size="sm"
              data-tone="red"
              disabled={!debt}
              onClick={() => {
                setArming(false);
                send({ t: 'bankrupt' });
              }}
            >
              {copy.foldConfirm}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mp-btn"
          data-tone="red"
          style={{ marginTop: '0.6rem' }}
          onClick={() => setArming(true)}
        >
          {copy.declareBankrupt}
        </button>
      )}
    </section>
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
    <section className="mp-panel" data-accent={yours ? 'live' : undefined}>
      <p className="mp-head mp-head-row">
        <span className="mp-turnhead">
          {active && <Pin player={active} turn />}
          {yours ? copy.yourTurn : fill(copy.turnOf, { a: active?.name ?? '—' })}
        </span>
        {room.turnEndsAt !== null && (
          <span className="mp-clock mp-num" data-low={seconds <= 10}>
            {seconds}s
          </span>
        )}
      </p>

      {room.turnEndsAt !== null && (
        <div className="mp-timer" data-low={seconds <= 10}>
          <i style={{ width: `${pct}%` }} />
        </div>
      )}

      {(!you || you.bankrupt) && (
        <p className="mp-note" style={{ marginTop: '0.6rem' }}>{copy.spectating}</p>
      )}

      {you && !yours && !you.bankrupt && (
        <div className="mp-acts">
          <button type="button" className="mp-btn" data-tone="ghost" onClick={onTrade}>
            {copy.tradeOpen}
          </button>
        </div>
      )}

      {yours && (
        <div className="mp-acts">
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
            <div className="mp-row">
              <button type="button" className="mp-btn" data-tone="ghost" onClick={onTrade}>
                {copy.tradeOpen}
              </button>
              <button type="button" className="mp-btn" onClick={() => send({ t: 'endTurn' })}>
                {room.doubles > 0 ? copy.rollAgain : copy.endTurn}
              </button>
            </div>
          )}
        </div>
      )}

      {debt && (
        <div className="mp-debt">
          <p className="mp-debt-head">
            {copy.debtTitle} — <span className="mp-num">{money(debt.amount)}</span>
          </p>
          <p className="mp-note">
            {creditor ? fill(copy.debtOwed, { a: creditor.name }) : copy.debtToBank}
          </p>
          <p className="mp-note">{copy.debtBody}</p>
        </div>
      )}
    </section>
  );
}
