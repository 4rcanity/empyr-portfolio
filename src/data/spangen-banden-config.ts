import type { SiteConfig } from '../types/site-config';

export const spangenBandenConfig = {
  slug: 'spangen-banden',
  name: 'Bandencentrale Spangen',
  businessType: 'garage',
  theme: {
    primary: '#000000',
    secondary: '#1a1a1a',
    accent: '#f5c400',
    background: '#111111',
    surface: '#1a1a1a',
    text: '#f5f5f5',
    muted: '#a3a3a3',
    onPrimaryText: '#f5f5f5',
    onPrimaryMuted: '#a3a3a3',
    onAccentText: '#111111',
    fontHeading: '"IBM Plex Sans", system-ui, sans-serif',
    fontBody: '"IBM Plex Sans", system-ui, sans-serif',
    variant: 'spangen-banden',
  },
  heroImage:
    'https://images.unsplash.com/photo-1619642751034-765df7697e92?w=1600&q=80',
  phone: '+31 10 476 2280',
  email: 'info@bandencentrale-spangen.example',
  address: {
    street: 'Mathenesserweg 164',
    city: 'Rotterdam',
    postalCode: '3026 HA',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9169, lng: 4.4262 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Mathenesserweg+164,+3026+HA+Rotterdam&output=embed',
  socials: {},
  gallery: [
    'https://images.unsplash.com/photo-1619642751034-765df7697e92?w=800&q=80',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'https://images.unsplash.com/photo-1487754183691-f732981f98ca?w=800&q=80',
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80',
  ],
  rating: { value: 4.6, count: 89, source: 'Google' },
  content: {
    nl: {
      tagline: 'Bandenspecialist · Spangen',
      description:
        'Bandenwissel, seizoensopslag, uitlijnen, balanceren en lekreparatie. Geen online reserveren — bel voor afspraak.',
      ctaLabel: 'Ken je bandenmaat? Bel ons',
      menuSectionLabel: 'Diensten',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '08:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Diensten',
          items: [
            {
              name: 'Bandenwissel',
              description: 'Complete set wisselen, inclusief balanceren.',
              price: '€39',
            },
            {
              name: 'Seizoensopslag',
              description: 'Opslag per set per seizoen.',
              price: '€69',
            },
            {
              name: 'Uitlijnen',
              description: 'Vooras uitlijnen.',
              price: '€59',
            },
            {
              name: 'Balanceren',
              description: 'Per wiel.',
              price: '€12',
            },
            {
              name: 'Lekreparatie',
              description: 'Reparatie tubeless band.',
              price: '€18',
            },
          ],
        },
      ],
      about: {
        heading: 'Bandencentrale Spangen',
        content:
          'Bandenspecialist in Spangen, Rotterdam. Wisselen, opslag, uitlijnen en reparatie.',
      },
    },
    en: {
      tagline: 'Tire specialist · Spangen',
      description:
        'Tire changes, seasonal storage, alignment, balancing and puncture repair. No online booking — call for an appointment.',
      ctaLabel: 'Know your tire size? Call us',
      menuSectionLabel: 'Services',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '08:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Services',
          items: [
            {
              name: 'Tire change',
              description: 'Full set swap, balancing included.',
              price: '€39',
            },
            {
              name: 'Seasonal storage',
              description: 'Per set, per season.',
              price: '€69',
            },
            {
              name: 'Wheel alignment',
              description: 'Front axle alignment.',
              price: '€59',
            },
            {
              name: 'Balancing',
              description: 'Per wheel.',
              price: '€12',
            },
            {
              name: 'Puncture repair',
              description: 'Tubeless tire repair.',
              price: '€18',
            },
          ],
        },
      ],
      about: {
        heading: 'Bandencentrale Spangen',
        content:
          'Tire specialist in Spangen, Rotterdam. Fitting, storage, alignment and repair.',
      },
    },
  },
} as SiteConfig;
