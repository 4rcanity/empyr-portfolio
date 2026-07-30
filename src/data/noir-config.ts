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
    fontBody: '"Inter", system-ui, sans-serif',
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
  aboutImage: 'https://images.unsplash.com/photo-1577219491135-ce391730e2c2?w=900&q=80&sat=-30',
  gallery: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&sat=-50',
  ],
  halal: true,
  content: {
    nl: {
      tagline: 'Halal fine dining na zonsondergang',
      description:
        'Twaalf tafels, kaarslicht en een alcoholvrij pairingprogramma gebouwd op thee, gefermenteerde sappen en huisgemaakte cordials.',
      bookingNote: 'Reserveringen openen om middernacht, 28 dagen van tevoren. Dresscode: quiet luxury.',
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
          name: 'Nocturne Menu',
          items: [
            {
              name: 'Negen Gangen — Nocturne',
              description:
                'Seizoensritme met optionele botanical pairing. Dieetwensen 72u van tevoren — wij bouwen de avond eromheen.',
              price: '€118',
              tags: ['halal'],
            },
            {
              name: 'Zes Gangen — Première',
              description: 'Kortere boog voor midweek: dezelfde keuken, minder uur aan tafel.',
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
              description: 'Glazen bol, hazelnootpraliné, eetbaar goud',
              price: '€18',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'De pairing zonder alcohol was beter dan menige wijnavond. Stil, precies, warm.',
          author: 'Lina R.',
          source: 'Resy',
        },
        {
          quote: 'Twaalf tafels voelen als een privéatelier. Geen haast, wel ritme.',
          author: 'Omar S.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Chef Mira Al-Hassan',
        content:
          'Atelier Nocturne is een fictief avondrestaurant: halal keuken, alcoholvrij pairing en een zaal die fluistert in plaats van schreeuwt. Namen en adressen op deze demo zijn placeholders — de toon is het product.',
        chefName: 'Mira Al-Hassan',
        chefTitle: 'Chef-patron',
      },
    },
    en: {
      tagline: 'Halal fine dining after dark',
      description:
        'Twelve tables, candlelight, and an alcohol-free pairing program built on tea, fermented juices, and house cordials.',
      bookingNote: 'Reservations open at midnight, 28 days out. Dress code: quiet luxury.',
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
          name: 'Nocturne Menu',
          items: [
            {
              name: 'Nine Courses — Nocturne',
              description:
                'Seasonal arc with optional botanical pairing. Dietary notes 72h ahead — we rebuild the night around them.',
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
              description: 'Glass sphere, hazelnut praline, edible gold',
              price: '€18',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'The alcohol-free pairing outran most wine nights. Quiet, precise, warm.',
          author: 'Lina R.',
          source: 'Resy',
        },
        {
          quote: 'Twelve tables feel like a private atelier. No rush — just rhythm.',
          author: 'Omar S.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Chef Mira Al-Hassan',
        content:
          'Atelier Nocturne is a fictional evening restaurant: halal kitchen, alcohol-free pairing, and a room that whispers instead of shouts. Names and addresses in this demo are placeholders — the tone is the product.',
        chefName: 'Mira Al-Hassan',
        chefTitle: 'Chef-patron',
      },
    },
  },
};
