/**
 * Apps published by Empyr Studios — single source for the /apps page.
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
      nl: 'Houd bij wat je elke maand aan abonnementen kwijt bent.',
      en: 'See what you actually spend on subscriptions each month.',
    },
    description: {
      nl: 'CostPulse is een Windows-app van Empyr Studios. Je ziet je maandelijkse lasten, wat eraan komt, en je kunt meerdere profielen bijhouden. De browserextensie herkent prijzen op websites en stuurt ze naar de app op je pc — via localhost, niet via onze servers.',
      en: 'CostPulse is a Windows app from Empyr Studios. It shows your monthly spend, what’s coming up, and lets you keep separate profiles. The browser extension spots prices on websites and sends them to the app on your PC — over localhost, not through our servers.',
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
        'Profielen en wat je per maand kwijt bent',
        'Lokale sync-server (localhost:48123)',
        'Browserextensie die prijzen herkent',
        'SQLite-opslag op je eigen pc',
      ],
      en: [
        'Profiles and monthly spend',
        'Local sync server (localhost:48123)',
        'Browser extension that spots prices',
        'SQLite storage on your own PC',
      ],
    },
  },
];
