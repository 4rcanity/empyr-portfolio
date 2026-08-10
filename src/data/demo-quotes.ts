/**
 * Per-demo sale quotes derived from the same rates as `pricing.ts`.
 * Keep feature lists honest to what each demo actually ships.
 */
import { WEBSITE_BUILDS, WEBSITE_FEATURES, WEBSITE_QUOTE_CAP, eur } from './pricing';

export type QuoteFeatureId =
  | 'language'
  | 'booking'
  | 'ordering'
  | 'payments'
  | 'cms'
  | 'blog'
  | 'seo'
  | 'brand'
  | 'gallery';

export type QuoteBuildId = 'static' | 'animated' | 'platform';

export interface DemoQuote {
  build: QuoteBuildId;
  features: QuoteFeatureId[];
  total: number;
}

function rate(id: string, table: { id: string; price: number }[]) {
  const row = table.find((r) => r.id === id);
  if (!row) throw new Error(`Unknown price id: ${id}`);
  return row.price;
}

function quote(build: QuoteBuildId, features: QuoteFeatureId[]): DemoQuote {
  const total = Math.min(
    rate(build, WEBSITE_BUILDS) + features.reduce((sum, id) => sum + rate(id, WEBSITE_FEATURES), 0),
    WEBSITE_QUOTE_CAP,
  );
  return { build, features, total };
}

/** Only for-sale demos that show a price on the portfolio. */
export const DEMO_QUOTES: Record<string, DemoQuote> = {
  trattoria: quote('static', ['language', 'booking', 'seo', 'brand', 'gallery']),
  noir: quote('animated', ['language', 'booking', 'seo', 'brand', 'gallery']),
  corner: quote('animated', ['language', 'booking', 'ordering', 'seo', 'brand', 'gallery']),
  ocakbasi: quote('static', ['language', 'ordering', 'seo', 'brand', 'gallery']),
  charlois: quote('static', ['language', 'booking', 'seo', 'brand', 'gallery']),
  'spangen-banden': quote('static', ['language', 'seo', 'brand', 'gallery']),
  'maashaven-schade': quote('static', ['language', 'booking', 'seo', 'brand', 'gallery']),
  // Dutch-only pitch demos: single language, so no language add-on.
  goldpoint: quote('static', ['seo', 'brand', 'gallery']),
  astex: quote('static', ['seo', 'brand', 'gallery']),
  'esila-zorg': quote('static', ['seo', 'brand', 'gallery']),
  'kapsalon-can': quote('static', ['booking', 'seo', 'brand', 'gallery']),
  hammam: quote('static', ['booking', 'seo', 'brand', 'gallery']),
};

export function formatDemoQuote(total: number, lang: 'nl' | 'en') {
  const amount = eur(total, lang === 'nl' ? 'nl-NL' : 'en-US');
  return lang === 'nl' ? `vanaf ${amount}` : `from ${amount}`;
}
