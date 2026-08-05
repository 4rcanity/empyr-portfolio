import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { GROUP_INK, GROUP_SHADE, OWNABLE, TILES, rentPreview } from './board';
import { Seal } from './avatars';
import { fill, money, type Copy } from './copy';
import type { Inbound, RoomView, TradeBundle } from './protocol';

type Send = (message: Inbound) => void;

function Scrim({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="mp-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mp-modal">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- title deed */

export function DeedModal({
  tile,
  room,
  copy,
  onClose,
}: {
  tile: number;
  room: RoomView;
  copy: Copy;
  onClose: () => void;
}) {
  const meta = TILES[tile];
  const deed = room.deeds[tile] ?? null;
  const owner = deed?.owner ? room.players.find((p) => p.id === deed.owner) : null;
  const band = meta.group ? GROUP_INK[meta.group] : '#3d4a55';
  const shade = meta.group ? GROUP_SHADE[meta.group] : '#1e262d';

  return (
    <Scrim onClose={onClose}>
      <div
        className="mp-deed"
        data-big="true"
        style={{ ['--band']: band, ['--band-2']: shade } as CSSProperties}
      >
        <div className="mp-deed-top">
          <span>{meta.name}</span>
          <span>{meta.group ? copy.groupName[meta.group] : copy.kind[meta.kind]}</span>
        </div>
        <div className="mp-deed-body">
          {meta.kind === 'street' && (
            <table className="mp-rent">
              <tbody>
                <tr>
                  <td>{copy.priceLabel}</td>
                  <td>{money(meta.price)}</td>
                </tr>
                <tr>
                  <td>{copy.rentLabel}</td>
                  <td>{money(meta.rent[0])}</td>
                </tr>
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td>{fill(copy.rentWithHouses, { n })}</td>
                    <td>{money(meta.rent[n])}</td>
                  </tr>
                ))}
                <tr>
                  <td>{copy.rentHotel}</td>
                  <td>{money(meta.rent[5])}</td>
                </tr>
                <tr>
                  <td>{copy.houseCostLabel}</td>
                  <td>{money(meta.houseCost)}</td>
                </tr>
                <tr>
                  <td>{copy.mortgageLabel}</td>
                  <td>{money(meta.mortgage)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {(meta.kind === 'rail' || meta.kind === 'util') && (
            <table className="mp-rent">
              <tbody>
                <tr>
                  <td>{copy.priceLabel}</td>
                  <td>{money(meta.price)}</td>
                </tr>
                {meta.kind === 'rail' ? (
                  [1, 2, 3, 4].map((n) => (
                    <tr key={n}>
                      <td>{fill(copy.railOwned, { n })}</td>
                      <td>{money(25 * 2 ** (n - 1))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{copy.utilRate}</td>
                    <td>4× / 10×</td>
                  </tr>
                )}
                <tr>
                  <td>{copy.mortgageLabel}</td>
                  <td>{money(meta.mortgage)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {meta.kind === 'tax' && (
            <p className="mp-note">
              {copy.kind.tax} — {money(meta.tax)}
            </p>
          )}
          {!meta.group && meta.kind !== 'tax' && <p className="mp-note">{copy.kind[meta.kind]}</p>}

          {meta.group && (
            <p className="mp-note mp-owned" style={{ marginTop: '0.5rem' }}>
              {owner && <Seal token={owner.token} label={owner.name} />}
              {owner ? fill(copy.ownedBy, { a: owner.name }) : copy.unowned}
              {deed && !deed.mortgaged && owner
                ? ` · ${copy.rentLabel} ${money(rentPreview(meta, room.deeds, room.settings.doubleRent))}`
                : ''}
              {deed?.mortgaged ? ` · ${copy.mortgagedTag}` : ''}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        className="mp-btn"
        data-tone="ghost"
        style={{ marginTop: '0.8rem' }}
        onClick={onClose}
      >
        {copy.cancel}
      </button>
    </Scrim>
  );
}

/* ----------------------------------------------------------------- auction */

export function AuctionModal({
  room,
  copy,
  youId,
  seconds,
  send,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  seconds: number;
  send: Send;
}) {
  const auction = room.auction!;
  const meta = TILES[auction.tile];
  const you = room.players.find((p) => p.id === youId) ?? null;
  const leader = auction.leaderId ? room.players.find((p) => p.id === auction.leaderId) : null;
  const live = auction.liveIds.includes(youId);
  const [custom, setCustom] = useState('');

  const minimum = auction.bid + 1;
  const cash = you?.cash ?? 0;

  const bid = (amount: number) => {
    if (amount > cash) return;
    send({ t: 'bid', amount });
    setCustom('');
  };

  return (
    <div className="mp-scrim">
      <div className="mp-modal" style={{ width: 'min(30rem, 100%)' }}>
        <h2 className="mp-modal-title">{copy.auctionTitle}</h2>
        <p className="mp-modal-sub">{copy.auctionSub}</p>

        <div
          className="mp-cardface"
          data-kicker={meta.group ? copy.groupName[meta.group] : copy.kind[meta.kind]}
        >
          {meta.name} · {copy.priceLabel} {money(meta.price)}
        </div>

        <div style={{ margin: '0.9rem 0 0.3rem' }}>
          <p className="mp-label">{copy.standingBid}</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'var(--serif)' }} className="mp-num">
            {auction.bid > 0 ? money(auction.bid) : copy.noBidYet}
            {leader && (
              <span className="mp-leader">
                <Seal token={leader.token} label={leader.name} turn />
                {leader.name} {copy.leading}
              </span>
            )}
          </p>
        </div>

        <p className="mp-label">
          {copy.auctionClock} {Math.max(0, seconds)}s
        </p>
        <div className="mp-timer" data-low={seconds <= 5}>
          <i style={{ width: `${Math.max(0, Math.min(100, (seconds / room.settings.auctionSeconds) * 100))}%` }} />
        </div>

        {live ? (
          <>
            <div className="mp-bidrow">
              {[10, 25, 50, 100].map((step) => {
                const amount = Math.max(minimum, auction.bid + step);
                return (
                  <button
                    key={step}
                    type="button"
                    className="mp-btn"
                    data-size="sm"
                    data-tone="ghost"
                    disabled={amount > cash}
                    onClick={() => bid(amount)}
                  >
                    +{step}
                  </button>
                );
              })}
            </div>
            <div className="mp-row" style={{ marginTop: '0.4rem' }}>
              <input
                className="mp-input"
                inputMode="numeric"
                placeholder={String(minimum)}
                value={custom}
                onChange={(event) => setCustom(event.target.value.replace(/[^0-9]/g, ''))}
              />
              <button
                type="button"
                className="mp-btn"
                data-tone="green"
                disabled={!custom || Number(custom) < minimum || Number(custom) > cash}
                onClick={() => bid(Number(custom))}
              >
                {copy.placeBid}
              </button>
            </div>
            <button
              type="button"
              className="mp-btn"
              data-tone="ghost"
              style={{ marginTop: '0.4rem' }}
              onClick={() => send({ t: 'passBid' })}
            >
              {copy.passBid}
            </button>
          </>
        ) : (
          <p className="mp-note" style={{ marginTop: '0.8rem' }}>
            {you ? copy.youPassed : copy.spectating}
          </p>
        )}

        {you && (
          <p className="mp-note" style={{ marginTop: '0.6rem' }}>
            {copy.cash} {money(cash)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- trade */

const EMPTY: TradeBundle = { cash: 0, tiles: [], jailCards: 0 };

function DeedPicker({
  tiles,
  chosen,
  onToggle,
  empty,
}: {
  tiles: number[];
  chosen: number[];
  onToggle: (tile: number) => void;
  empty: string;
}) {
  if (tiles.length === 0) return <p className="mp-empty">{empty}</p>;
  return (
    <div className="mp-pickbox">
      {tiles.map((tile) => (
        <button
          type="button"
          key={tile}
          className="mp-pick"
          data-on={chosen.includes(tile)}
          style={
            {
              ['--band']: GROUP_INK[TILES[tile].group ?? 'rail'],
              ['--band-2']: GROUP_SHADE[TILES[tile].group ?? 'rail'],
            } as CSSProperties
          }
          onClick={() => onToggle(tile)}
        >
          {TILES[tile].name}
        </button>
      ))}
    </div>
  );
}

export function TradeModal({
  room,
  copy,
  youId,
  send,
  onClose,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  send: Send;
  onClose: () => void;
}) {
  const you = room.players.find((p) => p.id === youId) ?? null;
  const rivals = room.players.filter((p) => p.id !== youId && !p.bankrupt);
  const [withId, setWithId] = useState(rivals[0]?.id ?? '');
  const [give, setGive] = useState<TradeBundle>({ ...EMPTY, tiles: [] });
  const [want, setWant] = useState<TradeBundle>({ ...EMPTY, tiles: [] });

  useEffect(() => {
    setGive({ cash: 0, tiles: [], jailCards: 0 });
    setWant({ cash: 0, tiles: [], jailCards: 0 });
  }, [withId]);

  const partner = rivals.find((p) => p.id === withId) ?? null;

  const myTiles = useMemo(
    () => OWNABLE.filter((tile) => room.deeds[tile]?.owner === youId && room.deeds[tile]!.houses === 0),
    [room.deeds, youId],
  );
  const theirTiles = useMemo(
    () =>
      partner
        ? OWNABLE.filter((tile) => room.deeds[tile]?.owner === partner.id && room.deeds[tile]!.houses === 0)
        : [],
    [room.deeds, partner],
  );

  const toggle = (
    bundle: TradeBundle,
    setter: (next: TradeBundle) => void,
    tile: number,
  ) => {
    const has = bundle.tiles.includes(tile);
    setter({
      ...bundle,
      tiles: has ? bundle.tiles.filter((t) => t !== tile) : [...bundle.tiles, tile],
    });
  };

  const empty =
    give.cash + give.tiles.length + give.jailCards + want.cash + want.tiles.length + want.jailCards === 0;

  return (
    <Scrim onClose={onClose}>
      <h2 className="mp-modal-title">{copy.tradeTitle}</h2>
      <p className="mp-modal-sub">{copy.tradeHint}</p>

      <div className="mp-field">
        <span className="mp-label">{copy.tradeWith}</span>
        <div className="mp-partners" role="radiogroup" aria-label={copy.tradeWith}>
          {rivals.map((rival) => (
            <button
              type="button"
              key={rival.id}
              className="mp-partner"
              role="radio"
              aria-checked={rival.id === withId}
              data-on={rival.id === withId}
              onClick={() => setWithId(rival.id)}
            >
              <Seal token={rival.token} turn={rival.id === withId} />
              <span>{rival.name}</span>
              <b className="mp-num">{money(rival.cash)}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="mp-split">
        <div>
          <p className="mp-head">{copy.youOffer}</p>
          <div className="mp-field">
            <span className="mp-label">
              {copy.tradeCash} · {money(you?.cash ?? 0)}
            </span>
            <input
              className="mp-input"
              inputMode="numeric"
              value={give.cash || ''}
              placeholder="0"
              onChange={(event) =>
                setGive({ ...give, cash: Math.max(0, Number(event.target.value.replace(/[^0-9]/g, '')) || 0) })
              }
            />
          </div>
          <span className="mp-label">{copy.tradeDeeds}</span>
          <DeedPicker
            tiles={myTiles}
            chosen={give.tiles}
            empty={copy.tradeNoDeeds}
            onToggle={(tile) => toggle(give, setGive, tile)}
          />
          {(you?.jailCards ?? 0) > 0 && (
            <div className="mp-field" style={{ marginTop: '0.5rem' }}>
              <span className="mp-label">
                {copy.tradeJailCards} · {you?.jailCards}
              </span>
              <input
                className="mp-input"
                inputMode="numeric"
                value={give.jailCards || ''}
                placeholder="0"
                onChange={(event) =>
                  setGive({
                    ...give,
                    jailCards: Math.min(
                      you?.jailCards ?? 0,
                      Math.max(0, Number(event.target.value.replace(/[^0-9]/g, '')) || 0),
                    ),
                  })
                }
              />
            </div>
          )}
        </div>

        <div>
          <p className="mp-head">{copy.youAskFor}</p>
          <div className="mp-field">
            <span className="mp-label">
              {copy.tradeCash} · {money(partner?.cash ?? 0)}
            </span>
            <input
              className="mp-input"
              inputMode="numeric"
              value={want.cash || ''}
              placeholder="0"
              onChange={(event) =>
                setWant({ ...want, cash: Math.max(0, Number(event.target.value.replace(/[^0-9]/g, '')) || 0) })
              }
            />
          </div>
          <span className="mp-label">{copy.tradeDeeds}</span>
          <DeedPicker
            tiles={theirTiles}
            chosen={want.tiles}
            empty={copy.tradeNoDeeds}
            onToggle={(tile) => toggle(want, setWant, tile)}
          />
          {(partner?.jailCards ?? 0) > 0 && (
            <div className="mp-field" style={{ marginTop: '0.5rem' }}>
              <span className="mp-label">
                {copy.tradeJailCards} · {partner?.jailCards}
              </span>
              <input
                className="mp-input"
                inputMode="numeric"
                value={want.jailCards || ''}
                placeholder="0"
                onChange={(event) =>
                  setWant({
                    ...want,
                    jailCards: Math.min(
                      partner?.jailCards ?? 0,
                      Math.max(0, Number(event.target.value.replace(/[^0-9]/g, '')) || 0),
                    ),
                  })
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="mp-row" style={{ marginTop: '1rem' }}>
        <button type="button" className="mp-btn" data-tone="ghost" onClick={onClose}>
          {copy.cancel}
        </button>
        <button
          type="button"
          className="mp-btn"
          data-tone="green"
          disabled={!partner || empty}
          onClick={() => {
            if (!partner) return;
            send({ t: 'trade', to: partner.id, give, want });
            onClose();
          }}
        >
          {copy.propose}
        </button>
      </div>
    </Scrim>
  );
}

/* --------------------------------------------------------- incoming offer */

export function OfferModal({
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
  const trade = room.trade!;
  const from = room.players.find((p) => p.id === trade.fromId);
  const mine = trade.toId === youId;

  const line = (bundle: TradeBundle) =>
    [
      bundle.cash > 0 ? money(bundle.cash) : null,
      ...bundle.tiles.map((tile) => TILES[tile].name),
      bundle.jailCards > 0 ? `${bundle.jailCards} × ${copy.tradeJailCards}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || '—';

  return (
    <div className="mp-scrim">
      <div className="mp-modal" style={{ width: 'min(30rem, 100%)' }}>
        <h2 className="mp-modal-title mp-title-row">
          {from && <Seal token={from.token} label={from.name} turn />}
          {fill(copy.incomingTrade, { a: from?.name ?? '?' })}
        </h2>
        <p className="mp-modal-sub">{copy.tradeTitle}</p>

        <div className="mp-cardface" data-kicker={mine ? copy.youAskFor : copy.youOffer}>
          {line(trade.give)}
        </div>
        <div className="mp-cardface" data-kicker={mine ? copy.youOffer : copy.youAskFor} style={{ marginTop: '1rem' }}>
          {line(trade.want)}
        </div>

        {mine ? (
          <div className="mp-row" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="mp-btn"
              data-tone="ghost"
              onClick={() => send({ t: 'tradeRespond', accept: false })}
            >
              {copy.refuse}
            </button>
            <button
              type="button"
              className="mp-btn"
              data-tone="green"
              onClick={() => send({ t: 'tradeRespond', accept: true })}
            >
              {copy.accept}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <p className="mp-note">{copy.awaitingAnswer}</p>
            <button
              type="button"
              className="mp-btn"
              data-tone="red"
              style={{ marginTop: '0.5rem' }}
              onClick={() => send({ t: 'tradeCancel' })}
            >
              {copy.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ winner */

export function WinnerOverlay({
  room,
  copy,
  youId,
  isHost,
  send,
}: {
  room: RoomView;
  copy: Copy;
  youId: string;
  isHost: boolean;
  send: Send;
}) {
  const winner = room.players.find((p) => p.id === room.winnerId) ?? null;
  return (
    <div className="mp-winner">
      <div className="mp-winner-card">
        <p className="mp-label">{copy.brand}</p>
        {winner && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Seal token={winner.token} label={winner.name} turn />
          </div>
        )}
        <h2>{winner?.id === youId ? copy.youWin : fill(copy.winnerTitle, { a: winner?.name ?? '—' })}</h2>
        <p>
          {copy.netWorth} {money(winner?.netWorth ?? 0)}
        </p>
        {isHost && (
          <button type="button" className="mp-btn" onClick={() => send({ t: 'again' })}>
            {copy.playAgain}
          </button>
        )}
      </div>
    </div>
  );
}
