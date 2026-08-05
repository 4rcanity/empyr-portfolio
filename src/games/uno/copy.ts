import type { Color, Face, Pack } from './protocol';

export type Lang = 'nl' | 'en';

interface PackCopy {
  name: string;
  tag: string;
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
  dlcTitle: string;
  dlcSub: string;
  baseGame: string;
  dlcBadge: string;
  activeBadge: string;
  houseTitle: string;
  houseSub: string;
  settingsTitle: string;
  handSize: string;
  targetScore: string;
  singleRound: string;
  turnClock: string;
  maxSeats: string;
  sevenZero: string;
  sevenZeroHint: string;
  jumpIn: string;
  jumpInHint: string;
  stacking: string;
  stackingHint: string;
  drawToMatch: string;
  drawToMatchHint: string;
  on: string;
  off: string;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  playersHeading: string;
  forcedOn: string;

  yourTurn: string;
  waitingFor: string;
  drawPile: string;
  discardPile: string;
  cardsLeft: string;
  mustDraw: string;
  stackWarn: string;
  drawBtn: string;
  takeStack: string;
  passBtn: string;
  playDrawn: string;
  pickColor: string;
  pickTarget: string;
  cancel: string;
  unoBtn: string;
  catchBtn: string;
  clock: string;
  clockwise: string;
  counter: string;
  lightSide: string;
  darkSide: string;
  spectating: string;
  knockedOut: string;
  yourHand: string;
  emptyHand: string;

  seatActive: string;
  seatAway: string;
  seatExposed: string;
  seatYou: string;
  seatCards: string;
  hostTag: string;
  notPlayable: string;
  incoming: string;
  tableLabel: string;

  roundTitle: string;
  roundSub: string;
  nextRound: string;
  waitingHost: string;
  scoreboard: string;
  points: string;
  winnerTitle: string;
  youWin: string;
  again: string;
  feed: string;

  packs: Record<Pack, PackCopy>;
  house: PackCopy;
  colors: Record<Color, string>;
  faces: Partial<Record<Face, string>>;
  fx: Record<string, string>;
  log: Record<string, string>;
}

const FACES_EN: Partial<Record<Face, string>> = {
  skip: 'Skip',
  reverse: 'Reverse',
  draw2: 'Draw Two',
  wild: 'Wild',
  wild4: 'Wild Draw Four',
  draw1: 'Draw One',
  draw5: 'Draw Five',
  skipAll: 'Skip Everyone',
  flip: 'Flip',
  wild2: 'Wild Draw Two',
  wildColor: 'Wild Draw Colour',
  draw6: 'Draw Six',
  draw10: 'Wild Draw Ten',
  discardAll: 'Discard All',
  wildRev4: 'Reverse Draw Four',
  wildSkip: 'Wild Skip',
  wildRev: 'Wild Reverse',
  wildSkipAll: 'Wild Skip Everyone',
  blast: 'Hit Fire',
};

const FACES_NL: Partial<Record<Face, string>> = {
  skip: 'Pas',
  reverse: 'Omkeren',
  draw2: 'Pak Twee',
  wild: 'Joker',
  wild4: 'Joker Pak Vier',
  draw1: 'Pak Eén',
  draw5: 'Pak Vijf',
  skipAll: 'Iedereen Slaat Over',
  flip: 'Flip',
  wild2: 'Joker Pak Twee',
  wildColor: 'Joker Pak Kleur',
  draw6: 'Pak Zes',
  draw10: 'Joker Pak Tien',
  discardAll: 'Alles Afleggen',
  wildRev4: 'Omkeren Pak Vier',
  wildSkip: 'Joker Pas',
  wildRev: 'Joker Omkeren',
  wildSkipAll: 'Joker Iedereen Over',
  blast: 'Vuurstoot',
};

const LOG_EN: Record<string, string> = {
  seated: '{a} sat down',
  rejoined: '{a} reconnected',
  dropped: '{a} dropped out',
  swept: 'Cleared empty seats',
  dealt: 'Cards dealt — {a}',
  lobby: 'Back to the lobby',
  reshuffled: 'Discard pile shuffled back in',
  played: '{a} played {f}',
  jumpedIn: '{a} jumped in!',
  drew: '{a} drew a card',
  drewUntil: '{a} drew {n} until playable',
  passed: '{a} passed',
  skipped: '{a} skipped {b}',
  skippedAll: '{a} skipped everyone and goes again',
  reversed: '{a} reversed the direction',
  flipped: '{a} flipped the deck to its {s} side',
  stacked: '{a} stacked it up to {n}',
  forcedDraw: '{a} made {b} draw {n}',
  atePile: '{a} ate the pile — {n} cards',
  blasted: '{a} hit {b} with a {n}-card blast',
  discardedAll: '{a} dumped {n} {c} cards',
  swapped: '{a} swapped hands with {b}',
  rotated: '{a} rotated every hand',
  calledUno: '{a} called UNO!',
  caught: '{a} caught {b} — two cards',
  mercyOut: '{a} hit {n} cards and is out',
  timeout: '{a} ran out of time',
  abandoned: 'Table went quiet — back to the lobby',
  wonRound: '{a} won the round for {n} points',
  winner: '{a} takes the game on {n} points',
};

const LOG_NL: Record<string, string> = {
  seated: '{a} neemt plaats',
  rejoined: '{a} is terug',
  dropped: '{a} viel weg',
  swept: 'Lege stoelen opgeruimd',
  dealt: 'Kaarten gedeeld — {a}',
  lobby: 'Terug naar de lobby',
  reshuffled: 'Aflegstapel opnieuw geschud',
  played: '{a} speelde {f}',
  jumpedIn: '{a} sprong ertussen!',
  drew: '{a} pakte een kaart',
  drewUntil: '{a} pakte er {n} tot het kon',
  passed: '{a} paste',
  skipped: '{a} sloeg {b} over',
  skippedAll: '{a} sloeg iedereen over en gaat door',
  reversed: '{a} draaide de richting om',
  flipped: '{a} flipte het spel naar de {s} kant',
  stacked: '{a} stapelde het op naar {n}',
  forcedDraw: '{a} liet {b} er {n} pakken',
  atePile: '{a} pakte de stapel — {n} kaarten',
  blasted: '{a} raakte {b} met {n} kaarten',
  discardedAll: '{a} dumpte {n} {c} kaarten',
  swapped: '{a} ruilde handen met {b}',
  rotated: '{a} draaide alle handen door',
  calledUno: '{a} riep UNO!',
  caught: '{a} betrapte {b} — twee kaarten',
  mercyOut: '{a} zit op {n} kaarten en ligt eruit',
  timeout: '{a} liet de klok verlopen',
  abandoned: 'Tafel viel stil — terug naar de lobby',
  wonRound: '{a} won de ronde voor {n} punten',
  winner: '{a} wint het spel met {n} punten',
};

const en: Copy = {
  brand: 'EMPYR',
  tagline: 'UNO',
  checkinTitle: 'Pick your name',
  checkinSub: 'Everyone at the table will see it.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. ACE',
  enter: 'Take a seat',
  room: 'Room',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',
  sound: 'Sound',
  status: { idle: 'Offline', dialing: 'Connecting', live: 'Live', lost: 'Reconnecting' },
  noRoom: 'No room code',

  lobbyTitle: 'Table lobby',
  lobbySub: 'Match the top card by colour or symbol, dump your hand first, and shout UNO on your last card.',
  dlcTitle: 'Expansions',
  dlcSub: 'Pick one deck pack. House Rules stacks on top of any of them.',
  baseGame: 'Base game',
  dlcBadge: 'DLC',
  activeBadge: 'Active',
  houseTitle: 'House Rules',
  houseSub: 'The classic table arguments, settled.',
  settingsTitle: 'Table settings',
  handSize: 'Starting hand',
  targetScore: 'Play to',
  singleRound: 'One round',
  turnClock: 'Turn clock',
  maxSeats: 'Max seats',
  sevenZero: '7-0',
  sevenZeroHint: 'Play a 7 to swap hands, a 0 to rotate every hand',
  jumpIn: 'Jump-In',
  jumpInHint: 'Hold an identical card? Slam it down out of turn',
  stacking: 'Stacking',
  stackingHint: 'Answer a draw card with your own and pass it on',
  drawToMatch: 'Draw to match',
  drawToMatchHint: 'Keep drawing until you get something playable',
  on: 'On',
  off: 'Off',
  ready: 'Ready',
  unready: 'Not ready',
  start: 'Deal',
  needTwo: 'Needs 2 players',
  hostOnly: 'The host sets the table',
  playersHeading: 'Players',
  forcedOn: 'Always on in this pack',

  yourTurn: 'Your turn',
  waitingFor: 'Waiting on',
  drawPile: 'Draw',
  discardPile: 'Discard',
  cardsLeft: 'left',
  mustDraw: 'Nothing playable — draw a card.',
  stackWarn: 'Stacked pickup:',
  drawBtn: 'Draw',
  takeStack: 'Take',
  passBtn: 'Pass',
  playDrawn: 'You drew — play it or pass.',
  pickColor: 'Pick a colour',
  pickTarget: 'Swap hands with…',
  cancel: 'Cancel',
  unoBtn: 'UNO!',
  catchBtn: 'Catch',
  clock: 'Clock',
  clockwise: 'Clockwise',
  counter: 'Counter',
  lightSide: 'Light',
  darkSide: 'Dark',
  spectating: 'Watching this round.',
  knockedOut: 'Knocked out',
  yourHand: 'Your hand',
  emptyHand: 'No cards',

  seatActive: 'playing now',
  seatAway: 'Away',
  seatExposed: 'open to a catch',
  seatYou: 'you',
  seatCards: 'cards',
  hostTag: 'Host',
  notPlayable: 'not playable',
  incoming: 'Incoming',
  tableLabel: 'Table',

  roundTitle: 'Round over',
  roundSub: 'Scores are in. Next deal when the host is ready.',
  nextRound: 'Next round',
  waitingHost: 'Waiting for the host',
  scoreboard: 'Scores',
  points: 'pts',
  winnerTitle: 'Winner',
  youWin: 'You win!',
  again: 'Back to lobby',
  feed: 'Table feed',

  packs: {
    classic: {
      name: 'Classic',
      tag: 'Base',
      desc: '108 cards. Skips, Reverses, Draw Twos and Wilds. The game you already know.',
    },
    flip: {
      name: 'UNO Flip!',
      tag: 'DLC',
      desc: 'Double-sided deck. A Flip card swaps the whole table between the mild light side and the brutal dark side — Draw Fives, Skip Everyone and Wild Draw Colour.',
    },
    nomercy: {
      name: "Show 'em No Mercy",
      tag: 'DLC',
      desc: 'Draw Sixes, Wild Draw Tens, Discard All and Skip Everyone. Stacking is forced on, and 25 cards in hand knocks you out for good.',
    },
    allwild: {
      name: 'All Wild!',
      tag: 'DLC',
      desc: 'No numbers, no colour matching. Every single card is an action, so every single turn hurts somebody.',
    },
    attack: {
      name: 'UNO Attack!',
      tag: 'DLC',
      desc: 'The classic deck plus Hit Fire cards. Trigger the launcher and the next player eats an unpredictable 0 to 12 card blast.',
    },
  },
  house: {
    name: 'House Rules',
    tag: 'DLC',
    desc: 'The famous table arguments as toggles: 7-0 hand swapping, Jump-In, stacking and draw-until-playable.',
  },
  colors: {
    red: 'Red',
    yellow: 'Yellow',
    green: 'Green',
    blue: 'Blue',
    pink: 'Pink',
    teal: 'Teal',
    orange: 'Orange',
    purple: 'Purple',
    wild: 'Wild',
  },
  faces: FACES_EN,
  fx: {
    skip: 'Skipped',
    reverse: 'Reversed',
    flip: 'Flipped',
    blast: 'Hit Fire',
    uno: 'UNO',
    caught: 'Caught',
    swap: 'Swap',
    out: 'Out',
    round: 'Round',
    win: 'Winner',
  },
  log: LOG_EN,
};

const nl: Copy = {
  brand: 'EMPYR',
  tagline: 'UNO',
  checkinTitle: 'Kies je naam',
  checkinSub: 'Iedereen aan tafel ziet hem.',
  nameLabel: 'Weergavenaam',
  namePlaceholder: 'bijv. ACE',
  enter: 'Neem plaats',
  room: 'Kamer',
  copyLink: 'Kopieer link',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  sound: 'Geluid',
  status: { idle: 'Offline', dialing: 'Verbinden', live: 'Live', lost: 'Herverbinden' },
  noRoom: 'Geen kamercode',

  lobbyTitle: 'Lobby',
  lobbySub: 'Leg een kaart met dezelfde kleur of hetzelfde symbool, raak je hand als eerste kwijt en roep UNO bij je laatste kaart.',
  dlcTitle: 'Uitbreidingen',
  dlcSub: 'Kies één deckpakket. House Rules komt er bovenop.',
  baseGame: 'Basisspel',
  dlcBadge: 'DLC',
  activeBadge: 'Actief',
  houseTitle: 'House Rules',
  houseSub: 'De klassieke tafelruzies, beslecht.',
  settingsTitle: 'Tafelinstellingen',
  handSize: 'Starthand',
  targetScore: 'Spelen tot',
  singleRound: 'Eén ronde',
  turnClock: 'Beurtklok',
  maxSeats: 'Max spelers',
  sevenZero: '7-0',
  sevenZeroHint: 'Een 7 ruilt handen, een 0 draait alle handen door',
  jumpIn: 'Jump-In',
  jumpInHint: 'Exact dezelfde kaart? Gooi hem buiten je beurt neer',
  stacking: 'Stapelen',
  stackingHint: 'Beantwoord een pakkaart en schuif hem door',
  drawToMatch: 'Pakken tot het kan',
  drawToMatchHint: 'Blijf pakken tot je iets kunt leggen',
  on: 'Aan',
  off: 'Uit',
  ready: 'Klaar',
  unready: 'Toch niet',
  start: 'Delen',
  needTwo: 'Minimaal 2 spelers',
  hostOnly: 'De host bepaalt de tafel',
  playersHeading: 'Spelers',
  forcedOn: 'Altijd aan in dit pakket',

  yourTurn: 'Jouw beurt',
  waitingFor: 'Wachten op',
  drawPile: 'Pakken',
  discardPile: 'Aflegstapel',
  cardsLeft: 'over',
  mustDraw: 'Niets speelbaar — pak een kaart.',
  stackWarn: 'Opgestapeld:',
  drawBtn: 'Pakken',
  takeStack: 'Aannemen',
  passBtn: 'Passen',
  playDrawn: 'Je pakte een kaart — leg hem of pas.',
  pickColor: 'Kies een kleur',
  pickTarget: 'Ruil handen met…',
  cancel: 'Annuleren',
  unoBtn: 'UNO!',
  catchBtn: 'Betrappen',
  clock: 'Klok',
  clockwise: 'Met de klok mee',
  counter: 'Tegen de klok in',
  lightSide: 'Licht',
  darkSide: 'Donker',
  spectating: 'Je kijkt deze ronde toe.',
  knockedOut: 'Uitgeschakeld',
  yourHand: 'Jouw hand',
  emptyHand: 'Geen kaarten',

  seatActive: 'is aan zet',
  seatAway: 'Weg',
  seatExposed: 'te betrappen',
  seatYou: 'jij',
  seatCards: 'kaarten',
  hostTag: 'Host',
  notPlayable: 'niet speelbaar',
  incoming: 'Onderweg',
  tableLabel: 'Tafel',

  roundTitle: 'Ronde voorbij',
  roundSub: 'De punten staan. De host deelt de volgende ronde.',
  nextRound: 'Volgende ronde',
  waitingHost: 'Wachten op de host',
  scoreboard: 'Punten',
  points: 'ptn',
  winnerTitle: 'Winnaar',
  youWin: 'Jij wint!',
  again: 'Terug naar lobby',
  feed: 'Tafelfeed',

  packs: {
    classic: {
      name: 'Klassiek',
      tag: 'Basis',
      desc: '108 kaarten. Passen, omkeren, pak-twee en jokers. Het spel dat je al kent.',
    },
    flip: {
      name: 'UNO Flip!',
      tag: 'DLC',
      desc: 'Dubbelzijdig deck. Een Flip-kaart draait de hele tafel van de milde lichte kant naar de gemene donkere kant — Pak Vijf, Iedereen Over en Joker Pak Kleur.',
    },
    nomercy: {
      name: "Show 'em No Mercy",
      tag: 'DLC',
      desc: 'Pak Zes, Joker Pak Tien, Alles Afleggen en Iedereen Over. Stapelen staat vast aan en bij 25 kaarten lig je er definitief uit.',
    },
    allwild: {
      name: 'All Wild!',
      tag: 'DLC',
      desc: 'Geen cijfers, geen kleuren. Elke kaart is een actiekaart, dus elke beurt doet iemand pijn.',
    },
    attack: {
      name: 'UNO Attack!',
      tag: 'DLC',
      desc: 'Het klassieke deck plus Vuurstoot-kaarten. Trek aan de hendel en de volgende speler krijgt 0 tot 12 kaarten over zich heen.',
    },
  },
  house: {
    name: 'House Rules',
    tag: 'DLC',
    desc: 'De beroemde tafelruzies als schakelaars: 7-0 handen ruilen, Jump-In, stapelen en pakken tot je kunt leggen.',
  },
  colors: {
    red: 'Rood',
    yellow: 'Geel',
    green: 'Groen',
    blue: 'Blauw',
    pink: 'Roze',
    teal: 'Turquoise',
    orange: 'Oranje',
    purple: 'Paars',
    wild: 'Joker',
  },
  faces: FACES_NL,
  fx: {
    skip: 'Overgeslagen',
    reverse: 'Omgekeerd',
    flip: 'Geflipt',
    blast: 'Vuurstoot',
    uno: 'UNO',
    caught: 'Betrapt',
    swap: 'Geruild',
    out: 'Eruit',
    round: 'Ronde',
    win: 'Winnaar',
  },
  log: LOG_NL,
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? nl : en;
}

export function faceName(face: Face, copy: Copy): string {
  return copy.faces[face] ?? face;
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
    if (key === 'f') return faceName(String(raw) as Face, copy);
    if (key === 'c') return copy.colors[String(raw) as Color] ?? String(raw);
    if (key === 's') return raw === 'dark' ? copy.darkSide : copy.lightSide;
    if (key === 'a' && line.code === 'dealt') {
      return copy.packs[String(raw) as Pack]?.name ?? String(raw);
    }
    return typeof raw === 'number' ? raw.toLocaleString('en-US') : String(raw);
  });
}
