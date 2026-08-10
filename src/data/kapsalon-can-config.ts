import type { NlDemoConfig } from './nl-demo';

export const kapsalonCanConfig: NlDemoConfig = {
  slug: 'kapsalon-can',
  name: 'Kapsalon Can',
  businessType: 'barbershop',
  theme: {
    primary: '#1E4FD8',
    secondary: '#141414',
    accent: '#1E4FD8',
    background: '#F4F1EA',
    surface: '#FFFFFF',
    text: '#141414',
    muted: '#5C5C5C',
    onPrimaryText: '#FFFFFF',
    onPrimaryMuted: '#C8D4F0',
    onAccentText: '#FFFFFF',
    fontHeading: '"Oswald", system-ui, sans-serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'kapsalon-can',
  },
  heroImage:
    'https://images.unsplash.com/photo-1503951914875-452162b0f3d1?w=1600&q=80',
  phone: '+31 10 000 0000',
  email: 'info@kapsaloncan.nl',
  address: {
    street: 'Nieuwe Binnenweg 434B',
    city: 'Rotterdam',
    postalCode: '3023 EX',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9139, lng: 4.4605 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Binnenweg+434B,+3023+EX+Rotterdam&output=embed',
  socials: {},
  reservationUrl: 'tel:+31100000000',
  gallery: [
    'https://images.unsplash.com/photo-1622286342621-4bd786c24470?w=800&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Kapsalon · Nieuwe Binnenweg',
      description: 'Knippen en baardverzorging op de Nieuwe Binnenweg in Rotterdam.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Behandelingen & prijzen',
      openingHours: [
        { dayKey: 'mon_fri', hours: '11:00 – 19:00' },
        { dayKey: 'sat', hours: '10:00 – 18:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Knippen',
          items: [
            {
              name: 'Heren knippen',
              description: 'Knipbeurt voor heren',
              price: '€20',
            },
            {
              name: 'Kinderen knippen (t/m 12 jr)',
              description: 'Knipbeurt voor kinderen tot 12 jaar',
              price: '€15',
            },
            {
              name: 'Wassen & knippen',
              description: 'Wassen en knippen in één behandeling',
              price: '€25',
            },
          ],
        },
        {
          name: 'Baard & extra',
          items: [
            {
              name: 'Baard trimmen',
              description: 'Baard bijwerken en in model',
              price: '€10',
            },
            {
              name: 'Scheren',
              description: 'Baard of gezicht scheren',
              price: '€15',
            },
            {
              name: 'Wenkbrauwen',
              description: 'Wenkbrauwen trimmen',
              price: '€5',
            },
            {
              name: 'Kaal scheren (tondeuse)',
              description: 'Hoofd kaal scheren met tondeuse',
              price: '€12',
            },
          ],
        },
      ],
      about: {
        heading: 'Kapsalon Can',
        content:
          'Kapsalon aan de Nieuwe Binnenweg in Rotterdam. Binnenlopen kan, bellen is sneller.',
      },
    },
  },
};
