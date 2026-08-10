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
  heroImage:
    'https://images.unsplash.com/photo-1584974390610-ca4c8d0e8e3e?w=1600&q=80',
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
    'https://images.unsplash.com/photo-1558171813-4c088754af7f?w=800&q=80',
    'https://images.unsplash.com/photo-1594938298608-c8148c4dae35?w=800&q=80',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Kledingreparatie · Nieuwe Binnenweg',
      description:
        'Vermaken, reparaties en kleine aanpassingen — breng uw kledingstuk langs of bel vooraf.',
      ctaLabel: 'Bel voor een afspraak',
      menuSectionLabel: 'Reparaties & prijzen',
      openingHours: [
        { dayKey: 'mon_fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 17:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Vermaken',
          items: [
            {
              name: 'Broek innemen / korter maken',
              description: 'Taille of pijplengte aanpassen',
              price: 'vanaf €18',
            },
            {
              name: 'Rok inkorten',
              description: 'Zoom of voering meenemen waar nodig',
              price: 'vanaf €15',
            },
            {
              name: 'Jas vermaken',
              description: 'Mouwen of lengte bijstellen',
              price: 'vanaf €35',
            },
            {
              name: 'Zoom omleggen',
              description: 'Broek, rok of jas',
              price: 'vanaf €12',
            },
          ],
        },
        {
          name: 'Reparaties',
          items: [
            {
              name: 'Rits vervangen (broek / jas)',
              description: 'Inclusief rits en arbeid',
              price: 'vanaf €22',
            },
            {
              name: 'Knopen vervangen',
              description: 'Per knoop of set',
              price: 'vanaf €3',
            },
            {
              name: 'Voering vervangen',
              description: 'Jas of mantel, afhankelijk van stof',
              price: 'vanaf €45',
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
