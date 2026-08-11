import type { NlDemoConfig } from './nl-demo';

export const esilaZorgConfig: NlDemoConfig = {
  slug: 'esila-zorg',
  name: 'Zorg & Ondersteuning',
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
  ],
  content: {
    nl: {
      tagline: 'Thuiszorg en ondersteuning',
      description: 'Zorgaanbieder voor thuiszorg, begeleiding en huishoudelijke hulp.',
      ctaLabel: 'Bel voor een gesprek',
      menuSectionLabel: 'Onze zorg',
      bookingNote:
        'Voorbeeldwebsite: openingstijden, prijzen, logo en foto’s zijn voorbeelden en vullen we aan met uw eigen gegevens.',
      openingHours: [
        { dayKey: 'mon', hours: '09:00 – 17:00' },
        { dayKey: 'tue_thu', hours: 'Voorbeeld' },
        { dayKey: 'fri_sat', hours: 'Voorbeeld' },
        { dayKey: 'sun', hours: 'Voorbeeld' },
      ],
      menu: [
        {
          name: 'Zorg en ondersteuning',
          items: [
            {
              name: 'Thuiszorg',
              description: 'Professionele zorg en ondersteuning in uw eigen omgeving.',
              price: 'op aanvraag',
            },
            {
              name: 'Persoonlijke verzorging',
              description: 'Hulp bij dagelijkse persoonlijke verzorging, afgestemd op uw situatie.',
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
        heading: 'Zorg & Ondersteuning',
        content: 'Zorgaanbieder voor thuiszorg en begeleiding.',
      },
    },
  },
};
