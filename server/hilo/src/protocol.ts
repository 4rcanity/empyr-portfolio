/** Wire format shared by the HI/LO FRENZY worker and browser client. */

export type Wild = 'reverse' | 'skip' | 'shield' | 'bluff';
export type Ace = 'narrow' | 'blindfold';
export type Card = Wild | Ace;
export type Call = 'higher' | 'lower';
export type Phase = 'lobby' | 'secrets' | 'turn' | 'vote' | 'over';

export const WILDS: Wild[] = ['reverse', 'skip', 'shield', 'bluff'];
export const ACES: Ace[] = ['narrow', 'blindfold'];

export interface Rules {
  min: number;
  max: number;
  capacity: number;
  choosers: number;
  shuffleVotes: boolean;
  turnSeconds: number;
}

export const DEFAULT_RULES: Rules = {
  min: 1,
  max: 100_000,
  capacity: 6,
  choosers: 2,
  shuffleVotes: true,
  turnSeconds: 40,
};

export function clampRules(patch: Partial<Rules>, base: Rules): Rules {
  const next = { ...base, ...patch };
  const min = Math.max(0, Math.floor(Number(next.min) || 0));
  const max = Math.max(min + 100, Math.floor(Number(next.max) || min + 100));
  const capacity = Math.min(10, Math.max(3, Math.floor(Number(next.capacity) || 3)));
  return {
    min,
    max,
    capacity,
    choosers: Math.min(capacity - 1, Math.max(1, Math.floor(Number(next.choosers) || 1))),
    shuffleVotes: Boolean(next.shuffleVotes),
    turnSeconds: Math.min(120, Math.max(15, Math.floor(Number(next.turnSeconds) || 40))),
  };
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

/** Log lines travel as codes + args so each client renders them in its own language. */
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
