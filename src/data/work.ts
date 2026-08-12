/**
 * Shared portfolio work catalog — single source for the Websites and
 * Products pages. Extracted from the old monolithic index page so every
 * page renders cards from the same data.
 */
import { configs } from './configs';
import { nlDemos } from './nl-demos';
import type { Lang } from '../i18n/ui';

export type WorkStatus = 'for-sale' | 'sold' | 'commission' | 'in-consideration' | 'pitch';

export const statusLabels: Record<WorkStatus, { en: string; nl: string; className: string }> = {
  'for-sale': {
    en: 'for sale',
    nl: 'te koop',
    className: 'border-emerald-400/35 bg-emerald-950/45 text-emerald-100',
  },
  sold: {
    en: 'sold',
    nl: 'verkocht',
    className: 'border-stone-400/30 bg-stone-950/50 text-stone-300',
  },
  commission: {
    en: 'commission',
    nl: 'commissie',
    className: 'border-orange-400/40 bg-orange-950/45 text-orange-100',
  },
  'in-consideration': {
    en: 'in consideration',
    nl: 'in overweging',
    className: 'border-amber-300/40 bg-stone-950/55 text-amber-100',
  },
  pitch: {
    en: 'proposal',
    nl: 'voorstel',
    className: 'border-sky-300/40 bg-sky-950/50 text-sky-100',
  },
};

export interface TemplateMeta {
  bestFor: string[];
  nlBestFor: string[];
  status: WorkStatus;
  /** Fictional demos get a Demo pill; real consideration cases get Live case. */
  kind: 'demo' | 'live';
}

export const templateMeta: Record<string, TemplateMeta> = {
  trattoria: {
    bestFor: ['Italian restaurants', 'Family dining', 'Alcohol-free'],
    nlBestFor: ['Italiaanse restaurants', 'Familierestaurants', 'Alcoholvrij'],
    status: 'for-sale',
    kind: 'demo',
  },
  noir: {
    bestFor: ['Fine dining', 'Alcohol-free', 'Tasting menus'],
    nlBestFor: ['Fine dining', 'Alcoholvrij', 'Proeverijen'],
    status: 'for-sale',
    kind: 'demo',
  },
  corner: {
    bestFor: ['Cafés', 'Brunch spots', 'All-day plates'],
    nlBestFor: ['Cafés', 'Brunchzaken', 'All-day dishes'],
    status: 'for-sale',
    kind: 'demo',
  },
  ocakbasi: {
    bestFor: ['Turkish grill', 'Kebab & döner', '100% Halal'],
    nlBestFor: ['Turkse grill', 'Kebab & döner', '100% halal'],
    status: 'for-sale',
    kind: 'demo',
  },
  charlois: {
    bestFor: ['APK', 'Maintenance', 'Rotterdam Charlois'],
    nlBestFor: ['APK', 'Onderhoud', 'Rotterdam Charlois'],
    status: 'for-sale',
    kind: 'demo',
  },
  'spangen-banden': {
    bestFor: ['Tires', 'Alignment', 'Rotterdam Spangen'],
    nlBestFor: ['Banden', 'Uitlijnen', 'Rotterdam Spangen'],
    status: 'for-sale',
    kind: 'demo',
  },
  'maashaven-schade': {
    bestFor: ['Body repair', 'Insurance claims', 'Rotterdam Maashaven'],
    nlBestFor: ['Schadeherstel', 'Verzekeringsschade', 'Rotterdam Maashaven'],
    status: 'for-sale',
    kind: 'demo',
  },
  goldpoint: {
    bestFor: ['Jewellers', 'Watch repair'],
    nlBestFor: ['Juweliers', 'Horlogereparatie'],
    status: 'for-sale',
    kind: 'demo',
  },
  astex: {
    bestFor: ['Clothing repair', 'Alterations'],
    nlBestFor: ['Kledingreparatie', 'Vermaakwerk'],
    status: 'for-sale',
    kind: 'demo',
  },
  'esila-zorg': {
    bestFor: ['Home care', 'Support'],
    nlBestFor: ['Thuiszorg', 'Begeleiding'],
    status: 'for-sale',
    kind: 'demo',
  },
  'kapsalon-can': {
    bestFor: ['Hair salons', 'Barbers'],
    nlBestFor: ['Kapsalons', 'Barbers'],
    status: 'for-sale',
    kind: 'demo',
  },
  hammam: {
    bestFor: ['Hammam', 'Spa & wellness'],
    nlBestFor: ['Hammam', 'Spa & wellness'],
    status: 'for-sale',
    kind: 'demo',
  },
  barberhouse: {
    bestFor: ['Barbershops', 'Hair salons', 'Grooming studios'],
    nlBestFor: ['Kapperszaken', 'Barbershops', "Grooming studio's"],
    status: 'in-consideration',
    kind: 'live',
  },
  medrese: {
    bestFor: ['Education', 'Community', 'NL · TR · EN'],
    nlBestFor: ['Educatie', 'Gemeenschap', 'NL · TR · EN'],
    status: 'commission',
    kind: 'demo',
  },
};

export interface TemplateCard {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  bestFor: string[];
  status: WorkStatus;
  kind: 'demo' | 'live';
  statusLabel: string;
  kindLabel: string;
  statusClass: string;
  href: string;
}

export interface WorkCategory {
  id: string;
  title: string;
  body: string;
  slugs: string[];
}

function buildCard(
  lang: Lang,
  slug: string,
  name: string,
  tagline: string,
  description: string,
  accent: string,
  bestFor: string[],
  /** Dutch-only demos have no /en route, so always link to the NL page */
  nlOnly = false,
): TemplateCard {
  const meta = templateMeta[slug];
  const status = meta.status;
  const statusMeta = statusLabels[status];
  return {
    slug,
    name,
    tagline,
    description,
    accent,
    bestFor,
    status,
    kind: meta.kind,
    statusLabel: lang === 'nl' ? statusMeta.nl : statusMeta.en,
    kindLabel: meta.kind === 'live' ? (lang === 'nl' ? 'Echte zaak' : 'Live case') : 'Demo',
    statusClass: statusMeta.className,
    href: `/${nlOnly ? 'nl' : lang}/${slug}`,
  };
}

export function getTemplatesBySlug(lang: Lang): Record<string, TemplateCard> {
  const templatesBySlug: Record<string, TemplateCard> = Object.fromEntries(
    configs.map((config) => {
      const content = config.content[lang];
      const meta = templateMeta[config.slug];
      return [
        config.slug,
        buildCard(
          lang,
          config.slug,
          config.name,
          content.tagline,
          content.description,
          config.theme.accent,
          lang === 'nl' ? meta.nlBestFor : meta.bestFor,
        ),
      ];
    }),
  );

  for (const demo of nlDemos) {
    const content = demo.content.nl;
    const meta = templateMeta[demo.slug];
    templatesBySlug[demo.slug] = buildCard(
      lang,
      demo.slug,
      demo.name,
      content.tagline,
      content.description,
      demo.theme.accent,
      lang === 'nl' ? meta.nlBestFor : meta.bestFor,
      true,
    );
  }

  templatesBySlug.medrese = buildCard(
    lang,
    'medrese',
    'Medrese',
    lang === 'nl' ? 'Kennis die hart en verstand verbindt' : 'Knowledge that connects heart and mind',
    lang === 'nl'
      ? 'Een meertalig educatief platform voor islamitische basiskennis, Koran, hadith, Risale-i Nur, lessen en activiteiten.'
      : 'A multilingual learning platform for Islamic foundations, Quran, hadith, Risale-i Nur, classes and activities.',
    '#BD8B35',
    lang === 'nl' ? templateMeta.medrese.nlBestFor : templateMeta.medrese.bestFor,
  );

  return templatesBySlug;
}

export function getWorkCategories(lang: Lang): WorkCategory[] {
  return lang === 'nl'
    ? [
        {
          id: 'restaurants',
          title: 'Restaurants & cafés',
          body: 'Vier concepten voor horeca — van familiezaak tot fine dining.',
          slugs: ['trattoria', 'noir', 'corner', 'ocakbasi'],
        },
        {
          id: 'garages',
          title: 'Garages & autoservice',
          body: 'Drie Rotterdamse concepten — onderhoud, banden en schadeherstel.',
          slugs: ['charlois', 'spangen-banden', 'maashaven-schade'],
        },
        {
          id: 'winkels',
          title: 'Winkels & diensten',
          body: 'Vijf concepten voor lokale zaken — van juwelier tot hammam.',
          slugs: ['goldpoint', 'astex', 'esila-zorg', 'kapsalon-can', 'hammam'],
        },
        {
          id: 'barbers',
          title: 'Barbershops',
          body: "Strak merkwerk voor kappers en grooming studio's.",
          slugs: ['barberhouse'],
        },
        {
          id: 'education',
          title: 'Educatie & platforms',
          body: 'Meertalige leerervaringen voor gemeenschap en kennis.',
          slugs: ['medrese'],
        },
      ]
    : [
        {
          id: 'restaurants',
          title: 'Restaurants & cafés',
          body: 'Four concepts for hospitality — from family dining to fine dining.',
          slugs: ['trattoria', 'noir', 'corner', 'ocakbasi'],
        },
        {
          id: 'garages',
          title: 'Garages & auto service',
          body: 'Three Rotterdam concepts — maintenance, tires and body repair.',
          slugs: ['charlois', 'spangen-banden', 'maashaven-schade'],
        },
        {
          id: 'winkels',
          title: 'Shops & services',
          body: 'Five concepts for local businesses — from jeweller to hammam.',
          slugs: ['goldpoint', 'astex', 'esila-zorg', 'kapsalon-can', 'hammam'],
        },
        {
          id: 'barbers',
          title: 'Barbershops',
          body: 'Sharp brand work for barbers and grooming studios.',
          slugs: ['barberhouse'],
        },
        {
          id: 'education',
          title: 'Education & platforms',
          body: 'Multilingual learning experiences for community and knowledge.',
          slugs: ['medrese'],
        },
      ];
}
