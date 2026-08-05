import type { Color, SixLimit } from './protocol';

export type Lang = 'nl' | 'en';

interface Option {
  name: string;
  desc: string;
}

export interface Copy {
  brand: string;
  tagline: string;
  checkinTitle: string;
  checkinSub: string;
  nameLabel: string;
  namePlaceholder: string;
  enter: string;
  room: string;
  copyLink: string;
  copied: string;
  leave: string;
  sound: string;
  status: Record<'idle' | 'dialing' | 'live' | 'lost', string>;
  noRoom: string;

  lobbyTitle: string;
  lobbySub: string;
  playersHeading: string;
  variantTitle: string;
  variantSub: string;
  settingsTitle: string;
  sixLimitLabel: string;
  sixLimits: Record<'2' | '3' | '0', string>;
  sixLimitHint: string;
  yardTriesLabel: string;
  yardTriesHint: string;
  turnClock: string;
  maxSeats: string;
  blockOnStart: Option;
  mustCapture: Option;
  autoSingle: Option;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  seatPreview: string;
  boardTwo: string;
  boardThree: string;
  boardFour: string;

  yourTurn: string;
  waitingFor: string;
  rollBtn: string;
  rolling: string;
  rolled: string;
  pickPawn: string;
  pickOne: string;
  autoPlayed: string;
  extraRoll: string;
  triesLeft: string;
  noMoveHint: string;
  clock: string;
  yard: string;
  homeCol: string;
  homeShort: string;
  pawn: string;
  closedArm: string;
  variantBadge: string;

  optEnter: string;
  optSteps: string;
  optHome: string;
  optFinish: string;
  optCapture: string;
  targetLabel: string;

  seatYou: string;
  seatAway: string;
  hostTag: string;
  hits: string;
  hurt: string;
  ruleSheet: string;
  rules: [string, string][];

  captureShout: string;
  captureSub: string;
  sixShout: string;
  homeShout: string;
  stuckShout: string;
  winnerTitle: string;
  youWin: string;
  again: string;
  waitingHost: string;
  feed: string;
  standings: string;

  colors: Record<Color, string>;
  log: Record<string, string>;
}

const LOG_EN: Record<string, string> = {
  seated: '{a} sat down',
  rejoined: '{a} is back',
  dropped: '{a} dropped out',
  newHost: '{a} is now the host',
  swept: 'Cleared the empty seats',
  start: 'Board set for {n} players',
  lobby: 'Back to the lobby',
  rolled: '{a} rolled a {n}',
  sixAgain: '{a} rolls again',
  tryAgain: '{a} may try again — {n} left',
  forced: 'Only one move — played for {a}',
  entered: '{a} brought a pawn out',
  moved: '{a} moved {n}',
  homed: '{a} is home with {n}',
  captured: '{a} sent {b} back to the yard',
  noMove: '{a} rolled {n} and could not move',
  timeout: '{a} ran out of time',
  abandoned: 'Board went quiet — back to the lobby',
  winner: '{a} got all four pawns home',
};

const LOG_NL: Record<string, string> = {
  seated: '{a} neemt plaats',
  rejoined: '{a} is terug',
  dropped: '{a} viel weg',
  newHost: '{a} is nu de host',
  swept: 'Lege plekken opgeruimd',
  start: 'Bord klaargezet voor {n} spelers',
  lobby: 'Terug naar de lobby',
  rolled: '{a} gooit {n}',
  sixAgain: '{a} mag nog een keer',
  tryAgain: '{a} mag het nog eens proberen — nog {n}',
  forced: 'Maar één zet — voor {a} gedaan',
  entered: '{a} zet een pion in het spel',
  moved: '{a} zet {n} vooruit',
  homed: '{a} is binnen met {n}',
  captured: '{a} slaat {b} terug naar het hok',
  noMove: '{a} gooit {n} en kan niets',
  timeout: '{a} liet de klok verlopen',
  abandoned: 'Bord viel stil — terug naar de lobby',
  winner: '{a} heeft alle vier de pionnen binnen',
};

const en: Copy = {
  brand: 'MENS',
  tagline: 'erger je niet',
  checkinTitle: 'Pick your name',
  checkinSub: 'Everyone at the board will see it.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. SAM',
  enter: 'Take a seat',
  room: 'Room',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',
  sound: 'Sound',
  status: { idle: 'Offline', dialing: 'Connecting', live: 'Live', lost: 'Reconnecting' },
  noRoom: 'No room code',

  lobbyTitle: 'Set up the board',
  lobbySub:
    'Four pawns each. Roll a six to get one out, race all the way round, and land on somebody to send them straight back to their yard.',
  playersHeading: 'Players',
  variantTitle: 'House variants',
  variantSub: 'Every family plays this differently. Settle it here — the board shows what is running.',
  settingsTitle: 'Board settings',
  sixLimitLabel: 'Sixes in a row',
  sixLimits: { '2': 'Two', '3': 'Three', '0': 'No limit' },
  sixLimitHint: 'The last six of the run buys no extra roll',
  yardTriesLabel: 'Tries from the yard',
  yardTriesHint: 'Rolls you get while all four pawns are still in the yard',
  turnClock: 'Turn clock',
  maxSeats: 'Seats',
  blockOnStart: {
    name: 'Guard the start',
    desc: 'A pawn parked on its own start square cannot be passed or captured.',
  },
  mustCapture: {
    name: 'Must hit',
    desc: 'If any move captures, the quiet moves are off the table.',
  },
  autoSingle: {
    name: 'Play forced moves',
    desc: 'When the roll leaves exactly one legal move, the board plays it for you.',
  },
  ready: 'Ready',
  unready: 'Not ready',
  start: 'Start the game',
  needTwo: 'Needs 2 players',
  hostOnly: 'The host sets up the board',
  seatPreview: 'Your colour',
  boardTwo: 'Two players sit on opposite corners — the other two arms stay closed.',
  boardThree: 'Three players, one arm closed. The board stays honest.',
  boardFour: 'All four corners in play.',

  yourTurn: 'Your turn',
  waitingFor: 'Waiting on',
  rollBtn: 'Roll the die',
  rolling: 'Rolling…',
  rolled: 'You rolled',
  pickPawn: 'Pick a pawn',
  pickOne: 'More than one move is legal — choose.',
  autoPlayed: 'Only one legal move, so it was played for you.',
  extraRoll: 'A six! Roll again.',
  triesLeft: 'tries left',
  noMoveHint: 'Nothing legal with that roll.',
  clock: 'Clock',
  yard: 'Yard',
  homeCol: 'Home column',
  homeShort: 'home',
  pawn: 'Pawn',
  closedArm: 'Closed',
  variantBadge: 'Running',

  optEnter: 'Bring a pawn out',
  optSteps: 'Move {n}',
  optHome: 'Into the home column',
  optFinish: 'Onto the last square',
  optCapture: 'and knock {name} back',
  targetLabel: 'Move here',

  seatYou: 'you',
  seatAway: 'Away',
  hostTag: 'Host',
  hits: 'hit',
  hurt: 'sent back',
  ruleSheet: 'How it works',
  rules: [
    ['Six to start', 'A pawn only leaves the yard on a six, straight onto your start square.'],
    ['Six rolls again', 'Every six earns another roll, up to the limit the host set.'],
    ['Land on someone', 'Landing exactly on an opponent sends that pawn all the way back.'],
    ['Exact entry', 'The home column takes an exact count. Overshoot and the move is illegal.'],
    ['All four home', 'Get every pawn into your column and the game is yours.'],
  ],

  captureShout: 'BACK YOU GO!',
  captureSub: '{a} knocked {b} home',
  sixShout: 'SIX!',
  homeShout: 'HOME!',
  stuckShout: 'NOTHING',
  winnerTitle: 'Winner',
  youWin: 'You win!',
  again: 'Back to the lobby',
  waitingHost: 'Waiting for the host',
  feed: 'Board feed',
  standings: 'Standings',

  colors: { red: 'Red', yellow: 'Yellow', green: 'Green', blue: 'Blue' },
  log: LOG_EN,
};

const nl: Copy = {
  brand: 'MENS',
  tagline: 'erger je niet',
  checkinTitle: 'Kies je naam',
  checkinSub: 'Iedereen aan het bord ziet hem.',
  nameLabel: 'Weergavenaam',
  namePlaceholder: 'bijv. SAM',
  enter: 'Neem plaats',
  room: 'Kamer',
  copyLink: 'Kopieer link',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  sound: 'Geluid',
  status: { idle: 'Offline', dialing: 'Verbinden', live: 'Live', lost: 'Herverbinden' },
  noRoom: 'Geen kamercode',

  lobbyTitle: 'Zet het bord klaar',
  lobbySub:
    'Vier pionnen per speler. Gooi een zes om er één uit het hok te halen, ga het hele bord rond en sla iedereen die je precies raakt terug naar zijn hok.',
  playersHeading: 'Spelers',
  variantTitle: 'Huisregels',
  variantSub: 'Elk gezin speelt het anders. Beslis het hier — op het bord staat wat er geldt.',
  settingsTitle: 'Bordinstellingen',
  sixLimitLabel: 'Zessen op rij',
  sixLimits: { '2': 'Twee', '3': 'Drie', '0': 'Geen limiet' },
  sixLimitHint: 'De laatste zes van de reeks geeft geen extra worp',
  yardTriesLabel: 'Pogingen uit het hok',
  yardTriesHint: 'Worpen die je krijgt zolang alle vier de pionnen in het hok staan',
  turnClock: 'Beurtklok',
  maxSeats: 'Plekken',
  blockOnStart: {
    name: 'Startveld bezet',
    desc: 'Een pion op zijn eigen startveld mag niet gepasseerd of geslagen worden.',
  },
  mustCapture: {
    name: 'Slaan is verplicht',
    desc: 'Kun je slaan, dan vervallen alle andere zetten.',
  },
  autoSingle: {
    name: 'Gedwongen zet zelf doen',
    desc: 'Is er precies één legale zet, dan doet het bord hem voor je.',
  },
  ready: 'Klaar',
  unready: 'Toch niet',
  start: 'Start het spel',
  needTwo: 'Minimaal 2 spelers',
  hostOnly: 'De host zet het bord klaar',
  seatPreview: 'Jouw kleur',
  boardTwo: 'Twee spelers zitten schuin tegenover elkaar — de andere twee armen blijven dicht.',
  boardThree: 'Drie spelers, één arm dicht. Het bord blijft eerlijk.',
  boardFour: 'Alle vier de hoeken in het spel.',

  yourTurn: 'Jouw beurt',
  waitingFor: 'Wachten op',
  rollBtn: 'Gooi de dobbelsteen',
  rolling: 'Rollen…',
  rolled: 'Je gooide',
  pickPawn: 'Kies een pion',
  pickOne: 'Er kan meer dan één zet — kies zelf.',
  autoPlayed: 'Er was maar één legale zet, dus die is voor je gedaan.',
  extraRoll: 'Een zes! Gooi nog een keer.',
  triesLeft: 'pogingen over',
  noMoveHint: 'Met deze worp kan er niets.',
  clock: 'Klok',
  yard: 'Hok',
  homeCol: 'Huis',
  homeShort: 'binnen',
  pawn: 'Pion',
  closedArm: 'Dicht',
  variantBadge: 'Actief',

  optEnter: 'Pion uit het hok',
  optSteps: '{n} vooruit',
  optHome: 'Het huis in',
  optFinish: 'Naar het laatste veld',
  optCapture: 'en {name} eruit slaan',
  targetLabel: 'Zet hierheen',

  seatYou: 'jij',
  seatAway: 'Weg',
  hostTag: 'Host',
  hits: 'geslagen',
  hurt: 'teruggeslagen',
  ruleSheet: 'Hoe het werkt',
  rules: [
    ['Zes om te starten', 'Een pion komt alleen met een zes uit het hok, recht op je startveld.'],
    ['Zes gooit door', 'Elke zes geeft een extra worp, tot de limiet die de host koos.'],
    ['Precies erop', 'Land je precies op een tegenstander, dan gaat die pion helemaal terug.'],
    ['Exact naar binnen', 'Het huis vraagt een exacte worp. Te veel is geen zet.'],
    ['Alle vier binnen', 'Krijg al je pionnen in je huis en het spel is van jou.'],
  ],

  captureShout: 'ERGER JE NIET!',
  captureSub: '{a} sloeg {b} naar het hok',
  sixShout: 'ZES!',
  homeShout: 'BINNEN!',
  stuckShout: 'NIETS',
  winnerTitle: 'Winnaar',
  youWin: 'Jij wint!',
  again: 'Terug naar de lobby',
  waitingHost: 'Wachten op de host',
  feed: 'Bordfeed',
  standings: 'Stand',

  colors: { red: 'Rood', yellow: 'Geel', green: 'Groen', blue: 'Blauw' },
  log: LOG_NL,
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? nl : en;
}

export function sixLimitName(limit: SixLimit, copy: Copy): string {
  return copy.sixLimits[String(limit) as '2' | '3' | '0'];
}

/** Renders a server log code into the viewer's language. */
export function logText(
  line: { code: string; args?: Record<string, string | number> },
  copy: Copy,
): string {
  const template = copy.log[line.code] ?? line.code;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const raw = line.args?.[key];
    if (raw === undefined) return '';
    return typeof raw === 'number' ? raw.toLocaleString('en-US') : String(raw);
  });
}
