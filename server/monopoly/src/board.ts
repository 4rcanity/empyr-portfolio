/** The EMPYR LEDGER board: 40 squares laid out in the classic structure
 *  (colour groups of 2/3/3/3/3/3/3/2, four terminals, two works, three of each
 *  card square, two taxes) with wholly original street names and artwork cues. */

import type { Group, TileKind } from './protocol';

export interface Tile {
  i: number;
  kind: TileKind;
  name: string;
  group?: Group;
  price?: number;
  /** [base, 1 house, 2, 3, 4, hotel] — streets only. */
  rent?: number[];
  houseCost?: number;
  mortgage?: number;
  /** Flat charge for tax squares. */
  tax?: number;
}

const street = (
  i: number,
  name: string,
  group: Group,
  price: number,
  rent: number[],
  houseCost: number,
): Tile => ({ i, kind: 'street', name, group, price, rent, houseCost, mortgage: price / 2 });

const rail = (i: number, name: string): Tile => ({
  i,
  kind: 'rail',
  name,
  group: 'rail',
  price: 200,
  mortgage: 100,
});

const util = (i: number, name: string): Tile => ({
  i,
  kind: 'util',
  name,
  group: 'util',
  price: 150,
  mortgage: 75,
});

export const BOARD: Tile[] = [
  { i: 0, kind: 'go', name: 'Ledger Start' },
  street(1, "Tanner's Row", 'brown', 60, [2, 10, 30, 90, 160, 250], 50),
  { i: 2, kind: 'ledger', name: 'Ledger Note' },
  street(3, 'Kiln Lane', 'brown', 60, [4, 20, 60, 180, 320, 450], 50),
  { i: 4, kind: 'tax', name: 'Revenue Levy', tax: 200 },
  rail(5, 'North Terminus'),
  street(6, 'Ferry Steps', 'lblue', 100, [6, 30, 90, 270, 400, 550], 50),
  { i: 7, kind: 'fortune', name: 'Fortune Card' },
  street(8, 'Salt Quay', 'lblue', 100, [6, 30, 90, 270, 400, 550], 50),
  street(9, 'Willow Bend', 'lblue', 120, [8, 40, 100, 300, 450, 600], 50),
  { i: 10, kind: 'jail', name: 'Debtors Gate' },
  street(11, 'Lantern Court', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  util(12, 'Ironworks Power'),
  street(13, "Cobbler's Gate", 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  street(14, 'Verdigris Square', 'pink', 160, [12, 60, 180, 500, 700, 900], 100),
  rail(15, 'East Junction'),
  street(16, 'Copper Market', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  { i: 17, kind: 'ledger', name: 'Ledger Note' },
  street(18, 'Saffron Street', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  street(19, 'Guildhall Way', 'orange', 200, [16, 80, 220, 600, 800, 1000], 100),
  { i: 20, kind: 'vacation', name: 'Long Vacation' },
  street(21, 'Vermilion Arcade', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  { i: 22, kind: 'fortune', name: 'Fortune Card' },
  street(23, 'Opera Terrace', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  street(24, 'Crimson Mile', 'red', 240, [20, 100, 300, 750, 925, 1100], 150),
  rail(25, 'South Halt'),
  street(26, 'Amberfield', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  street(27, 'Sunhaven Rise', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  util(28, 'Grand Waterworks'),
  street(29, 'Goldleaf Parade', 'yellow', 280, [24, 120, 360, 850, 1025, 1200], 150),
  { i: 30, kind: 'arrest', name: 'Bailiff Call' },
  street(31, 'Emerald Gardens', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  street(32, 'Laurel Concourse', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  { i: 33, kind: 'ledger', name: 'Ledger Note' },
  street(34, 'Cypress Boulevard', 'green', 320, [28, 150, 450, 1000, 1200, 1400], 200),
  rail(35, 'West Sidings'),
  { i: 36, kind: 'fortune', name: 'Fortune Card' },
  street(37, 'Meridian Place', 'dblue', 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { i: 38, kind: 'tax', name: 'Luxury Duty', tax: 100 },
  street(39, 'Empyr Crown', 'dblue', 400, [50, 200, 600, 1400, 1700, 2000], 200),
];

export const GO_TILE = 0;
export const JAIL_TILE = 10;
export const VACATION_TILE = 20;
export const ARREST_TILE = 30;

export const RAIL_TILES = [5, 15, 25, 35];
export const UTIL_TILES = [12, 28];

/** Tiles per colour group, in board order. */
export const GROUPS: Record<Group, number[]> = {
  brown: [1, 3],
  lblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  dblue: [37, 39],
  rail: RAIL_TILES,
  util: UTIL_TILES,
};

export const OWNABLE = BOARD.filter(
  (tile) => tile.kind === 'street' || tile.kind === 'rail' || tile.kind === 'util',
).map((tile) => tile.i);

export type CardEffect =
  | { k: 'money'; amount: number }
  | { k: 'moveTo'; tile: number; salary: boolean }
  | { k: 'moveBy'; steps: number }
  | { k: 'nearest'; kind: 'rail' | 'util' }
  | { k: 'jail' }
  | { k: 'freedom' }
  | { k: 'repairs'; house: number; hotel: number }
  /** Positive: every rival pays you. Negative: you pay every rival. */
  | { k: 'each'; amount: number };

export interface CardDef {
  id: string;
  effect: CardEffect;
}

/** Fortune — the swingy deck. Card text lives client-side, keyed by id. */
export const FORTUNE: CardDef[] = [
  { id: 'f.go', effect: { k: 'moveTo', tile: 0, salary: true } },
  { id: 'f.crimson', effect: { k: 'moveTo', tile: 24, salary: true } },
  { id: 'f.crown', effect: { k: 'moveTo', tile: 39, salary: true } },
  { id: 'f.guildhall', effect: { k: 'moveTo', tile: 19, salary: true } },
  { id: 'f.terminus', effect: { k: 'moveTo', tile: 5, salary: true } },
  { id: 'f.nearRail1', effect: { k: 'nearest', kind: 'rail' } },
  { id: 'f.nearRail2', effect: { k: 'nearest', kind: 'rail' } },
  { id: 'f.nearUtil', effect: { k: 'nearest', kind: 'util' } },
  { id: 'f.back3', effect: { k: 'moveBy', steps: -3 } },
  { id: 'f.arrest', effect: { k: 'jail' } },
  { id: 'f.freedom', effect: { k: 'freedom' } },
  { id: 'f.dividend', effect: { k: 'money', amount: 50 } },
  { id: 'f.loan', effect: { k: 'money', amount: 150 } },
  { id: 'f.fine', effect: { k: 'money', amount: -15 } },
  { id: 'f.repairs', effect: { k: 'repairs', house: 25, hotel: 100 } },
  { id: 'f.chair', effect: { k: 'each', amount: -50 } },
];

/** Ledger — the steadier bookkeeping deck. */
export const LEDGER: CardDef[] = [
  { id: 'l.go', effect: { k: 'moveTo', tile: 0, salary: true } },
  { id: 'l.bankerror', effect: { k: 'money', amount: 200 } },
  { id: 'l.doctor', effect: { k: 'money', amount: -50 } },
  { id: 'l.stock', effect: { k: 'money', amount: 50 } },
  { id: 'l.freedom', effect: { k: 'freedom' } },
  { id: 'l.arrest', effect: { k: 'jail' } },
  { id: 'l.holiday', effect: { k: 'money', amount: 100 } },
  { id: 'l.refund', effect: { k: 'money', amount: 20 } },
  { id: 'l.birthday', effect: { k: 'each', amount: 10 } },
  { id: 'l.insurance', effect: { k: 'money', amount: 100 } },
  { id: 'l.hospital', effect: { k: 'money', amount: -100 } },
  { id: 'l.school', effect: { k: 'money', amount: -50 } },
  { id: 'l.consultancy', effect: { k: 'money', amount: 25 } },
  { id: 'l.streetwork', effect: { k: 'repairs', house: 40, hotel: 115 } },
  { id: 'l.contest', effect: { k: 'money', amount: 10 } },
  { id: 'l.inheritance', effect: { k: 'money', amount: 100 } },
];

export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(
  [...FORTUNE, ...LEDGER].map((card) => [card.id, card]),
);
