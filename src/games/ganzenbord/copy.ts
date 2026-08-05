import type { SquareKind, Variant } from './protocol';

export type Lang = 'nl' | 'en';

/** One square, with the traditional Dutch name always kept alongside. */
export interface SquareCopy {
  /** Name in the reader's language. */
  name: string;
  /** The same square in the other language, shown as a subtitle. */
  other: string;
}

/** Everything the punishment window puts on the page. */
export interface EventCopy extends SquareCopy {
  /** One-line headline for the ticker. */
  head: string;
  /** What the square does, mechanically. */
  what: string;
  /** How long it lasts or what gets you out. */
  how: string;
  /** A little storybook line, in the voice of the old board. */
  flavour: string;
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
  status: Record<'idle' | 'dialing' | 'live' | 'lost', string>;
  noRoom: string;
  noRoomSub: string;
  toLanding: string;

  lobbyTitle: string;
  lobbySub: string;
  variantTitle: string;
  variantSub: string;
  variantNames: Record<Variant, string>;
  variantNote: Record<Variant, string>;
  restore: string;
  rulesHeading: string;
  openingNines: string;
  openingNinesHint: string;
  innTurns: string;
  innTurnsHint: string;
  mazeBack: string;
  mazeBackHint: string;
  deathTo: string;
  deathToHint: string;
  deathNest: string;
  deathOne: string;
  wellFreesAll: string;
  wellFreesAllHint: string;
  exactFinish: string;
  exactFinishHint: string;
  swapOnLanding: string;
  swapOnLandingHint: string;
  turnClock: string;
  maxSeats: string;
  seconds: string;
  /** Singular and plural, so no user-facing string ever says "turn(s)". */
  turnOne: string;
  turnMany: string;
  gooseOne: string;
  gooseMany: string;
  on: string;
  off: string;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  playersHeading: string;
  waitingHost: string;

  boardTitle: string;
  yourTurn: string;
  waitingFor: string;
  rollBtn: string;
  rolling: string;
  throwLabel: string;
  clock: string;
  turnNo: string;
  heldHint: string;
  innHint: string;
  fitView: string;
  followView: string;
  legend: string;
  pawns: string;
  square: string;
  nest: string;
  /** Reads better than a bare "0" inside a sentence. */
  nestInline: string;
  feed: string;
  you: string;
  hostTag: string;
  away: string;
  throws: string;
  held: string;
  waits: string;
  spectating: string;
  reconnecting: string;

  winnerTitle: string;
  youWin: string;
  winnerSub: string;
  again: string;

  punishTitle: string;
  punishFor: string;
  whatHappens: string;
  howLong: string;
  yourPawn: string;
  theirPawn: string;
  company: string;
  freedNow: string;
  pawnMoved: string;
  pawnStays: string;
  dismiss: string;
  details: string;
  autoClose: string;
  rescueHead: string;
  rescueBody: string;
  gooseHead: string;
  bridgeHead: string;
  bounceHead: string;
  openingHead: string;
  swapHead: string;

  squares: Record<SquareKind, SquareCopy>;
  events: Record<'inn' | 'well' | 'maze' | 'prison' | 'death', EventCopy>;
  log: Record<string, string>;
}

const LOG_EN: Record<string, string> = {
  seated: '{a} took a pawn',
  rejoined: '{a} is back',
  dropped: '{a} left the board',
  newHost: '{a} is now the host',
  swept: 'Empty places cleared',
  opened: 'Dice are out — {a} rules',
  lobby: 'Back to the lobby',
  threw: '{a} threw {x} and {y} — {n}',
  moved: '{a} moves to {n}',
  opening: '{a} throws the opening nine and runs to {n}',
  goose: '{a} rides {n} {g} up to {m}',
  bridge: '{a} takes the bridge across to {n}',
  bounced: '{a} overshoots 63 and bounces back to {n}',
  inn: '{a} settles into the inn and loses {n} {t}',
  well: '{a} falls into the well',
  prison: '{a} is locked in the prison',
  maze: '{a} gets lost in the maze and is back on {n}',
  death: '{a} meets death and starts again from {n}',
  rescued: '{a} frees {b} from square {n}',
  swapped: '{a} trades places with {b}, who drops to {n}',
  waits: '{a} is still in the inn — {n} {t} to go',
  deadlock: 'Everybody was stuck, so {a} climbs out on {n}',
  timeout: '{a} ran out of time — the clock threw for them',
  abandoned: 'Board went quiet — back to the lobby',
  winner: '{a} reaches 63 in {n} throws and wins',
};

const LOG_NL: Record<string, string> = {
  seated: '{a} pakt een pion',
  rejoined: '{a} is terug',
  dropped: '{a} verliet het bord',
  newHost: '{a} is nu de host',
  swept: 'Lege plekken opgeruimd',
  opened: 'De dobbelstenen zijn los — {a}',
  lobby: 'Terug naar de lobby',
  threw: '{a} gooide {x} en {y} — {n}',
  moved: '{a} gaat naar {n}',
  opening: '{a} gooit de openingsnegen en rent naar {n}',
  goose: '{a} vliegt met {n} {g} door naar {m}',
  bridge: '{a} steekt de brug over naar {n}',
  bounced: '{a} gooit voorbij 63 en stuitert terug naar {n}',
  inn: '{a} blijft hangen in de herberg en slaat {n} {t} over',
  well: '{a} valt in de put',
  prison: '{a} zit vast in de gevangenis',
  maze: '{a} verdwaalt in het doolhof en staat weer op {n}',
  death: '{a} komt de dood tegen en begint opnieuw op {n}',
  rescued: '{a} bevrijdt {b} van vak {n}',
  swapped: '{a} ruilt van plek met {b}, die terugvalt naar {n}',
  waits: '{a} zit nog in de herberg — nog {n} {t}',
  deadlock: 'Iedereen zat vast, dus {a} klimt eruit op {n}',
  timeout: '{a} liet de klok verlopen — er is voor hem gegooid',
  abandoned: 'Het bord viel stil — terug naar de lobby',
  winner: '{a} bereikt 63 in {n} worpen en wint',
};

const SQUARES_NL: Record<SquareKind, SquareCopy> = {
  start: { name: 'Het nest', other: 'The nest' },
  plain: { name: 'Gewoon vak', other: 'Plain square' },
  goose: { name: 'De gans', other: 'The goose' },
  bridge: { name: 'De brug', other: 'The bridge' },
  inn: { name: 'De herberg', other: 'The inn' },
  well: { name: 'De put', other: 'The well' },
  maze: { name: 'Het doolhof', other: 'The maze' },
  prison: { name: 'De gevangenis', other: 'The prison' },
  death: { name: 'De dood', other: 'Death' },
  goal: { name: 'De ganzentuin', other: 'The goose garden' },
};

const SQUARES_EN: Record<SquareKind, SquareCopy> = {
  start: { name: 'The nest', other: 'Het nest' },
  plain: { name: 'Plain square', other: 'Gewoon vak' },
  goose: { name: 'The goose', other: 'De gans' },
  bridge: { name: 'The bridge', other: 'De brug' },
  inn: { name: 'The inn', other: 'De herberg' },
  well: { name: 'The well', other: 'De put' },
  maze: { name: 'The maze', other: 'Het doolhof' },
  prison: { name: 'The prison', other: 'De gevangenis' },
  death: { name: 'Death', other: 'De dood' },
  goal: { name: 'The goose garden', other: 'De ganzentuin' },
};

const EVENTS_NL: Copy['events'] = {
  inn: {
    ...SQUARES_NL.inn,
    head: '{a} blijft plakken in de herberg',
    what: 'Vak 19 is de herberg. Wie hier aankomt schuift aan, bestelt en blijft zitten. De pion blijft op 19 staan en er worden {n} {t} overgeslagen.',
    how: 'Het gaat vanzelf voorbij: na {n} overgeslagen {t} mag er weer gegooid worden, gewoon verder vanaf 19.',
    flavour: '"Nog één kannetje," zei hij. Dat was drie kannetjes geleden.',
  },
  well: {
    ...SQUARES_NL.well,
    head: '{a} valt in de put',
    what: 'Vak 31 is de put. Wie erin valt blijft op 31 staan en gooit niet meer mee zolang hij daar zit.',
    how: 'Eruit komen gaat alleen als een andere speler óók precies op 31 landt. Die neemt de plaats in de put over en de eerste mag weer verder.',
    flavour: 'Beneden is het koud en het riekt naar mos. Je hoort de anderen dobbelen.',
  },
  maze: {
    ...SQUARES_NL.maze,
    head: '{a} verdwaalt in het doolhof',
    what: 'Vak 42 is het doolhof. Je loopt er rondjes, komt uit waar je niet wilt, en de pion wordt teruggezet naar vak {n}.',
    how: 'Eenmalig. Er gaat geen beurt verloren — de volgende worp gaat gewoon door, alleen {m} vakken verder terug.',
    flavour: 'Alle heggen zien er hetzelfde uit. Ook die je al drie keer voorbij liep.',
  },
  prison: {
    ...SQUARES_NL.prison,
    head: '{a} gaat de gevangenis in',
    what: 'Vak 52 is de gevangenis. De deur valt dicht, de pion blijft op 52 staan en er wordt niet meer meegegooid.',
    how: 'Aflossing is de enige uitweg: pas als een andere speler precies op 52 landt, gaat die zitten en mag de vorige weer verder.',
    flavour: 'De cipier heeft alle tijd. Jij ook, blijkt.',
  },
  death: {
    ...SQUARES_NL.death,
    head: '{a} komt de dood tegen',
    what: 'Vak 58 is de dood, vijf vakken voor de finish. Alle gelopen vakken zijn weg: de pion gaat terug naar {n}.',
    how: 'Eenmalig en meteen klaar. Er gaat geen beurt verloren — de reis begint alleen helemaal opnieuw.',
    flavour: 'Zo dicht bij de tuin. En dan dit.',
  },
};

const EVENTS_EN: Copy['events'] = {
  inn: {
    ...SQUARES_EN.inn,
    head: '{a} is stuck at the inn',
    what: 'Square 19 is the inn. Whoever arrives pulls up a chair, orders, and stays. The pawn stays on 19 and {n} {t} are missed.',
    how: 'It clears on its own: after {n} skipped {t} the throwing resumes, carrying on from 19.',
    flavour: '"Just one more jug," he said. That was three jugs ago.',
  },
  well: {
    ...SQUARES_EN.well,
    head: '{a} falls into the well',
    what: 'Square 31 is the well. Whoever falls in stays on 31 and drops out of the throwing order while sitting down there.',
    how: 'Only another player landing exactly on 31 gets them out. That player takes over the well and the first one carries on.',
    flavour: 'It is cold down here and it smells of moss. You can hear the dice above you.',
  },
  maze: {
    ...SQUARES_EN.maze,
    head: '{a} gets lost in the maze',
    what: 'Square 42 is the maze. You wander, you come out at the wrong hedge, and the pawn is set back to square {n}.',
    how: 'One-off. No turn is lost — the next throw happens as normal, just {m} squares further back.',
    flavour: 'Every hedge looks the same. Including the three you already walked past.',
  },
  prison: {
    ...SQUARES_EN.prison,
    head: '{a} is thrown in prison',
    what: 'Square 52 is the prison. The door shuts, the pawn stays on 52, and the throwing stops.',
    how: 'Relief is the only way out: only when another player lands exactly on 52 do they take the cell and the previous one goes free.',
    flavour: 'The jailer has all the time in the world. So do you, it turns out.',
  },
  death: {
    ...SQUARES_EN.death,
    head: '{a} meets death',
    what: 'Square 58 is death, five squares from the finish. Every square walked is gone: the pawn returns to {n}.',
    how: 'One-off and over at once. No turn is missed — the whole journey simply starts again.',
    flavour: 'So close to the garden. And then this.',
  },
};

const nl: Copy = {
  brand: 'EMPYR',
  tagline: 'GANZENBORD',
  checkinTitle: 'Kies je naam',
  checkinSub: 'Iedereen aan het bord ziet hem naast je pion staan.',
  nameLabel: 'Weergavenaam',
  namePlaceholder: 'bijv. ANJA',
  enter: 'Pak een pion',
  room: 'Kamer',
  copyLink: 'Kopieer link',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  status: { idle: 'Offline', dialing: 'Verbinden', live: 'Live', lost: 'Herverbinden' },
  noRoom: 'Geen kamercode',
  noRoomSub: 'Open een bord via de voorpagina of gebruik een uitnodigingslink.',
  toLanding: 'Naar de voorpagina',

  lobbyTitle: 'Om het bord',
  lobbySub:
    'Gooi met twee stenen, verplaats je pion en doe wat het vak zegt. Twaalf ganzen vliegen je door, maar de put, de gevangenis en de dood wachten geduldig. Wie precies op 63 landt, wint.',
  variantTitle: 'Regelset',
  variantSub: 'De host bepaalt de variant. Waar tafels echt van mening verschillen, kun je kiezen.',
  variantNames: { traditional: 'Traditioneel', house: 'Huisregels' },
  variantNote: {
    traditional: 'De klassieke Nederlandse regels, ongewijzigd.',
    house: 'Aangepast — zie de instellingen hieronder.',
  },
  restore: 'Terug naar traditioneel',
  rulesHeading: 'Instellingen',
  openingNines: 'Openingsnegen',
  openingNinesHint: 'Eerste worp 9 met 3+6 gaat naar 26, met 4+5 naar 53',
  innTurns: 'Herberg',
  innTurnsHint: 'Beurten die je in de herberg verliest',
  mazeBack: 'Doolhof',
  mazeBackHint: 'Waar vak 42 je terugzet',
  deathTo: 'Dood',
  deathToHint: 'Waar vak 58 je heen stuurt',
  deathNest: 'Het nest',
  deathOne: 'Vak 1',
  wellFreesAll: 'Put bevrijdt allemaal',
  wellFreesAllHint: 'Bevrijdt een redding iedereen in dat vak of alleen de eerste',
  exactFinish: 'Precies op 63',
  exactFinishHint: 'Te veel gegooid? Je stuitert terug met het verschil',
  swapOnLanding: 'Plekken ruilen',
  swapOnLandingHint: 'Huisregel: land je op een bezet vak, dan ruil je van plek',
  turnClock: 'Beurtklok',
  maxSeats: 'Max spelers',
  seconds: 'sec',
  turnOne: 'beurt',
  turnMany: 'beurten',
  gooseOne: 'gans',
  gooseMany: 'ganzen',
  on: 'Aan',
  off: 'Uit',
  ready: 'Klaar',
  unready: 'Toch niet',
  start: 'Beginnen',
  needTwo: 'Minimaal 2 spelers',
  hostOnly: 'De host bepaalt de regels',
  playersHeading: 'Pionnen',
  waitingHost: 'Wachten op de host',

  boardTitle: 'Het bord',
  yourTurn: 'Jouw beurt',
  waitingFor: 'Aan zet',
  rollBtn: 'Gooien',
  rolling: 'Rollen…',
  throwLabel: 'Worp',
  clock: 'Klok',
  turnNo: 'Beurt',
  heldHint: 'Je zit vast — wacht tot iemand je komt aflossen.',
  innHint: 'Je zit in de herberg. Nog {n} {t} wachten.',
  fitView: 'Heel bord',
  followView: 'Inzoomen',
  legend: 'Legenda',
  pawns: 'Pionnen',
  square: 'Vak',
  nest: 'Nest',
  nestInline: 'het nest',
  feed: 'Verslag',
  you: 'jij',
  hostTag: 'Host',
  away: 'Weg',
  throws: 'worpen',
  held: 'Vast',
  waits: 'Herberg',
  spectating: 'Je kijkt toe.',
  reconnecting: 'Verbinding kwijt — we proberen het opnieuw.',

  winnerTitle: 'In de ganzentuin',
  youWin: 'Jij wint!',
  winnerSub: 'Precies op 63 geland. De rest staat nog te dobbelen.',
  again: 'Terug naar de lobby',

  punishTitle: 'Strafvak',
  punishFor: 'Vak {n}',
  whatHappens: 'Wat gebeurt er',
  howLong: 'Hoe lang duurt het',
  yourPawn: 'Je pion',
  theirPawn: 'De pion van {a}',
  company: 'Wie er al zat',
  freedNow: 'die is nu vrij',
  pawnMoved: 'Van vak {a} naar {b}.',
  pawnStays: 'Blijft op vak {a} staan.',
  dismiss: 'Verder spelen',
  details: 'Bekijken',
  autoClose: 'Sluit vanzelf — het spel gaat door.',
  rescueHead: '{a} lost {b} af',
  rescueBody: 'Vak {n} is weer bezet, maar niet meer door hen.',
  gooseHead: '{a} vliegt mee met de gans',
  bridgeHead: '{a} steekt de brug over',
  bounceHead: '{a} stuitert terug van 63',
  openingHead: '{a} gooit de openingsnegen',
  swapHead: '{a} ruilt van plek met {b}',

  squares: SQUARES_NL,
  events: EVENTS_NL,
  log: LOG_NL,
};

const en: Copy = {
  brand: 'EMPYR',
  tagline: 'GANZENBORD',
  checkinTitle: 'Pick your name',
  checkinSub: 'Everyone around the board sees it next to your pawn.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. ANJA',
  enter: 'Take a pawn',
  room: 'Room',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',
  status: { idle: 'Offline', dialing: 'Connecting', live: 'Live', lost: 'Reconnecting' },
  noRoom: 'No room code',
  noRoomSub: 'Open a board from the front page or use an invite link.',
  toLanding: 'To the front page',

  lobbyTitle: 'Around the board',
  lobbySub:
    'Throw two dice, move your pawn, and do whatever the square tells you. Twelve geese fly you onward, but the well, the prison and death all wait patiently. Land exactly on 63 to win.',
  variantTitle: 'Rule set',
  variantSub: 'The host picks the variant. Where tables genuinely disagree, you get a choice.',
  variantNames: { traditional: 'Traditional', house: 'House rules' },
  variantNote: {
    traditional: 'The classic Dutch rules, untouched.',
    house: 'Bent out of shape — see the settings below.',
  },
  restore: 'Back to traditional',
  rulesHeading: 'Settings',
  openingNines: 'Opening nine',
  openingNinesHint: 'A first-throw 9 as 3+6 runs to 26, as 4+5 runs to 53',
  innTurns: 'Inn',
  innTurnsHint: 'Turns lost sitting in the inn',
  mazeBack: 'Maze',
  mazeBackHint: 'Where square 42 sets you back to',
  deathTo: 'Death',
  deathToHint: 'Where square 58 sends you',
  deathNest: 'The nest',
  deathOne: 'Square 1',
  wellFreesAll: 'Well frees everyone',
  wellFreesAllHint: 'Does a rescue free everybody in that square, or only the first',
  exactFinish: 'Exactly 63',
  exactFinishHint: 'Overshoot and you bounce back by the excess',
  swapOnLanding: 'Trade places',
  swapOnLandingHint: 'House rule: land on an occupied square and you swap places',
  turnClock: 'Turn clock',
  maxSeats: 'Max players',
  seconds: 'sec',
  turnOne: 'turn',
  turnMany: 'turns',
  gooseOne: 'goose',
  gooseMany: 'geese',
  on: 'On',
  off: 'Off',
  ready: 'Ready',
  unready: 'Not ready',
  start: 'Start',
  needTwo: 'Needs 2 players',
  hostOnly: 'The host sets the rules',
  playersHeading: 'Pawns',
  waitingHost: 'Waiting for the host',

  boardTitle: 'The board',
  yourTurn: 'Your turn',
  waitingFor: 'Throwing',
  rollBtn: 'Throw',
  rolling: 'Rolling…',
  throwLabel: 'Throw',
  clock: 'Clock',
  turnNo: 'Turn',
  heldHint: 'You are held — wait for somebody to relieve you.',
  innHint: 'You are in the inn. {n} {t} still to wait.',
  fitView: 'Whole board',
  followView: 'Zoom in',
  legend: 'Legend',
  pawns: 'Pawns',
  square: 'Square',
  nest: 'Nest',
  nestInline: 'the nest',
  feed: 'Report',
  you: 'you',
  hostTag: 'Host',
  away: 'Away',
  throws: 'throws',
  held: 'Held',
  waits: 'Inn',
  spectating: 'You are watching.',
  reconnecting: 'Connection lost — trying again.',

  winnerTitle: 'Into the goose garden',
  youWin: 'You win!',
  winnerSub: 'Landed exactly on 63. Everybody else is still rattling dice.',
  again: 'Back to the lobby',

  punishTitle: 'Penalty square',
  punishFor: 'Square {n}',
  whatHappens: 'What happens',
  howLong: 'How long it lasts',
  yourPawn: 'Your pawn',
  theirPawn: '{a}’s pawn',
  company: 'Who was already in there',
  freedNow: 'now free',
  pawnMoved: 'From square {a} to {b}.',
  pawnStays: 'Stays on square {a}.',
  dismiss: 'Carry on',
  details: 'Look',
  autoClose: 'Closes by itself — the game keeps going.',
  rescueHead: '{a} relieves {b}',
  rescueBody: 'Square {n} is occupied again, just not by them.',
  gooseHead: '{a} rides the goose',
  bridgeHead: '{a} takes the bridge',
  bounceHead: '{a} bounces back from 63',
  openingHead: '{a} throws the opening nine',
  swapHead: '{a} trades places with {b}',

  squares: SQUARES_EN,
  events: EVENTS_EN,
  log: LOG_EN,
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? nl : en;
}

/** Fill {a}, {n}… placeholders. */
export function fill(template: string, args?: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const raw = args?.[key];
    return raw === undefined ? '' : String(raw);
  });
}

export function plural(n: number, one: string, many: string): string {
  return Math.abs(n) === 1 ? one : many;
}

/** Counted nouns the templates ask for: {t} turns, {g} geese. */
export function counts(copy: Copy, n: number): Record<string, string> {
  return {
    t: plural(n, copy.turnOne, copy.turnMany),
    g: plural(n, copy.gooseOne, copy.gooseMany),
  };
}

/** Log codes whose {n} is a square number, so 0 must read as the nest. */
const PLACE_CODES = new Set([
  'moved',
  'opening',
  'bridge',
  'bounced',
  'maze',
  'death',
  'swapped',
  'deadlock',
]);

/** A square number as it should read inside a sentence. */
export function place(copy: Copy, n: number): string {
  return n === 0 ? copy.nestInline : String(n);
}

/** Renders a server log code into the viewer's language. */
export function logText(
  line: { code: string; args?: Record<string, string | number> },
  copy: Copy,
): string {
  const template = copy.log[line.code] ?? line.code;
  if (line.code === 'opened') {
    const variant = String(line.args?.a ?? 'traditional') as Variant;
    return fill(template, { a: copy.variantNames[variant] ?? variant });
  }
  const n = Number(line.args?.n ?? 0);
  const args = { ...counts(copy, n), ...line.args };
  if (PLACE_CODES.has(line.code)) args.n = place(copy, n);
  return fill(template, args);
}
