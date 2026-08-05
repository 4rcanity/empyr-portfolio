import type { Bank, Category, LogLine } from './protocol';

export type Lang = 'nl' | 'en';

export interface Copy {
  brand: string;
  tagline: string;

  checkinTitle: string;
  checkinSub: string;
  nameLabel: string;
  namePlaceholder: string;
  enter: string;
  noRoom: string;
  noRoomSub: string;

  room: string;
  copyLink: string;
  copied: string;
  leave: string;
  status: Record<'idle' | 'dialing' | 'live' | 'lost', string>;

  lobbyTitle: string;
  lobbySub: string;
  playersHeading: string;
  settingsHeading: string;
  gridSize: string;
  wordCount: string;
  roundClock: string;
  categoryLabel: string;
  bankLabel: string;
  roundsLabel: string;
  seatsLabel: string;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  hostBadge: string;
  youBadge: string;
  readyBadge: string;
  offline: string;

  roundOf: (round: number, total: number) => string;
  timeLeft: string;
  found: string;
  wordsHeading: string;
  boardHint: string;
  boardHintTouch: string;
  clearTrace: string;
  scoreHeading: string;
  points: string;
  feedHeading: string;
  seedLabel: string;

  gotIt: (word: string) => string;
  tooSlow: (word: string, name: string) => string;
  notAWord: string;
  tooShort: string;
  claimedBy: (name: string, word: string) => string;

  resultsTitle: string;
  finalTitle: string;
  nextIn: (seconds: number) => string;
  nextNow: string;
  backToLobby: string;
  missed: string;
  nothingMissed: string;
  roundPoints: string;
  totalPoints: string;
  wonBy: (name: string) => string;
  tied: string;
  clearedBoard: string;

  categories: Record<Category, string>;
  banks: Record<Bank, string>;
  line: (line: LogLine) => string;
}

const NL: Copy = {
  brand: 'WOORDJACHT',
  tagline: 'Wie streept hem eerst weg?',

  checkinTitle: 'Pak een potlood',
  checkinSub: 'Kies een naam en je zit aan tafel.',
  nameLabel: 'Jouw naam',
  namePlaceholder: 'bijv. SANNE',
  enter: 'Naar het raster',
  noRoom: 'Geen kamercode',
  noRoomSub: 'Open een kamer via de startpagina van Woordjacht.',

  room: 'Kamer',
  copyLink: 'Link kopiëren',
  copied: 'Gekopieerd',
  leave: 'Verlaten',
  status: {
    idle: 'wachten',
    dialing: 'verbinden…',
    live: 'verbonden',
    lost: 'verbinding kwijt',
  },

  lobbyTitle: 'Lobby',
  lobbySub: 'De host stelt het raster in. Iedereen zoekt op hetzelfde blad.',
  playersHeading: 'Spelers',
  settingsHeading: 'Instellingen',
  gridSize: 'Rastergrootte',
  wordCount: 'Aantal woorden',
  roundClock: 'Rondetijd',
  categoryLabel: 'Categorie',
  bankLabel: 'Woordenlijst',
  roundsLabel: 'Rondes',
  seatsLabel: 'Max spelers',
  ready: 'Ik ben klaar',
  unready: 'Toch nog niet',
  start: 'Raster printen',
  needTwo: 'Je hebt minimaal 2 spelers nodig.',
  hostOnly: 'Alleen de host kan starten.',
  hostBadge: 'host',
  youBadge: 'jij',
  readyBadge: 'klaar',
  offline: 'weg',

  roundOf: (round, total) => `Ronde ${round} van ${total}`,
  timeLeft: 'Tijd over',
  found: 'gevonden',
  wordsHeading: 'Te vinden',
  boardHint: 'Sleep van de eerste naar de laatste letter. Of klik ze los aan.',
  boardHintTouch: 'Veeg over de letters. Achteruit mag ook.',
  clearTrace: 'Selectie wissen',
  scoreHeading: 'Stand',
  points: 'ptn',
  feedHeading: 'Kantlijn',
  seedLabel: 'seed',

  gotIt: (word) => `${word} is van jou`,
  tooSlow: (word, name) => `${name} was net eerder met ${word}`,
  notAWord: 'Die letters staan niet op de lijst',
  tooShort: 'Selecteer minstens drie letters',
  claimedBy: (name, word) => `${name} pakt ${word}`,

  resultsTitle: 'Ronde afgelopen',
  finalTitle: 'Eindstand',
  nextIn: (seconds) => `Volgende raster over ${seconds}s`,
  nextNow: 'Nu doorgaan',
  backToLobby: 'Terug naar de lobby',
  missed: 'Gemist',
  nothingMissed: 'Alles gevonden — niets gemist.',
  roundPoints: 'deze ronde',
  totalPoints: 'totaal',
  wonBy: (name) => `${name} wint`,
  tied: 'Gelijkspel',
  clearedBoard: 'Blad leeg',

  categories: {
    mixed: 'Alles door elkaar',
    animals: 'Dieren',
    food: 'Eten',
    countries: 'Landen',
    sport: 'Sport',
    nature: 'Natuur',
    house: 'In huis',
    travel: 'Reizen',
    tech: 'Techniek',
  },
  banks: { en: 'Engels', nl: 'Nederlands' },

  line: (line) => {
    const a = String(line.args?.a ?? '');
    const b = String(line.args?.b ?? '');
    const n = line.args?.n ?? 0;
    const w = String(line.args?.w ?? '');
    switch (line.code) {
      case 'seated':
        return `${a} schuift aan`;
      case 'rejoined':
        return `${a} is terug`;
      case 'dropped':
        return `${a} is weg`;
      case 'newHost':
        return `${a} is nu host`;
      case 'swept':
        return 'Lege stoelen opgeruimd';
      case 'lobby':
        return 'Terug naar de lobby';
      case 'printed':
        return `Ronde ${n} gedrukt — ${w} woorden`;
      case 'claimed':
        return `${a} streept ${w} weg (+${n})`;
      case 'cleared':
        return `${a} maakt het blad leeg`;
      case 'timeUp':
        return 'Tijd is om';
      case 'abandoned':
        return 'Niemand zocht nog — ronde afgebroken';
      case 'winner':
        return `${a} wint met ${n} punten`;
      default:
        return `${line.code} ${a} ${b}`.trim();
    }
  },
};

const EN: Copy = {
  brand: 'WORDSEARCH',
  tagline: 'First pencil on the word takes it.',

  checkinTitle: 'Grab a pencil',
  checkinSub: 'Pick a name and you are at the table.',
  nameLabel: 'Your name',
  namePlaceholder: 'e.g. SAM',
  enter: 'Go to the grid',
  noRoom: 'No room code',
  noRoomSub: 'Open a room from the Wordsearch landing page.',

  room: 'Room',
  copyLink: 'Copy link',
  copied: 'Copied',
  leave: 'Leave',
  status: {
    idle: 'idle',
    dialing: 'connecting…',
    live: 'connected',
    lost: 'connection lost',
  },

  lobbyTitle: 'Lobby',
  lobbySub: 'The host sets the grid. Everyone hunts the same sheet.',
  playersHeading: 'Players',
  settingsHeading: 'Settings',
  gridSize: 'Grid size',
  wordCount: 'Words',
  roundClock: 'Round clock',
  categoryLabel: 'Category',
  bankLabel: 'Word list',
  roundsLabel: 'Rounds',
  seatsLabel: 'Max players',
  ready: 'I am ready',
  unready: 'Not yet',
  start: 'Print the grid',
  needTwo: 'You need at least 2 players.',
  hostOnly: 'Only the host can start.',
  hostBadge: 'host',
  youBadge: 'you',
  readyBadge: 'ready',
  offline: 'away',

  roundOf: (round, total) => `Round ${round} of ${total}`,
  timeLeft: 'Time left',
  found: 'found',
  wordsHeading: 'To find',
  boardHint: 'Drag from the first letter to the last. Or click them one at a time.',
  boardHintTouch: 'Swipe across the letters. Backwards counts too.',
  clearTrace: 'Clear selection',
  scoreHeading: 'Scores',
  points: 'pts',
  feedHeading: 'Margin',
  seedLabel: 'seed',

  gotIt: (word) => `${word} is yours`,
  tooSlow: (word, name) => `${name} got ${word} a moment before you`,
  notAWord: 'Those letters are not on the list',
  tooShort: 'Select at least three letters',
  claimedBy: (name, word) => `${name} takes ${word}`,

  resultsTitle: 'Round over',
  finalTitle: 'Final standings',
  nextIn: (seconds) => `Next grid in ${seconds}s`,
  nextNow: 'Go now',
  backToLobby: 'Back to the lobby',
  missed: 'Missed',
  nothingMissed: 'Every word found — nothing missed.',
  roundPoints: 'this round',
  totalPoints: 'total',
  wonBy: (name) => `${name} wins`,
  tied: 'Dead heat',
  clearedBoard: 'Sheet cleared',

  categories: {
    mixed: 'Everything mixed',
    animals: 'Animals',
    food: 'Food',
    countries: 'Countries',
    sport: 'Sport',
    nature: 'Nature',
    house: 'Around the house',
    travel: 'Travel',
    tech: 'Tech',
  },
  banks: { en: 'English', nl: 'Dutch' },

  line: (line) => {
    const a = String(line.args?.a ?? '');
    const b = String(line.args?.b ?? '');
    const n = line.args?.n ?? 0;
    const w = String(line.args?.w ?? '');
    switch (line.code) {
      case 'seated':
        return `${a} sits down`;
      case 'rejoined':
        return `${a} is back`;
      case 'dropped':
        return `${a} dropped out`;
      case 'newHost':
        return `${a} is host now`;
      case 'swept':
        return 'Empty seats cleared';
      case 'lobby':
        return 'Back to the lobby';
      case 'printed':
        return `Round ${n} printed — ${w} words`;
      case 'claimed':
        return `${a} takes ${w} (+${n})`;
      case 'cleared':
        return `${a} clears the sheet`;
      case 'timeUp':
        return 'Time is up';
      case 'abandoned':
        return 'Nobody was hunting — round dropped';
      case 'winner':
        return `${a} wins on ${n} points`;
      default:
        return `${line.code} ${a} ${b}`.trim();
    }
  },
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? NL : EN;
}
