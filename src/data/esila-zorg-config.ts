import type { NlDemoConfig } from './nl-demo';

export const esilaZorgConfig: NlDemoConfig = {
  slug: 'esila-zorg',
  name: 'Esila Zorg',
  businessType: 'care',
  theme: {
    primary: '#2E7D6B',
    secondary: '#256B5C',
    accent: '#2E7D6B',
    background: '#F4F7F5',
    surface: '#FFFFFF',
    text: '#1E293B',
    muted: '#64748B',
    onPrimaryText: '#FFFFFF',
    onPrimaryMuted: '#C8E6DF',
    onAccentText: '#FFFFFF',
    fontHeading: '"DM Sans", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    variant: 'esila-zorg',
  },
  heroImage:
    'https://images.unsplash.com/photo-1576765617530-46828e99e388?auto=format&fit=crop&w=1600&q=80',
  phone: '+31 10 000 0000',
  email: 'info@esilazorg.nl',
  address: {
    street: 'Nieuwe Binnenweg 507',
    city: 'Rotterdam',
    postalCode: '3023 EP',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9136, lng: 4.4618 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Binnenweg+507,+3023+EP+Rotterdam&output=embed',
  socials: {},
  gallery: [
    'https://images.unsplash.com/photo-1581579438742-33c5a7ae711a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516734212186-a967f21ad0d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559027615-cd4628907079?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Thuiszorg en ondersteuning · Rotterdam',
      description:
        'Zorgaanbieder voor thuiszorg, begeleiding en huishoudelijke hulp in Rotterdam.',
      ctaLabel: 'Bel voor een gesprek',
      menuSectionLabel: 'Onze zorg',
      openingHours: [
        { dayKey: 'mon_fri', hours: '09:00 – 17:00' },
        { dayKey: 'sat', hours: null },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Zorg en ondersteuning',
          items: [
            {
              name: 'Thuiszorg',
              description:
                'Professionele zorg en ondersteuning in uw eigen omgeving.',
              price: 'op aanvraag',
            },
            {
              name: 'Persoonlijke verzorging',
              description:
                'Hulp bij dagelijkse persoonlijke verzorging, afgestemd op uw situatie.',
              price: 'op aanvraag',
            },
            {
              name: 'Individuele begeleiding',
              description:
                'Begeleiding en ondersteuning bij dagelijkse activiteiten en zelfstandigheid.',
              price: 'op aanvraag',
            },
            {
              name: 'Huishoudelijke ondersteuning',
              description:
                'Hulp in en om het huis, zoals schoonmaken en lichte huishoudelijke taken.',
              price: 'op aanvraag',
            },
          ],
        },
      ],
      about: {
        heading: 'Esila Zorg',
        content: 'Zorgaanbieder aan de Nieuwe Binnenweg in Rotterdam.',
      },
    },
  },
};
