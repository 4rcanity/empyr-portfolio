/* Mouse sensitivity maths.
   Every FPS turns the camera by `yaw * sens` degrees per mouse count, where the
   yaw constant is fixed per engine. VALORANT's is 0.07 deg/count. Everything
   below falls out of that one relation. */

export type GameId = 'valorant' | 'cs2' | 'apex' | 'overwatch';

export interface GameProfile {
  id: GameId;
  label: string;
  /** Degrees of camera yaw per single mouse count at sensitivity 1. */
  yaw: number;
  note: string;
}

export const GAMES: GameProfile[] = [
  { id: 'valorant', label: 'VALORANT', yaw: 0.07, note: 'Riot / Unreal' },
  { id: 'cs2', label: 'CS2 · Source', yaw: 0.022, note: 'm_yaw 0.022' },
  { id: 'apex', label: 'Apex Legends', yaw: 0.022, note: 'Source lineage' },
  { id: 'overwatch', label: 'Overwatch 2', yaw: 0.0066, note: 'Blizzard' },
];

export const CM_PER_INCH = 2.54;

export function profileOf(id: GameId): GameProfile {
  return GAMES.find((g) => g.id === id) ?? GAMES[0]!;
}

/** Effective DPI — the only number that is comparable inside one game. */
export function edpi(sens: number, dpi: number): number {
  return sens * dpi;
}

/** Degrees the camera turns for one mouse count. */
export function degPerCount(yaw: number, sens: number): number {
  return yaw * sens;
}

/** Counts of mouse movement needed for a full 360 turn. */
export function countsPer360(yaw: number, sens: number): number {
  return 360 / (yaw * sens);
}

/** Centimetres of desk travel for a full 360 turn. */
export function cm360(yaw: number, sens: number, dpi: number): number {
  const counts = countsPer360(yaw, sens);
  if (!Number.isFinite(counts) || dpi <= 0) return Number.POSITIVE_INFINITY;
  return (counts / dpi) * CM_PER_INCH;
}

export function inch360(yaw: number, sens: number, dpi: number): number {
  return cm360(yaw, sens, dpi) / CM_PER_INCH;
}

/** Invert cm/360 back into an in-game sensitivity value. */
export function sensForCm360(yaw: number, dpi: number, cm: number): number {
  if (cm <= 0 || dpi <= 0) return 0;
  return (360 * CM_PER_INCH) / (yaw * dpi * cm);
}

/** Carry a sensitivity across engines at the same DPI: matched cm/360. */
export function convertSens(fromYaw: number, sens: number, toYaw: number): number {
  if (toYaw <= 0) return 0;
  return (sens * fromYaw) / toYaw;
}

export interface SensRow {
  game: GameProfile;
  sens: number;
  edpi: number;
  cm360: number;
  inch360: number;
}

/** Full conversion table for one VALORANT-anchored setting. */
export function conversionTable(sens: number, dpi: number, from: GameId = 'valorant'): SensRow[] {
  const src = profileOf(from);
  return GAMES.map((game) => {
    const converted = game.id === from ? sens : convertSens(src.yaw, sens, game.yaw);
    return {
      game,
      sens: converted,
      edpi: edpi(converted, dpi),
      cm360: cm360(game.yaw, converted, dpi),
      inch360: inch360(game.yaw, converted, dpi),
    };
  });
}

export function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
