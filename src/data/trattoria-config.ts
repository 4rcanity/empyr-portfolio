import type { SiteConfig } from '../types/site-config';

export const trattoriaConfig: SiteConfig = {
  slug: 'trattoria',
  name: 'Trattoria Tavola',
  businessType: 'restaurant',
  theme: {
    primary: '#8B4513',
    secondary: '#D4A574',
    accent: '#C0392B',
    background: '#FBF7F2',
    surface: '#FFFFFF',
    text: '#2C1810',
    muted: '#6B5344',
    onPrimaryText: '#FBF3E9',
    onPrimaryMuted: '#E4CBB3',
    onAccentText: '#FFFFFF',
    fontHeading: '"Playfair Display", Georgia, serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'trattoria',
  },
  heroImage:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
  phone: '+31 20 000 0001',
  email: 'hello@trattoriatavola.example',
  address: {
    street: 'Voorbeeldstraat 10',
    city: 'Demostad',
    postalCode: '1234 AB',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.0, lng: 5.0 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.0,5.0&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000001',
  aboutImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
    'https://images.unsplash.com/photo-1598866594230-a7c158562c60?w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Familierecepten sinds 1987',
      description:
        'Authentiek Italiaans dineren in het hart van de stad. Vers gemaakte pasta, houtoven-pizza en warme gastvrijheid, elke avond.',
      bookingNote: 'Bel ons om een tafel te reserveren. Inlopen kan op doordeweekse dagen.',
      openingHours: [
        { dayKey: 'mon', hours: null },
        { dayKey: 'tue_thu', hours: '17:00 – 22:00' },
        { dayKey: 'fri_sat', hours: '12:00 – 23:00' },
        { dayKey: 'sun', hours: '12:00 – 21:00' },
      ],
      menu: [
        {
          name: 'Antipasti',
          items: [
            {
              name: 'Burrata con Pomodoro',
              description: 'Romige burrata, heirloom tomaten, basilicumolie, oude balsamico',
              price: '€14',
              tags: ['vegetarian'],
            },
            {
              name: 'Bruschetta al Pomodoro',
              description: 'Gegrild zuurdesembrood, San Marzano tomaten, knoflook, verse basilicum',
              price: '€9',
              tags: ['vegetarian', 'vegan'],
            },
            {
              name: 'Carpaccio di Manzo',
              description: 'Dungesneden rundvlees, rucola, parmezaanschaafsel, citroendressing',
              price: '€16',
            },
          ],
        },
        {
          name: 'Pasta',
          items: [
            {
              name: 'Tagliatelle al Ragù',
              description: 'Langzaam gestoofde bolognese, verse eierpasta, pecorino',
              price: '€19',
            },
            {
              name: 'Spaghetti alle Vongole',
              description: 'Venusschelpen, witte wijn, knoflook, peterselie, chili',
              price: '€22',
              tags: ['spicy'],
            },
            {
              name: 'Pappardelle ai Funghi',
              description: 'Wilde paddenstoelen, truffelroom, tijm',
              price: '€21',
              tags: ['vegetarian'],
            },
          ],
        },
        {
          name: 'Secondi',
          items: [
            {
              name: 'Saltimbocca alla Romana',
              description: 'Kalfsvlees, prosciutto, salie, witte wijnsaus',
              price: '€28',
            },
            {
              name: 'Branzino al Forno',
              description: 'Ovengebakken zeebaars, kappertjes, cherrytomaten, olijven',
              price: '€26',
              tags: ['gluten-free'],
            },
          ],
        },
      ],
      testimonials: [
        {
          quote:
            'De beste pasta buiten Italië. Oma zou trots zijn — de ragù smaakt als een zondagse familielunch.',
          author: 'Marco R.',
          source: 'Google Reviews',
        },
        {
          quote: 'Warme sfeer, attente bediening, en de tiramisu is de reis alleen al waard.',
          author: 'Sophie L.',
          source: 'TripAdvisor',
        },
      ],
      about: {
        heading: 'Drie generaties aan tafel',
        content:
          'Trattoria Tavola is een fictief restaurantconcept, ontworpen om te laten zien hoe een warme Italiaanse familiezaak online tot leven kan komen. Alle namen, locaties en contactgegevens op deze demo zijn placeholders.',
      },
    },
    en: {
      tagline: 'Family recipes since 1987',
      description:
        'Authentic Italian dining in the heart of the city. Handmade pasta, wood-fired pizza, and warm hospitality every evening.',
      bookingNote: 'Call us to reserve your table. Walk-ins welcome on weekdays.',
      openingHours: [
        { dayKey: 'mon', hours: null },
        { dayKey: 'tue_thu', hours: '17:00 – 22:00' },
        { dayKey: 'fri_sat', hours: '12:00 – 23:00' },
        { dayKey: 'sun', hours: '12:00 – 21:00' },
      ],
      menu: [
        {
          name: 'Antipasti',
          items: [
            {
              name: 'Burrata con Pomodoro',
              description: 'Creamy burrata, heirloom tomatoes, basil oil, aged balsamic',
              price: '€14',
              tags: ['vegetarian'],
            },
            {
              name: 'Bruschetta al Pomodoro',
              description: 'Grilled sourdough, San Marzano tomatoes, garlic, fresh basil',
              price: '€9',
              tags: ['vegetarian', 'vegan'],
            },
            {
              name: 'Carpaccio di Manzo',
              description: 'Thinly sliced beef, rocket, parmesan shavings, lemon dressing',
              price: '€16',
            },
          ],
        },
        {
          name: 'Pasta',
          items: [
            {
              name: 'Tagliatelle al Ragù',
              description: 'Slow-cooked Bolognese, fresh egg pasta, pecorino',
              price: '€19',
            },
            {
              name: 'Spaghetti alle Vongole',
              description: 'Clams, white wine, garlic, parsley, chili',
              price: '€22',
              tags: ['spicy'],
            },
            {
              name: 'Pappardelle ai Funghi',
              description: 'Wild mushrooms, truffle cream, thyme',
              price: '€21',
              tags: ['vegetarian'],
            },
          ],
        },
        {
          name: 'Secondi',
          items: [
            {
              name: 'Saltimbocca alla Romana',
              description: 'Veal, prosciutto, sage, white wine sauce',
              price: '€28',
            },
            {
              name: 'Branzino al Forno',
              description: 'Oven-roasted sea bass, capers, cherry tomatoes, olives',
              price: '€26',
              tags: ['gluten-free'],
            },
          ],
        },
      ],
      testimonials: [
        {
          quote:
            'The best pasta outside of Italy. Nonna would approve — the ragù tastes like Sunday dinner at home.',
          author: 'Marco R.',
          source: 'Google Reviews',
        },
        {
          quote: 'Warm atmosphere, attentive staff, and the tiramisu is worth the trip alone.',
          author: 'Sophie L.',
          source: 'TripAdvisor',
        },
      ],
      about: {
        heading: 'Three generations at the table',
        content:
          'Trattoria Tavola is a fictional restaurant concept designed to show how a warm Italian family business can come alive online. All names, locations and contact details in this demo are placeholders.',
      },
    },
  },
};
