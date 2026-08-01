import type { Card } from './protocol';

export type Lang = 'nl' | 'en';

interface CardCopy {
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
  lobbyTitle: string;
  lobbySub: string;
  dialRange: string;
  dialSeats: string;
  dialChoosers: string;
  dialClock: string;
  dialVotes: string;
  on: string;
  off: string;
  ready: string;
  unready: string;
  start: string;
  needThree: string;
  hostOnly: string;
  seatsHeading: string;
  secretsTitle: string;
  secretsSub: string;
  secretsWait: string;
  lock: string;
  lockedIn: string;
  windowLabel: string;
  lastCall: string;
  noCall: string;
  yourTurn: string;
  waitingFor: string;
  openPrompt: string;
  openAction: string;
  callPrompt: string;
  numberPrompt: string;
  confirm: string;
  changeCall: string;
  nowRange: string;
  lower: string;
  higher: string;
  pass: string;
  passHint: string;
  spectating: string;
  blinded: string;
  bluffClaim: string;
  quickLow: string;
  quickMid: string;
  quickHigh: string;
  quickRandom: string;
  clock: string;
  voteTitle: string;
  voteSub: string;
  voteYes: string;
  voteNo: string;
  voteWaiting: string;
  winnerTitle: string;
  youWin: string;
  again: string;
  feed: string;
  handEmpty: string;
  pickTarget: string;
  pickBluff: string;
  cancel: string;
  cards: Record<Card, CardCopy>;
  fx: Record<string, string>;
  log: Record<string, string>;
}

const LOG_EN: Record<string, string> = {
  seated: '{a} took a seat',
  rejoined: '{a} reconnected',
  dropped: '{a} dropped out',
  swept: 'Cleared empty seats',
  dealt: 'Hands dealt — choosers are hiding numbers',
  locked: '{a} locked a secret',
  live: 'Target is live — open the round',
  lobby: 'Back to the lobby',
  reversed: '{a} reversed the direction',
  skipped: '{a} skipped {b}',
  shielded: '{a} raised a Shield',
  bluffed: '{a} claims it is {d}',
  narrowed: '{a} narrowed the window',
  blindfolded: '{a} blindfolded {b}',
  opened: '{a} opened at {n}',
  called: '{a} called {d} → {n}',
  passed: '{a} passed safely',
  burned: '{a} called {d} and burned',
  exact: '{a} landed exactly on the number',
  exactOpen: '{a} opened straight onto the number',
  timeout: '{a} ran out of time',
  shieldClock: '{a} ran out the clock behind a Shield',
  rotation: 'Full rotation — vote to reshuffle',
  shuffled: 'Unanimous — turn order reshuffled',
  voteFailed: 'Vote failed — order stands',
  winner: '{a} takes the table',
  nosurvivor: 'Nobody survived',
};

const LOG_NL: Record<string, string> = {
  seated: '{a} neemt plaats',
  rejoined: '{a} is terug',
  dropped: '{a} viel weg',
  swept: 'Lege stoelen opgeruimd',
  dealt: 'Kaarten gedeeld — kiezers verstoppen getallen',
  locked: '{a} zette een geheim vast',
  live: 'Doel staat live — open de ronde',
  lobby: 'Terug naar de lobby',
  reversed: '{a} draaide de richting om',
  skipped: '{a} sloeg {b} over',
  shielded: '{a} zette een schild op',
  bluffed: '{a} beweert dat het {d} is',
  narrowed: '{a} vernauwde het venster',
  blindfolded: '{a} blinddoekte {b}',
  opened: '{a} opende op {n}',
  called: '{a} riep {d} → {n}',
  passed: '{a} paste veilig',
  burned: '{a} riep {d} en ging eraan',
  exact: '{a} landde precies op het getal',
  exactOpen: '{a} opende recht op het getal',
  timeout: '{a} liet de klok verlopen',
  shieldClock: '{a} liet de klok verlopen achter een schild',
  rotation: 'Ronde compleet — stem over shuffelen',
  shuffled: 'Unaniem — nieuwe beurtvolgorde',
  voteFailed: 'Stemming mislukt — volgorde blijft',
  winner: '{a} pakt de tafel',
  nosurvivor: 'Niemand overleefde',
};

const en: Copy = {
  brand: 'HI/LO',
  tagline: 'FRENZY',
  checkinTitle: 'Check in',
  checkinSub: 'Pick a handle. Everyone at the table will see it.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. VOLT',
  enter: 'Enter table',
  room: 'Room',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',
  sound: 'Sound',
  status: { idle: 'Offline', dialing: 'Dialing', live: 'Live', lost: 'Reconnecting' },
  lobbyTitle: 'Table lobby',
  lobbySub:
    'Choosers hide a number inside the range. Everyone else calls higher or lower and hands the next number to the player after them. Call it wrong — or land exactly on it — and you are out.',
  dialRange: 'Range',
  dialSeats: 'Max seats',
  dialChoosers: 'Choosers',
  dialClock: 'Turn clock',
  dialVotes: 'Shuffle votes',
  on: 'On',
  off: 'Off',
  ready: 'Ready up',
  unready: 'Stand down',
  start: 'Deal in',
  needThree: 'Needs 3 players',
  hostOnly: 'Host controls the rules',
  seatsHeading: 'Seats',
  secretsTitle: 'Secrets',
  secretsSub: 'You are a chooser. Lock a number inside the range — one of the picks becomes the live target.',
  secretsWait: 'Choosers are locking their numbers',
  lock: 'Lock it',
  lockedIn: 'Locked',
  windowLabel: 'Live window',
  lastCall: 'Number on the table',
  noCall: 'Not opened',
  yourTurn: 'Your move',
  waitingFor: 'Waiting on',
  openPrompt: 'Open the round with any number in range.',
  openAction: 'Put it on the table',
  callPrompt: 'Is the target higher or lower than the number on the table?',
  numberPrompt: 'Now hand the next number to the player after you.',
  confirm: 'Lock it in',
  changeCall: 'Change call',
  nowRange: 'Your window',
  lower: 'Lower',
  higher: 'Higher',
  pass: 'Pass behind shield',
  passHint: 'Shield is up — you may pass without calling.',
  spectating: 'You are out. Watch it burn.',
  blinded: 'Blindfolded — numbers are hidden for you.',
  bluffClaim: 'claims the target is',
  quickLow: 'Low edge',
  quickMid: 'Middle',
  quickHigh: 'High edge',
  quickRandom: 'Random',
  clock: 'Clock',
  voteTitle: 'Reshuffle vote',
  voteSub: 'A full rotation is done. Unanimous yes reshuffles the turn order.',
  voteYes: 'Shuffle',
  voteNo: 'Keep order',
  voteWaiting: 'Waiting for the rest of the table',
  winnerTitle: 'Table winner',
  youWin: 'You took the table',
  again: 'Back to lobby',
  feed: 'Table feed',
  handEmpty: 'No cards in hand',
  pickTarget: 'Blindfold which player?',
  pickBluff: 'Announce which direction?',
  cancel: 'Cancel',
  cards: {
    reverse: { name: 'Reverse', desc: 'Flip turn direction' },
    skip: { name: 'Skip', desc: 'Next player loses the turn' },
    shield: { name: 'Shield', desc: 'Pass without calling' },
    bluff: { name: 'Bluff', desc: 'Broadcast a fake direction' },
    narrow: { name: 'Narrow', desc: 'Collapse the window' },
    blindfold: { name: 'Blindfold', desc: 'Hide numbers from a rival' },
  },
  fx: {
    reverse: 'Reverse',
    skip: 'Skipped',
    shield: 'Shield',
    bluff: 'Bluff',
    narrow: 'Narrowed',
    blindfold: 'Blindfold',
    out: 'Eliminated',
    mine: 'Direct hit',
    shuffle: 'Shuffled',
    win: 'Winner',
  },
  log: LOG_EN,
};

const nl: Copy = {
  brand: 'HI/LO',
  tagline: 'FRENZY',
  checkinTitle: 'Inchecken',
  checkinSub: 'Kies een naam. Iedereen aan tafel ziet hem.',
  nameLabel: 'Weergavenaam',
  namePlaceholder: 'bijv. VOLT',
  enter: 'Tafel betreden',
  room: 'Kamer',
  copyLink: 'Kopieer link',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  sound: 'Geluid',
  status: { idle: 'Offline', dialing: 'Verbinden', live: 'Live', lost: 'Herverbinden' },
  lobbyTitle: 'Lobby',
  lobbySub:
    'Kiezers verstoppen een getal in het bereik. De rest roept hoger of lager en geeft het volgende getal door. Fout geroepen — of precies erop landen — en je ligt eruit.',
  dialRange: 'Bereik',
  dialSeats: 'Max spelers',
  dialChoosers: 'Kiezers',
  dialClock: 'Beurtklok',
  dialVotes: 'Shuffle-stemmen',
  on: 'Aan',
  off: 'Uit',
  ready: 'Klaar',
  unready: 'Toch niet',
  start: 'Delen maar',
  needThree: 'Minimaal 3 spelers',
  hostOnly: 'De host bepaalt de regels',
  seatsHeading: 'Stoelen',
  secretsTitle: 'Geheimen',
  secretsSub: 'Jij bent kiezer. Zet een getal vast binnen het bereik — één keuze wordt het echte doel.',
  secretsWait: 'Kiezers zetten hun getallen vast',
  lock: 'Vastzetten',
  lockedIn: 'Vast',
  windowLabel: 'Actief venster',
  lastCall: 'Getal op tafel',
  noCall: 'Nog niet geopend',
  yourTurn: 'Jouw beurt',
  waitingFor: 'Wachten op',
  openPrompt: 'Open de ronde met een getal binnen het bereik.',
  openAction: 'Leg hem neer',
  callPrompt: 'Is het doel hoger of lager dan het getal op tafel?',
  numberPrompt: 'Geef nu het volgende getal door aan de speler na jou.',
  confirm: 'Vastleggen',
  changeCall: 'Andere keuze',
  nowRange: 'Jouw venster',
  lower: 'Lager',
  higher: 'Hoger',
  pass: 'Passen achter schild',
  passHint: 'Schild staat — je mag passen zonder te roepen.',
  spectating: 'Je ligt eruit. Kijk maar toe.',
  blinded: 'Geblinddoekt — getallen zijn voor jou verborgen.',
  bluffClaim: 'beweert dat het doel',
  quickLow: 'Ondergrens',
  quickMid: 'Midden',
  quickHigh: 'Bovengrens',
  quickRandom: 'Willekeurig',
  clock: 'Klok',
  voteTitle: 'Shuffle-stemming',
  voteSub: 'De ronde is rond. Unaniem ja betekent nieuwe beurtvolgorde.',
  voteYes: 'Shuffelen',
  voteNo: 'Zo laten',
  voteWaiting: 'Wachten op de rest van de tafel',
  winnerTitle: 'Winnaar',
  youWin: 'Jij pakt de tafel',
  again: 'Terug naar lobby',
  feed: 'Tafelfeed',
  handEmpty: 'Geen kaarten in hand',
  pickTarget: 'Wie blinddoeken?',
  pickBluff: 'Welke richting roep je?',
  cancel: 'Annuleren',
  cards: {
    reverse: { name: 'Omkeren', desc: 'Draai de richting om' },
    skip: { name: 'Overslaan', desc: 'Volgende speler verliest beurt' },
    shield: { name: 'Schild', desc: 'Passen zonder te roepen' },
    bluff: { name: 'Bluf', desc: 'Roep een valse richting' },
    narrow: { name: 'Vernauwen', desc: 'Krimp het venster' },
    blindfold: { name: 'Blinddoek', desc: 'Verberg getallen voor een rivaal' },
  },
  fx: {
    reverse: 'Omgekeerd',
    skip: 'Overgeslagen',
    shield: 'Schild',
    bluff: 'Bluf',
    narrow: 'Vernauwd',
    blindfold: 'Blinddoek',
    out: 'Eruit',
    mine: 'Voltreffer',
    shuffle: 'Geshuffeld',
    win: 'Winnaar',
  },
  log: LOG_NL,
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? nl : en;
}

/** Renders a server log code into the viewer's language. */
export function logText(line: { code: string; args?: Record<string, string | number> }, copy: Copy): string {
  const template = copy.log[line.code] ?? line.code;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const raw = line.args?.[key];
    if (raw === undefined) return '';
    if (key === 'd') return raw === 'higher' ? copy.higher : copy.lower;
    return typeof raw === 'number' ? raw.toLocaleString('en-US') : String(raw);
  });
}
