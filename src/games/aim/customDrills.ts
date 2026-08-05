import { clampConfig, type RunConfig, type ScoreMode } from './scenarios';
import { newCustomDrillId, type CustomDrill } from './storage';

export function defaultConfigForMode(mode: ScoreMode): RunConfig {
  switch (mode) {
    case 'click':
      return { duration: 60, size: 1.5, targets: 6, area: 22, speed: 0, turnEvery: 0 };
    case 'track':
      return { duration: 60, size: 2.2, targets: 1, area: 20, speed: 14, turnEvery: 2.2 };
    case 'spray':
      return { duration: 60, size: 2.0, targets: 1, area: 8, speed: 0, turnEvery: 0 };
  }
}

export function createCustomDrill(name: string, mode: ScoreMode): CustomDrill {
  return {
    id: newCustomDrillId(),
    name: name.trim() || 'Custom drill',
    mode,
    createdAt: Date.now(),
    config: defaultConfigForMode(mode),
  };
}

export type CustomDrillExport = {
  version: 1;
  name: string;
  mode: ScoreMode;
  config: RunConfig;
};

export function exportDrill(drill: CustomDrill): CustomDrillExport {
  return {
    version: 1,
    name: drill.name,
    mode: drill.mode,
    config: drill.config,
  };
}

export function exportAll(drills: CustomDrill[]): { version: 1; drills: CustomDrillExport[] } {
  return { version: 1, drills: drills.map(exportDrill) };
}

const MODES: ScoreMode[] = ['click', 'track', 'spray'];

function isMode(value: unknown): value is ScoreMode {
  return typeof value === 'string' && MODES.includes(value as ScoreMode);
}

function parseEntry(raw: unknown, fallbackName: string): CustomDrill | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!isMode(obj.mode)) return null;

  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : fallbackName;
  const cfgRaw = obj.config && typeof obj.config === 'object' ? (obj.config as Record<string, unknown>) : {};

  const config = clampConfig({
    duration: Number(cfgRaw.duration) || 0,
    size: Number(cfgRaw.size) || 0,
    targets: Number(cfgRaw.targets) || 0,
    area: Number(cfgRaw.area) || 0,
    speed: Number(cfgRaw.speed) || 0,
    turnEvery: Number(cfgRaw.turnEvery) || 0,
  });

  return {
    id: newCustomDrillId(),
    name,
    mode: obj.mode,
    createdAt: Date.now(),
    config,
  };
}

export function parseImport(json: unknown): CustomDrill[] {
  try {
    if (!json || typeof json !== 'object') return [];

    const root = json as Record<string, unknown>;

    if (Array.isArray(root)) {
      return root
        .map((entry, i) => parseEntry(entry, `Imported drill ${i + 1}`))
        .filter((d): d is CustomDrill => d !== null);
    }

    if (Array.isArray(root.drills)) {
      return root.drills
        .map((entry, i) => parseEntry(entry, `Imported drill ${i + 1}`))
        .filter((d): d is CustomDrill => d !== null);
    }

    const single = parseEntry(root, 'Imported drill');
    return single ? [single] : [];
  } catch {
    return [];
  }
}

export function downloadJson(filename: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch {
    /* no-op */
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'custom-drill';
}
