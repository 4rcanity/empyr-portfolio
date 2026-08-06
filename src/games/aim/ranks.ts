import type { RunResult } from './engine';
import { LIMITS, type RunConfig, type ScoreMode } from './scenarios';

export interface RankTier {
  id: string;
  name: string;
  color: string;
}

export const RANKS: RankTier[] = [
  { id: 'iron', name: 'Iron', color: '#4A4E54' },
  { id: 'bronze', name: 'Bronze', color: '#8A5A34' },
  { id: 'silver', name: 'Silver', color: '#A7AFB6' },
  { id: 'gold', name: 'Gold', color: '#DDB639' },
  { id: 'platinum', name: 'Platinum', color: '#3AA6A6' },
  { id: 'diamond', name: 'Diamond', color: '#B15FDE' },
  { id: 'ascendant', name: 'Ascendant', color: '#29C46A' },
  { id: 'immortal', name: 'Immortal', color: '#B9375E' },
  { id: 'radiant', name: 'Radiant', color: '#F0E68C' },
];

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'extreme';

export interface DifficultyInfo {
  id: DifficultyId;
  /** 0..1 — how punishing the settings are. */
  challenge: number;
  /** Highest tier index this setup is allowed to award (0=Iron … 8=Radiant). */
  maxTierIndex: number;
}

/** Raw performance thresholds before difficulty is applied. Tuned so a
    *normal*-difficulty run with strong play can still reach Immortal/Radiant,
    while an easy oversized-static drill tops out much lower. */
const CLICK_THRESHOLDS = [0, 1800, 3000, 4200, 5400, 6600, 7800, 9200, 10800];
const TRACK_THRESHOLDS = [0, 0.12, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.92];
const SPRAY_THRESHOLDS = [0, 4, 7, 10, 13, 16, 19, 22, 24];

export interface RankEstimate {
  tier: RankTier;
  tierIndex: number;
  sub: 1 | 2 | 3;
  metric: number;
  /** Metric after difficulty scaling (what the thresholds are compared against). */
  effectiveMetric: number;
  nextTier: RankTier | null;
  toNext: number;
  progress: number;
  difficulty: DifficultyInfo;
  /** True when the raw score would have ranked higher but the drill was too easy. */
  capped: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function norm(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

/**
 * How hard the *settings* are, independent of how well you played.
 * Small targets, wide spawn, and motion push this up; fat static targets
 * push it down. Defaults for the builtin drills land around ~0.45–0.7.
 */
export function challengeOf(config: RunConfig, mode: ScoreMode): number {
  // Smaller size → harder.
  const sizeHard = 1 - norm(config.size, LIMITS.size.min, LIMITS.size.max);
  // Wider spawn → harder flicks / tracking.
  const areaHard = norm(config.area, LIMITS.area.min, LIMITS.area.max);
  // Motion.
  const speedHard = norm(config.speed, LIMITS.speed.min, LIMITS.speed.max);
  // Frequent direction changes hurt more when anything is moving.
  const turnHard =
    config.speed > 0 ? 1 - norm(config.turnEvery, LIMITS.turnEvery.min, LIMITS.turnEvery.max) : 0;
  // Busy click walls are a bit harder; spray/track usually run one target.
  const targetHard = mode === 'click' ? norm(config.targets, LIMITS.targets.min, LIMITS.targets.max) * 0.35 : 0;

  if (mode === 'track') {
    return clamp01(0.28 * sizeHard + 0.18 * areaHard + 0.34 * speedHard + 0.2 * turnHard);
  }
  if (mode === 'spray') {
    // Spray lives or dies on target size and how far the group can wander.
    return clamp01(0.6 * sizeHard + 0.4 * areaHard);
  }
  return clamp01(0.42 * sizeHard + 0.22 * areaHard + 0.2 * speedHard + 0.1 * turnHard + 0.06 * targetHard);
}

/** Map challenge → the highest rank this setup may claim. Easy fat-target
    drills stop at Gold; only punishing setups unlock Immortal/Radiant.
    Builtin defaults (~0.4–0.55 challenge) top out around Ascendant–Immortal. */
export function maxTierForChallenge(challenge: number): number {
  if (challenge < 0.18) return 3; // Gold
  if (challenge < 0.3) return 4; // Platinum
  if (challenge < 0.4) return 5; // Diamond
  if (challenge < 0.52) return 6; // Ascendant
  if (challenge < 0.68) return 7; // Immortal
  return 8; // Radiant
}

export function difficultyIdFor(challenge: number): DifficultyId {
  if (challenge < 0.25) return 'easy';
  if (challenge < 0.48) return 'normal';
  if (challenge < 0.7) return 'hard';
  return 'extreme';
}

export function difficultyOf(config: RunConfig, mode: ScoreMode): DifficultyInfo {
  const challenge = challengeOf(config, mode);
  return {
    id: difficultyIdFor(challenge),
    challenge,
    maxTierIndex: maxTierForChallenge(challenge),
  };
}

function metricFor(result: RunResult): number {
  if (result.mode === 'click') {
    return result.score * (60000 / Math.max(1, result.elapsed));
  }
  if (result.mode === 'track') return result.onTargetPct;
  return result.hits;
}

function thresholdsFor(mode: RunResult['mode']): number[] {
  if (mode === 'click') return CLICK_THRESHOLDS;
  if (mode === 'track') return TRACK_THRESHOLDS;
  return SPRAY_THRESHOLDS;
}

/** Scale raw performance by drill hardness so the same accuracy on a huge
    static target reads lower than on a tiny moving one. */
function effectiveMetric(raw: number, challenge: number): number {
  // Easy (~0) → ×0.45; normal (~0.5) → ×0.78; extreme (~1) → ×1.05
  const scale = 0.45 + challenge * 0.6;
  return raw * scale;
}

export function estimateRank(result: RunResult): RankEstimate {
  const difficulty = difficultyOf(result.config, result.mode);
  const metric = metricFor(result);
  const scaled = effectiveMetric(metric, difficulty.challenge);
  const thresholds = thresholdsFor(result.mode);

  let uncapped = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (scaled >= thresholds[i]!) {
      uncapped = i;
      break;
    }
  }
  uncapped = Math.max(0, Math.min(8, uncapped));
  const tierIndex = Math.min(uncapped, difficulty.maxTierIndex);
  const capped = uncapped > difficulty.maxTierIndex;

  const floor = thresholds[tierIndex]!;
  const ceiling = thresholds[tierIndex + 1] ?? floor * 1.25;
  const span = ceiling - floor;
  // Progress toward the next tier uses the scaled metric, but never past the
  // difficulty ceiling — if capped, progress reads full within the max tier.
  const progress = capped
    ? 1
    : span > 0
      ? Math.max(0, Math.min(1, (scaled - floor) / span))
      : 1;

  const sub = tierIndex === 8 ? 3 : (Math.min(3, Math.max(1, Math.floor(progress * 3) + 1)) as 1 | 2 | 3);

  const nextTier =
    tierIndex < difficulty.maxTierIndex && tierIndex < 8 ? RANKS[tierIndex + 1]! : null;
  const toNext = nextTier ? Math.max(0, ceiling - scaled) : 0;

  return {
    tier: RANKS[tierIndex]!,
    tierIndex,
    sub,
    metric,
    effectiveMetric: scaled,
    nextTier,
    toNext,
    progress,
    difficulty,
    capped,
  };
}
