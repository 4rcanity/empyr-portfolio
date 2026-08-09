import type { SiteConfig } from '../types/site-config';
import { trattoriaConfig } from './trattoria-config';
import { noirConfig } from './noir-config';
import { cornerConfig } from './corner-config';
import { ocakbasiConfig } from './ocakbasi-config';
import { barberhouseConfig } from './barberhouse-config';
import { charloisConfig } from './charlois-config';
import { spangenBandenConfig } from './spangen-banden-config';
import { maashavenSchadeConfig } from './maashaven-schade-config';

export const configs: SiteConfig[] = [
  trattoriaConfig,
  noirConfig,
  cornerConfig,
  ocakbasiConfig,
  barberhouseConfig,
  charloisConfig,
  spangenBandenConfig,
  maashavenSchadeConfig,
];

export function getConfigBySlug(slug: string): SiteConfig | undefined {
  return configs.find((c) => c.slug === slug);
}
