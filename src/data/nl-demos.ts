import type { NlDemoConfig } from './nl-demo';
import { goldpointConfig } from './goldpoint-config';
import { astexConfig } from './astex-config';
import { esilaZorgConfig } from './esila-zorg-config';
import { kapsalonCanConfig } from './kapsalon-can-config';
import { hammamConfig } from './hammam-config';

/**
 * Dutch-only pitch demos for existing Rotterdam businesses. Kept out of
 * `configs.ts` on purpose: those slugs get English routes and shared legal
 * pages, which these single-language demos do not have.
 */
export const nlDemos: NlDemoConfig[] = [
  goldpointConfig,
  astexConfig,
  esilaZorgConfig,
  kapsalonCanConfig,
  hammamConfig,
];
