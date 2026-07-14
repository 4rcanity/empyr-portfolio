import type { SiteConfig } from '../types/site-config';

export const noirConfig: SiteConfig = {
  slug: 'noir',
  name: 'Noir',
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
  phone: '+31 20 987 6543',
  email: 'reservations@noir.example',
  address: {
    street: 'Keizersgracht 128',
    city: 'Amsterdam',
    postalCode: '1015 CW',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.3744, lng: 4.885 },
  googleMapsEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.0!2d4.885!3d52.3744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDIyJzI3LjgiTiA0wrA1MycwNi4wIkU!5e0!3m2!1sen!2snl!4v1',
  socials: {
    instagram: 'https://instagram.com',
  },
  reservationUrl: 'mailto:reservations@noir.example?subject=Table%20Reservation',
  aboutImage: 'https://images.unsplash.com/photo-1577219491135-ce391730e2c2?w=900&q=80&sat=-30',
  gallery: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&sat=-50',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&sat=-50',
  ],
  content: {
    nl: {
      tagline: 'Modern Europees fine dining',
      description:
        'Een intieme dine-ervaring waar seizoensgebonden ingrediënten en precieze techniek samenkomen. Reserveren aanbevolen.',
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
                'Seizoensgebonden proeverij met optionele wijnpairing. Dieetwensen mogelijk met 48u vooraankondiging.',
              price: '€95',
            },
            {
              name: 'Vijf Gangen',
              description: 'Een compacte reis langs de favorieten van de chef.',
              price: '€72',
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Eendenlever Parfait',
              description: 'Sauternes gelei, brioche, gepekelde sjalot',
              price: '€24',
            },
            {
              name: 'Noordzeetarbot',
              description: 'Beurre blanc, venkel, kaviaarboter',
              price: '€38',
              tags: ['gluten-free'],
            },
            {
              name: 'Wagyu Ribeye',
              description: 'Geschroeide look, mergjus, pommes soufflées',
              price: '€52',
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
      wineList: [
        { name: 'Champagne Ruinart Blanc de Blancs', region: 'Champagne, FR', price: '€18 / glas', note: 'Fris, mineraal' },
        { name: 'Sancerre "Les Belles Vignes"', region: 'Loire, FR', price: '€12 / glas', note: 'Citrus, vuursteen' },
        { name: 'Barolo "Bricco delle Viole"', region: 'Piemonte, IT', price: '€22 / glas', note: 'Kers, teer, roos' },
        { name: 'Riesling Spätlese', region: 'Mosel, DE', price: '€11 / glas', note: 'Steenfruit, leisteen' },
        { name: 'Pinot Noir "Calera"', region: 'Central Coast, VS', price: '€16 / glas', note: 'Zijdezacht, rood fruit' },
      ],
      about: {
        heading: 'Chef Thomas van der Berg',
        content:
          'Na een decennium in Michelinsterren-keukens in Kopenhagen en Parijs keerde chef Thomas terug naar Amsterdam om Noir te creëren — een restaurant gebouwd op terughoudendheid, seizoensgebondenheid en het geloof dat luxe te vinden is in precisie, niet in overdaad.',
        chefName: 'Thomas van der Berg',
        chefTitle: 'Uitvoerend Chef',
      },
    },
    en: {
      tagline: 'Modern European fine dining',
      description:
        'An intimate dining experience where seasonal ingredients meet precise technique. Reservations recommended.',
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
                'Seasonal tasting journey with optional wine pairing. Dietary requirements accommodated with 48h notice.',
              price: '€95',
            },
            {
              name: 'Five Courses',
              description: "A condensed journey through the chef's current favourites.",
              price: '€72',
            },
          ],
        },
        {
          name: 'À la Carte',
          items: [
            {
              name: 'Duck Liver Parfait',
              description: 'Sauternes gelée, brioche, pickled shallot',
              price: '€24',
            },
            {
              name: 'North Sea Turbot',
              description: 'Beurre blanc, fennel, caviar beurre',
              price: '€38',
              tags: ['gluten-free'],
            },
            {
              name: 'Wagyu Ribeye',
              description: 'Charred leek, bone marrow jus, pommes soufflées',
              price: '€52',
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
      wineList: [
        { name: 'Champagne Ruinart Blanc de Blancs', region: 'Champagne, FR', price: '€18 / glass', note: 'Crisp, mineral' },
        { name: 'Sancerre "Les Belles Vignes"', region: 'Loire, FR', price: '€12 / glass', note: 'Citrus, flint' },
        { name: 'Barolo "Bricco delle Viole"', region: 'Piedmont, IT', price: '€22 / glass', note: 'Cherry, tar, rose' },
        { name: 'Riesling Spätlese', region: 'Mosel, DE', price: '€11 / glass', note: 'Stone fruit, slate' },
        { name: 'Pinot Noir "Calera"', region: 'Central Coast, US', price: '€16 / glass', note: 'Silky, red berry' },
      ],
      about: {
        heading: 'Chef Thomas van der Berg',
        content:
          'After a decade in Michelin-starred kitchens across Copenhagen and Paris, Chef Thomas returned to Amsterdam to create Noir — a restaurant built on restraint, seasonality, and the belief that luxury is found in precision, not excess.',
        chefName: 'Thomas van der Berg',
        chefTitle: 'Executive Chef',
      },
    },
  },
};
