/** Pure helpers: the deck, the shuffle and the cylinder. */

import { DECK_SHAPE, TABLE_CARDS, type Card, type Rank, type Rules, type TableCard } from './protocol';

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function rollTable(): TableCard {
  return pick(TABLE_CARDS);
}

/**
 * A shuffled deck big enough to deal the table. One deck is the canonical 20
 * cards, which is exactly four hands of five; a fuller table quietly gets a
 * second deck rather than running dry mid-deal.
 */
export function buildDeck(rules: Rules, seats: number): Card[] {
  const shape = rules.jokers ? DECK_SHAPE : DECK_SHAPE.filter((entry) => entry.rank !== 'joker');
  const perDeck = shape.reduce((sum, entry) => sum + entry.count, 0);
  const needed = Math.max(1, seats) * rules.handSize;
  const copies = Math.max(1, Math.ceil(needed / perDeck));

  const cards: Card[] = [];
  let serial = 0;
  for (let copy = 0; copy < copies; copy++) {
    for (const entry of shape) {
      for (let i = 0; i < entry.count; i++) {
        cards.push({ id: `c${serial++}`, rank: entry.rank });
      }
    }
  }
  return shuffle(cards);
}

/** Which chambers of a fresh cylinder hold a live round. */
export function loadCylinder(chambers: number, bullets: number): number[] {
  const slots = shuffle([...Array(chambers).keys()]);
  return slots.slice(0, Math.min(bullets, chambers)).sort((a, b) => a - b);
}

export interface Pull {
  chamber: number;
  fatal: boolean;
}

/**
 * Advance one chamber. The cylinder never rewinds, which is why the odds get
 * worse with every pull: one in six, then one in five, then one in four.
 */
export function pullTrigger(live: number[], spent: number, chambers: number): Pull {
  const chamber = Math.min(spent, chambers - 1);
  return { chamber, fatal: live.includes(chamber) };
}

/** Count how many of the revealed cards were not what was claimed. */
export function countLies(revealed: Rank[], table: TableCard): number {
  return revealed.filter((rank) => rank !== table && rank !== 'joker').length;
}
