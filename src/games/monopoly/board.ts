/** Client-side board metadata: everything needed to draw the 11x11 grid and the
 *  title-deed cards without asking the worker for anything. Prices and rents mirror
 *  server/monopoly/src/board.ts. */

import type { Group, TileKind } from './protocol';

export type Side = 'bottom' | 'left' | 'top' | 'right' | 'corner';

export interface TileMeta {
  i: number;
  kind: TileKind;
  name: string;
  group: Group | null;
  price: number;
  /** [base, 1 house, 2, 3, 4, hotel] — streets only. */
  rent: number[];
  houseCost: number;
  mortgage: number;
  tax: number;
  row: number;
  col: number;
  side: Side;
}

interface Seed {
  kind: TileKind;
  name: string;
  group?: Group;
  price?: number;
  rent?: number[];
  houseCost?: number;
  mortgage?: number;
  tax?: number;
}

const s = (name: string, group: Group, price: number, rent: number[], houseCost: number): Seed => ({
  kind: 'street',
  name,
  group,
  price,
  rent,
  houseCost,
  mortgage: price / 2,
});

const rail = (name: string): Seed => ({ kind: 'rail', name, group: 'rail', price: 200, mortgage: 100 });
const util = (name: string): Seed => ({ kind: 'util', name, group: 'util', price: 150, mortgage: 75 });

const SEEDS: Seed[] = [
  { kind: 'go', name: 'Ledger Start' },
  s("Tanner's Row", 'brown', 60, [2, 10, 30, 90, 160, 250], 50),
  { kind: 'ledger', name: 'Ledger Note' },
  s('Kiln Lane', 'brown', 60, [4, 20, 60, 180, 320, 450], 50),
  { kind: 'tax', name: 'Revenue Levy', tax: 200 },
  rail('North Terminus'),
  s('Ferry Steps', 'lblue', 100, [6, 30, 90, 270, 400, 550], 50),
  { kind: 'fortune', name: 'Fortune Card' },
  s('Salt Quay', 'lblue', 100, [6, 30, 90, 270, 400, 550], 50),
  s('Willow Bend', 'lblue', 120, [8, 40, 100, 300, 450, 600], 50),
  { kind: 'jail', name: 'Debtors Gate' },
  s('Lantern Court', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  util('Ironworks Power'),
  s("Cobbler's Gate", 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  s('Verdigris Square', 'pink', 160, [12, 60, 180, 500, 700, 900], 100),
  rail('East Junction'),
  s('Copper Market', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  { kind: 'ledger', name: 'Ledger Note' },
  s('Saffron Street', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  s('Guildhall Way', 'orange', 200, [16, 80, 220, 600, 800, 1000], 100),
  { kind: 'vacation', name: 'Long Vacation' },
  s('Vermilion Arcade', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  { kind: 'fortune', name: 'Fortune Card' },
  s('Opera Terrace', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  s('Crimson Mile', 'red', 240, [20, 100, 300, 750, 925, 1100], 150),
  rail('South Halt'),
  s('Amberfield', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  s('Sunhaven Rise', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  util('Grand Waterworks'),
  s('Goldleaf Parade', 'yellow', 280, [24, 120, 360, 850, 1025, 1200], 150),
  { kind: 'arrest', name: 'Bailiff Call' },
  s('Emerald Gardens', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  s('Laurel Concourse', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  { kind: 'ledger', name: 'Ledger Note' },
  s('Cypress Boulevard', 'green', 320, [28, 150, 450, 1000, 1200, 1400], 200),
  rail('West Sidings'),
  { kind: 'fortune', name: 'Fortune Card' },
  s('Meridian Place', 'dblue', 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { kind: 'tax', name: 'Luxury Duty', tax: 100 },
  s('Empyr Crown', 'dblue', 400, [50, 200, 600, 1400, 1700, 2000], 200),
];

/** Squares run anti-clockwise from the bottom-right corner of an 11x11 grid. */
function placement(i: number): { row: number; col: number; side: Side } {
  if (i === 0) return { row: 11, col: 11, side: 'corner' };
  if (i < 10) return { row: 11, col: 11 - i, side: 'bottom' };
  if (i === 10) return { row: 11, col: 1, side: 'corner' };
  if (i < 20) return { row: 21 - i, col: 1, side: 'left' };
  if (i === 20) return { row: 1, col: 1, side: 'corner' };
  if (i < 30) return { row: 1, col: i - 19, side: 'top' };
  if (i === 30) return { row: 1, col: 11, side: 'corner' };
  return { row: i - 29, col: 11, side: 'right' };
}

export const TILES: TileMeta[] = SEEDS.map((seed, i) => ({
  i,
  kind: seed.kind,
  name: seed.name,
  group: seed.group ?? null,
  price: seed.price ?? 0,
  rent: seed.rent ?? [],
  houseCost: seed.houseCost ?? 0,
  mortgage: seed.mortgage ?? 0,
  tax: seed.tax ?? 0,
  ...placement(i),
}));

export const GROUPS: Record<Group, number[]> = TILES.reduce(
  (acc, tile) => {
    if (tile.group) (acc[tile.group] ??= []).push(tile.i);
    return acc;
  },
  {} as Record<Group, number[]>,
);

export const OWNABLE: number[] = TILES.filter((tile) => tile.group !== null).map((tile) => tile.i);

export const STREET_GROUPS: Group[] = ['brown', 'lblue', 'pink', 'orange', 'red', 'yellow', 'green', 'dblue'];

/** Ink-on-paper band colours for the eight street groups. */
export const GROUP_INK: Record<Group, string> = {
  brown: '#6b4a2f',
  lblue: '#5f9ec4',
  pink: '#bf5f8c',
  orange: '#d1802f',
  red: '#b3341f',
  yellow: '#d9b13b',
  green: '#2f6b47',
  dblue: '#27406e',
  rail: '#3a3a44',
  util: '#7d7a94',
};

/** Eight seat colours — deliberately distinct at token size. */
export const TOKEN_INK: string[] = [
  '#b3341f',
  '#27406e',
  '#2f6b47',
  '#b8892b',
  '#7a3d8f',
  '#0f7d84',
  '#c25d1e',
  '#5c5f6b',
];

export const TOKEN_GLYPH: string[] = ['♜', '♞', '♝', '♛', '✦', '⬢', '❖', '▲'];

export function tileName(i: number): string {
  return TILES[i]?.name ?? `#${i}`;
}

/** Rent the deed would command right now, given the whole board. */
export function rentPreview(
  tile: TileMeta,
  deeds: ({ owner: string | null; houses: number; mortgaged: boolean } | null)[],
  doubleRent: boolean,
): number {
  const deed = deeds[tile.i];
  if (!deed?.owner || deed.mortgaged || !tile.group) return 0;
  if (tile.kind === 'rail') {
    const owned = GROUPS.rail.filter((i) => deeds[i]?.owner === deed.owner).length;
    return owned > 0 ? 25 * 2 ** (owned - 1) : 0;
  }
  if (tile.kind === 'util') {
    const owned = GROUPS.util.filter((i) => deeds[i]?.owner === deed.owner).length;
    return owned >= 2 ? 10 : 4;
  }
  if (deed.houses > 0) return tile.rent[Math.min(5, deed.houses)] ?? 0;
  const whole = GROUPS[tile.group].every((i) => deeds[i]?.owner === deed.owner);
  const clean = !GROUPS[tile.group].some((i) => (deeds[i]?.houses ?? 0) > 0);
  return doubleRent && whole && clean ? tile.rent[0] * 2 : tile.rent[0];
}
