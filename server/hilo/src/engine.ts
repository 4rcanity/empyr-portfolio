import { ACES, WILDS, type Ace, type Card, type Wild } from './protocol';

export function shuffled<T>(input: readonly T[]): T[] {
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

/** Every round starts with three wildcards and a single ace. */
export function openingHand(): Card[] {
  const wilds: Wild[] = [pick(WILDS), pick(WILDS), pick(WILDS)];
  const ace: Ace = pick(ACES);
  return [...wilds, ace];
}

export function bonusCard(): Card {
  return Math.random() < 0.72 ? pick(WILDS) : pick(ACES);
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Deterministic-ish hue spread so seats stay visually distinct. */
export function hueFor(index: number): number {
  return (index * 67 + 24) % 360;
}
