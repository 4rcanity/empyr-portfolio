/**
 * Apps published by Empyr Studio — single source for the /apps page.
 */

export type AppPlatform = 'ios' | 'android' | 'windows' | 'web' | 'cross-platform';
export type AppStatus = 'live' | 'in-development' | 'coming-soon';

export interface AppEntry {
  id: string;
  name: string;
  platforms: AppPlatform[];
  status: AppStatus;
  tagline: { nl: string; en: string };
  description: { nl: string; en: string };
  /** Direct download or store URL */
  storeUrl?: string;
  storeLabel?: { nl: string; en: string };
  /** Secondary action (docs, chrome extension notes, etc.) */
  secondaryUrl?: string;
  secondaryLabel?: { nl: string; en: string };
  /** Icon path under /public, e.g. /images/apps/costpulse.svg */
  icon?: string;
  accent: string;
  features: { nl: string[]; en: string[] };
  /** Optional file size hint shown under the download CTA */
  downloadMeta?: { nl: string; en: string };
}

export const appStatusMeta: Record<AppStatus, { nl: string; en: string; className: string }> = {
  live: {
    nl: 'Live',
    en: 'Live',
    className: 'border-emerald-400/35 bg-emerald-950/45 text-emerald-100',
  },
  'in-development': {
    nl: 'In ontwikkeling',
    en: 'In development',
    className: 'border-amber-300/40 bg-stone-950/55 text-amber-100',
  },
  'coming-soon': {
    nl: 'Binnenkort',
    en: 'Coming soon',
    className: 'border-sky-300/40 bg-sky-950/50 text-sky-100',
  },
};

export const platformLabels: Record<AppPlatform, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  web: 'Web',
  'cross-platform': 'Cross-platform',
};

export const apps: AppEntry[] = [
  {
    id: 'costpulse',
    name: 'CostPulse',
    platforms: ['windows'],
    status: 'live',
    tagline: {
      nl: 'Abonnementen en terugkerende kosten bijhouden — met browser-detectie.',
      en: 'Track subscriptions and recurring costs — with browser detection.',
    },
    description: {
      nl: 'CostPulse is een Windows-app van Empyr Studio die je maandelijkse burn rate, aankomende betalingen en kostenprofielen overzichtelijk houdt. De bijbehorende browserextensie herkent abonnementsprijzen op websites en synchroniseert ze lokaal via localhost.',
      en: 'CostPulse is an Empyr Studio Windows app that keeps monthly burn rate, upcoming payments and cost profiles in one place. The companion browser extension detects subscription prices on websites and syncs them locally over localhost.',
    },
    storeUrl: '/downloads/CostPulse-Setup.exe',
    storeLabel: { nl: 'Download voor Windows', en: 'Download for Windows' },
    accent: '#00B7C3',
    icon: '/images/apps/costpulse.svg',
    downloadMeta: {
      nl: 'Windows 10/11 · x64 · installer ~58 MB',
      en: 'Windows 10/11 · x64 · installer ~58 MB',
    },
    features: {
      nl: [
        'Profielen & maandelijkse burn rate',
        'Lokale sync-server (localhost:48123)',
        'Browserextensie voor abonnementsdetectie',
        'SQLite-opslag op je eigen pc',
      ],
      en: [
        'Profiles & monthly burn rate',
        'Local sync server (localhost:48123)',
        'Browser extension for subscription detection',
        'SQLite storage on your own PC',
      ],
    },
  },
];
