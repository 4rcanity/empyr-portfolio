/**
 * Every price on the site, in one place.
 *
 * The pricing hub shows headline "from" figures on its category tabs while the
 * calculators below work off the same numbers, so these live here rather than
 * inside the components — otherwise a rate change has to be made twice and the
 * tab hint silently drifts away from the real total.
 */

export interface PricedItem {
  id: string;
  price: number;
}

/* ── Websites (EUR) ──────────────────────────────────────────────────────── */

export const WEBSITE_BUILDS: PricedItem[] = [
  { id: 'static', price: 1200 },
  { id: 'animated', price: 2200 },
  { id: 'platform', price: 3200 },
];

export const WEBSITE_FEATURES: PricedItem[] = [
  { id: 'language', price: 350 },
  { id: 'booking', price: 500 },
  { id: 'ordering', price: 600 },
  { id: 'payments', price: 550 },
  { id: 'cms', price: 450 },
  { id: 'blog', price: 300 },
  { id: 'seo', price: 250 },
  { id: 'brand', price: 400 },
  { id: 'gallery', price: 200 },
];

export const CARE_NL = 150;
export const CARE_COM = 170;
export const WEBSITE_QUOTE_CAP = 5000;

/* ── Apps (USD) ──────────────────────────────────────────────────────────── */

export const APP_BASE = 3000;
export const APP_QUOTE_CAP = 10000;

export const APP_FEATURES: PricedItem[] = [
  { id: 'accounts', price: 500 },
  { id: 'push', price: 350 },
  { id: 'payments', price: 700 },
  { id: 'admin', price: 900 },
  { id: 'offline', price: 600 },
  { id: 'design', price: 800 },
  { id: 'multiplatform', price: 1200 },
  { id: 'analytics', price: 300 },
  { id: 'integrations', price: 500 },
];

/* ── Roblox development (USD, DevEx-equivalent) ──────────────────────────────
 * Quoted and paid in real currency, not Robux. Figures are the DevEx cash-out
 * value of the old Robux rates (standard rate: 100 Robux ≈ $0.35), so clients
 * never have to think in Robux at all. */

export interface VfxTier {
  id: string;
  price: number;
  /** Bulk discount kicks in from this many effects. */
  bulk: number;
}

export const VFX_TIERS: VfxTier[] = [
  { id: 'small', price: 25, bulk: 20 },
  { id: 'mid', price: 35, bulk: 15 },
  { id: 'large', price: 55, bulk: 15 },
];

export const UI_USD = 105;
export const SCRIPTED_UI_USD = 200;

/* ── Music (USD, DevEx-equivalent) ───────────────────────────────────────── */

export const COVER_USD = 210;
export const ORIGINAL_USD = 350;
export const STUDIO_FEE_USD = 30;

/* ── Formatting helpers ──────────────────────────────────────────────────── */

export function eur(n: number, locale = 'en-US') {
  return `€${n.toLocaleString(locale)}`;
}

export function usd(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}
