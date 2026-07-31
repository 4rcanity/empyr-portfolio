export type CardId = 'reverse' | 'skip' | 'shield' | 'bluff' | 'narrow' | 'blindfold';

export type Phase = 'lobby' | 'choose_secret' | 'playing' | 'vote_shuffle' | 'ended';

export type Direction = 1 | -1;

export interface LobbySettings {
  min: number;
  max: number;
  maxPlayers: number;
  chooserCount: number;
  shuffleVote: boolean;
}

export const DEFAULT_SETTINGS: LobbySettings = {
  min: 1,
  max: 100_000,
  maxPlayers: 6,
  chooserCount: 2,
  shuffleVote: true,
};

export interface PublicPlayer {
  id: string;
  name: string;
  ready: boolean;
  eliminated: boolean;
  isHost: boolean;
  cardCount: number;
  blindfoldRounds: number;
  isChooser: boolean;
}

export interface PublicState {
  roomId: string;
  phase: Phase;
  settings: LobbySettings;
  players: PublicPlayer[];
  hostId: string | null;
  direction: Direction;
  turnOrder: string[];
  currentTurnId: string | null;
  low: number;
  high: number;
  lastGuess: number | null;
  lastBluff: 'higher' | 'lower' | null;
  winnerId: string | null;
  chooserIds: string[];
  secretsSubmitted: string[];
  voteYesCount: number;
  voteTotal: number;
  youVoted: boolean;
  event: string | null;
  survivorsNeeded: number;
}

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'update_settings'; settings: Partial<LobbySettings> }
  | { type: 'set_ready'; ready: boolean }
  | { type: 'start_game' }
  | { type: 'submit_secret'; value: number }
  | { type: 'play_card'; card: CardId; targetId?: string; bluff?: 'higher' | 'lower' }
  | { type: 'opening_guess'; value: number }
  | { type: 'guess'; call: 'higher' | 'lower'; nextGuess: number }
  | { type: 'pass_shield' }
  | { type: 'vote_shuffle'; yes: boolean }
  | { type: 'rematch' };

export type ServerMessage =
  | { type: 'state'; state: PublicState; hand: CardId[] }
  | { type: 'error'; message: string }
  | { type: 'eliminated'; playerId: string; name: string }
  | { type: 'fx'; kind: 'reverse' | 'narrow' | 'blindfold' | 'eliminate' | 'deal' | 'shuffle' };

export const REGULAR_CARDS: CardId[] = ['reverse', 'skip', 'shield', 'bluff'];
export const ACE_CARDS: CardId[] = ['narrow', 'blindfold'];

export function randomRoomId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
