import type { NlDemoConfig } from './nl-demo';

export const astexConfig: NlDemoConfig = {
  slug: 'astex',
  name: 'Astex Textiel Kledingreparatie',
  businessType: 'tailor',
  theme: {
    primary: '#1C1917',
    secondary: '#292524',
    accent: '#B33A2B',
    background: '#F7F3ED',
    surface: '#FFFCF7',
    text: '#1C1917',
    muted: '#6B6560',
    onPrimaryText: '#F7F3ED',
    onPrimaryMuted: '#A8A29E',
    onAccentText: '#FFFFFF',
    fontHeading: '"Space Grotesk", system-ui, sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'astex',
  },
  logo: '/voorbeeld/logo.svg',
  heroImage: '/voorbeeld/afbeelding.svg',
  phone: '+31 10 000 0000',
  email: 'info@astex-rotterdam.nl',
  address: {
    street: 'Nieuwe Binnenweg 525',
    city: 'Rotterdam',
    postalCode: '3023 EP',
    country: 'Nederland',
  },
  coordinates: { lat: 51.9134, lng: 4.4622 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Binnenweg+525,+3023+EP+Rotterdam&output=embed',
  socials: {},
  gallery: [
    '/voorbeeld/afbeelding-1.svg',
    '/voorbeeld/afbeelding-2.svg',
    '/voorbeeld/afbeelding-3.svg',
    '/voorbeeld/afbeelding-4.svg',
  ],
  content: {
    nl: {
      tagline: 'Kledingreparatie · Nieuwe Binnenweg',
      description:
        'Vermaken, reparaties en kleine aanpassingen — breng uw kledingstuk langs of bel vooraf.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Reparaties & prijzen',
      bookingNote:
        'Voorbeeldwebsite: openingstijden, prijzen, logo en foto’s zijn voorbeelden en vullen we aan met uw eigen gegevens.',
      openingHours: [
        { dayKey: 'mon', hours: '09:00 – 18:00' },
        { dayKey: 'tue_thu', hours: 'Voorbeeld' },
        { dayKey: 'fri_sat', hours: 'Voorbeeld' },
        { dayKey: 'sun', hours: 'Voorbeeld' },
      ],
      menu: [
        {
          name: 'Vermaken',
          items: [
            {
              name: 'Broek innemen / korter maken',
              description: 'Taille of pijplengte aanpassen',
              price: 'Voorbeeld',
            },
            {
              name: 'Rok inkorten',
              description: 'Zoom of voering meenemen waar nodig',
              price: 'Voorbeeld',
            },
            {
              name: 'Jas vermaken',
              description: 'Mouwen of lengte bijstellen',
              price: 'Voorbeeld',
            },
            {
              name: 'Zoom omleggen',
              description: 'Broek, rok of jas',
              price: 'Voorbeeld',
            },
          ],
        },
        {
          name: 'Reparaties',
          items: [
            {
              name: 'Rits vervangen (broek / jas)',
              description: 'Inclusief rits en arbeid',
              price: 'Voorbeeld',
            },
            {
              name: 'Knopen vervangen',
              description: 'Per knoop of set',
              price: 'Voorbeeld',
            },
            {
              name: 'Voering vervangen',
              description: 'Jas of mantel, afhankelijk van stof',
              price: 'Voorbeeld',
            },
          ],
        },
      ],
      about: {
        heading: 'Astex Textiel Kledingreparatie',
        content:
          'Kledingreparatie en vermaakwerk aan de Nieuwe Binnenweg in Rotterdam.',
      },
    },
  },
};
