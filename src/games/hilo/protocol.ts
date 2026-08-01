/** Mirror of server/hilo/src/protocol.ts — kept standalone so the site never imports worker code. */

export type Wild = 'reverse' | 'skip' | 'shield' | 'bluff';
export type Ace = 'narrow' | 'blindfold';
export type Card = Wild | Ace;
export type Call = 'higher' | 'lower';
export type Phase = 'lobby' | 'secrets' | 'turn' | 'vote' | 'over';

export interface Rules {
  min: number;
  max: number;
  capacity: number;
  choosers: number;
  shuffleVotes: boolean;
  turnSeconds: number;
}

export interface SeatView {
  id: string;
  name: string;
  hue: number;
  host: boolean;
  ready: boolean;
  alive: boolean;
  online: boolean;
  cards: number;
  blind: number;
  chooser: boolean;
  locked: boolean;
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
  seats: SeatView[];
  order: string[];
  activeId: string | null;
  direction: 1 | -1;
  low: number;
  high: number;
  probe: number | null;
  bluff: Call | null;
  shielded: boolean;
  winnerId: string | null;
  turnEndsAt: number | null;
  now: number;
  voteYes: number;
  voteCast: number;
  voteNeeded: number;
  youVoted: boolean;
  log: LogLine[];
}

export type Inbound =
  | { t: 'hello'; key: string; name: string }
  | { t: 'rules'; patch: Partial<Rules> }
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'secret'; value: number }
  | { t: 'card'; card: Card; target?: string; bluff?: Call }
  | { t: 'probe'; value: number }
  | { t: 'call'; call: Call; value: number }
  | { t: 'pass' }
  | { t: 'vote'; yes: boolean }
  | { t: 'again' };

export type FxKind =
  | 'reverse'
  | 'skip'
  | 'shield'
  | 'bluff'
  | 'narrow'
  | 'blindfold'
  | 'out'
  | 'mine'
  | 'deal'
  | 'shuffle'
  | 'win';

export type Outbound =
  | { t: 'sync'; room: RoomView; hand: Card[]; youId: string }
  | { t: 'nope'; msg: string }
  | { t: 'fx'; kind: FxKind; seatId?: string; text?: string };

export const CARD_META: Record<Card, { glyph: string; kind: 'wild' | 'ace' }> = {
  reverse: { glyph: '⟲', kind: 'wild' },
  skip: { glyph: '⇥', kind: 'wild' },
  shield: { glyph: '◈', kind: 'wild' },
  bluff: { glyph: '☰', kind: 'wild' },
  narrow: { glyph: '⌁', kind: 'ace' },
  blindfold: { glyph: '◐', kind: 'ace' },
};
