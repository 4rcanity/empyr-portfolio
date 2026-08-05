/** Wire format shared by the EMPYR LEDGER (monopoly) worker and its browser client.
 *  The client keeps a byte-identical standalone mirror at src/games/monopoly/protocol.ts. */

export type Group =
  | 'brown'
  | 'lblue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dblue'
  | 'rail'
  | 'util';

export type TileKind =
  | 'go'
  | 'street'
  | 'rail'
  | 'util'
  | 'fortune'
  | 'ledger'
  | 'tax'
  | 'jail'
  | 'vacation'
  | 'arrest';

export type Phase = 'lobby' | 'play' | 'over';

/** What the active player is allowed to do right now. */
export type Stage = 'roll' | 'jail' | 'buy' | 'manage' | 'debt';

export interface Settings {
  startCash: number;
  salary: number;
  /** Double rent on a complete, unimproved colour group. */
  doubleRent: boolean;
  /** Taxes and fees pile up on Vacation instead of vanishing into the bank. */
  vacationCash: boolean;
  auctions: boolean;
  evenBuild: boolean;
  /** Owners sitting in jail collect no rent. */
  noRentInJail: boolean;
  /** Percent added when lifting a mortgage. */
  mortgageInterest: number;
  turnSeconds: number;
  auctionSeconds: number;
  maxHouses: number;
  maxHotels: number;
  capacity: number;
}

export const DEFAULT_SETTINGS: Settings = {
  startCash: 1500,
  salary: 200,
  doubleRent: true,
  vacationCash: false,
  auctions: true,
  evenBuild: true,
  noRentInJail: false,
  mortgageInterest: 10,
  turnSeconds: 90,
  auctionSeconds: 20,
  maxHouses: 32,
  maxHotels: 12,
  capacity: 8,
};

const clampInt = (value: unknown, low: number, high: number, fallback: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(high, Math.max(low, n));
};

export function clampSettings(patch: Partial<Settings>, base: Settings): Settings {
  const next = { ...base, ...patch };
  return {
    startCash: clampInt(next.startCash, 200, 50_000, base.startCash),
    salary: clampInt(next.salary, 0, 5_000, base.salary),
    doubleRent: Boolean(next.doubleRent),
    vacationCash: Boolean(next.vacationCash),
    auctions: Boolean(next.auctions),
    evenBuild: Boolean(next.evenBuild),
    noRentInJail: Boolean(next.noRentInJail),
    mortgageInterest: clampInt(next.mortgageInterest, 0, 100, base.mortgageInterest),
    turnSeconds: clampInt(next.turnSeconds, 20, 300, base.turnSeconds),
    auctionSeconds: clampInt(next.auctionSeconds, 8, 90, base.auctionSeconds),
    maxHouses: clampInt(next.maxHouses, 8, 200, base.maxHouses),
    maxHotels: clampInt(next.maxHotels, 4, 100, base.maxHotels),
    capacity: clampInt(next.capacity, 2, 8, base.capacity),
  };
}

export interface PlayerView {
  id: string;
  name: string;
  /** Token palette index 0-7. */
  token: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  cash: number;
  pos: number;
  /** Turns served so far; null when not locked up. */
  jail: number | null;
  jailCards: number;
  bankrupt: boolean;
  netWorth: number;
}

/** One of the 40 squares, as owned state. `null` for squares nobody can own. */
export interface DeedView {
  owner: string | null;
  houses: number;
  mortgaged: boolean;
}

export interface AuctionView {
  tile: number;
  bid: number;
  leaderId: string | null;
  endsAt: number;
  /** Still allowed to bid. */
  liveIds: string[];
}

export interface TradeBundle {
  cash: number;
  tiles: number[];
  jailCards: number;
}

export interface TradeView {
  id: number;
  fromId: string;
  toId: string;
  give: TradeBundle;
  want: TradeBundle;
}

export interface DebtView {
  playerId: string;
  amount: number;
  /** Creditor, or null when the bank is owed. */
  toId: string | null;
}

/** Log lines travel as codes + args so each client renders them in its own language. */
export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'deal';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  stage: Stage;
  settings: Settings;
  players: PlayerView[];
  order: string[];
  activeId: string | null;
  dice: [number, number] | null;
  doubles: number;
  /** 40 entries; `null` where the square cannot be owned. */
  deeds: (DeedView | null)[];
  /** Square awaiting a buy / decline from the active player. */
  offerTile: number | null;
  auction: AuctionView | null;
  trade: TradeView | null;
  debt: DebtView | null;
  vacationPot: number;
  housesLeft: number;
  hotelsLeft: number;
  /** Card id drawn most recently, so clients can show the card face. */
  lastCard: string | null;
  turnEndsAt: number | null;
  now: number;
  winnerId: string | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'settings'; patch: Partial<Settings> }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'roll' }
  | { t: 'jail'; how: 'pay' | 'card' | 'roll' }
  | { t: 'buy' }
  | { t: 'decline' }
  | { t: 'build'; tile: number }
  | { t: 'sell'; tile: number }
  | { t: 'mortgage'; tile: number }
  | { t: 'unmortgage'; tile: number }
  | { t: 'bid'; amount: number }
  | { t: 'passBid' }
  | { t: 'trade'; to: string; give: TradeBundle; want: TradeBundle }
  | { t: 'tradeRespond'; accept: boolean }
  | { t: 'tradeCancel' }
  | { t: 'bankrupt' }
  | { t: 'endTurn' }
  | { t: 'again' };

export type FxKind =
  | 'dice'
  | 'buy'
  | 'rent'
  | 'card'
  | 'jail'
  | 'build'
  | 'trade'
  | 'auction'
  | 'bust'
  | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; playerId?: string; text?: string };
