import type { SiteConfig } from '../types/site-config';

/** Family-owned trust shop — deep forest, calm confidence, multi-generation feel. */
export const oakAxleConfig: SiteConfig = {
  slug: 'oak-axle',
  name: 'Oak & Axle Garage',
  businessType: 'garage',
  theme: {
    primary: '#122018',
    secondary: '#1a2c22',
    accent: '#7ec8a3',
    background: '#122018',
    surface: '#1a2c22',
    text: '#eef6f0',
    muted: '#a3b8ab',
    onPrimaryText: '#eef6f0',
    onPrimaryMuted: '#a3b8ab',
    onAccentText: '#0f1a14',
    fontHeading: '"Playfair Display", Georgia, serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 20 000 0103',
  email: 'hello@oakandaxle.example',
  address: {
    street: 'Eikenlaan 4',
    city: 'Demostad',
    postalCode: '1234 EF',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.03, lng: 5.03 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.03,5.03&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000103',
  aboutImage:
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.9, count: 241, source: 'Google' },
  content: {
    nl: {
      tagline: 'Familiebedrijf. Buurtvertrouwen.',
      description:
        'Drie generaties zorgvuldige reparaties voor gezinnen die de auto als deel van het huishouden zien.',
      bookingNote: 'Plan een bezoek — we sturen een update zodra de diagnose klaar is.',
      ctaLabel: 'Plan een bezoek',
      secondaryCtaLabel: 'Ontdek de garage',
      menuSectionLabel: 'Familie-autozorg',
      ratingNote: '241+ Google reviews',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Veiligheid',
          items: [
            {
              name: 'Veiligheidsinspectie',
              description: 'Lichten, banden, remmen en riemen voor de schoolrun',
              price: '€39',
            },
            {
              name: 'Winterklaar maken',
              description: 'Accu, banden en vloeistoffen voor de eerste vorst',
              price: 'vanaf €79',
            },
            {
              name: 'Hybrid service',
              description: 'Accugezondheid en koeling voor moderne hybrids',
              price: 'op offerte',
            },
          ],
        },
        {
          name: 'Preventie',
          items: [
            {
              name: 'Distributie & riemen',
              description: 'Preventief werk dat dure verrassingen voorkomt',
              price: 'op offerte',
            },
            {
              name: 'Foto-updates',
              description: 'We sturen foto\'s van slijtage zodat jij meekijkt',
              price: 'inbegrepen',
            },
            {
              name: 'Leenwagen / rit naar huis',
              description: 'Vraag naar een rit als de klus langer duurt',
              price: 'op aanvraag',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Eerlijke opties: goed / beter / best. Precies wat je als ouder wilt.',
          author: 'Fatima H.',
          source: 'Google',
        },
        {
          quote: 'Drie generaties en dat voel je — rustig, netjes, geen druk.',
          author: 'Peter L.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Hoe we met je meedenken',
        content:
          'Oak & Axle is een familiegarage: respect voor je tijd, budget en auto. Same-day updates, eerlijke opties en lokale garantie als iets wat wij plaatsten aandacht nodig heeft.',
        chefName: 'Els & Jan van Oak',
        chefTitle: 'Eigenaren',
      },
    },
    en: {
      tagline: 'Family owned. Neighborhood trusted.',
      description:
        'Three generations of careful repairs for families who treat the car like part of the household.',
      bookingNote: 'Schedule a visit — we text when diagnosis is done.',
      ctaLabel: 'Schedule a visit',
      secondaryCtaLabel: 'Meet the shop',
      menuSectionLabel: 'Family car care',
      ratingNote: '241+ Google reviews',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Safety',
          items: [
            {
              name: 'Safety inspection',
              description: 'Lights, tires, brakes, and belts checked before the school run',
              price: '€39',
            },
            {
              name: 'Winter prep',
              description: 'Batteries, tires, and fluids ready before the first freeze',
              price: 'from €79',
            },
            {
              name: 'Hybrid service',
              description: 'Battery health and cooling for modern family hybrids',
              price: 'on quote',
            },
          ],
        },
        {
          name: 'Prevention',
          items: [
            {
              name: 'Timing & belts',
              description: 'Preventive work that protects engines from expensive surprises',
              price: 'on quote',
            },
            {
              name: 'Honest photos',
              description: 'We send pictures of worn parts so you see what we see',
              price: 'included',
            },
            {
              name: 'Courtesy ride',
              description: 'Ask about a ride home when the job runs long',
              price: 'on request',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Fair options: good / better / best. Exactly what parents want.',
          author: 'Fatima H.',
          source: 'Google',
        },
        {
          quote: 'Three generations and you feel it — calm, tidy, no pressure.',
          author: 'Peter L.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'How we work with you',
        content:
          'Oak & Axle is a family garage: respect for your time, budget, and car. Same-day updates, fair options, and a local warranty if something we installed needs attention.',
        chefName: 'Els & Jan van Oak',
        chefTitle: 'Owners',
      },
    },
  },
};
