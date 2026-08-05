import type { EndReason, Side } from './protocol';

export type Lang = 'nl' | 'en';

export interface Copy {
  brand: string;
  tagline: string;

  checkinTitle: string;
  checkinSub: string;
  nameLabel: string;
  namePlaceholder: string;
  enter: string;
  watch: string;
  noRoom: string;
  room: string;
  copyLink: string;
  copied: string;
  leave: string;
  status: Record<'idle' | 'dialing' | 'live' | 'lost', string>;

  lobbyTitle: string;
  lobbySub: string;
  seatWhite: string;
  seatBlack: string;
  takeSeat: string;
  yourSeat: string;
  seatTaken: string;
  stand: string;
  stands: string;
  ready: string;
  unready: string;
  waitingReady: string;
  begin: string;
  needBoth: string;
  hostOnly: string;
  clockTitle: string;
  clockOn: string;
  clockOff: string;
  minutes: string;
  increment: string;
  noClock: string;
  positionTitle: string;
  positionSub: string;
  positionLoad: string;
  positionPlaceholder: string;
  rulesTitle: string;
  rulesList: Array<[string, string]>;

  white: string;
  black: string;
  yourMove: string;
  theirMove: string;
  spectating: string;
  spectators: string;
  mustCapture: string;
  mustCaptureCount: (n: number) => string;
  pickRoute: string;
  pickRouteSub: string;
  routeCount: (n: number) => string;
  cancelPick: string;
  flip: string;
  moves: string;
  noMoves: string;
  live: string;
  navStart: string;
  navBack: string;
  navForward: string;
  navLive: string;
  reviewing: string;
  resign: string;
  offerDraw: string;
  drawOffered: string;
  drawFromThem: string;
  accept: string;
  decline: string;
  confirmResign: string;
  yes: string;
  no: string;
  again: string;
  drawCounters: string;
  kingIdle: (n: number, limit: number) => string;
  endgame: (n: number, limit: number) => string;
  captured: (n: number) => string;
  kings: (n: number) => string;
  men: string;

  wins: (who: string) => string;
  drawn: string;
  reason: Record<EndReason, string>;
  logLine: (code: string, args: Record<string, string | number>) => string;
  sideName: (side: Side) => string;
}

const REASON_NL: Record<EndReason, string> = {
  captured: 'alle stukken geslagen',
  blocked: 'geen zet meer mogelijk',
  resign: 'opgegeven',
  time: 'tijd verstreken',
  agreement: 'remise overeengekomen',
  repetition: 'driemaal dezelfde stand',
  kingIdle: '25 zetten alleen met dammen',
  endgame16: '3 tegen 1 dam, 16 zetten',
  endgame5: '2 tegen 1 dam, 5 zetten',
};

const REASON_EN: Record<EndReason, string> = {
  captured: 'every piece taken',
  blocked: 'no legal move left',
  resign: 'resigned',
  time: 'flag fell',
  agreement: 'draw agreed',
  repetition: 'same position three times',
  kingIdle: '25 moves of kings only',
  endgame16: '3 against a lone king, 16 moves',
  endgame5: '2 against a lone king, 5 moves',
};

const NL: Copy = {
  brand: 'DAMCAFÉ',
  tagline: 'Internationaal dammen · 10×10',

  checkinTitle: 'Aanschuiven',
  checkinSub: 'Kies een naam en neem plaats aan het bord.',
  nameLabel: 'Naam',
  namePlaceholder: 'Jouw naam',
  enter: 'Aanschuiven',
  watch: 'Alleen kijken',
  noRoom: 'Geen kamercode in de link.',
  room: 'Kamer',
  copyLink: 'Link kopiëren',
  copied: 'Gekopieerd',
  leave: 'Weg',
  status: {
    idle: 'niet verbonden',
    dialing: 'verbinden…',
    live: 'verbonden',
    lost: 'verbinding kwijt — opnieuw…',
  },

  lobbyTitle: 'Het bord staat klaar',
  lobbySub: 'Twee spelers, zoveel kijkers als je wil. Wit begint.',
  seatWhite: 'Wit',
  seatBlack: 'Zwart',
  takeSeat: 'Neem plaats',
  yourSeat: 'Jij',
  seatTaken: 'Bezet',
  stand: 'Naar de zijlijn',
  stands: 'Zijlijn',
  ready: 'Ik ben klaar',
  unready: 'Toch nog niet',
  waitingReady: 'Wachten tot iedereen klaar is…',
  begin: 'Beginnen',
  needBoth: 'Beide plaatsen moeten bezet zijn.',
  hostOnly: 'Alleen de gastheer kan beginnen.',
  clockTitle: 'Klok',
  clockOn: 'Aan',
  clockOff: 'Uit',
  minutes: 'Minuten',
  increment: 'Bonus per zet (s)',
  noClock: 'Zonder klok',
  positionTitle: 'Stand inzetten',
  positionSub: 'Optioneel: begin vanaf een eigen stand in damnotatie.',
  positionLoad: 'Stand laden',
  positionPlaceholder: 'W:W31,K35:B12,K19',
  rulesTitle: 'De regels van het internationale spel',
  rulesList: [
    ['Bord van 100 velden', '10×10, twintig schijven per kant, gespeeld op de donkere velden en genummerd 1 tot 50.'],
    ['Slaan is verplicht', 'Ligt er een slagzet, dan mág je niets anders. Schijven slaan vooruit én achteruit.'],
    ['Meerslag: het maximum', 'Van alle mogelijke slagzetten moet je er één spelen die het grootste aantal stukken slaat.'],
    ['Vliegende dam', 'Een dam loopt zo ver als hij wil over de diagonaal en slaat op willekeurige afstand — je kiest zelf waar hij landt.'],
    ['Geslagen stukken blijven staan', 'Ze gaan er pas af als de hele slag klaar is, dus twee keer over hetzelfde stuk kan niet.'],
    ['Promotie op de laatste lijn', 'Een schijf die op de overkant eindigt wordt dam. Wie er onderweg alleen langs komt, blijft schijf.'],
  ],

  white: 'Wit',
  black: 'Zwart',
  yourMove: 'Jij bent aan zet',
  theirMove: 'aan zet',
  spectating: 'Je kijkt mee',
  spectators: 'kijkers',
  mustCapture: 'Slaan is verplicht',
  mustCaptureCount: (n) => `Slaan is verplicht — ${n} ${n === 1 ? 'stuk' : 'stukken'}`,
  pickRoute: 'Kies je route',
  pickRouteSub: 'Even veel stukken, verschillende weg. Tik de volgende landing of kies hieronder.',
  routeCount: (n) => `${n} routes`,
  cancelPick: 'Opnieuw kiezen',
  flip: 'Bord omdraaien',
  moves: 'Zetlijst',
  noMoves: 'Nog geen zetten.',
  live: 'Nu',
  navStart: 'Naar het begin',
  navBack: 'Zet terug',
  navForward: 'Zet vooruit',
  navLive: 'Terug naar de stand',
  reviewing: 'Je kijkt terug',
  resign: 'Opgeven',
  offerDraw: 'Remise aanbieden',
  drawOffered: 'Remise aangeboden — wachten op antwoord',
  drawFromThem: 'biedt remise aan',
  accept: 'Aannemen',
  decline: 'Afwijzen',
  confirmResign: 'Echt opgeven?',
  yes: 'Ja, opgeven',
  no: 'Nee',
  again: 'Nieuwe partij',
  drawCounters: 'Remisetellers',
  kingIdle: (n, limit) => `${n}/${limit} halve zetten alleen met dammen`,
  endgame: (n, limit) => `${n}/${limit} halve zetten in het eindspel`,
  captured: (n) => `${n} geslagen`,
  kings: (n) => (n === 1 ? '1 dam' : `${n} dammen`),
  men: 'schijven',

  wins: (who) => `${who} wint`,
  drawn: 'Remise',
  reason: REASON_NL,
  sideName: (side) => (side === 'w' ? 'Wit' : 'Zwart'),
  logLine: (code, args) => {
    const a = String(args.a ?? '');
    switch (code) {
      case 'seated':
        return `${a} schoof aan`;
      case 'watching':
        return `${a} kijkt mee`;
      case 'rejoined':
        return `${a} is terug`;
      case 'dropped':
        return `${a} viel weg`;
      case 'swept':
        return 'Lege plaatsen opgeruimd';
      case 'sat':
        return `${a} neemt ${args.s === 'w' ? 'wit' : 'zwart'}`;
      case 'stood':
        return `${a} ging naar de zijlijn`;
      case 'host':
        return `${a} is nu gastheer`;
      case 'position':
        return 'Eigen stand ingezet';
      case 'started':
        return 'De partij is begonnen';
      case 'moved':
        return Number(args.n) > 0 ? `${a}: ${args.m} (${args.n} geslagen)` : `${a}: ${args.m}`;
      case 'crowned':
        return `${a} haalt dam op ${args.q}`;
      case 'resigned':
        return `${a} geeft op`;
      case 'offered':
        return `${a} biedt remise aan`;
      case 'declined':
        return `${a} wijst remise af`;
      case 'flagged':
        return `${a} valt door de vlag`;
      case 'won':
        return `${a} wint — ${REASON_NL[args.r as EndReason] ?? args.r}`;
      case 'drawn':
        return `Remise — ${REASON_NL[args.r as EndReason] ?? args.r}`;
      case 'abandoned':
        return 'Niemand meer aan het bord — partij afgebroken';
      case 'lobby':
        return 'Terug naar de lobby';
      default:
        return code;
    }
  },
};

const EN: Copy = {
  brand: 'DAMCAFÉ',
  tagline: 'International draughts · 10×10',

  checkinTitle: 'Pull up a chair',
  checkinSub: 'Pick a name and take a seat at the board.',
  nameLabel: 'Name',
  namePlaceholder: 'Your name',
  enter: 'Sit down',
  watch: 'Just watch',
  noRoom: 'No room code in the link.',
  room: 'Room',
  copyLink: 'Copy link',
  copied: 'Copied',
  leave: 'Leave',
  status: {
    idle: 'not connected',
    dialing: 'connecting…',
    live: 'connected',
    lost: 'connection lost — retrying…',
  },

  lobbyTitle: 'The board is set',
  lobbySub: 'Two players, as many onlookers as you like. White moves first.',
  seatWhite: 'White',
  seatBlack: 'Black',
  takeSeat: 'Take this seat',
  yourSeat: 'You',
  seatTaken: 'Taken',
  stand: 'Move to the side',
  stands: 'Onlookers',
  ready: 'I am ready',
  unready: 'Not yet',
  waitingReady: 'Waiting for everyone to be ready…',
  begin: 'Start the game',
  needBoth: 'Both seats have to be filled.',
  hostOnly: 'Only the host can start.',
  clockTitle: 'Clock',
  clockOn: 'On',
  clockOff: 'Off',
  minutes: 'Minutes',
  increment: 'Increment per move (s)',
  noClock: 'No clock',
  positionTitle: 'Set up a position',
  positionSub: 'Optional: start from your own position in draughts notation.',
  positionLoad: 'Load position',
  positionPlaceholder: 'W:W31,K35:B12,K19',
  rulesTitle: 'The international rules',
  rulesList: [
    ['A hundred squares', '10×10, twenty men a side, played on the dark squares and numbered 1 to 50.'],
    ['Capturing is compulsory', 'If a capture exists you may play nothing else. Men capture forwards and backwards.'],
    ['Take the maximum', 'Of every capture sequence available you must play one that takes the greatest number of pieces.'],
    ['Flying kings', 'A king runs as far as it likes along a diagonal and captures at any distance — you choose where it lands.'],
    ['Captured pieces stay put', 'They only come off once the whole sequence is finished, so nothing is ever jumped twice.'],
    ['Promotion on the far row', 'A man that finishes on the far row is crowned. One that merely passes through stays a man.'],
  ],

  white: 'White',
  black: 'Black',
  yourMove: 'Your move',
  theirMove: 'to move',
  spectating: 'You are watching',
  spectators: 'watching',
  mustCapture: 'Capturing is compulsory',
  mustCaptureCount: (n) => `Capturing is compulsory — ${n} ${n === 1 ? 'piece' : 'pieces'}`,
  pickRoute: 'Choose your route',
  pickRouteSub: 'Same number of pieces, different way round. Tap the next landing or pick one below.',
  routeCount: (n) => `${n} routes`,
  cancelPick: 'Start over',
  flip: 'Flip the board',
  moves: 'Moves',
  noMoves: 'No moves yet.',
  live: 'Live',
  navStart: 'To the start',
  navBack: 'One move back',
  navForward: 'One move forward',
  navLive: 'Back to live',
  reviewing: 'Reviewing',
  resign: 'Resign',
  offerDraw: 'Offer a draw',
  drawOffered: 'Draw offered — waiting for an answer',
  drawFromThem: 'offers a draw',
  accept: 'Accept',
  decline: 'Decline',
  confirmResign: 'Really resign?',
  yes: 'Yes, resign',
  no: 'No',
  again: 'New game',
  drawCounters: 'Draw counters',
  kingIdle: (n, limit) => `${n}/${limit} half-moves of kings only`,
  endgame: (n, limit) => `${n}/${limit} half-moves in the endgame`,
  captured: (n) => `${n} taken`,
  kings: (n) => (n === 1 ? '1 king' : `${n} kings`),
  men: 'men',

  wins: (who) => `${who} wins`,
  drawn: 'Draw',
  reason: REASON_EN,
  sideName: (side) => (side === 'w' ? 'White' : 'Black'),
  logLine: (code, args) => {
    const a = String(args.a ?? '');
    switch (code) {
      case 'seated':
        return `${a} sat down`;
      case 'watching':
        return `${a} is watching`;
      case 'rejoined':
        return `${a} is back`;
      case 'dropped':
        return `${a} dropped out`;
      case 'swept':
        return 'Empty seats cleared';
      case 'sat':
        return `${a} takes ${args.s === 'w' ? 'white' : 'black'}`;
      case 'stood':
        return `${a} moved to the side`;
      case 'host':
        return `${a} is now the host`;
      case 'position':
        return 'Custom position loaded';
      case 'started':
        return 'The game has begun';
      case 'moved':
        return Number(args.n) > 0 ? `${a}: ${args.m} (${args.n} taken)` : `${a}: ${args.m}`;
      case 'crowned':
        return `${a} crowns a king on ${args.q}`;
      case 'resigned':
        return `${a} resigns`;
      case 'offered':
        return `${a} offers a draw`;
      case 'declined':
        return `${a} declines the draw`;
      case 'flagged':
        return `${a}'s flag fell`;
      case 'won':
        return `${a} wins — ${REASON_EN[args.r as EndReason] ?? args.r}`;
      case 'drawn':
        return `Draw — ${REASON_EN[args.r as EndReason] ?? args.r}`;
      case 'abandoned':
        return 'Nobody left at the board — game abandoned';
      case 'lobby':
        return 'Back to the lobby';
      default:
        return code;
    }
  },
};

export function copyFor(lang: Lang): Copy {
  return lang === 'en' ? EN : NL;
}
