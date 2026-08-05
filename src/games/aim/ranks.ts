import type { RunResult } from './engine';

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

const CLICK_THRESHOLDS = [0, 1800, 3000, 4200, 5400, 6600, 7800, 9200, 10800];
const TRACK_THRESHOLDS = [0, 0.12, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.92];
const SPRAY_THRESHOLDS = [0, 4, 7, 10, 13, 16, 19, 22, 24];

export interface RankEstimate {
  tier: RankTier;
  tierIndex: number;
  sub: 1 | 2 | 3;
  metric: number;
  nextTier: RankTier | null;
  toNext: number;
  progress: number;
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

export function estimateRank(result: RunResult): RankEstimate {
  const metric = metricFor(result);
  const thresholds = thresholdsFor(result.mode);

  let tierIndex = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (metric >= thresholds[i]!) {
      tierIndex = i;
      break;
    }
  }
  tierIndex = Math.max(0, Math.min(8, tierIndex));

  const floor = thresholds[tierIndex]!;
  const ceiling = thresholds[tierIndex + 1] ?? floor * 1.25;
  const span = ceiling - floor;
  const progress = span > 0 ? Math.max(0, Math.min(1, (metric - floor) / span)) : 1;

  const sub = tierIndex === 8 ? 3 : (Math.min(3, Math.max(1, Math.floor(progress * 3) + 1)) as 1 | 2 | 3);

  const nextTier = tierIndex < 8 ? RANKS[tierIndex + 1]! : null;
  const toNext = nextTier ? Math.max(0, ceiling - metric) : 0;

  return {
    tier: RANKS[tierIndex]!,
    tierIndex,
    sub,
    metric,
    nextTier,
    toNext,
    progress,
  };
}
