/** Mirror of server/uno/src/protocol.ts — standalone so the site never imports worker code. */

export type Color =
  | 'red' | 'yellow' | 'green' | 'blue'
  | 'pink' | 'teal' | 'orange' | 'purple'
  | 'wild';

export const LIGHT_COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
export const DARK_COLORS: Color[] = ['pink', 'teal', 'orange', 'purple'];

export type Face =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'
  | 'draw1' | 'draw5' | 'skipAll' | 'flip' | 'wild2' | 'wildColor'
  | 'draw6' | 'draw10' | 'discardAll' | 'wildRev4'
  | 'wildSkip' | 'wildRev' | 'wildSkipAll'
  | 'blast';

export interface Side {
  color: Color;
  face: Face;
}

export interface Card {
  id: string;
  a: Side;
  b?: Side;
}

export type Pack = 'classic' | 'flip' | 'nomercy' | 'allwild' | 'attack';
export const PACKS: Pack[] = ['classic', 'flip', 'nomercy', 'allwild', 'attack'];

export type Phase = 'lobby' | 'play' | 'roundOver' | 'over';

export interface Rules {
  pack: Pack;
  houseRules: boolean;
  sevenZero: boolean;
  jumpIn: boolean;
  stacking: boolean;
  drawToMatch: boolean;
  startingHand: number;
  targetScore: number;
  turnSeconds: number;
  capacity: number;
}

export interface PlayerView {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  cards: number;
  score: number;
  out: boolean;
  uno: boolean;
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
  side: 'light' | 'dark';
  top: Side | null;
  activeColor: Color;
  deckLeft: number;
  discardCount: number;
  pendingDraw: number;
  drewThisTurn: boolean;
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
  | 'play' | 'draw' | 'skip' | 'reverse' | 'wild' | 'flip'
  | 'blast' | 'uno' | 'caught' | 'swap' | 'out' | 'round' | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; hand: Card[]; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; playerId?: string; text?: string };

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
    face === 'wild' || face === 'wild2' || face === 'wild4' || face === 'wildColor' ||
    face === 'wildRev4' || face === 'wildSkip' || face === 'wildRev' ||
    face === 'wildSkipAll' || face === 'blast'
  );
}

/** The face a card currently shows, honouring the Flip side. */
export function faceOf(card: Card, side: 'light' | 'dark'): Side {
  return side === 'dark' && card.b ? card.b : card.a;
}

function stackingOn(room: RoomView): boolean {
  return room.rules.pack === 'nomercy' ? true : room.rules.stacking;
}

/** Local mirror of the server's legality check, so the UI can grey out dead cards. */
export function canPlay(card: Card, room: RoomView): boolean {
  const shown = faceOf(card, room.side);
  if (room.rules.pack === 'allwild') return true;
  if (room.pendingDraw > 0) return stackingOn(room) && Boolean(DRAW_FACES[shown.face]);
  if (shown.color === 'wild') return true;
  if (room.activeColor !== 'wild' && shown.color === room.activeColor) return true;
  return Boolean(room.top && room.top.face === shown.face);
}

export function paletteFor(side: 'light' | 'dark'): Color[] {
  return side === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

/** Short glyph shown in the middle of a card. */
export const FACE_GLYPH: Record<Face, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  skip: '⊘',
  reverse: '⇄',
  draw2: '+2',
  wild: '★',
  wild4: '+4',
  draw1: '+1',
  draw5: '+5',
  skipAll: '⊘⊘',
  flip: '⟳',
  wild2: '+2',
  wildColor: '+C',
  draw6: '+6',
  draw10: '+10',
  discardAll: '✧',
  wildRev4: '⇄4',
  wildSkip: '⊘',
  wildRev: '⇄',
  wildSkipAll: '⊘⊘',
  blast: '🔥',
};
