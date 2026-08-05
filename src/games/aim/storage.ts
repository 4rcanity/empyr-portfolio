/* Everything this trainer knows lives in localStorage. No server, by design. */

import type { Crosshair, RunResult } from './engine';
import { DEFAULT_CROSSHAIR } from './engine';
import { clampConfig, defaultConfig, type RunConfig, type ScenarioId } from './scenarios';
import type { GameId } from './sens';

const KEY = 'empyr.aim.v1';
const MAX_HISTORY = 80;

export interface SensSettings {
  source: GameId;
  sens: number;
  dpi: number;
  fov: number;
  invertY: boolean;
}

export interface Vault {
  sens: SensSettings;
  crosshair: Crosshair;
  configs: Partial<Record<ScenarioId, RunConfig>>;
  history: RunResult[];
}

export const DEFAULT_SENS: SensSettings = {
  source: 'valorant',
  sens: 0.4,
  dpi: 800,
  fov: 103,
  invertY: false,
};

export function emptyVault(): Vault {
  return { sens: { ...DEFAULT_SENS }, crosshair: { ...DEFAULT_CROSSHAIR }, configs: {}, history: [] };
}

export function loadVault(): Vault {
  const base = emptyVault();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Vault>;
    return {
      sens: { ...base.sens, ...(parsed.sens ?? {}) },
      crosshair: { ...base.crosshair, ...(parsed.crosshair ?? {}) },
      configs: parsed.configs ?? {},
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : [],
    };
  } catch {
    return base;
  }
}

export function saveVault(vault: Vault) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...vault, history: vault.history.slice(0, MAX_HISTORY) }),
    );
  } catch {
    /* quota or private mode — the trainer still works, just forgetfully. */
  }
}

export function configFor(vault: Vault, id: ScenarioId): RunConfig {
  return clampConfig(vault.configs[id] ?? defaultConfig(id));
}

export function runsFor(vault: Vault, id: ScenarioId): RunResult[] {
  return vault.history.filter((run) => run.scenario === id);
}

export function personalBest(vault: Vault, id: ScenarioId): RunResult | null {
  let best: RunResult | null = null;
  for (const run of runsFor(vault, id)) if (!best || run.score > best.score) best = run;
  return best;
}

/** Mean score across the last `count` runs of a scenario, excluding none. */
export function recentAverage(vault: Vault, id: ScenarioId, count = 5): number {
  const runs = runsFor(vault, id).slice(0, count);
  if (!runs.length) return 0;
  return runs.reduce((total, run) => total + run.score, 0) / runs.length;
}
