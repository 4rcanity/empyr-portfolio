import type { NlDemoConfig } from './nl-demo';

export const hammamConfig: NlDemoConfig = {
  slug: 'hammam',
  name: 'Spa & Wellness Hammam',
  businessType: 'spa',
  theme: {
    primary: '#1F4E4A',
    secondary: '#163D3A',
    accent: '#C4785A',
    background: '#FAF6F1',
    surface: '#FFFCF8',
    text: '#2C2420',
    muted: '#7A6E66',
    onPrimaryText: '#FAF6F1',
    onPrimaryMuted: '#C8DDD9',
    onAccentText: '#FFFCF8',
    fontHeading: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'hammam',
  },
  heroImage:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80',
  phone: '+31 10 000 0000',
  email: 'info@hammam-rotterdam.nl',
  address: {
    street: 'Nieuwe Binnenweg 397',
    city: 'Rotterdam',
    postalCode: '3023 EL',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9141, lng: 4.459 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Binnenweg+397,+3023+EL+Rotterdam&output=embed',
  socials: {},
  reservationUrl: 'tel:+31100000000',
  gallery: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996cc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571902947732-223c4880f4b6?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Traditionele hammam · Nieuwe Binnenweg',
      description:
        'Hammam, kese scrub, massage en sauna in een rustige wellnessomgeving.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Behandelingen & prijzen',
      openingHours: [
        { dayKey: 'mon_fri', hours: '11:30 – 21:30' },
        { dayKey: 'sat', hours: '11:00 – 21:30' },
        { dayKey: 'sun', hours: '11:00 – 20:00' },
      ],
      menu: [
        {
          name: 'Hammam',
          items: [
            {
              name: 'Hammam entree',
              description: 'Toegang tot stoombad, sauna en rustruimte',
              price: '€35',
            },
            {
              name: 'Kese scrub',
              description: 'Traditionele exfoliatie met kese handschoen',
              price: '€25',
            },
            {
              name: 'Schuimmassage',
              description: 'Zeepmassage op het marmeren plataeu',
              price: '€40',
            },
            {
              name: 'Hammam ritueel',
              description: 'Kese scrub en schuimmassage',
              price: '€65',
            },
          ],
        },
        {
          name: 'Massage',
          items: [
            {
              name: 'Klassieke massage 30 min',
              description: 'Gerichte massage van nek, schouders en rug',
              price: '€45',
            },
            {
              name: 'Klassieke massage 60 min',
              description: 'Volledige lichaamsmassage',
              price: '€65',
            },
            {
              name: 'Ontspanningsmassage',
              description: 'Zachte massage voor diepe ontspanning',
              price: '€55',
            },
          ],
        },
      ],
      about: {
        heading: 'Spa & Wellness Hammam',
        content: 'Traditionele hammam aan de Nieuwe Binnenweg in Rotterdam.',
      },
    },
  },
};
