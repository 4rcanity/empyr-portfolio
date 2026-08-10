import type { NlDemoConfig } from './nl-demo';

export const goldpointConfig: NlDemoConfig = {
  slug: 'goldpoint',
  name: 'Gold Point Jewelry and Watches',
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
  heroImage:
    'https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=1600&q=80',
  phone: '+31 10 000 0000',
  email: 'info@goldpoint-rotterdam.nl',
  address: {
    street: 'Rochussenstraat 517/515',
    city: 'Rotterdam',
    postalCode: '3023 DL',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9128, lng: 4.4636 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Rochussenstraat+517,+3023+DL+Rotterdam&output=embed',
  socials: {},
  gallery: [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Juwelier & horlogemaker · Rochussenstraat',
      description:
        'Verkoop en reparatie van gouden sieraden en horloges in Rotterdam.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Diensten & prijzen',
      openingHours: [
        { dayKey: 'mon_fri', hours: '12:00 – 17:00' },
        { dayKey: 'sat', hours: '12:00 – 17:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Sieraden',
          items: [
            {
              name: 'Ring vermaken',
              description: 'Maat aanpassen of ring herstellen',
              price: 'vanaf €25',
            },
            {
              name: 'Ketting repareren',
              description: 'Schakel, sluiting of gehele ketting',
              price: 'vanaf €30',
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
              price: 'vanaf €15',
            },
            {
              name: 'Horlogeband',
              description: 'Band vervangen of maat aanpassen',
              price: 'vanaf €35',
            },
            {
              name: 'Horloge revisie',
              description: 'Volledige controle en onderhoud',
              price: 'vanaf €75',
            },
          ],
        },
      ],
      about: {
        heading: 'Gold Point',
        content:
          'Juwelier en horlogemaker aan de Rochussenstraat in Rotterdam.',
      },
    },
  },
};
