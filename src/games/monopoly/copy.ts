import type { Group, LogLine, TileKind } from './protocol';
import { tileName } from './board';

export type Lang = 'nl' | 'en';

export const MARK = 'ƒ';

export function money(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${MARK}${Math.abs(Math.round(value)).toLocaleString('en-US')}`;
}

export interface Copy {
  brand: string;
  tagline: string;

  checkinTitle: string;
  checkinSub: string;
  nameLabel: string;
  namePlaceholder: string;
  enter: string;
  noRoomTitle: string;
  noRoomBody: string;
  noRoomAction: string;

  status: Record<'idle' | 'dialing' | 'live' | 'lost', string>;
  roomLabel: string;
  copyLink: string;
  copied: string;
  leave: string;

  lobbyTitle: string;
  lobbySub: string;
  seatsTitle: string;
  ready: string;
  unready: string;
  start: string;
  needTwo: string;
  hostOnly: string;
  waitingHost: string;
  hostTag: string;
  youTag: string;
  offline: string;
  settingsTitle: string;
  on: string;
  off: string;
  setting: Record<string, string>;

  turnOf: string;
  yourTurn: string;
  clock: string;
  roll: string;
  rollAgain: string;
  endTurn: string;
  buy: string;
  declineTile: string;
  offerTitle: string;
  offerSub: string;

  jailTitle: string;
  jailSub: string;
  jailPay: string;
  jailCard: string;
  jailRoll: string;
  jailAttempts: string;
  inJail: string;

  debtTitle: string;
  debtOwed: string;
  debtToBank: string;
  debtBody: string;
  declareBankrupt: string;

  auctionTitle: string;
  auctionSub: string;
  standingBid: string;
  noBidYet: string;
  leading: string;
  placeBid: string;
  passBid: string;
  youPassed: string;
  auctionClock: string;

  tradeTitle: string;
  tradeHint: string;
  tradeOpen: string;
  railOwned: string;
  utilRate: string;
  tradeWith: string;
  youOffer: string;
  youAskFor: string;
  tradeCash: string;
  tradeDeeds: string;
  tradeJailCards: string;
  propose: string;
  cancel: string;
  incomingTrade: string;
  accept: string;
  refuse: string;
  awaitingAnswer: string;
  tradeNoDeeds: string;

  deedsTitle: string;
  noDeeds: string;
  build: string;
  sellHouse: string;
  mortgage: string;
  unmortgage: string;
  mortgagedTag: string;
  hotelTag: string;
  housesTag: string;
  priceLabel: string;
  rentLabel: string;
  rentWithHouses: string;
  rentHotel: string;
  houseCostLabel: string;
  mortgageLabel: string;
  unowned: string;
  ownedBy: string;

  bankTitle: string;
  housesLeft: string;
  hotelsLeft: string;
  vacationPot: string;
  cash: string;
  netWorth: string;
  bankrupt: string;
  spectating: string;

  feedTitle: string;
  winnerTitle: string;
  youWin: string;
  playAgain: string;
  drawnCard: string;

  kind: Record<TileKind, string>;
  groupName: Record<Group, string>;
  cards: Record<string, string>;
  lines: Record<string, string>;
}

const SETTING_EN: Record<string, string> = {
  startCash: 'Starting cash',
  salary: 'Salary past start',
  doubleRent: 'Double rent on full sets',
  vacationCash: 'Fees pile up on Vacation',
  auctions: 'Auction declined deeds',
  evenBuild: 'Even build rule',
  noRentInJail: 'No rent while owner is jailed',
  mortgageInterest: 'Mortgage interest %',
  turnSeconds: 'Turn clock (s)',
  auctionSeconds: 'Auction clock (s)',
  maxHouses: 'Houses in the bank',
  maxHotels: 'Hotels in the bank',
  capacity: 'Seats',
};

const SETTING_NL: Record<string, string> = {
  startCash: 'Startkapitaal',
  salary: 'Salaris langs start',
  doubleRent: 'Dubbele huur bij volle reeks',
  vacationCash: 'Heffingen stapelen op Vakantie',
  auctions: 'Geweigerde akten veilen',
  evenBuild: 'Gelijkmatig bouwen',
  noRentInJail: 'Geen huur als eigenaar vastzit',
  mortgageInterest: 'Hypotheekrente %',
  turnSeconds: 'Beurtklok (s)',
  auctionSeconds: 'Veilingklok (s)',
  maxHouses: 'Huizen in de bank',
  maxHotels: 'Hotels in de bank',
  capacity: 'Plaatsen',
};

const CARDS_EN: Record<string, string> = {
  'f.go': 'Advance to Ledger Start and draw your salary.',
  'f.crimson': 'The playhouses call — advance to Crimson Mile.',
  'f.crown': 'A summons to Empyr Crown. Advance there.',
  'f.guildhall': 'Guild business: advance to Guildhall Way.',
  'f.terminus': 'Take the early train to North Terminus.',
  'f.nearRail1': 'Advance to the nearest terminus.',
  'f.nearRail2': 'Advance to the nearest terminus.',
  'f.nearUtil': 'Advance to the nearest works.',
  'f.back3': 'You dropped your papers. Go back three squares.',
  'f.arrest': 'The bailiff finds you. Go straight to Debtors Gate.',
  'f.freedom': 'A magistrate owes you a favour. Keep this release.',
  'f.dividend': 'Harbour dividend pays out ƒ50.',
  'f.loan': 'Your building loan matures: collect ƒ150.',
  'f.fine': 'Fined ƒ15 for racing a cart through Old Town.',
  'f.repairs': 'Roof survey: pay ƒ25 per house and ƒ100 per hotel.',
  'f.chair': 'You chaired the guild dinner. Pay every rival ƒ50.',
  'l.go': 'The books balance. Advance to Ledger Start.',
  'l.bankerror': 'Bank error in your favour: collect ƒ200.',
  'l.doctor': "Physician's fee: pay ƒ50.",
  'l.stock': 'Sale of stock brings in ƒ50.',
  'l.freedom': 'Clerical mercy. Keep this release from Debtors Gate.',
  'l.arrest': 'An old writ resurfaces. Go to Debtors Gate.',
  'l.holiday': 'Holiday fund matures: collect ƒ100.',
  'l.refund': 'Levy refund: collect ƒ20.',
  'l.birthday': 'It is your name day. Every rival pays you ƒ10.',
  'l.insurance': 'Life policy pays out ƒ100.',
  'l.hospital': 'Infirmary fees: pay ƒ100.',
  'l.school': 'School fees: pay ƒ50.',
  'l.consultancy': 'Consultancy fee received: ƒ25.',
  'l.streetwork': 'Street works: pay ƒ40 per house and ƒ115 per hotel.',
  'l.contest': 'Second place in the flower show: collect ƒ10.',
  'l.inheritance': 'A distant aunt remembers you: collect ƒ100.',
};

const CARDS_NL: Record<string, string> = {
  'f.go': 'Ga naar Grootboek Start en beur je salaris.',
  'f.crimson': 'De schouwburg roept — ga naar Crimson Mile.',
  'f.crown': 'Een oproep bij Empyr Crown. Ga daarheen.',
  'f.guildhall': 'Gildezaken: ga naar Guildhall Way.',
  'f.terminus': 'Neem de vroege trein naar North Terminus.',
  'f.nearRail1': 'Ga naar het dichtstbijzijnde station.',
  'f.nearRail2': 'Ga naar het dichtstbijzijnde station.',
  'f.nearUtil': 'Ga naar de dichtstbijzijnde nutsvoorziening.',
  'f.back3': 'Je papieren waaien weg. Ga drie vakjes terug.',
  'f.arrest': 'De deurwaarder vindt je. Direct naar de Schuldpoort.',
  'f.freedom': 'Een rechter staat bij je in het krijt. Bewaar dit vrijbrief.',
  'f.dividend': 'Havendividend keert ƒ50 uit.',
  'f.loan': 'Je bouwlening loopt af: ontvang ƒ150.',
  'f.fine': 'Boete van ƒ15 voor hard rijden door de oude stad.',
  'f.repairs': 'Dakinspectie: betaal ƒ25 per huis en ƒ100 per hotel.',
  'f.chair': 'Jij zat het gildediner voor. Betaal elke rivaal ƒ50.',
  'l.go': 'De boeken kloppen. Ga naar Grootboek Start.',
  'l.bankerror': 'Bankfout in jouw voordeel: ontvang ƒ200.',
  'l.doctor': 'Doktersrekening: betaal ƒ50.',
  'l.stock': 'Verkoop van aandelen levert ƒ50 op.',
  'l.freedom': 'Genade van de klerk. Bewaar deze vrijbrief.',
  'l.arrest': 'Een oud vonnis duikt op. Ga naar de Schuldpoort.',
  'l.holiday': 'Vakantiepot komt vrij: ontvang ƒ100.',
  'l.refund': 'Teruggave heffing: ontvang ƒ20.',
  'l.birthday': 'Het is je naamdag. Elke rivaal betaalt je ƒ10.',
  'l.insurance': 'Levensverzekering keert ƒ100 uit.',
  'l.hospital': 'Ziekenhuiskosten: betaal ƒ100.',
  'l.school': 'Schoolgeld: betaal ƒ50.',
  'l.consultancy': 'Adviesgeld ontvangen: ƒ25.',
  'l.streetwork': 'Straatwerk: betaal ƒ40 per huis en ƒ115 per hotel.',
  'l.contest': 'Tweede prijs op de bloemenshow: ontvang ƒ10.',
  'l.inheritance': 'Een verre tante denkt aan je: ontvang ƒ100.',
};

const LINES_EN: Record<string, string> = {
  seated: '{a} takes a seat.',
  rejoined: '{a} is back at the table.',
  dropped: '{a} lost the connection.',
  swept: 'Empty seats cleared.',
  lobby: 'Back to the lobby.',
  begin: 'The books are opened. Play begins.',
  roll: '{a} rolled {x} and {y} — {n}.',
  tripleJail: 'Three doubles in a row. {a} is taken to Debtors Gate.',
  salary: '{a} passes start and collects ƒ{n}.',
  buy: '{a} buys {i} for ƒ{n}.',
  declined: '{a} passes on {i}.',
  rent: '{a} pays {b} ƒ{n} in rent for {i}.',
  tax: '{a} is charged ƒ{n} at {i}.',
  vacationPot: '{a} sweeps the vacation pot: ƒ{n}.',
  vacationEmpty: '{a} finds the vacation pot empty.',
  card: '{a} draws: {c}',
  collect: '{a} collects ƒ{n}.',
  payAll: '{a} pays out ƒ{n} to the table.',
  repairs: '{a} owes ƒ{n} in repairs.',
  jailed: '{a} is locked in Debtors Gate.',
  jailPay: '{a} pays ƒ{n} for release.',
  jailCard: '{a} plays a release and walks out.',
  jailOut: '{a} rolls doubles and walks out — {n}.',
  jailStay: '{a} stays locked up. {n} attempt(s) left.',
  jailForced: '{a} runs out of attempts and pays ƒ{n}.',
  build: '{a} raises a house on {i} — now {n}.',
  hotel: '{a} crowns {i} with a hotel for ƒ{n}.',
  sell: '{a} sells a building on {i} for ƒ{n}.',
  mortgage: '{a} mortgages {i} for ƒ{n}.',
  unmortgage: '{a} lifts the mortgage on {i} for ƒ{n}.',
  auctionStart: '{i} goes under the hammer.',
  bid: '{a} bids ƒ{n}.',
  pass: '{a} passes.',
  auctionWon: '{a} takes {i} at auction for ƒ{n}.',
  auctionNone: 'Nobody bids on {i}. It stays unowned.',
  tradeOffer: '{a} puts an offer to {b}.',
  tradeAccept: '{a} accepts the offer from {b}.',
  tradeDecline: '{a} refuses the offer from {b}.',
  tradeCancel: '{a} withdraws the offer.',
  debt: '{a} is short ƒ{n} and must raise funds.',
  settled: '{a} settles ƒ{n}.',
  bankruptTo: '{a} is bankrupt. Everything passes to {b}.',
  bankruptBank: '{a} is bankrupt. The bank reclaims the lot.',
  timeout: "{a}'s clock ran out.",
  abandoned: 'The table went quiet — the books are closed.',
  winner: '{a} holds the last solvent ledger.',
  nowinner: 'The table folds with nobody left standing.',
};

const LINES_NL: Record<string, string> = {
  seated: '{a} neemt plaats.',
  rejoined: '{a} is terug aan tafel.',
  dropped: '{a} verloor de verbinding.',
  swept: 'Lege plaatsen opgeruimd.',
  lobby: 'Terug naar de lobby.',
  begin: 'De boeken gaan open. Het spel begint.',
  roll: '{a} gooide {x} en {y} — {n}.',
  tripleJail: 'Drie keer dubbel. {a} gaat naar de Schuldpoort.',
  salary: '{a} passeert start en beurt ƒ{n}.',
  buy: '{a} koopt {i} voor ƒ{n}.',
  declined: '{a} slaat {i} over.',
  rent: '{a} betaalt {b} ƒ{n} huur voor {i}.',
  tax: '{a} wordt ƒ{n} belast op {i}.',
  vacationPot: '{a} strijkt de vakantiepot op: ƒ{n}.',
  vacationEmpty: '{a} treft een lege vakantiepot.',
  card: '{a} trekt: {c}',
  collect: '{a} ontvangt ƒ{n}.',
  payAll: '{a} betaalt ƒ{n} uit aan tafel.',
  repairs: '{a} is ƒ{n} aan reparaties verschuldigd.',
  jailed: '{a} zit vast in de Schuldpoort.',
  jailPay: '{a} betaalt ƒ{n} voor vrijlating.',
  jailCard: '{a} speelt een vrijbrief en loopt naar buiten.',
  jailOut: '{a} gooit dubbel en komt vrij — {n}.',
  jailStay: '{a} blijft vastzitten. Nog {n} poging(en).',
  jailForced: '{a} is door de pogingen heen en betaalt ƒ{n}.',
  build: '{a} zet een huis op {i} — nu {n}.',
  hotel: '{a} bekroont {i} met een hotel voor ƒ{n}.',
  sell: '{a} verkoopt een gebouw op {i} voor ƒ{n}.',
  mortgage: '{a} verhypothekeert {i} voor ƒ{n}.',
  unmortgage: '{a} lost de hypotheek op {i} af voor ƒ{n}.',
  auctionStart: '{i} gaat onder de hamer.',
  bid: '{a} biedt ƒ{n}.',
  pass: '{a} past.',
  auctionWon: '{a} koopt {i} op de veiling voor ƒ{n}.',
  auctionNone: 'Niemand biedt op {i}. Het blijft vrij.',
  tradeOffer: '{a} legt {b} een voorstel voor.',
  tradeAccept: '{a} gaat akkoord met het voorstel van {b}.',
  tradeDecline: '{a} wijst het voorstel van {b} af.',
  tradeCancel: '{a} trekt het voorstel in.',
  debt: '{a} komt ƒ{n} tekort en moet geld vrijmaken.',
  settled: '{a} voldoet ƒ{n}.',
  bankruptTo: '{a} is failliet. Alles gaat naar {b}.',
  bankruptBank: '{a} is failliet. De bank neemt alles terug.',
  timeout: 'De klok van {a} liep af.',
  abandoned: 'De tafel viel stil — de boeken gaan dicht.',
  winner: '{a} houdt het laatste solvabele grootboek.',
  nowinner: 'De tafel valt stil zonder winnaar.',
};

const EN: Copy = {
  brand: 'EMPYR LEDGER',
  tagline: 'A property game for two to eight bookkeepers.',

  checkinTitle: 'Sign the register',
  checkinSub: 'Your name goes on the deeds. Keep it short.',
  nameLabel: 'Name',
  namePlaceholder: 'e.g. Wren',
  enter: 'Take a seat',
  noRoomTitle: 'No table code',
  noRoomBody: 'This page needs a room code in the address. Open a fresh table from the lobby.',
  noRoomAction: 'Go to the lobby',

  status: { idle: 'idle', dialing: 'connecting', live: 'connected', lost: 'reconnecting' },
  roomLabel: 'Table',
  copyLink: 'Copy invite',
  copied: 'Copied',
  leave: 'Leave',

  lobbyTitle: 'The table is being set',
  lobbySub: 'Everyone marks themselves ready, then the host opens the books.',
  seatsTitle: 'Seats',
  ready: 'Ready',
  unready: 'Not ready',
  start: 'Open the books',
  needTwo: 'Two players minimum.',
  hostOnly: 'Only the host can start.',
  waitingHost: 'Waiting for the host to start.',
  hostTag: 'host',
  youTag: 'you',
  offline: 'away',
  settingsTitle: 'House rules',
  on: 'On',
  off: 'Off',
  setting: SETTING_EN,

  turnOf: "{a}'s turn",
  yourTurn: 'Your turn',
  clock: 'Clock',
  roll: 'Roll the dice',
  rollAgain: 'Doubles — roll again',
  endTurn: 'End turn',
  buy: 'Buy for {n}',
  declineTile: 'Decline',
  offerTitle: 'On offer',
  offerSub: 'Buy it now, or let the table bid for it.',

  jailTitle: 'Debtors Gate',
  jailSub: 'Buy your way out, play a release, or roll doubles.',
  jailPay: 'Pay ƒ50',
  jailCard: 'Use release card',
  jailRoll: 'Roll for doubles',
  jailAttempts: '{n} attempt(s) left',
  inJail: 'jailed',

  debtTitle: 'You are short',
  debtOwed: 'Owed to {a}',
  debtToBank: 'Owed to the bank',
  debtBody: 'Sell buildings or mortgage deeds until the bill is covered — it settles itself the moment you can pay.',
  declareBankrupt: 'Declare bankruptcy',

  auctionTitle: 'Auction',
  auctionSub: 'Highest bid when the hammer falls takes the deed.',
  standingBid: 'Standing bid',
  noBidYet: 'No bid yet',
  leading: 'leading',
  placeBid: 'Bid',
  passBid: 'Pass',
  youPassed: 'You passed on this lot.',
  auctionClock: 'Hammer in',

  tradeTitle: 'Draw up a trade',
  tradeHint: 'Cash, deeds and release cards, either way. Built-up streets cannot change hands.',
  tradeOpen: 'Trade',
  railOwned: 'Holding {n}',
  utilRate: 'One works / both works',
  tradeWith: 'With',
  youOffer: 'You hand over',
  youAskFor: 'You ask for',
  tradeCash: 'Cash',
  tradeDeeds: 'Deeds',
  tradeJailCards: 'Release cards',
  propose: 'Send offer',
  cancel: 'Cancel',
  incomingTrade: 'Offer from {a}',
  accept: 'Accept',
  refuse: 'Refuse',
  awaitingAnswer: 'Waiting for an answer…',
  tradeNoDeeds: 'No tradable deeds.',

  deedsTitle: 'Your deeds',
  noDeeds: 'You hold nothing yet.',
  build: 'Build',
  sellHouse: 'Sell',
  mortgage: 'Mortgage',
  unmortgage: 'Redeem',
  mortgagedTag: 'mortgaged',
  hotelTag: 'Hotel',
  housesTag: '{n} house(s)',
  priceLabel: 'Price',
  rentLabel: 'Rent',
  rentWithHouses: 'With {n} house(s)',
  rentHotel: 'With hotel',
  houseCostLabel: 'House cost',
  mortgageLabel: 'Mortgage',
  unowned: 'Unowned',
  ownedBy: 'Held by {a}',

  bankTitle: 'The bank',
  housesLeft: 'Houses',
  hotelsLeft: 'Hotels',
  vacationPot: 'Vacation pot',
  cash: 'Cash',
  netWorth: 'Worth',
  bankrupt: 'bankrupt',
  spectating: 'You are watching the rest play out.',

  feedTitle: 'The record',
  winnerTitle: '{a} wins the table',
  youWin: 'You win the table',
  playAgain: 'Back to the lobby',
  drawnCard: 'Card drawn',

  kind: {
    go: 'Ledger Start',
    street: 'Street',
    rail: 'Terminus',
    util: 'Works',
    fortune: 'Fortune',
    ledger: 'Ledger note',
    tax: 'Levy',
    jail: 'Debtors Gate',
    vacation: 'Long vacation',
    arrest: 'Bailiff call',
  },
  groupName: {
    brown: 'Docklands',
    lblue: 'Riverside',
    pink: 'Old Town',
    orange: 'Market',
    red: 'Theatre Row',
    yellow: 'The Heights',
    green: 'Park Ring',
    dblue: 'Crown Quarter',
    rail: 'Termini',
    util: 'Works',
  },
  cards: CARDS_EN,
  lines: LINES_EN,
};

const NL: Copy = {
  brand: 'EMPYR LEDGER',
  tagline: 'Een vastgoedspel voor twee tot acht boekhouders.',

  checkinTitle: 'Teken het register',
  checkinSub: 'Je naam komt op de akten te staan. Houd het kort.',
  nameLabel: 'Naam',
  namePlaceholder: 'bijv. Wren',
  enter: 'Neem plaats',
  noRoomTitle: 'Geen tafelcode',
  noRoomBody: 'Deze pagina heeft een kamercode in het adres nodig. Open een nieuwe tafel in de lobby.',
  noRoomAction: 'Naar de lobby',

  status: { idle: 'inactief', dialing: 'verbinden', live: 'verbonden', lost: 'herverbinden' },
  roomLabel: 'Tafel',
  copyLink: 'Kopieer uitnodiging',
  copied: 'Gekopieerd',
  leave: 'Verlaten',

  lobbyTitle: 'De tafel wordt gedekt',
  lobbySub: 'Iedereen zet zich op gereed, daarna opent de gastheer de boeken.',
  seatsTitle: 'Plaatsen',
  ready: 'Gereed',
  unready: 'Niet gereed',
  start: 'Open de boeken',
  needTwo: 'Minimaal twee spelers.',
  hostOnly: 'Alleen de gastheer kan starten.',
  waitingHost: 'Wachten tot de gastheer start.',
  hostTag: 'gastheer',
  youTag: 'jij',
  offline: 'weg',
  settingsTitle: 'Huisregels',
  on: 'Aan',
  off: 'Uit',
  setting: SETTING_NL,

  turnOf: 'Beurt van {a}',
  yourTurn: 'Jouw beurt',
  clock: 'Klok',
  roll: 'Gooi de dobbelstenen',
  rollAgain: 'Dubbel — gooi nog eens',
  endTurn: 'Beurt beëindigen',
  buy: 'Koop voor {n}',
  declineTile: 'Weigeren',
  offerTitle: 'Te koop',
  offerSub: 'Koop het nu, of laat de tafel erop bieden.',

  jailTitle: 'Schuldpoort',
  jailSub: 'Koop je vrij, speel een vrijbrief, of gooi dubbel.',
  jailPay: 'Betaal ƒ50',
  jailCard: 'Gebruik vrijbrief',
  jailRoll: 'Gooi voor dubbel',
  jailAttempts: 'Nog {n} poging(en)',
  inJail: 'vast',

  debtTitle: 'Je komt tekort',
  debtOwed: 'Verschuldigd aan {a}',
  debtToBank: 'Verschuldigd aan de bank',
  debtBody: 'Verkoop gebouwen of verhypothekeer akten tot de rekening gedekt is — hij vereffent zichzelf zodra je kunt betalen.',
  declareBankrupt: 'Faillissement aanvragen',

  auctionTitle: 'Veiling',
  auctionSub: 'Het hoogste bod bij de hamerslag krijgt de akte.',
  standingBid: 'Huidig bod',
  noBidYet: 'Nog geen bod',
  leading: 'aan kop',
  placeBid: 'Bied',
  passBid: 'Pas',
  youPassed: 'Je hebt op dit kavel gepast.',
  auctionClock: 'Hamer over',

  tradeTitle: 'Stel een ruil op',
  tradeHint: 'Contant, akten en vrijbrieven, beide kanten op. Bebouwde straten zijn niet verhandelbaar.',
  tradeOpen: 'Ruilen',
  railOwned: '{n} in bezit',
  utilRate: 'Eén bedrijf / beide bedrijven',
  tradeWith: 'Met',
  youOffer: 'Jij geeft',
  youAskFor: 'Jij vraagt',
  tradeCash: 'Contant',
  tradeDeeds: 'Akten',
  tradeJailCards: 'Vrijbrieven',
  propose: 'Voorstel sturen',
  cancel: 'Annuleren',
  incomingTrade: 'Voorstel van {a}',
  accept: 'Akkoord',
  refuse: 'Afwijzen',
  awaitingAnswer: 'Wachten op antwoord…',
  tradeNoDeeds: 'Geen verhandelbare akten.',

  deedsTitle: 'Jouw akten',
  noDeeds: 'Je bezit nog niets.',
  build: 'Bouwen',
  sellHouse: 'Verkopen',
  mortgage: 'Hypotheek',
  unmortgage: 'Aflossen',
  mortgagedTag: 'verhypothekeerd',
  hotelTag: 'Hotel',
  housesTag: '{n} huis(zen)',
  priceLabel: 'Prijs',
  rentLabel: 'Huur',
  rentWithHouses: 'Met {n} huis(zen)',
  rentHotel: 'Met hotel',
  houseCostLabel: 'Huisprijs',
  mortgageLabel: 'Hypotheek',
  unowned: 'Vrij',
  ownedBy: 'In bezit van {a}',

  bankTitle: 'De bank',
  housesLeft: 'Huizen',
  hotelsLeft: 'Hotels',
  vacationPot: 'Vakantiepot',
  cash: 'Contant',
  netWorth: 'Waarde',
  bankrupt: 'failliet',
  spectating: 'Je kijkt toe hoe de rest het uitspeelt.',

  feedTitle: 'Het journaal',
  winnerTitle: '{a} wint de tafel',
  youWin: 'Jij wint de tafel',
  playAgain: 'Terug naar de lobby',
  drawnCard: 'Getrokken kaart',

  kind: {
    go: 'Grootboek Start',
    street: 'Straat',
    rail: 'Station',
    util: 'Nutsbedrijf',
    fortune: 'Fortuin',
    ledger: 'Grootboekbrief',
    tax: 'Heffing',
    jail: 'Schuldpoort',
    vacation: 'Lange vakantie',
    arrest: 'Deurwaarder',
  },
  groupName: {
    brown: 'Havenkwartier',
    lblue: 'Rivieroever',
    pink: 'Oude Stad',
    orange: 'Marktbuurt',
    red: 'Theaterrij',
    yellow: 'De Hoogten',
    green: 'Parkring',
    dblue: 'Kroonwijk',
    rail: 'Stations',
    util: 'Nutsbedrijven',
  },
  cards: CARDS_NL,
  lines: LINES_NL,
};

export function copyFor(lang: Lang): Copy {
  return lang === 'nl' ? NL : EN;
}

export function fill(template: string, args: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = args[key];
    if (value === undefined) return whole;
    return typeof value === 'number' ? value.toLocaleString('en-US') : String(value);
  });
}

/** Renders a server log line in the reader's own language. */
export function logText(copy: Copy, line: LogLine): string {
  const template = copy.lines[line.code];
  if (!template) return line.code;
  const args: Record<string, string | number> = { ...(line.args ?? {}) };
  if (typeof args.i === 'number') args.i = tileName(args.i);
  if (typeof args.c === 'string') args.c = copy.cards[args.c] ?? args.c;
  return fill(template, args);
}
