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
  secretsTitle: string;
  secretsSub: string;
  secretsInput: string;
  secretsLock: string;
  secretsLocked: string;
  secretsWaiting: string;
  hunting: string;
  dialRange: string;
  dialSeats: string;
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
  dealt: 'Hands dealt — lock in your secret numbers',
  lobby: 'Back to the lobby',
  locked: '{a} locked in a number',
  turnsBegin: 'All secrets locked — the hunt begins',
  reversed: '{a} reversed the direction',
  skipped: '{a} skipped {b}',
  shielded: '{a} raised a Shield',
  bluffed: '{a} claims it is {d}',
  narrowed: '{a} narrowed the window',
  blindfolded: '{a} blindfolded {b}',
  opened: '{a} opened at {n}',
  called: '{a} called {d} → {n}',
  missed: '{a} called {d} → {n} — wrong, but no harm, next up',
  passed: '{a} passed safely',
  targetOut: '{a} nailed {b}\u2019s exact number — {b} is out',
  targetOutOpen: '{a} opened straight onto {b}\u2019s number — {b} is out',
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
  dealt: 'Kaarten gedeeld — leg je geheime getal vast',
  lobby: 'Terug naar de lobby',
  locked: '{a} legde een getal vast',
  turnsBegin: 'Alle geheimen vastgelegd — de jacht begint',
  reversed: '{a} draaide de richting om',
  skipped: '{a} sloeg {b} over',
  shielded: '{a} zette een schild op',
  bluffed: '{a} beweert dat het {d} is',
  narrowed: '{a} vernauwde het venster',
  blindfolded: '{a} blinddoekte {b}',
  opened: '{a} opende op {n}',
  called: '{a} riep {d} → {n}',
  missed: '{a} riep {d} → {n} — fout, maar geen probleem, volgende',
  passed: '{a} paste veilig',
  targetOut: '{a} raakte het exacte getal van {b} — {b} ligt eruit',
  targetOutOpen: '{a} opende recht op het getal van {b} — {b} ligt eruit',
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
    'Everyone locks a secret number. Your job is to crack the number of whoever is next in the ring — call higher or lower each turn. A wrong call costs nothing, you just pass to the next player. Land exactly on someone\u2019s number and they are out — everyone left draws a wildcard.',
  secretsTitle: 'Lock your number',
  secretsSub: 'Pick a secret number in range. Once everyone has locked one in, the hunt begins.',
  secretsInput: 'Your secret number',
  secretsLock: 'Lock it in',
  secretsLocked: 'Locked in — waiting on the table',
  secretsWaiting: 'Waiting for everyone to lock in',
  hunting: 'Hunting',
  dialRange: 'Range',
  dialSeats: 'Max seats',
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
    'Iedereen legt een geheim getal vast. Jouw taak is het getal van de volgende speler in de ring te kraken — roep elke beurt hoger of lager. Fout geroepen kost niks, je geeft gewoon door. Land je precies op iemands getal, dan ligt diegene eruit — de rest trekt een wildcard.',
  secretsTitle: 'Leg je getal vast',
  secretsSub: 'Kies een geheim getal binnen het bereik. Zodra iedereen vastgelegd heeft, begint de jacht.',
  secretsInput: 'Jouw geheime getal',
  secretsLock: 'Vastleggen',
  secretsLocked: 'Vastgelegd — wachten op de tafel',
  secretsWaiting: 'Wachten tot iedereen vastgelegd heeft',
  hunting: 'Jaagt op',
  dialRange: 'Bereik',
  dialSeats: 'Max spelers',
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
