/** Pure helpers for the EMPYR LEDGER room. Nothing in here touches sockets or state. */

import { BOARD, GROUPS, type CardDef } from './board';
import type { Group, Settings } from './protocol';

export interface Deed {
  owner: string | null;
  houses: number;
  mortgaged: boolean;
}

export function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function rollPair(): [number, number] {
  return [rollDie(), rollDie()];
}

/** Eight distinct token slots; the client maps these to its own palette. */
export function tokenFor(index: number): number {
  return index % 8;
}

export function makeDeck(defs: CardDef[]): string[] {
  return shuffled(defs.map((card) => card.id));
}

/** Draws the top card, recycling the pile when it runs dry. */
export function drawCard(pile: string[], defs: CardDef[]): { id: string; pile: string[] } {
  const deck = pile.length > 0 ? pile : makeDeck(defs);
  const [id, ...rest] = deck;
  return { id, pile: rest };
}

export function groupOf(tile: number): Group | null {
  return BOARD[tile]?.group ?? null;
}

/** How many squares of a group an owner holds. */
export function ownedInGroup(deeds: (Deed | null)[], group: Group, ownerId: string): number {
  return GROUPS[group].filter((i) => deeds[i]?.owner === ownerId).length;
}

export function groupComplete(deeds: (Deed | null)[], group: Group, ownerId: string): boolean {
  return GROUPS[group].every((i) => deeds[i]?.owner === ownerId);
}

export function groupHasBuildings(deeds: (Deed | null)[], group: Group): boolean {
  return GROUPS[group].some((i) => (deeds[i]?.houses ?? 0) > 0);
}

export function groupHasMortgage(deeds: (Deed | null)[], group: Group): boolean {
  return GROUPS[group].some((i) => deeds[i]?.mortgaged);
}

/** Rent owed for landing on `tile`. Returns 0 when nothing is due. */
export function rentFor(
  tile: number,
  deeds: (Deed | null)[],
  diceTotal: number,
  settings: Settings,
  ownerIsJailed: boolean,
): number {
  const deed = deeds[tile];
  const def = BOARD[tile];
  if (!deed || !deed.owner || deed.mortgaged || !def.group) return 0;
  if (ownerIsJailed && settings.noRentInJail) return 0;

  if (def.kind === 'rail') {
    const owned = ownedInGroup(deeds, 'rail', deed.owner);
    return owned > 0 ? 25 * 2 ** (owned - 1) : 0;
  }

  if (def.kind === 'util') {
    const owned = ownedInGroup(deeds, 'util', deed.owner);
    return diceTotal * (owned >= 2 ? 10 : 4);
  }

  const rent = def.rent ?? [0, 0, 0, 0, 0, 0];
  if (deed.houses > 0) return rent[Math.min(5, deed.houses)];

  const whole = groupComplete(deeds, def.group, deed.owner);
  const unimproved = !groupHasBuildings(deeds, def.group);
  return settings.doubleRent && whole && unimproved ? rent[0] * 2 : rent[0];
}

/** Cash plus book value of every deed and building held. */
export function netWorth(id: string, cash: number, deeds: (Deed | null)[]): number {
  let total = cash;
  for (let i = 0; i < deeds.length; i++) {
    const deed = deeds[i];
    if (!deed || deed.owner !== id) continue;
    const def = BOARD[i];
    total += deed.mortgaged ? (def.mortgage ?? 0) : (def.price ?? 0);
    total += deed.houses * (def.houseCost ?? 0);
  }
  return total;
}

/** Everything a player could raise by stripping their portfolio bare. */
export function liquidValue(id: string, deeds: (Deed | null)[]): number {
  let total = 0;
  for (let i = 0; i < deeds.length; i++) {
    const deed = deeds[i];
    if (!deed || deed.owner !== id) continue;
    const def = BOARD[i];
    if (!deed.mortgaged) total += def.mortgage ?? 0;
    total += Math.floor((deed.houses * (def.houseCost ?? 0)) / 2);
  }
  return total;
}

export function countBuildings(id: string, deeds: (Deed | null)[]): { houses: number; hotels: number } {
  let houses = 0;
  let hotels = 0;
  for (const deed of deeds) {
    if (!deed || deed.owner !== id) continue;
    if (deed.houses === 5) hotels += 1;
    else houses += deed.houses;
  }
  return { houses, hotels };
}

/** First square of `kind` at or after `from`, wrapping the board. */
export function nearest(from: number, tiles: number[]): number {
  for (let step = 1; step <= 40; step++) {
    const at = (from + step) % 40;
    if (tiles.includes(at)) return at;
  }
  return tiles[0];
}

export function withInterest(mortgage: number, percent: number): number {
  return Math.ceil(mortgage * (1 + percent / 100));
}
