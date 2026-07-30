import type { SiteConfig } from '../types/site-config';

export const noirConfig: SiteConfig = {
  slug: 'noir',
  name: 'Atelier Nocturne',
  businessType: 'restaurant',
  theme: {
    primary: '#141210',
    secondary: '#24201c',
    accent: '#d4b06a',
    background: '#0c0b0a',
    surface: '#181614',
    text: '#f3ebe0',
    muted: '#9c9284',
    onPrimaryText: '#f3ebe0',
    onPrimaryMuted: '#9c9284',
    onAccentText: '#1a1612',
    fontHeading: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'noir',
  },
  heroImage:
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1600&q=80&sat=-40',
  phone: '+31 20 000 0002',
  email: 'reservations@ateliernocturne.example',
  address: {
    street: 'Conceptlaan 21',
    city: 'Demostad',
    postalCode: '1234 CD',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.01, lng: 5.01 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.01,5.01&output=embed',
  socials: {
    instagram: 'https://instagram.com',
  },
  reservationUrl: 'mailto:reservations@ateliernocturne.example?subject=Table%20Reservation',
  aboutImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&sat=-30',
  gallery: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&sat=-50',
  ],
  halal: true,
  content: {
    nl: {
      tagline: 'Halal fine dining · alcoholvrij',
      description:
        'Twaalf tafels. Seizoensmenu met optionele botanical pairing (thee, gefermenteerde sappen, cordials).',
      bookingNote: 'Reserveren per e-mail, 28 dagen vooruit.',
      ctaLabel: 'Reserveer een tafel',
      secondaryCtaLabel: 'Bekijk de avondkaart',
      menuSectionLabel: 'Avondkaart',
      openingHours: [
        { dayKey: 'mon_tue', hours: null },
        { dayKey: 'wed_thu', hours: '18:30 – 22:30' },
        { dayKey: 'fri_sat', hours: '18:30 – 23:30' },
        { dayKey: 'sun', hours: '18:00 – 21:30' },
      ],
      menu: [
        {
          name: 'Menu',
          items: [
            {
              name: 'Negen Gangen — Nocturne',
              description: 'Seizoensritme met optionele botanical pairing. Dieetwensen 72u van tevoren.',
              price: '€118',
              tags: ['halal'],
            },
            {
              name: 'Zes Gangen — Première',
              description: 'Kortere midweekboog: dezelfde keuken, minder uur aan tafel.',
              price: '€84',
              tags: ['halal'],
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Gerookte eendenborst',
              description: 'Kweepeer, zwarte knoflook, briochekruim',
              price: '€28',
              tags: ['halal'],
            },
            {
              name: 'Heek met yuzu-beurre',
              description: 'Venkelconfit, zeekraal, kaviaar-olie',
              price: '€41',
              tags: ['halal', 'gluten-free'],
            },
            {
              name: 'Dry-aged ribeye',
              description: 'Beenmergjus zonder alcohol, knoflookasch, soufflé-aardappel',
              price: '€58',
              tags: ['halal'],
            },
            {
              name: 'Cacao & bergamot',
              description: 'Glazen bol, hazelnootpraliné',
              price: '€18',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      about: {
        heading: 'Atelier Nocturne',
        content:
          'Halal avondrestaurant met alcoholvrij pairingprogramma. Reserveren via e-mail. Demoadres — ter illustratie van de template.',
      },
    },
    en: {
      tagline: 'Halal fine dining · alcohol-free',
      description:
        'Twelve tables. Seasonal menu with optional botanical pairing (tea, fermented juices, cordials).',
      bookingNote: 'Reserve by email, 28 days ahead.',
      ctaLabel: 'Reserve a table',
      secondaryCtaLabel: 'See the evening card',
      menuSectionLabel: 'Evening card',
      openingHours: [
        { dayKey: 'mon_tue', hours: null },
        { dayKey: 'wed_thu', hours: '18:30 – 22:30' },
        { dayKey: 'fri_sat', hours: '18:30 – 23:30' },
        { dayKey: 'sun', hours: '18:00 – 21:30' },
      ],
      menu: [
        {
          name: 'Menu',
          items: [
            {
              name: 'Nine Courses — Nocturne',
              description: 'Seasonal arc with optional botanical pairing. Dietary notes 72h ahead.',
              price: '€118',
              tags: ['halal'],
            },
            {
              name: 'Six Courses — Première',
              description: 'Shorter midweek arc: same kitchen, fewer hours at the table.',
              price: '€84',
              tags: ['halal'],
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Smoked duck breast',
              description: 'Quince, black garlic, brioche crumb',
              price: '€28',
              tags: ['halal'],
            },
            {
              name: 'Hake with yuzu beurre',
              description: 'Fennel confit, sea beans, caviar oil',
              price: '€41',
              tags: ['halal', 'gluten-free'],
            },
            {
              name: 'Dry-aged ribeye',
              description: 'Alcohol-free marrow jus, garlic ash, soufflé potato',
              price: '€58',
              tags: ['halal'],
            },
            {
              name: 'Cacao & bergamot',
              description: 'Glass sphere, hazelnut praline',
              price: '€18',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      about: {
        heading: 'Atelier Nocturne',
        content:
          'Halal evening restaurant with an alcohol-free pairing program. Reserve by email. Demo address — for template illustration.',
      },
    },
  },
};
