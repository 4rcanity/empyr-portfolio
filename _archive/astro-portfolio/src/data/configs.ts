import type { SiteConfig } from '../types/site-config';
import { trattoriaConfig } from './trattoria-config';
import { noirConfig } from './noir-config';
import { cornerConfig } from './corner-config';
import { ocakbasiConfig } from './ocakbasi-config';
import { barberhouseConfig } from './barberhouse-config';

export const configs: SiteConfig[] = [trattoriaConfig, noirConfig, cornerConfig, ocakbasiConfig, barberhouseConfig];

export function getConfigBySlug(slug: string): SiteConfig | undefined {
  return configs.find((c) => c.slug === slug);
}
