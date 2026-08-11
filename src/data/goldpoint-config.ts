import type { NlDemoConfig } from './nl-demo';

export const goldpointConfig: NlDemoConfig = {
  slug: 'goldpoint',
  name: 'Juwelier & Horlogemaker',
  businessType: 'jewelry',
  theme: {
    primary: '#0C0C0C',
    secondary: '#161616',
    accent: '#C8A94B',
    background: '#0A0A0A',
    surface: '#141414',
    text: '#F5F0E6',
    muted: '#9A9284',
    onPrimaryText: '#F5F0E6',
    onPrimaryMuted: '#9A9284',
    onAccentText: '#0A0A0A',
    fontHeading: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Inter", system-ui, sans-serif',
    variant: 'goldpoint',
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
  gallery: [
    '/voorbeeld/afbeelding-1.svg',
    '/voorbeeld/afbeelding-2.svg',
    '/voorbeeld/afbeelding-3.svg',
    '/voorbeeld/afbeelding-4.svg',
  ],
  content: {
    nl: {
      tagline: 'Juwelier & horlogemaker',
      description: 'Verkoop en reparatie van gouden sieraden en horloges.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Diensten & prijzen',
      bookingNote:
        'Voorbeeldwebsite: openingstijden, prijzen, logo en foto’s zijn voorbeelden en vullen we aan met uw eigen gegevens.',
      openingHours: [
        { dayKey: 'mon', hours: '12:00 – 17:00' },
        { dayKey: 'tue_thu', hours: 'Voorbeeld' },
        { dayKey: 'fri_sat', hours: 'Voorbeeld' },
        { dayKey: 'sun', hours: 'Voorbeeld' },
      ],
      menu: [
        {
          name: 'Sieraden',
          items: [
            {
              name: 'Ring vermaken',
              description: 'Maat aanpassen of ring herstellen',
              price: 'Voorbeeld',
            },
            {
              name: 'Ketting repareren',
              description: 'Schakel, sluiting of gehele ketting',
              price: 'Voorbeeld',
            },
            {
              name: 'Goud inkoop / verkoop',
              description: 'Inkoop van goud en verkoop van sieraden',
              price: 'op aanvraag',
            },
          ],
        },
        {
          name: 'Horloges',
          items: [
            {
              name: 'Horlogebatterij',
              description: 'Batterij vervangen, waterdichtheidstest',
              price: 'Voorbeeld',
            },
            {
              name: 'Horlogeband',
              description: 'Band vervangen of maat aanpassen',
              price: 'Voorbeeld',
            },
            {
              name: 'Horloge revisie',
              description: 'Volledige controle en onderhoud',
              price: 'Voorbeeld',
            },
          ],
        },
      ],
      about: {
        heading: 'Juwelier & Horlogemaker',
        content: 'Juwelier en horlogemaker voor sieraden en horloges.',
      },
    },
  },
};
