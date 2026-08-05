/* Everything this trainer knows lives in localStorage. No server, by design. */

import type { Crosshair, RunResult, TargetStyle } from './engine';
import { DEFAULT_CROSSHAIR, DEFAULT_TARGET_STYLE } from './engine';
import { clampConfig, defaultConfig, type RunConfig, type ScenarioId, type ScoreMode } from './scenarios';
import type { GameId } from './sens';

const KEY = 'empyr.aim.v1';
const MAX_HISTORY = 80;
const MAX_CUSTOM_DRILLS = 60;

export interface SensSettings {
  source: GameId;
  sens: number;
  dpi: number;
  fov: number;
  invertY: boolean;
}

export interface AudioSettings {
  enabled: boolean;
  /** 0..1 */
  volume: number;
}

/** A user-authored drill. Unlike the seven builtins, its mode, speed and
    turn cadence are all first-class fields rather than baked into a static
    table — the engine reads every one of them straight off `RunConfig`. */
export interface CustomDrill {
  id: string;
  name: string;
  mode: ScoreMode;
  createdAt: number;
  config: RunConfig;
}

export interface Vault {
  sens: SensSettings;
  crosshair: Crosshair;
  targetStyle: TargetStyle;
  audio: AudioSettings;
  configs: Partial<Record<ScenarioId, RunConfig>>;
  customDrills: CustomDrill[];
  history: RunResult[];
}

export const DEFAULT_SENS: SensSettings = {
  source: 'valorant',
  sens: 0.4,
  dpi: 800,
  fov: 103,
  invertY: false,
};

export const DEFAULT_AUDIO: AudioSettings = {
  enabled: true,
  volume: 0.6,
};

export function emptyVault(): Vault {
  return {
    sens: { ...DEFAULT_SENS },
    crosshair: { ...DEFAULT_CROSSHAIR },
    targetStyle: { ...DEFAULT_TARGET_STYLE },
    audio: { ...DEFAULT_AUDIO },
    configs: {},
    customDrills: [],
    history: [],
  };
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
      targetStyle: { ...base.targetStyle, ...(parsed.targetStyle ?? {}) },
      audio: { ...base.audio, ...(parsed.audio ?? {}) },
      configs: parsed.configs ?? {},
      customDrills: Array.isArray(parsed.customDrills) ? parsed.customDrills.slice(0, MAX_CUSTOM_DRILLS) : [],
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

/** Every run's stable identity, whether or not it predates `drillKey`. */
function keyOf(run: RunResult): string {
  return run.drillKey ?? run.scenario;
}

/** `key` is a ScenarioId for builtins or a CustomDrill's id — both are just
    strings here, so history/PB lookups don't care which kind they're given. */
export function runsFor(vault: Vault, key: string): RunResult[] {
  return vault.history.filter((run) => keyOf(run) === key);
}

export function personalBest(vault: Vault, key: string): RunResult | null {
  let best: RunResult | null = null;
  for (const run of runsFor(vault, key)) if (!best || run.score > best.score) best = run;
  return best;
}

/** Mean score across the last `count` runs of a drill, excluding none. */
export function recentAverage(vault: Vault, key: string, count = 5): number {
  const runs = runsFor(vault, key).slice(0, count);
  if (!runs.length) return 0;
  return runs.reduce((total, run) => total + run.score, 0) / runs.length;
}

export function findCustomDrill(vault: Vault, id: string): CustomDrill | null {
  return vault.customDrills.find((drill) => drill.id === id) ?? null;
}

export function newCustomDrillId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
