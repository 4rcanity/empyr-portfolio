/** Wire format for EMPYR LEDGER. Standalone mirror of server/monopoly/src/protocol.ts —
 *  the browser bundle must never import worker code, so the two are kept in step by hand. */

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
  doubleRent: boolean;
  vacationCash: boolean;
  auctions: boolean;
  evenBuild: boolean;
  noRentInJail: boolean;
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

export interface PlayerView {
  id: string;
  name: string;
  token: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  cash: number;
  pos: number;
  jail: number | null;
  jailCards: number;
  bankrupt: boolean;
  netWorth: number;
}

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
  deeds: (DeedView | null)[];
  offerTile: number | null;
  auction: AuctionView | null;
  trade: TradeView | null;
  debt: DebtView | null;
  vacationPot: number;
  housesLeft: number;
  hotelsLeft: number;
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
