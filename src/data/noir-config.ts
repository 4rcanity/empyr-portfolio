import type { SiteConfig } from '../types/site-config';

export const noirConfig: SiteConfig = {
  slug: 'noir',
  name: 'Atelier Nocturne',
  businessType: 'restaurant',
  theme: {
    primary: '#1A1A1A',
    secondary: '#2D2D2D',
    accent: '#C9A962',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#F5F0E8',
    muted: '#A89F8F',
    onPrimaryText: '#F5F0E8',
    onPrimaryMuted: '#A89F8F',
    onAccentText: '#1A1A1A',
    fontHeading: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Inter", system-ui, sans-serif',
    variant: 'noir',
  },
  heroImage:
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1600&q=80&sat=-40',
  phone: '+31 20 000 0002',
  email: 'reservations@ateliernocturne.example',
  address: {
    street: 'Conceptlaan 21',
    city: 'Demostad',
    postalCode: '1234 CD',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.01, lng: 5.01 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.01,5.01&output=embed',
  socials: {
    instagram: 'https://instagram.com',
  },
  reservationUrl: 'mailto:reservations@ateliernocturne.example?subject=Table%20Reservation',
  aboutImage: 'https://images.unsplash.com/photo-1577219491135-ce391730e2c2?w=900&q=80&sat=-30',
  gallery: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&sat=-50',
  ],
  halal: true,
  content: {
    nl: {
      tagline: 'Modern Europees fine dining',
      description:
        'Een intieme fine-diningervaring met een volledig halal en alcoholvrij menu. Seizoensproducten en precieze techniek.',
      bookingNote: 'Reserveringen worden 30 dagen van tevoren vrijgegeven. Dresscode: smart casual.',
      openingHours: [
        { dayKey: 'mon_tue', hours: null },
        { dayKey: 'wed_thu', hours: '18:00 – 22:00' },
        { dayKey: 'fri_sat', hours: '18:00 – 23:00' },
        { dayKey: 'sun', hours: '18:00 – 21:00' },
      ],
      menu: [
        {
          name: 'Proeverij',
          items: [
            {
              name: 'Zeven Gangen',
              description:
                'Seizoensgebonden proeverij met optionele alcoholvrije pairing. Dieetwensen mogelijk met 48u vooraankondiging.',
              price: '€95',
              tags: ['halal'],
            },
            {
              name: 'Vijf Gangen',
              description: 'Een compacte reis langs de favorieten van de chef.',
              price: '€72',
              tags: ['halal'],
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Eendenlever Parfait',
              description: 'Vijgengelei, brioche, gepekelde sjalot',
              price: '€24',
              tags: ['halal'],
            },
            {
              name: 'Noordzeetarbot',
              description: 'Citrusboter, venkel, kaviaarboter',
              price: '€38',
              tags: ['halal', 'gluten-free'],
            },
            {
              name: 'Wagyu Ribeye',
              description: 'Geschroeide look, mergjus, pommes soufflées',
              price: '€52',
              tags: ['halal'],
            },
            {
              name: 'Bol van Pure Chocolade',
              description: 'Passievrucht, hazelnootpraliné, bladgoud',
              price: '€16',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      about: {
        heading: 'Chef Alex Vermeer',
        content:
          'Atelier Nocturne is een fictief fine-diningconcept dat laat zien hoe een ingetogen restaurantmerk digitaal kan worden gepresenteerd. Alle namen, locaties en contactgegevens op deze demo zijn placeholders.',
        chefName: 'Alex Vermeer',
        chefTitle: 'Uitvoerend Chef',
      },
    },
    en: {
      tagline: 'Modern European fine dining',
      description:
        'An intimate fine-dining experience with a fully halal, alcohol-free menu. Seasonal ingredients meet precise technique.',
      bookingNote: 'We release reservations 30 days in advance. Dress code: smart casual.',
      openingHours: [
        { dayKey: 'mon_tue', hours: null },
        { dayKey: 'wed_thu', hours: '18:00 – 22:00' },
        { dayKey: 'fri_sat', hours: '18:00 – 23:00' },
        { dayKey: 'sun', hours: '18:00 – 21:00' },
      ],
      menu: [
        {
          name: 'Tasting Menu',
          items: [
            {
              name: 'Seven Courses',
              description:
                'Seasonal tasting journey with an optional alcohol-free pairing. Dietary requirements accommodated with 48h notice.',
              price: '€95',
              tags: ['halal'],
            },
            {
              name: 'Five Courses',
              description: "A condensed journey through the chef's current favourites.",
              price: '€72',
              tags: ['halal'],
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Duck Liver Parfait',
              description: 'Fig gelée, brioche, pickled shallot',
              price: '€24',
              tags: ['halal'],
            },
            {
              name: 'North Sea Turbot',
              description: 'Citrus butter, fennel, caviar beurre',
              price: '€38',
              tags: ['halal', 'gluten-free'],
            },
            {
              name: 'Wagyu Ribeye',
              description: 'Charred leek, bone marrow jus, pommes soufflées',
              price: '€52',
              tags: ['halal'],
            },
            {
              name: 'Dark Chocolate Sphere',
              description: 'Passion fruit, hazelnut praline, gold leaf',
              price: '€16',
              tags: ['vegetarian'],
            },
          ],
        },
      ],
      about: {
        heading: 'Chef Alex Vermeer',
        content:
          'Atelier Nocturne is a fictional fine-dining concept showing how a restrained restaurant brand can be presented digitally. All names, locations and contact details in this demo are placeholders.',
        chefName: 'Alex Vermeer',
        chefTitle: 'Executive Chef',
      },
    },
  },
};
