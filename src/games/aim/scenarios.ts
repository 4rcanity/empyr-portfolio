export type ScenarioId = 'gridshot' | 'flick' | 'tracking' | 'strafe' | 'micro' | 'switch' | 'spray';

/** How a run is scored. Click drills count shots, track drills count seconds. */
export type ScoreMode = 'click' | 'track' | 'spray';

export interface ScenarioDef {
  id: ScenarioId;
  mode: ScoreMode;
  /** Targets alive at once. */
  targets: number;
  /** Angular radius of a target, in degrees. */
  size: number;
  /** Half-width of the spawn box, in degrees. Height is 55% of this. */
  area: number;
  /** Target travel speed, degrees per second. 0 for static drills. */
  speed: number;
  /** Default run length in seconds. */
  duration: number;
  /** Seconds between direction changes for evasive targets. */
  turnEvery: number;
}

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  gridshot: { id: 'gridshot', mode: 'click', targets: 6, size: 1.5, area: 22, speed: 0, duration: 60, turnEvery: 0 },
  flick: { id: 'flick', mode: 'click', targets: 1, size: 1.4, area: 26, speed: 0, duration: 60, turnEvery: 0 },
  tracking: { id: 'tracking', mode: 'track', targets: 1, size: 2.2, area: 20, speed: 14, duration: 60, turnEvery: 2.2 },
  strafe: { id: 'strafe', mode: 'track', targets: 1, size: 2.4, area: 18, speed: 22, duration: 60, turnEvery: 0.45 },
  micro: { id: 'micro', mode: 'click', targets: 4, size: 0.55, area: 9, speed: 0, duration: 60, turnEvery: 0 },
  switch: { id: 'switch', mode: 'click', targets: 5, size: 1.6, area: 24, speed: 8, duration: 60, turnEvery: 1.6 },
  spray: { id: 'spray', mode: 'spray', targets: 1, size: 2.0, area: 8, speed: 0, duration: 60, turnEvery: 0 },
};

export const SCENARIO_ORDER: ScenarioId[] = [
  'gridshot',
  'flick',
  'tracking',
  'strafe',
  'micro',
  'switch',
  'spray',
];

export interface RunConfig {
  duration: number;
  size: number;
  targets: number;
  area: number;
  /** Target travel speed, degrees per second. 0 = static. Lets any drill —
      including normally-static click drills — be turned into a moving one. */
  speed: number;
  /** Seconds between direction changes while moving. 0 = bounce off the
      spawn box edges only, never picking a fresh heading early. */
  turnEvery: number;
}

export function defaultConfig(id: ScenarioId): RunConfig {
  const def = SCENARIOS[id];
  return {
    duration: def.duration,
    size: def.size,
    targets: def.targets,
    area: def.area,
    speed: def.speed,
    turnEvery: def.turnEvery,
  };
}

export const LIMITS = {
  duration: { min: 10, max: 300, step: 5 },
  size: { min: 0.25, max: 6, step: 0.05 },
  targets: { min: 1, max: 16, step: 1 },
  area: { min: 4, max: 45, step: 1 },
  speed: { min: 0, max: 60, step: 1 },
  turnEvery: { min: 0, max: 6, step: 0.1 },
};

export function clampConfig(config: RunConfig): RunConfig {
  const fit = (value: number, key: keyof typeof LIMITS) =>
    Math.min(LIMITS[key].max, Math.max(LIMITS[key].min, Number.isFinite(value) ? value : LIMITS[key].min));
  return {
    duration: Math.round(fit(config.duration, 'duration')),
    size: Math.round(fit(config.size, 'size') * 100) / 100,
    targets: Math.round(fit(config.targets, 'targets')),
    area: Math.round(fit(config.area, 'area')),
    speed: Math.round(fit(config.speed, 'speed')),
    turnEvery: Math.round(fit(config.turnEvery, 'turnEvery') * 10) / 10,
  };
}
