/** Wire format shared by the EMPYR UNO worker and its browser client. */

/** Light-side colours, dark-side (Flip) colours, and the colourless wild slot. */
export type Color =
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'teal'
  | 'orange'
  | 'purple'
  | 'wild';

export const LIGHT_COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
export const DARK_COLORS: Color[] = ['pink', 'teal', 'orange', 'purple'];

export type Face =
  // numbers
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  // classic actions
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'
  // Flip
  | 'draw1' | 'draw5' | 'skipAll' | 'flip' | 'wild2' | 'wildColor'
  // No Mercy
  | 'draw6' | 'draw10' | 'discardAll' | 'wildRev4'
  // All Wild
  | 'wildSkip' | 'wildRev' | 'wildSkipAll'
  // Attack
  | 'blast';

/** One printed face of a card. Flip cards carry two. */
export interface Side {
  color: Color;
  face: Face;
}

export interface Card {
  id: string;
  /** Light side (also the only side outside the Flip pack). */
  a: Side;
  /** Dark side, present only in the Flip pack. */
  b?: Side;
}

export type Pack = 'classic' | 'flip' | 'nomercy' | 'allwild' | 'attack';
export const PACKS: Pack[] = ['classic', 'flip', 'nomercy', 'allwild', 'attack'];

export type Phase = 'lobby' | 'play' | 'roundOver' | 'over';

export interface Rules {
  /** Deck pack. `classic` is the base game; the other four are the deck DLCs. */
  pack: Pack;
  /** The House Rules DLC master switch — gates the four toggles below. */
  houseRules: boolean;
  sevenZero: boolean;
  jumpIn: boolean;
  stacking: boolean;
  drawToMatch: boolean;
  startingHand: number;
  /** First to this many points wins. 0 plays a single round. */
  targetScore: number;
  turnSeconds: number;
  capacity: number;
}

export const DEFAULT_RULES: Rules = {
  pack: 'classic',
  houseRules: false,
  sevenZero: false,
  jumpIn: false,
  stacking: true,
  drawToMatch: false,
  startingHand: 7,
  targetScore: 500,
  turnSeconds: 45,
  capacity: 6,
};

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const pack: Pack = PACKS.includes(next.pack) ? next.pack : 'classic';
  const houseRules = Boolean(next.houseRules);
  return {
    pack,
    houseRules,
    // The three fun toggles only exist while the House Rules DLC is on.
    sevenZero: houseRules && Boolean(next.sevenZero),
    jumpIn: houseRules && Boolean(next.jumpIn),
    drawToMatch: houseRules && Boolean(next.drawToMatch),
    // No Mercy is built around stacking, so it forces it on.
    stacking: pack === 'nomercy' ? true : Boolean(next.stacking),
    startingHand: Math.min(12, Math.max(3, Math.floor(Number(next.startingHand) || 7))),
    targetScore: Math.min(2000, Math.max(0, Math.floor(Number(next.targetScore) || 0))),
    turnSeconds: Math.min(180, Math.max(15, Math.floor(Number(next.turnSeconds) || 45))),
    capacity: Math.min(10, Math.max(2, Math.floor(Number(next.capacity) || 6))),
  };
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Card count — hands themselves are only ever sent to their owner. */
  cards: number;
  score: number;
  /** Knocked out by the No Mercy 25-card rule. */
  out: boolean;
  /** Has a live UNO call standing. */
  uno: boolean;
  /** Vulnerable to a catch right now (on 1 card without calling). */
  exposed: boolean;
}

export interface LogLine {
  id: number;
  code: string;
  tone: 'info' | 'good' | 'bad' | 'wild';
  args?: Record<string, string | number>;
}

export interface RoomView {
  code: string;
  phase: Phase;
  rules: Rules;
  players: PlayerView[];
  activeId: string | null;
  direction: 1 | -1;
  /** Which side of the deck is face up (Flip pack). */
  side: 'light' | 'dark';
  /** Top of the discard pile, as currently facing. */
  top: Side | null;
  /** Colour that must be matched — differs from `top.color` after a wild. */
  activeColor: Color;
  deckLeft: number;
  discardCount: number;
  /** Accumulated stacked draw penalty waiting on the active player. */
  pendingDraw: number;
  /** True once the active player has drawn and may only play that card or pass. */
  drewThisTurn: boolean;
  /** The card just drawn — only ever sent to the player who drew it. */
  drawnId: string | null;
  turnEndsAt: number | null;
  now: number;
  roundWinnerId: string | null;
  winnerId: string | null;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'play'; cardId: string; color?: Color; target?: string }
  | { t: 'draw' }
  | { t: 'pass' }
  | { t: 'uno' }
  | { t: 'catch'; playerId: string }
  | { t: 'next' }
  | { t: 'again' };

export type FxKind =
  | 'play'
  | 'draw'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'flip'
  | 'blast'
  | 'uno'
  | 'caught'
  | 'swap'
  | 'out'
  | 'round'
  | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; hand: Card[]; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; playerId?: string; text?: string };

/** Scoring values used when a round is won. */
export function cardScore(face: Face): number {
  if (/^[0-9]$/.test(face)) return Number(face);
  switch (face) {
    case 'wild':
    case 'wild2':
    case 'wild4':
    case 'wildColor':
    case 'wildRev4':
    case 'wildSkip':
    case 'wildRev':
    case 'wildSkipAll':
    case 'blast':
      return 50;
    case 'draw10':
      return 50;
    case 'draw6':
      return 40;
    case 'draw5':
      return 30;
    default:
      return 20;
  }
}

/** Faces that force the next player to pick up, and by how much. */
export const DRAW_FACES: Partial<Record<Face, number>> = {
  draw1: 1,
  draw2: 2,
  wild2: 2,
  wild4: 4,
  wildRev4: 4,
  draw5: 5,
  draw6: 6,
  draw10: 10,
};

export function isWildFace(face: Face): boolean {
  return (
    face === 'wild' ||
    face === 'wild2' ||
    face === 'wild4' ||
    face === 'wildColor' ||
    face === 'wildRev4' ||
    face === 'wildSkip' ||
    face === 'wildRev' ||
    face === 'wildSkipAll' ||
    face === 'blast'
  );
}
