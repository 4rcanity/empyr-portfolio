import type { NlDemoConfig } from './nl-demo';

export const kapsalonCanConfig: NlDemoConfig = {
  slug: 'kapsalon-can',
  name: 'Kapsalon',
  businessType: 'barbershop',
  theme: {
    primary: '#33527A',
    secondary: '#1F1F1F',
    accent: '#33527A',
    background: '#F6F4F0',
    surface: '#FFFFFF',
    text: '#1F1F1F',
    muted: '#63615D',
    onPrimaryText: '#FFFFFF',
    onPrimaryMuted: '#CBD6E5',
    onAccentText: '#FFFFFF',
    fontHeading: '"Oswald", system-ui, sans-serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'kapsalon-can',
  },
  logo: '/voorbeeld/logo.svg',
  heroImage: '/voorbeeld/afbeelding.svg',
  phone: '+31 10 000 0000',
  email: 'info@voorbeeld.nl',
  address: {
    street: 'Voorbeeldstraat 1',
    city: 'Voorbeeldstad',
    postalCode: '0000 AB',
    country: 'Nederland',
  },
  coordinates: { lat: 51.9244, lng: 4.4777 },
  googleMapsEmbed: 'https://www.google.com/maps?q=Rotterdam&output=embed',
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
      tagline: 'Kapsalon & barber',
      description: 'Knippen en baardverzorging.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Behandelingen & prijzen',
      bookingNote:
        'Voorbeeldwebsite: openingstijden, prijzen, logo en foto’s zijn voorbeelden en vullen we aan met uw eigen gegevens.',
      openingHours: [
        { dayKey: 'mon', hours: '11:00 – 19:00' },
        { dayKey: 'tue_thu', hours: 'Voorbeeld' },
        { dayKey: 'fri_sat', hours: 'Voorbeeld' },
        { dayKey: 'sun', hours: 'Voorbeeld' },
      ],
      menu: [
        {
          name: 'Knippen',
          items: [
            {
              name: 'Heren knippen',
              description: 'Knipbeurt voor heren',
              price: 'Voorbeeld',
            },
            {
              name: 'Kinderen knippen (t/m 12 jr)',
              description: 'Knipbeurt voor kinderen tot 12 jaar',
              price: 'Voorbeeld',
            },
            {
              name: 'Wassen & knippen',
              description: 'Wassen en knippen in één behandeling',
              price: 'Voorbeeld',
            },
          ],
        },
        {
          name: 'Baard & extra',
          items: [
            {
              name: 'Baard trimmen',
              description: 'Baard bijwerken en in model',
              price: 'Voorbeeld',
            },
            {
              name: 'Scheren',
              description: 'Baard of gezicht scheren',
              price: 'Voorbeeld',
            },
            {
              name: 'Wenkbrauwen',
              description: 'Wenkbrauwen trimmen',
              price: 'Voorbeeld',
            },
            {
              name: 'Kaal scheren (tondeuse)',
              description: 'Hoofd kaal scheren met tondeuse',
              price: 'Voorbeeld',
            },
          ],
        },
      ],
      about: {
        heading: 'Kapsalon',
        content: 'Kapsalon voor knippen en baardverzorging. Binnenlopen kan, bellen is sneller.',
      },
    },
  },
};
