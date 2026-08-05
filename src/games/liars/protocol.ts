/** Wire format shared by the Liar's Bar worker and its browser client. */

/** The four kinds of card in the deck. */
export type Rank = 'king' | 'queen' | 'ace' | 'joker';

/** The card a round is played on. Jokers are wild, so they are never named. */
export type TableCard = 'king' | 'queen' | 'ace';

export const TABLE_CARDS: readonly TableCard[] = ['king', 'queen', 'ace'];

/** One physical card. Only ever sent to the hand it belongs to. */
export interface Card {
  id: string;
  rank: Rank;
}

/** The composition of one 20-card deck: 6/6/6 plus the two jokers. */
export const DECK_SHAPE: readonly { rank: Rank; count: number }[] = [
  { rank: 'king', count: 6 },
  { rank: 'queen', count: 6 },
  { rank: 'ace', count: 6 },
  { rank: 'joker', count: 2 },
];

/** A joker stands in for whatever the table card is. */
export function matchesTable(rank: Rank, table: TableCard): boolean {
  return rank === table || rank === 'joker';
}

export type Phase = 'lobby' | 'play' | 'showdown' | 'over';

export interface Rules {
  /** Chambers in every revolver. Six is the barrel everybody knows. */
  chambers: number;
  /** Live rounds loaded into each revolver, in random chambers. */
  bullets: number;
  /** Cards dealt to each player at the start of a round. */
  handSize: number;
  /** Most cards a single claim may cover. */
  maxPlay: number;
  /** Are the two jokers in the deck at all? */
  jokers: boolean;
  /** Keep one table card for the whole game instead of re-rolling each round. */
  fixedTable: boolean;
  turnSeconds: number;
  capacity: number;
}

/** The table everybody means when they say Liar's Bar. */
export const CLASSIC_RULES: Rules = {
  chambers: 6,
  bullets: 1,
  handSize: 5,
  maxPlay: 3,
  jokers: true,
  fixedTable: false,
  turnSeconds: 30,
  capacity: 4,
};

export const DEFAULT_RULES: Rules = { ...CLASSIC_RULES };

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const chambers = Math.min(8, Math.max(2, Math.floor(Number(next.chambers) || 6)));
  return {
    chambers,
    // A revolver loaded to the brim kills on the first pull, so leave one click.
    bullets: Math.min(chambers - 1, Math.max(1, Math.floor(Number(next.bullets) || 1))),
    handSize: Math.min(7, Math.max(2, Math.floor(Number(next.handSize) || 5))),
    maxPlay: Math.min(4, Math.max(1, Math.floor(Number(next.maxPlay) || 3))),
    jokers: Boolean(next.jokers),
    fixedTable: Boolean(next.fixedTable),
    turnSeconds: Math.min(180, Math.max(10, Math.floor(Number(next.turnSeconds) || 30))),
    capacity: Math.min(6, Math.max(2, Math.floor(Number(next.capacity) || 4))),
  };
}

/** Named in the header so the table always knows which variant is running. */
export type Variant = 'classic' | 'house';

export function variantOf(rules: Rules): Variant {
  const keys: (keyof Rules)[] = [
    'chambers',
    'bullets',
    'handSize',
    'maxPlay',
    'jokers',
    'fixedTable',
  ];
  return keys.every((key) => rules[key] === CLASSIC_RULES[key]) ? 'classic' : 'house';
}

/** The claim sitting face down on the table, as everybody else may see it. */
export interface Claim {
  playerId: string;
  playerName: string;
  /** How many cards went down. Their faces stay secret until a challenge. */
  count: number;
  /** Turn number the claim was made on, for the ticker. */
  turn: number;
  /** Played by the turn clock rather than by the player. */
  auto: boolean;
}

/** Everything the challenge sequence needs to play itself out. */
export interface Showdown {
  id: number;
  table: TableCard;
  accusedId: string;
  accusedName: string;
  challengerId: string;
  challengerName: string;
  /** How many cards the accused claimed. */
  count: number;
  /** The faces, now public. Ordered as they were played. */
  revealed: Rank[];
  /** True when every revealed card was the table card or a joker. */
  honest: boolean;
  shooterId: string;
  shooterName: string;
  /** Which chamber came up, zero-based. */
  chamber: number;
  chambersTotal: number;
  /** The shooter's odds at the moment of the pull: one in this many. */
  oddsIn: number;
  fatal: boolean;
  /** The challenge was forced by the turn clock. */
  auto: boolean;
}

/**
 * The beat between rounds. `showdown` is null when the round simply ran out of
 * cards and nobody had to pull.
 */
export interface Stage {
  id: number;
  showdown: Showdown | null;
  startedAt: number;
  endsAt: number;
  /** Set when the shot ended the game outright. */
  final: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Cards left in hand. The faces are never sent to anybody else. */
  cards: number;
  /** Out of cards for this round; the turn order steps over them. */
  done: boolean;
  /** Chambers already pulled on their own revolver. */
  spent: number;
  chambers: number;
  /** Live rounds still somewhere in their cylinder. */
  bullets: number;
  /** Shot dead and out of the game. */
  dead: boolean;
  /** Round number they died on, for the epitaph. */
  diedRound: number;
  /** Triggers pulled and survived. */
  clicks: number;
  /** Times they were caught lying. */
  caught: number;
  /** Times they called Liar and were wrong. */
  misfires: number;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'shot';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  variant: Variant;
  players: PlayerView[];
  activeId: string | null;
  /** The round in play, counted from the first deal of the game. */
  round: number;
  /** Turns taken this round. */
  turn: number;
  table: TableCard;
  /** The challengeable pile, without its faces. */
  claim: Claim | null;
  /** Cards played earlier this round that can no longer be challenged. */
  buried: number;
  /** Cards left undealt. */
  deckLeft: number;
  turnEndsAt: number | null;
  now: number;
  stage: Stage | null;
  winnerId: string | null;
  log: LogLine[];
  /** How many players have asked to move past the current stage. */
  waiting: number;
  /** Online seats, so the "move on" count reads as a fraction. */
  seated: number;
  /** Has the viewer already asked to move on? */
  youWaiting: boolean;
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'preset'; name: 'classic' }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'play'; cardIds: string[] }
  | { t: 'liar' }
  | { t: 'onward' }
  | { t: 'again' };

export type Outbound =
  | { t: 'sync'; room: RoomView; hand: Card[]; youId: string }
  | { t: 'nope'; msg: string };

/** Odds of the next pull being the live one: one in this many. */
export function oddsIn(chambers: number, spent: number, bullets: number): number {
  const left = Math.max(1, chambers - spent);
  return Math.max(1, Math.round((left / Math.max(1, bullets)) * 100) / 100);
}
