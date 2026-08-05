/* The drill simulation.

   Targets live on a sphere around the player as (yaw, pitch) angles, exactly
   like a real FPS, so the configured cm/360 translates into the same wrist
   movement it would in game. The camera is turned by raw mouse counts times
   `yaw * sens` degrees; the crosshair never leaves the centre of the screen.

   The hot path (step/render) allocates nothing: targets come from a fixed pool
   and every sample buffer is a preallocated typed array. */

import { SCENARIOS, type RunConfig, type ScenarioId, type ScoreMode } from './scenarios';

const DEG = Math.PI / 180;
const MAX_TARGETS = 16;
const MAX_SHOTS = 4096;
const MAX_KILLS = 2048;
const MAX_SAMPLES = 1500;
/** Simulation sub-step. Anything the loop hands us is chopped into these. */
const STEP_MS = 4;
const SAMPLE_MS = 250;

/** VALORANT Vandal-flavoured recoil: hard vertical climb, then a lateral sway. */
const SPRAY_V = [
  0, 1.15, 1.35, 1.4, 1.35, 1.2, 1.02, 0.88, 0.74, 0.63, 0.55, 0.49, 0.44, 0.4, 0.36, 0.33, 0.31,
  0.29, 0.27, 0.26, 0.25, 0.24, 0.23, 0.22, 0.21,
];
const SPRAY_H = [
  0, 0.04, -0.06, 0.09, 0.16, 0.36, 0.62, 0.78, 0.52, 0.11, -0.36, -0.72, -0.88, -0.62, -0.21, 0.31,
  0.72, 0.92, 0.61, 0.12, -0.42, -0.82, -0.94, -0.52, 0.02,
];
export const SPRAY_MAG = SPRAY_V.length;
const SPRAY_INTERVAL = 1 / 9.75;
const RECOIL_RECOVER = 6.5;

export interface Crosshair {
  colour: string;
  thickness: number;
  gap: number;
  length: number;
  dot: boolean;
  outline: boolean;
}

export const DEFAULT_CROSSHAIR: Crosshair = {
  colour: '#00ff9c',
  thickness: 2,
  gap: 4,
  length: 8,
  dot: true,
  outline: true,
};

export type TargetShape = 'circle' | 'square' | 'diamond' | 'hexagon';

export interface TargetStyle {
  shape: TargetShape;
  fill: string;
  outline: boolean;
  outlineColour: string;
  /** Fill/outline used for an inactive (unlit) target, e.g. in target-switch. */
  dimFill: string;
  dimOutline: string;
}

export const DEFAULT_TARGET_STYLE: TargetStyle = {
  shape: 'circle',
  fill: 'rgba(255,70,85,0.9)',
  outline: true,
  outlineColour: 'rgba(255,190,195,0.95)',
  dimFill: 'rgba(120,140,160,0.16)',
  dimOutline: 'rgba(150,170,190,0.35)',
};

/** Fired at the exact instant of a shot outcome. The engine stays audio-free
    and fully headless-testable; callers (the React layer) hang sound effects
    off this instead. */
export type EngineEvent = 'shot' | 'hit' | 'miss' | 'kill';

export interface EngineSens {
  /** Degrees of yaw per mouse count at sensitivity 1 (engine constant). */
  yaw: number;
  sens: number;
  dpi: number;
  /** Horizontal field of view in degrees. */
  fov: number;
  invertY: boolean;
}

interface Target {
  live: boolean;
  yaw: number;
  pitch: number;
  vYaw: number;
  vPitch: number;
  radius: number;
  bornAt: number;
  activeAt: number;
  active: boolean;
  turnIn: number;
  /** Angular offset from the crosshair the moment this target appeared. */
  originYaw: number;
  originPitch: number;
  engaged: boolean;
  sx: number;
  sy: number;
  sr: number;
  onScreen: boolean;
}

export interface LiveStats {
  elapsed: number;
  remaining: number;
  score: number;
  hits: number;
  misses: number;
  shots: number;
  accuracy: number;
  kills: number;
  onTarget: number;
  ammo: number;
  running: boolean;
}

export interface ShotSample {
  t: number;
  /** Offset from target centre in target-radius units. */
  dx: number;
  dy: number;
  hit: boolean;
}

export interface TimelinePoint {
  t: number;
  score: number;
  accuracy: number;
}

export interface RunResult {
  scenario: ScenarioId | 'custom';
  /** Stable identity for PB/history lookups: the ScenarioId for builtins, or
      the caller-supplied custom drill id. Older stored runs predate this
      field, so readers should fall back to `scenario`. */
  drillKey?: string;
  /** Name snapshot for a custom drill, taken at run time so history still
      reads correctly even if the drill is later renamed or deleted. */
  customLabel?: string;
  mode: ScoreMode;
  config: RunConfig;
  sens: EngineSens;
  startedAt: number;
  elapsed: number;
  score: number;
  hits: number;
  misses: number;
  shots: number;
  accuracy: number;
  kills: number;
  kps: number;
  ttks: number[];
  avgTtk: number;
  medTtk: number;
  reactions: number[];
  avgReaction: number;
  /** Signed degrees at the first shot of a flick. Positive = went past it. */
  flickError: number[];
  avgOvershoot: number;
  avgUndershoot: number;
  overshootRate: number;
  onTarget: number;
  trackTime: number;
  onTargetPct: number;
  sprayGroup: number;
  shotSamples: ShotSample[];
  timeline: TimelinePoint[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

export class AimEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 1;
  private height = 1;
  private dpr = 1;

  private pool: Target[] = [];
  private scenario: ScenarioId | 'custom' = 'gridshot';
  private mode: ScoreMode = 'click';
  private config: RunConfig = { duration: 60, size: 1.5, targets: 6, area: 22, speed: 0, turnEvery: 0 };
  private sens: EngineSens = { yaw: 0.07, sens: 0.4, dpi: 800, fov: 103, invertY: false };
  private crosshair: Crosshair = DEFAULT_CROSSHAIR;
  private targetStyle: TargetStyle = DEFAULT_TARGET_STYLE;

  /** Optional hook the React layer wires up for sound effects. No-op by
      default so headless tests never touch the Audio API. */
  onEvent: ((type: EngineEvent) => void) | null = null;

  private rng = mulberry32(1);
  private camYaw = 0;
  private camPitch = 0;
  private recoilYaw = 0;
  private recoilPitch = 0;

  running = false;
  private startedAt = 0;
  private elapsed = 0;
  private nextSample = 0;
  private firing = false;
  private sprayIndex = 0;
  private sprayClock = 0;
  private sprayGroups: number[] = [];

  private score = 0;
  private hits = 0;
  private misses = 0;
  private shots = 0;
  private kills = 0;
  private onTarget = 0;
  private trackTime = 0;

  private shotT = new Float32Array(MAX_SHOTS);
  private shotX = new Float32Array(MAX_SHOTS);
  private shotY = new Float32Array(MAX_SHOTS);
  private shotHit = new Uint8Array(MAX_SHOTS);
  private shotCount = 0;

  private ttk = new Float32Array(MAX_KILLS);
  private ttkCount = 0;
  private reaction = new Float32Array(MAX_KILLS);
  private reactionCount = 0;
  private flick = new Float32Array(MAX_KILLS);
  private flickCount = 0;

  private sampleT = new Float32Array(MAX_SAMPLES);
  private sampleScore = new Float32Array(MAX_SAMPLES);
  private sampleAcc = new Float32Array(MAX_SAMPLES);
  private sampleCount = 0;

  /** Transient hit flashes, also pooled. */
  private flashX = new Float32Array(24);
  private flashY = new Float32Array(24);
  private flashLife = new Float32Array(24);
  private flashHit = new Uint8Array(24);
  private flashHead = 0;

  constructor() {
    for (let i = 0; i < MAX_TARGETS; i++) {
      this.pool.push({
        live: false,
        yaw: 0,
        pitch: 0,
        vYaw: 0,
        vPitch: 0,
        radius: 0,
        bornAt: 0,
        activeAt: 0,
        active: false,
        turnIn: 0,
        originYaw: 0,
        originPitch: 0,
        engaged: false,
        sx: 0,
        sy: 0,
        sr: 0,
        onScreen: false,
      });
    }
  }

  attach(canvas: HTMLCanvasElement | null) {
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = dpr;
  }

  setCrosshair(crosshair: Crosshair) {
    this.crosshair = crosshair;
  }

  setTargetStyle(style: TargetStyle) {
    this.targetStyle = style;
  }

  setSens(sens: EngineSens) {
    this.sens = sens;
  }

  get focal(): number {
    return this.width / 2 / Math.tan((this.sens.fov * DEG) / 2);
  }

  /** `customMode` is required (and only meaningful) when `scenario` is
      `'custom'` — it has no static entry in SCENARIOS to read a mode from.
      Speed and direction-change cadence always come from `config`, not the
      scenario table, so both builtin overrides and fully custom drills flow
      through the same code path. */
  start(scenario: ScenarioId | 'custom', config: RunConfig, sens: EngineSens, seed = Date.now() & 0xffff, customMode?: ScoreMode) {
    this.scenario = scenario;
    this.mode = scenario === 'custom' ? (customMode ?? 'click') : SCENARIOS[scenario].mode;
    this.config = config;
    this.sens = sens;
    this.rng = mulberry32(seed || 1);

    this.camYaw = 0;
    this.camPitch = 0;
    this.recoilYaw = 0;
    this.recoilPitch = 0;
    this.elapsed = 0;
    this.nextSample = 0;
    this.startedAt = Date.now();
    this.firing = false;
    this.sprayIndex = 0;
    this.sprayClock = 0;
    this.sprayGroups = [];

    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.shots = 0;
    this.kills = 0;
    this.onTarget = 0;
    this.trackTime = 0;
    this.shotCount = 0;
    this.ttkCount = 0;
    this.reactionCount = 0;
    this.flickCount = 0;
    this.sampleCount = 0;
    this.flashLife.fill(0);

    for (const target of this.pool) target.live = false;
    const count = Math.min(MAX_TARGETS, config.targets);
    for (let i = 0; i < count; i++) this.spawn(i);
    if (scenario === 'switch') this.pickActive();

    this.running = true;
  }

  stop() {
    this.running = false;
    this.firing = false;
  }

  private spawn(index: number) {
    const target = this.pool[index]!;
    const areaX = this.config.area;
    const areaY = this.config.area * 0.55;
    target.live = true;
    target.yaw = (this.rng() * 2 - 1) * areaX * DEG;
    target.pitch = (this.rng() * 2 - 1) * areaY * DEG;
    target.radius = this.config.size * DEG;
    target.bornAt = this.elapsed;
    target.activeAt = this.elapsed;
    target.engaged = false;
    target.originYaw = target.yaw - this.camYaw;
    target.originPitch = target.pitch - this.camPitch;
    target.active = this.scenario !== 'switch';
    target.turnIn = this.config.turnEvery;
    if (this.config.speed > 0) {
      const angle = this.rng() * Math.PI * 2;
      target.vYaw = Math.cos(angle) * this.config.speed * DEG;
      target.vPitch = Math.sin(angle) * this.config.speed * 0.45 * DEG;
    } else {
      target.vYaw = 0;
      target.vPitch = 0;
    }
  }

  private pickActive() {
    const live: number[] = [];
    for (let i = 0; i < this.pool.length; i++) if (this.pool[i]!.live) live.push(i);
    if (!live.length) return;
    for (const i of live) this.pool[i]!.active = false;
    const pick = this.pool[live[Math.floor(this.rng() * live.length)]!]!;
    pick.active = true;
    pick.activeAt = this.elapsed;
    pick.engaged = false;
    pick.originYaw = pick.yaw - this.camYaw;
    pick.originPitch = pick.pitch - this.camPitch;
  }

  /** Feed raw mouse counts. This is the only place sensitivity is applied. */
  look(dx: number, dy: number) {
    if (!this.running) return;
    const perCount = this.sens.yaw * this.sens.sens * DEG;
    this.camYaw += dx * perCount;
    this.camPitch += (this.sens.invertY ? dy : -dy) * perCount;
    const limit = (this.config.area + 30) * DEG;
    if (this.camYaw > limit) this.camYaw = limit;
    if (this.camYaw < -limit) this.camYaw = -limit;
    const vLimit = 70 * DEG;
    if (this.camPitch > vLimit) this.camPitch = vLimit;
    if (this.camPitch < -vLimit) this.camPitch = -vLimit;
  }

  down() {
    if (!this.running) return;
    this.firing = true;
    if (this.mode === 'click') this.fire();
    else if (this.mode === 'spray') {
      this.sprayClock = 0;
      this.fire();
    }
  }

  up() {
    this.firing = false;
    if (this.mode === 'spray' && this.sprayIndex > 0) this.resetSpray();
  }

  private resetSpray() {
    this.sprayIndex = 0;
    this.recoilYaw = 0;
    this.recoilPitch = 0;
  }

  private get aimYaw() {
    return this.camYaw + this.recoilYaw;
  }

  private get aimPitch() {
    return this.camPitch + this.recoilPitch;
  }

  /** Project a target into screen space using the current aim direction. */
  private project(target: Target) {
    const cy = Math.cos(this.aimYaw);
    const sy = Math.sin(this.aimYaw);
    const cp = Math.cos(this.aimPitch);
    const sp = Math.sin(this.aimPitch);
    const cb = Math.cos(target.pitch);
    const dx = cb * Math.sin(target.yaw);
    const dy = Math.sin(target.pitch);
    const dz = cb * Math.cos(target.yaw);

    const x1 = dx * cy - dz * sy;
    const z1 = dx * sy + dz * cy;
    const y2 = dy * cp - z1 * sp;
    const z2 = dy * sp + z1 * cp;

    if (z2 < 0.05) {
      target.onScreen = false;
      return;
    }
    const focal = this.focal;
    target.sx = this.width / 2 + (focal * x1) / z2;
    target.sy = this.height / 2 - (focal * y2) / z2;
    target.sr = (focal * Math.tan(target.radius)) / z2;
    target.onScreen = true;
  }

  private nearest(): Target | null {
    let best: Target | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (const target of this.pool) {
      if (!target.live || !target.onScreen) continue;
      const dx = target.sx - cx;
      const dy = target.sy - cy;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    }
    return best;
  }

  private recordShot(t: number, dx: number, dy: number, hit: boolean) {
    if (this.shotCount < MAX_SHOTS) {
      this.shotT[this.shotCount] = t;
      this.shotX[this.shotCount] = dx;
      this.shotY[this.shotCount] = dy;
      this.shotHit[this.shotCount] = hit ? 1 : 0;
      this.shotCount++;
    }
    const slot = this.flashHead++ % this.flashLife.length;
    this.flashX[slot] = this.width / 2;
    this.flashY[slot] = this.height / 2;
    this.flashLife[slot] = 0.35;
    this.flashHit[slot] = hit ? 1 : 0;
  }

  private fire() {
    if (!this.running) return;
    for (const target of this.pool) if (target.live) this.project(target);

    if (this.mode === 'spray') {
      this.fireSpray();
      return;
    }

    this.shots++;
    this.onEvent?.('shot');
    const cx = this.width / 2;
    const cy = this.height / 2;
    let struck: Target | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const target of this.pool) {
      if (!target.live || !target.onScreen) continue;
      const dx = target.sx - cx;
      const dy = target.sy - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= target.sr && dist < bestDist) {
        bestDist = dist;
        struck = target;
      }
    }

    const reference = struck ?? this.nearest();
    if (reference && reference.sr > 0) {
      this.recordShot(
        this.elapsed,
        (cx - reference.sx) / reference.sr,
        (cy - reference.sy) / reference.sr,
        struck !== null && (struck.active || this.scenario !== 'switch'),
      );
      // Overshoot is a property of the first shot, hit or miss.
      this.registerFirstContact(reference);
    } else {
      this.recordShot(this.elapsed, 0, 0, false);
    }

    if (!struck || (this.scenario === 'switch' && !struck.active)) {
      this.misses++;
      this.score = Math.max(0, this.score - 25);
      this.onEvent?.('miss');
      return;
    }

    this.hits++;
    this.kills++;
    this.onEvent?.('hit');
    this.onEvent?.('kill');
    const life = this.elapsed - (this.scenario === 'switch' ? struck.activeAt : struck.bornAt);
    if (this.ttkCount < MAX_KILLS) this.ttk[this.ttkCount++] = life;
    if ((this.scenario === 'flick' || this.scenario === 'switch') && this.reactionCount < MAX_KILLS) {
      this.reaction[this.reactionCount++] = life;
    }

    const precision = 1 - Math.min(1, bestDist / struck.sr);
    const speed = Math.max(0, 1 - Math.max(0, life - 250) / 750);
    this.score += Math.round(100 + precision * 50 + speed * 50);

    const index = this.pool.indexOf(struck);
    this.spawn(index);
    if (this.scenario === 'switch') this.pickActive();
  }

  /** Overshoot bookkeeping: only meaningful for the first shot at a target. */
  private registerFirstContact(target: Target) {
    if (target.engaged) return;
    target.engaged = true;
    if (this.scenario !== 'flick') return;
    const d0 = Math.hypot(target.originYaw, target.originPitch);
    if (d0 < 1e-6) return;
    const rY = target.yaw - this.aimYaw;
    const rP = target.pitch - this.aimPitch;
    const along = (rY * target.originYaw + rP * target.originPitch) / d0;
    if (this.flickCount < MAX_KILLS) this.flick[this.flickCount++] = -along / DEG;
  }

  private fireSpray() {
    if (this.sprayIndex >= SPRAY_MAG) return;
    this.shots++;
    this.onEvent?.('shot');
    const cx = this.width / 2;
    const cy = this.height / 2;
    const target = this.pool.find((t) => t.live) ?? null;
    let hit = false;
    if (target && target.onScreen && target.sr > 0) {
      const dx = cx - target.sx;
      const dy = cy - target.sy;
      const dist = Math.hypot(dx, dy);
      hit = dist <= target.sr;
      this.recordShot(this.elapsed, dx / target.sr, dy / target.sr, hit);
      this.sprayGroups.push(dist / target.sr);
      this.score += Math.round(Math.max(0, 100 * (1 - dist / (3 * target.sr))));
    } else {
      this.recordShot(this.elapsed, 0, 0, false);
    }
    if (hit) {
      this.hits++;
      this.onEvent?.('hit');
    } else {
      this.misses++;
      this.onEvent?.('miss');
    }

    const shot = this.sprayIndex;
    this.recoilPitch += (SPRAY_V[shot] ?? 0.2) * DEG;
    this.recoilYaw += (SPRAY_H[shot] ?? 0) * DEG;
    this.sprayIndex++;
    if (this.sprayIndex >= SPRAY_MAG) this.firing = false;
  }

  /** Advance the simulation. Frame-rate independent: dt is chopped into
      fixed sub-steps so physics and scoring never depend on frame timing. */
  update(dtMs: number) {
    if (!this.running) return;
    let left = Math.min(10_000, Math.max(0, dtMs));
    while (left > 0) {
      const step = Math.min(STEP_MS, left);
      this.step(step / 1000);
      left -= step;
      if (!this.running) break;
    }
  }

  private step(dt: number) {
    this.elapsed += dt * 1000;
    const areaX = this.config.area * DEG;
    const areaY = this.config.area * 0.55 * DEG;

    for (const target of this.pool) {
      if (!target.live) continue;
      if (target.vYaw !== 0 || target.vPitch !== 0) {
        target.yaw += target.vYaw * dt;
        target.pitch += target.vPitch * dt;
        if (target.yaw > areaX || target.yaw < -areaX) {
          target.yaw = Math.max(-areaX, Math.min(areaX, target.yaw));
          target.vYaw = -target.vYaw;
        }
        if (target.pitch > areaY || target.pitch < -areaY) {
          target.pitch = Math.max(-areaY, Math.min(areaY, target.pitch));
          target.vPitch = -target.vPitch;
        }
        if (this.config.turnEvery > 0) {
          target.turnIn -= dt;
          if (target.turnIn <= 0) {
            target.turnIn = this.config.turnEvery * (0.55 + this.rng() * 0.9);
            const angle = this.rng() * Math.PI * 2;
            target.vYaw = Math.cos(angle) * this.config.speed * DEG;
            target.vPitch = Math.sin(angle) * this.config.speed * 0.45 * DEG;
          }
        }
      }
      this.project(target);
    }

    if (this.mode === 'track') {
      this.trackTime += dt;
      if (this.firing) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        for (const target of this.pool) {
          if (!target.live || !target.onScreen) continue;
          const dist = Math.hypot(target.sx - cx, target.sy - cy);
          if (dist <= target.sr) {
            this.onTarget += dt;
            const precision = 1 - Math.min(1, dist / target.sr);
            this.score += 100 * dt * (0.55 + 0.45 * precision);
            break;
          }
        }
      }
    }

    if (this.mode === 'spray') {
      if (this.firing && this.sprayIndex < SPRAY_MAG) {
        this.sprayClock += dt;
        while (this.sprayClock >= SPRAY_INTERVAL && this.sprayIndex < SPRAY_MAG) {
          this.sprayClock -= SPRAY_INTERVAL;
          this.fireSpray();
        }
      } else if (!this.firing) {
        const decay = Math.min(1, RECOIL_RECOVER * dt);
        this.recoilPitch -= this.recoilPitch * decay;
        this.recoilYaw -= this.recoilYaw * decay;
      }
    }

    for (let i = 0; i < this.flashLife.length; i++) {
      if (this.flashLife[i]! > 0) this.flashLife[i] = Math.max(0, this.flashLife[i]! - dt);
    }

    if (this.elapsed >= this.nextSample && this.sampleCount < MAX_SAMPLES) {
      this.sampleT[this.sampleCount] = this.elapsed;
      this.sampleScore[this.sampleCount] = this.score;
      this.sampleAcc[this.sampleCount] = this.shots ? this.hits / this.shots : 0;
      this.sampleCount++;
      this.nextSample += SAMPLE_MS;
    }

    if (this.elapsed >= this.config.duration * 1000) this.stop();
  }

  stats(): LiveStats {
    return {
      elapsed: this.elapsed,
      remaining: Math.max(0, this.config.duration * 1000 - this.elapsed),
      score: Math.round(this.score),
      hits: this.hits,
      misses: this.misses,
      shots: this.shots,
      accuracy: this.shots ? this.hits / this.shots : 0,
      kills: this.kills,
      onTarget: this.trackTime ? this.onTarget / this.trackTime : 0,
      ammo: SPRAY_MAG - this.sprayIndex,
      running: this.running,
    };
  }

  result(): RunResult {
    const ttks = Array.from(this.ttk.subarray(0, this.ttkCount));
    const reactions = Array.from(this.reaction.subarray(0, this.reactionCount));
    const flickError = Array.from(this.flick.subarray(0, this.flickCount));
    const over = flickError.filter((v) => v > 0);
    const under = flickError.filter((v) => v <= 0).map((v) => -v);

    const shotSamples: ShotSample[] = [];
    for (let i = 0; i < this.shotCount; i++) {
      shotSamples.push({
        t: this.shotT[i]!,
        dx: this.shotX[i]!,
        dy: this.shotY[i]!,
        hit: this.shotHit[i] === 1,
      });
    }
    const timeline: TimelinePoint[] = [];
    for (let i = 0; i < this.sampleCount; i++) {
      timeline.push({ t: this.sampleT[i]!, score: this.sampleScore[i]!, accuracy: this.sampleAcc[i]! });
    }

    const seconds = Math.max(0.001, this.elapsed / 1000);
    const accuracy = this.shots ? this.hits / this.shots : 0;
    // Microshot is explicitly accuracy-weighted: spraying it costs you.
    const score = Math.round(this.scenario === 'micro' ? this.score * accuracy : this.score);
    return {
      scenario: this.scenario,
      drillKey: this.scenario === 'custom' ? undefined : this.scenario,
      mode: this.mode,
      config: this.config,
      sens: this.sens,
      startedAt: this.startedAt,
      elapsed: this.elapsed,
      score,
      hits: this.hits,
      misses: this.misses,
      shots: this.shots,
      accuracy,
      kills: this.kills,
      kps: this.kills / seconds,
      ttks,
      avgTtk: mean(ttks),
      medTtk: median(ttks),
      reactions,
      avgReaction: mean(reactions),
      flickError,
      avgOvershoot: mean(over),
      avgUndershoot: mean(under),
      overshootRate: flickError.length ? over.length / flickError.length : 0,
      onTarget: this.onTarget,
      trackTime: this.trackTime,
      onTargetPct: this.trackTime ? this.onTarget / this.trackTime : 0,
      sprayGroup: mean(this.sprayGroups),
      shotSamples,
      timeline,
    };
  }

  /* ---- test hooks ------------------------------------------------------ */

  /** Angular position of each live target, in degrees. */
  targets(): { yaw: number; pitch: number; radius: number; active: boolean }[] {
    return this.pool
      .filter((t) => t.live)
      .map((t) => ({
        yaw: t.yaw / DEG,
        pitch: t.pitch / DEG,
        radius: t.radius / DEG,
        active: t.active,
      }));
  }

  camera() {
    return { yaw: this.camYaw / DEG, pitch: this.camPitch / DEG };
  }

  /** Snap the camera onto a live target. Used by the headless test harness,
      where pointer lock cannot engage. */
  snapTo(index = -1, offsetYaw = 0, offsetPitch = 0) {
    const live = this.pool.filter((t) => t.live);
    const target =
      index >= 0
        ? live[index]
        : this.scenario === 'switch'
          ? (live.find((t) => t.active) ?? live[0])
          : live[0];
    if (!target) return false;
    this.camYaw = target.yaw + offsetYaw * DEG - this.recoilYaw;
    this.camPitch = target.pitch + offsetPitch * DEG - this.recoilPitch;
    return true;
  }

  /* ---- rendering ------------------------------------------------------- */

  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0d1116';
    ctx.fillRect(0, 0, w, h);
    this.drawRange(ctx, w, h);

    for (const target of this.pool) {
      if (!target.live || !target.onScreen) continue;
      if (target.sr < 0.4) continue;
      const dim = this.scenario === 'switch' && !target.active;
      this.tracePath(ctx, target.sx, target.sy, target.sr);
      ctx.fillStyle = dim ? this.targetStyle.dimFill : this.targetStyle.fill;
      ctx.fill();
      if (this.targetStyle.outline) {
        ctx.lineWidth = Math.max(1, target.sr * 0.08);
        ctx.strokeStyle = dim ? this.targetStyle.dimOutline : this.targetStyle.outlineColour;
        ctx.stroke();
      }
      if (!dim && target.sr > 6) {
        this.tracePath(ctx, target.sx, target.sy, target.sr * 0.22);
        ctx.fillStyle = 'rgba(13,17,22,0.85)';
        ctx.fill();
      }
    }

    for (let i = 0; i < this.flashLife.length; i++) {
      const life = this.flashLife[i]!;
      if (life <= 0) continue;
      const alpha = life / 0.35;
      ctx.beginPath();
      ctx.arc(this.flashX[i]!, this.flashY[i]!, 6 + (1 - alpha) * 16, 0, Math.PI * 2);
      ctx.strokeStyle = this.flashHit[i] ? `rgba(0,255,156,${alpha * 0.8})` : `rgba(255,70,85,${alpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    this.drawCrosshair(ctx, w / 2, h / 2);
  }

  /** Traces one of the four target shapes into the current path, centred at
      (cx, cy) with `r` as the enclosing radius. Caller fills/strokes it. */
  private tracePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    ctx.beginPath();
    switch (this.targetStyle.shape) {
      case 'square': {
        const s = r * 1.15;
        ctx.rect(cx - s / 2, cy - s / 2, s, s);
        break;
      }
      case 'diamond':
        ctx.moveTo(cx, cy - r * 1.2);
        ctx.lineTo(cx + r * 1.2, cy);
        ctx.lineTo(cx, cy + r * 1.2);
        ctx.lineTo(cx - r * 1.2, cy);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case 'circle':
      default:
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        break;
    }
  }

  private drawRange(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const focal = this.focal;
    ctx.save();
    ctx.strokeStyle = 'rgba(90,120,140,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let deg = -60; deg <= 60; deg += 10) {
      const x = w / 2 + focal * Math.tan(deg * DEG - this.aimYaw);
      if (x < -50 || x > w + 50) continue;
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
    }
    for (let deg = -40; deg <= 40; deg += 10) {
      const y = h / 2 - focal * Math.tan(deg * DEG - this.aimPitch);
      if (y < -50 || y > h + 50) continue;
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(w, Math.round(y) + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const { colour, thickness, gap, length, dot, outline } = this.crosshair;
    ctx.save();
    ctx.lineCap = 'butt';
    const arms: [number, number, number, number][] = [
      [x, y - gap - length, x, y - gap],
      [x, y + gap, x, y + gap + length],
      [x - gap - length, y, x - gap, y],
      [x + gap, y, x + gap + length, y],
    ];
    if (outline) {
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = thickness + 2;
      ctx.beginPath();
      for (const [ax, ay, bx, by] of arms) {
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      if (dot) {
        ctx.beginPath();
        ctx.arc(x, y, thickness / 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fill();
      }
    }
    ctx.strokeStyle = colour;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    for (const [ax, ay, bx, by] of arms) {
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
    if (dot) {
      ctx.beginPath();
      ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
    }
    ctx.restore();
  }
}
