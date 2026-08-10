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
  logo: '/voorbeeld/logo.svg',
  heroImage: '/voorbeeld/afbeelding.svg',
  phone: '+31 10 000 0000',
  email: 'info@hammam-rotterdam.nl',
  address: {
    street: 'Nieuwe Binnenweg 397',
    city: 'Rotterdam',
    postalCode: '3023 EL',
    country: 'Nederland',
  },
  coordinates: { lat: 51.9141, lng: 4.459 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Binnenweg+397,+3023+EL+Rotterdam&output=embed',
  socials: {},
  reservationUrl: 'tel:+31100000000',
  gallery: [
    '/voorbeeld/afbeelding-1.svg',
    '/voorbeeld/afbeelding-2.svg',
    '/voorbeeld/afbeelding-3.svg',
    '/voorbeeld/afbeelding-4.svg',
  ],
  content: {
    nl: {
      tagline: 'Traditionele hammam · Nieuwe Binnenweg',
      description:
        'Hammam, kese scrub, massage en sauna in een rustige wellnessomgeving.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Behandelingen & prijzen',
      bookingNote:
        'Voorbeeldwebsite: openingstijden, prijzen, logo en foto’s zijn voorbeelden en vullen we aan met uw eigen gegevens.',
      openingHours: [
        { dayKey: 'mon', hours: '11:30 – 21:30' },
        { dayKey: 'tue_thu', hours: 'Voorbeeld' },
        { dayKey: 'fri_sat', hours: 'Voorbeeld' },
        { dayKey: 'sun', hours: 'Voorbeeld' },
      ],
      menu: [
        {
          name: 'Hammam',
          items: [
            {
              name: 'Hammam entree',
              description: 'Toegang tot stoombad, sauna en rustruimte',
              price: 'Voorbeeld',
            },
            {
              name: 'Kese scrub',
              description: 'Traditionele exfoliatie met kese handschoen',
              price: 'Voorbeeld',
            },
            {
              name: 'Schuimmassage',
              description: 'Zeepmassage op het marmeren plataeu',
              price: 'Voorbeeld',
            },
            {
              name: 'Hammam ritueel',
              description: 'Kese scrub en schuimmassage',
              price: 'Voorbeeld',
            },
          ],
        },
        {
          name: 'Massage',
          items: [
            {
              name: 'Klassieke massage 30 min',
              description: 'Gerichte massage van nek, schouders en rug',
              price: 'Voorbeeld',
            },
            {
              name: 'Klassieke massage 60 min',
              description: 'Volledige lichaamsmassage',
              price: 'Voorbeeld',
            },
            {
              name: 'Ontspanningsmassage',
              description: 'Zachte massage voor diepe ontspanning',
              price: 'Voorbeeld',
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
