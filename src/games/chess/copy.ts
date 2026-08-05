import type { LinkStatus } from './net';
import type { Color, Preset, Termination } from './protocol';

export type Lang = 'nl' | 'en';

type Args = Record<string, string | number>;

export interface Copy {
  brand: string;
  tagline: string;

  checkinTitle: string;
  checkinSub: string;
  nameLabel: string;
  namePlaceholder: string;
  enter: string;
  watchInstead: string;
  noRoom: string;

  room: string;
  copyLink: string;
  copied: string;
  leave: string;
  status: Record<LinkStatus, string>;

  lobbyTitle: string;
  lobbySub: string;
  timeTitle: string;
  timeSub: string;
  presets: Record<Preset, string>;
  minutesLabel: string;
  incrementLabel: string;
  positionTitle: string;
  positionSub: string;
  fenLabel: string;
  fenApply: string;
  fenReset: string;
  fenBad: string;
  ready: string;
  unready: string;
  start: string;
  needBoth: string;
  hostOnly: string;
  swap: string;
  sitDown: string;
  standUp: string;
  playersTitle: string;
  watchers: (n: number) => string;
  waitingForOpponent: string;
  youTag: string;
  hostTag: string;
  offlineTag: string;
  readyTag: string;
  seatOpen: string;

  colors: Record<Color, string>;
  yourMove: string;
  theirMove: string;
  spectating: string;
  flip: string;
  resign: string;
  resignConfirm: string;
  offerDraw: string;
  drawPending: string;
  drawOffered: (name: string) => string;
  accept: string;
  decline: string;
  claimThreefold: string;
  claimFifty: string;
  claimHint: string;
  autoDrawHint: string;
  promoteTitle: string;
  pieceNames: Record<'q' | 'r' | 'b' | 'n', string>;
  movesTitle: string;
  noMoves: string;
  reviewing: (ply: number) => string;
  backToLive: string;
  capturedTitle: string;
  checkTag: string;
  copyPgn: string;
  pgnCopied: string;
  rematch: string;
  newGame: string;
  repeats: (n: number) => string;
  fiftyCount: (n: number) => string;

  winLine: (name: string) => string;
  drawLine: string;
  reasons: Record<Termination, string>;
  log: Record<string, (args: Args) => string>;
}

const EN_REASONS: Record<Termination, string> = {
  checkmate: 'by checkmate',
  stalemate: 'stalemate — no legal move, no check',
  fifty: 'claimed under the fifty-move rule',
  threefold: 'claimed by threefold repetition',
  fivefold: 'fivefold repetition',
  seventyfive: 'seventy-five moves without progress',
  insufficient: 'neither side can mate',
  resign: 'by resignation',
  agreement: 'by agreement',
  flag: 'on time',
  flagInsufficient: 'time ran out, but there was nothing left to mate with',
  abandoned: 'abandoned',
};

const NL_REASONS: Record<Termination, string> = {
  checkmate: 'door schaakmat',
  stalemate: 'pat — geen zet mogelijk, geen schaak',
  fifty: 'geclaimd volgens de vijftigzettenregel',
  threefold: 'geclaimd door driemaal dezelfde stelling',
  fivefold: 'vijfmaal dezelfde stelling',
  seventyfive: 'vijfenzeventig zetten zonder vooruitgang',
  insufficient: 'geen van beiden kan mat zetten',
  resign: 'door opgave',
  agreement: 'bij overeenkomst',
  flag: 'op tijd',
  flagInsufficient: 'de tijd liep af, maar er stond geen matmateriaal meer',
  abandoned: 'verlaten',
};

export const COPY: Record<Lang, Copy> = {
  en: {
    brand: 'Empyr Gambit',
    tagline: 'Tournament chess, two seats and a clock',

    checkinTitle: 'Take a seat',
    checkinSub: 'Your name goes on the scoresheet.',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Capablanca',
    enter: 'Sit down',
    watchInstead: 'Watch instead',
    noRoom: 'No room code in the link.',

    room: 'Room',
    copyLink: 'Copy link',
    copied: 'Link copied',
    leave: 'Leave',
    status: { idle: 'idle', dialing: 'connecting', live: 'connected', lost: 'reconnecting' },

    lobbyTitle: 'Before the clocks start',
    lobbySub: 'The host sets the time control and starts the game.',
    timeTitle: 'Time control',
    timeSub: 'The server owns both clocks. A flag ends the game.',
    presets: {
      bullet1: '1+0 bullet',
      bullet2: '2+1 bullet',
      blitz3: '3+2 blitz',
      blitz5: '5+0 blitz',
      rapid10: '10+0 rapid',
      rapid15: '15+10 rapid',
      custom: 'Custom',
    },
    minutesLabel: 'Minutes each',
    incrementLabel: 'Increment (s)',
    positionTitle: 'Starting position',
    positionSub: 'Paste a FEN to set up a study, or leave it standard.',
    fenLabel: 'FEN',
    fenApply: 'Set position',
    fenReset: 'Standard position',
    fenBad: 'That FEN was refused.',
    ready: 'Ready',
    unready: 'Not ready',
    start: 'Start the clocks',
    needBoth: 'Both colours need a player.',
    hostOnly: 'Only the host can start.',
    swap: 'Swap colours',
    sitDown: 'Take the free seat',
    standUp: 'Watch instead',
    playersTitle: 'Board',
    watchers: (n) => (n === 1 ? '1 watching' : `${n} watching`),
    waitingForOpponent: 'Waiting for an opponent — share the link.',
    youTag: 'you',
    hostTag: 'host',
    offlineTag: 'away',
    readyTag: 'ready',
    seatOpen: 'Seat open',

    colors: { w: 'White', b: 'Black' },
    yourMove: 'Your move',
    theirMove: 'Their move',
    spectating: 'Watching',
    flip: 'Flip board',
    resign: 'Resign',
    resignConfirm: 'Confirm resignation',
    offerDraw: 'Offer a draw',
    drawPending: 'Draw offered — waiting',
    drawOffered: (name) => `${name} offers a draw`,
    accept: 'Accept',
    decline: 'Decline',
    claimThreefold: 'Claim threefold',
    claimFifty: 'Claim fifty-move',
    claimHint: 'Repetition and the fifty-move rule are yours to claim.',
    autoDrawHint: 'Stalemate, dead material, fivefold and seventy-five moves are automatic.',
    promoteTitle: 'Promote to',
    pieceNames: { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' },
    movesTitle: 'Scoresheet',
    noMoves: 'No moves yet.',
    reviewing: (ply) => `Reviewing move ${ply}`,
    backToLive: 'Back to live',
    capturedTitle: 'Captured',
    checkTag: 'Check',
    copyPgn: 'Copy PGN',
    pgnCopied: 'PGN copied',
    rematch: 'Rematch',
    newGame: 'Back to the lobby',
    repeats: (n) => `position seen ${n}×`,
    fiftyCount: (n) => `${n} half-moves without progress`,

    winLine: (name) => `${name} wins`,
    drawLine: 'Draw',
    reasons: EN_REASONS,
    log: {
      seated: (a) => `${a.a} took a seat`,
      watching: (a) => `${a.a} is watching`,
      rejoined: (a) => `${a.a} is back`,
      dropped: (a) => `${a.a} dropped out`,
      newHost: (a) => `${a.a} is now host`,
      swept: () => 'Empty seats cleared',
      swapped: () => 'Colours swapped',
      lobby: () => 'Back in the lobby',
      abandoned: () => 'Nobody came back — the game was abandoned',
      parked: () => 'Clocks parked while the board is empty',
      begin: (a) => `${a.a} (white) vs ${a.b} (black) · ${a.t}`,
      drawOffered: (a) => `${a.a} offered a draw`,
      drawDeclined: (a) => `${a.a} declined the draw`,
      won: (a) => `${a.a} won`,
      drawn: () => 'Game drawn',
    },
  },

  nl: {
    brand: 'Empyr Gambit',
    tagline: 'Toernooischaak, twee stoelen en een klok',

    checkinTitle: 'Neem plaats',
    checkinSub: 'Je naam komt op het notatieformulier.',
    nameLabel: 'Naam',
    namePlaceholder: 'bijv. Capablanca',
    enter: 'Ga zitten',
    watchInstead: 'Liever toekijken',
    noRoom: 'Geen kamercode in de link.',

    room: 'Kamer',
    copyLink: 'Link kopiëren',
    copied: 'Link gekopieerd',
    leave: 'Verlaten',
    status: { idle: 'stil', dialing: 'verbinden', live: 'verbonden', lost: 'opnieuw verbinden' },

    lobbyTitle: 'Voordat de klokken lopen',
    lobbySub: 'De host kiest het tempo en start de partij.',
    timeTitle: 'Speeltempo',
    timeSub: 'De server beheert beide klokken. Vlagvallen beslist de partij.',
    presets: {
      bullet1: '1+0 bullet',
      bullet2: '2+1 bullet',
      blitz3: '3+2 blitz',
      blitz5: '5+0 blitz',
      rapid10: '10+0 rapid',
      rapid15: '15+10 rapid',
      custom: 'Zelf instellen',
    },
    minutesLabel: 'Minuten per speler',
    incrementLabel: 'Increment (s)',
    positionTitle: 'Beginstelling',
    positionSub: 'Plak een FEN voor een studie, of laat het standaard.',
    fenLabel: 'FEN',
    fenApply: 'Stelling instellen',
    fenReset: 'Standaardstelling',
    fenBad: 'Die FEN werd geweigerd.',
    ready: 'Klaar',
    unready: 'Nog niet klaar',
    start: 'Start de klokken',
    needBoth: 'Beide kleuren hebben een speler nodig.',
    hostOnly: 'Alleen de host kan starten.',
    swap: 'Kleuren wisselen',
    sitDown: 'Neem de vrije stoel',
    standUp: 'Liever toekijken',
    playersTitle: 'Bord',
    watchers: (n) => (n === 1 ? '1 kijkt mee' : `${n} kijken mee`),
    waitingForOpponent: 'Wachten op een tegenstander — deel de link.',
    youTag: 'jij',
    hostTag: 'host',
    offlineTag: 'weg',
    readyTag: 'klaar',
    seatOpen: 'Stoel vrij',

    colors: { w: 'Wit', b: 'Zwart' },
    yourMove: 'Jij bent aan zet',
    theirMove: 'Tegenstander aan zet',
    spectating: 'Je kijkt mee',
    flip: 'Bord draaien',
    resign: 'Opgeven',
    resignConfirm: 'Opgave bevestigen',
    offerDraw: 'Remise aanbieden',
    drawPending: 'Remise aangeboden — wachten',
    drawOffered: (name) => `${name} biedt remise aan`,
    accept: 'Aannemen',
    decline: 'Afwijzen',
    claimThreefold: 'Claim driemaal',
    claimFifty: 'Claim vijftig zetten',
    claimHint: 'Herhaling en de vijftigzettenregel claim je zelf.',
    autoDrawHint: 'Pat, dood materiaal, vijfmaal en vijfenzeventig zetten gaan automatisch.',
    promoteTitle: 'Promoveren naar',
    pieceNames: { q: 'Koningin', r: 'Toren', b: 'Loper', n: 'Paard' },
    movesTitle: 'Notatie',
    noMoves: 'Nog geen zetten.',
    reviewing: (ply) => `Je bekijkt zet ${ply}`,
    backToLive: 'Terug naar live',
    capturedTitle: 'Geslagen',
    checkTag: 'Schaak',
    copyPgn: 'PGN kopiëren',
    pgnCopied: 'PGN gekopieerd',
    rematch: 'Revanche',
    newGame: 'Terug naar de lobby',
    repeats: (n) => `stelling ${n}× gezien`,
    fiftyCount: (n) => `${n} halve zetten zonder vooruitgang`,

    winLine: (name) => `${name} wint`,
    drawLine: 'Remise',
    reasons: NL_REASONS,
    log: {
      seated: (a) => `${a.a} nam plaats`,
      watching: (a) => `${a.a} kijkt mee`,
      rejoined: (a) => `${a.a} is terug`,
      dropped: (a) => `${a.a} viel weg`,
      newHost: (a) => `${a.a} is nu host`,
      swept: () => 'Lege stoelen opgeruimd',
      swapped: () => 'Kleuren gewisseld',
      lobby: () => 'Terug in de lobby',
      abandoned: () => 'Niemand kwam terug — de partij is verlaten',
      parked: () => 'Klokken stilgezet zolang het bord leeg is',
      begin: (a) => `${a.a} (wit) tegen ${a.b} (zwart) · ${a.t}`,
      drawOffered: (a) => `${a.a} bood remise aan`,
      drawDeclined: (a) => `${a.a} wees de remise af`,
      won: (a) => `${a.a} won`,
      drawn: () => 'Partij in remise',
    },
  },
};

/** Render a server log line, falling back to the raw code if it is unknown. */
export function renderLog(copy: Copy, code: string, args?: Args): string {
  const line = copy.log[code];
  return line ? line(args ?? {}) : code;
}
