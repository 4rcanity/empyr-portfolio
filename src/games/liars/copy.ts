import type { Rank, TableCard } from './protocol';

export type Lang = 'nl' | 'en';

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
  dialChambers: string;
  dialBullets: string;
  dialHand: string;
  dialMaxPlay: string;
  dialSeats: string;
  dialClock: string;
  dialJokers: string;
  dialFixedTable: string;
  on: string;
  off: string;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  classicPreset: string;
  tableCard: string;
  round: string;
  turn: string;
  claim: string;
  noClaim: string;
  buried: string;
  deckLeft: string;
  yourTurn: string;
  waitingFor: string;
  playCards: string;
  callLiar: string;
  spectating: string;
  dead: string;
  clock: string;
  revolver: string;
  odds: string;
  moveOn: string;
  skipStage: string;
  waitingOn: string;
  winnerTitle: string;
  youWin: string;
  again: string;
  feed: string;
  handEmpty: string;
  selectCards: string;
  cardsSelected: string;
  cancel: string;
  showdownReveal: string;
  showdownHonest: string;
  showdownLied: string;
  showdownShooter: string;
  showdownOdds: string;
  showdownClick: string;
  showdownBang: string;
  showdownQuiet: string;
  ranks: Record<Rank, string>;
  tables: Record<TableCard, string>;
  log: Record<string, string>;
}

const LOG_EN: Record<string, string> = {
  seated: '{a} took a seat',
  rejoined: '{a} reconnected',
  dropped: '{a} dropped out',
  newHost: '{a} is now host',
  swept: 'Cleared empty seats',
  abandoned: 'Table abandoned — too quiet',
  lobby: 'Back to the lobby',
  opened: 'Game opened — {a} rules',
  dealt: 'Round {n} — table card is {a}',
  played: '{a} played {n} as {c}',
  timeout: '{a} ran out of time',
  challenged: '{a} called liar on {b}',
  honest: '{a} was honest — {b} pulls',
  lied: '{a} lied ({n} fake) — pulls',
  click: '{a} clicked — survived (1 in {n})',
  bang: '{a} — BANG',
  eliminated: '{a} eliminated in round {n}',
  quiet: 'Round ended quiet — no challenge',
  winner: '{a} wins ({n} clicks survived)',
};

const LOG_NL: Record<string, string> = {
  seated: '{a} neemt plaats',
  rejoined: '{a} is terug',
  dropped: '{a} viel weg',
  newHost: '{a} is nu host',
  swept: 'Lege stoelen opgeruimd',
  abandoned: 'Tafel verlaten — te stil geworden',
  lobby: 'Terug naar de lobby',
  opened: 'Spel geopend — {a} regels',
  dealt: 'Ronde {n} — tafelkaart is {a}',
  played: '{a} speelde {n} als {c}',
  timeout: '{a} liet de klok verlopen',
  challenged: '{a} riep leugenaar tegen {b}',
  honest: '{a} was eerlijk — {b} trekt',
  lied: '{a} loog ({n} vals) — trekt',
  click: '{a} klik — overleefd (1 op {n})',
  bang: '{a} — BANG',
  eliminated: '{a} geëlimineerd in ronde {n}',
  quiet: 'Ronde stil afgelopen — geen uitdaging',
  winner: '{a} wint ({n} kliks overleefd)',
};

const RANKS_EN: Record<Rank, string> = {
  king: 'King',
  queen: 'Queen',
  ace: 'Ace',
  joker: 'Joker',
};

const RANKS_NL: Record<Rank, string> = {
  king: 'Koning',
  queen: 'Vrouw',
  ace: 'Aas',
  joker: 'Joker',
};

const TABLES_EN: Record<TableCard, string> = {
  king: 'King',
  queen: 'Queen',
  ace: 'Ace',
};

const TABLES_NL: Record<TableCard, string> = {
  king: 'Koning',
  queen: 'Vrouw',
  ace: 'Aas',
};

const en: Copy = {
  brand: "LIAR'S BAR",
  tagline: 'EMPYR',
  checkinTitle: 'Take a seat',
  checkinSub: 'Pick a handle. The back room remembers faces, not excuses.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. CROW',
  enter: 'Enter table',
  room: 'Room',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',
  sound: 'Sound',
  status: { idle: 'Offline', dialing: 'Dialing', live: 'Live', lost: 'Reconnecting' },
  lobbyTitle: 'Back-room lobby',
  lobbySub:
    'Bluff your cards onto the table card. Call liar when you smell a lie — the loser pulls the trigger. Last one breathing takes the pot.',
  dialChambers: 'Chambers',
  dialBullets: 'Live rounds',
  dialHand: 'Hand size',
  dialMaxPlay: 'Max per claim',
  dialSeats: 'Seats',
  dialClock: 'Turn clock',
  dialJokers: 'Jokers',
  dialFixedTable: 'Fixed table card',
  on: 'On',
  off: 'Off',
  ready: 'Ready up',
  unready: 'Stand down',
  start: 'Deal in',
  needTwo: 'Needs 2 players',
  hostOnly: 'Host controls the house rules',
  classicPreset: 'Classic rules',
  tableCard: 'Table card',
  round: 'Round',
  turn: 'Turn',
  claim: 'On the table',
  noClaim: 'Nothing played yet',
  buried: 'Buried',
  deckLeft: 'Deck',
  yourTurn: 'Your move',
  waitingFor: 'Waiting on',
  playCards: 'Play selected',
  callLiar: 'Call liar',
  spectating: 'You are out. Watch the room.',
  dead: 'Out',
  clock: 'Clock',
  revolver: 'Cylinder',
  odds: 'Odds',
  moveOn: 'Move on',
  skipStage: 'Skip wait',
  waitingOn: 'Waiting on table',
  winnerTitle: 'Last one standing',
  youWin: 'You survived the bar',
  again: 'Back to lobby',
  feed: 'Room feed',
  handEmpty: 'No cards in hand',
  selectCards: 'Pick cards to claim',
  cardsSelected: 'selected',
  cancel: 'Cancel',
  showdownReveal: 'Cards revealed',
  showdownHonest: 'Honest claim',
  showdownLied: 'Caught lying',
  showdownShooter: 'Pulls the trigger',
  showdownOdds: 'One in',
  showdownClick: 'Click',
  showdownBang: 'Bang',
  showdownQuiet: 'Quiet round',
  ranks: RANKS_EN,
  tables: TABLES_EN,
  log: LOG_EN,
};

const nl: Copy = {
  brand: "LIAR'S BAR",
  tagline: 'EMPYR',
  checkinTitle: 'Neem plaats',
  checkinSub: 'Kies een naam. De achterkamer onthoudt gezichten, geen smoesjes.',
  nameLabel: 'Weergavenaam',
  namePlaceholder: 'bijv. CROW',
  enter: 'Tafel betreden',
  room: 'Kamer',
  copyLink: 'Kopieer link',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  sound: 'Geluid',
  status: { idle: 'Offline', dialing: 'Verbinden', live: 'Live', lost: 'Herverbinden' },
  lobbyTitle: 'Achterkamer lobby',
  lobbySub:
    'Bluf je kaarten op de tafelkaart. Roep leugenaar als je een leugen ruikt — de verliezer trekt de trekker. Wie het langst ademt, wint.',
  dialChambers: 'Kamers',
  dialBullets: 'Live patronen',
  dialHand: 'Handgrootte',
  dialMaxPlay: 'Max per claim',
  dialSeats: 'Stoelen',
  dialClock: 'Beurtklok',
  dialJokers: 'Jokers',
  dialFixedTable: 'Vaste tafelkaart',
  on: 'Aan',
  off: 'Uit',
  ready: 'Klaar',
  unready: 'Toch niet',
  start: 'Delen maar',
  needTwo: 'Minimaal 2 spelers',
  hostOnly: 'De host bepaalt de huisregels',
  classicPreset: 'Klassieke regels',
  tableCard: 'Tafelkaart',
  round: 'Ronde',
  turn: 'Beurt',
  claim: 'Op tafel',
  noClaim: 'Nog niets gespeeld',
  buried: 'Begraven',
  deckLeft: 'Stapel',
  yourTurn: 'Jouw beurt',
  waitingFor: 'Wachten op',
  playCards: 'Speel geselecteerd',
  callLiar: 'Leugenaar',
  spectating: 'Je ligt eruit. Kijk maar toe.',
  dead: 'Eruit',
  clock: 'Klok',
  revolver: 'Cilinder',
  odds: 'Kans',
  moveOn: 'Verder',
  skipStage: 'Wacht overslaan',
  waitingOn: 'Wachten op tafel',
  winnerTitle: 'Laatste overlevende',
  youWin: 'Jij overleefde de bar',
  again: 'Terug naar lobby',
  feed: 'Kamerfeed',
  handEmpty: 'Geen kaarten in hand',
  selectCards: 'Kies kaarten om te claimen',
  cardsSelected: 'geselecteerd',
  cancel: 'Annuleren',
  showdownReveal: 'Kaarten onthuld',
  showdownHonest: 'Eerlijke claim',
  showdownLied: 'Betrapt op liegen',
  showdownShooter: 'Trekt de trekker',
  showdownOdds: 'Eén op',
  showdownClick: 'Klik',
  showdownBang: 'Knal',
  showdownQuiet: 'Stille ronde',
  ranks: RANKS_NL,
  tables: TABLES_NL,
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
    if (key === 'a' || key === 'b' || key === 'c') {
      const asRank = String(raw) as Rank | TableCard;
      if (copy.ranks[asRank as Rank]) return copy.ranks[asRank as Rank];
      if (copy.tables[asRank as TableCard]) return copy.tables[asRank as TableCard];
    }
    return typeof raw === 'number' ? raw.toLocaleString('en-US') : String(raw);
  });
}

export function rankLabel(rank: Rank, copy: Copy): string {
  return copy.ranks[rank];
}

export function tableLabel(table: TableCard, copy: Copy): string {
  return copy.tables[table];
}
