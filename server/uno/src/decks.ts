import {
  DARK_COLORS,
  LIGHT_COLORS,
  type Card,
  type Color,
  type Face,
  type Pack,
  type Side,
} from './protocol';

let serial = 0;
function card(a: Side, b?: Side): Card {
  return { id: `c${(serial++).toString(36)}`, a, b };
}

export function shuffle<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick<T>(input: readonly T[]): T {
  return input[Math.floor(Math.random() * input.length)];
}

/** 108 cards: one 0 and two of every other rank per colour, plus eight wilds. */
function classicDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of LIGHT_COLORS) {
    deck.push(card({ color, face: '0' }));
    for (let n = 1; n <= 9; n++) {
      const face = String(n) as Face;
      deck.push(card({ color, face }), card({ color, face }));
    }
    for (const face of ['skip', 'reverse', 'draw2'] as Face[]) {
      deck.push(card({ color, face }), card({ color, face }));
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push(card({ color: 'wild', face: 'wild' }));
    deck.push(card({ color: 'wild', face: 'wild4' }));
  }
  return deck;
}

/**
 * UNO Flip! — every card is double sided. The light face is mild (Draw One,
 * Skip, Reverse, Flip) and the dark face is vicious (Draw Five, Skip Everyone,
 * Wild Draw Colour). Flipping swaps which face the whole table is playing with.
 */
function flipDeck(): Card[] {
  const deck: Card[] = [];
  const lightRanks: Face[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  for (let i = 0; i < LIGHT_COLORS.length; i++) {
    const light = LIGHT_COLORS[i];
    // Dark colours are paired to light ones so a flipped card keeps its identity.
    const dark = DARK_COLORS[i];

    deck.push(card({ color: light, face: '0' }, { color: dark, face: '0' }));
    for (const face of lightRanks) {
      deck.push(card({ color: light, face }, { color: dark, face }));
      deck.push(card({ color: light, face }, { color: dark, face }));
    }
    for (let n = 0; n < 2; n++) {
      deck.push(card({ color: light, face: 'draw1' }, { color: dark, face: 'draw5' }));
      deck.push(card({ color: light, face: 'skip' }, { color: dark, face: 'skipAll' }));
      deck.push(card({ color: light, face: 'reverse' }, { color: dark, face: 'reverse' }));
      deck.push(card({ color: light, face: 'flip' }, { color: dark, face: 'flip' }));
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push(card({ color: 'wild', face: 'wild' }, { color: 'wild', face: 'wild' }));
    deck.push(card({ color: 'wild', face: 'wild2' }, { color: 'wild', face: 'wildColor' }));
  }
  return deck;
}

/**
 * UNO Show 'em No Mercy — bigger, meaner deck. Draw Sixes, Wild Draw Tens,
 * Skip Everyone, Discard All, mandatory stacking and a 25-card death limit.
 */
function noMercyDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of LIGHT_COLORS) {
    deck.push(card({ color, face: '0' }));
    for (let n = 1; n <= 9; n++) {
      const face = String(n) as Face;
      deck.push(card({ color, face }), card({ color, face }));
    }
    for (const face of ['skip', 'reverse', 'draw2', 'draw6'] as Face[]) {
      deck.push(card({ color, face }), card({ color, face }));
    }
    deck.push(card({ color, face: 'skipAll' }));
    deck.push(card({ color, face: 'discardAll' }));
  }
  for (let i = 0; i < 4; i++) {
    deck.push(card({ color: 'wild', face: 'wild' }));
    deck.push(card({ color: 'wild', face: 'wild4' }));
    deck.push(card({ color: 'wild', face: 'wildRev4' }));
    deck.push(card({ color: 'wild', face: 'draw10' }));
  }
  return deck;
}

/**
 * UNO All Wild! — no numbers and no colour matching at all. Every card is an
 * action, so every turn does something.
 */
function allWildDeck(): Card[] {
  const deck: Card[] = [];
  const spread: Array<[Face, number]> = [
    ['wild', 18],
    ['wild2', 14],
    ['wildSkip', 14],
    ['wildRev', 14],
    ['wild4', 8],
    ['wildSkipAll', 8],
  ];
  for (const [face, count] of spread) {
    for (let i = 0; i < count; i++) deck.push(card({ color: 'wild', face }));
  }
  return deck;
}

/** UNO Attack! — the classic deck plus Hit Fire cards that spray random draws. */
function attackDeck(): Card[] {
  const deck = classicDeck();
  for (let i = 0; i < 8; i++) deck.push(card({ color: 'wild', face: 'blast' }));
  return deck;
}

export function buildDeck(pack: Pack): Card[] {
  switch (pack) {
    case 'flip':
      return shuffle(flipDeck());
    case 'nomercy':
      return shuffle(noMercyDeck());
    case 'allwild':
      return shuffle(allWildDeck());
    case 'attack':
      return shuffle(attackDeck());
    default:
      return shuffle(classicDeck());
  }
}

/** Colour wheel the active side offers for wild choices. */
export function paletteFor(side: 'light' | 'dark'): Color[] {
  return side === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

/** Deterministic-ish hue spread so seats stay visually distinct. */
export function hueFor(index: number): number {
  return (index * 47 + 12) % 360;
}

/** UNO Attack's launcher: an unpredictable spray of cards. */
export function blastCount(): number {
  const roll = Math.random();
  if (roll < 0.28) return 0;
  if (roll < 0.62) return 1 + Math.floor(Math.random() * 2);
  if (roll < 0.88) return 3 + Math.floor(Math.random() * 3);
  return 6 + Math.floor(Math.random() * 7);
}
