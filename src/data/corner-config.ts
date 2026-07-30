import type { SiteConfig } from '../types/site-config';

export const cornerConfig: SiteConfig = {
  slug: 'corner',
  name: 'Pixel & Pour Café',
  businessType: 'cafe',
  theme: {
    primary: '#e85d2a',
    secondary: '#0b3d66',
    accent: '#ffe566',
    background: '#fff9f0',
    surface: '#ffffff',
    text: '#1c1a2e',
    muted: '#5a5678',
    onPrimaryText: '#fff9f0',
    onPrimaryMuted: '#ffe8d6',
    onAccentText: '#1c1a2e',
    fontHeading: '"Space Grotesk", system-ui, sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'corner',
  },
  heroImage:
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80',
  phone: '+31 20 000 0003',
  email: 'hello@pixelandpour.example',
  address: {
    street: 'Mockupplein 7',
    city: 'Demostad',
    postalCode: '1234 EF',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.02, lng: 5.02 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.02,5.02&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  aboutImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
  ],
  instagramFeed: [
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&q=80',
  ],
  deliveryLinks: [
    { name: 'Uber Eats', url: 'https://ubereats.com' },
    { name: 'Deliveroo', url: 'https://deliveroo.com' },
    { name: 'Thuisbezorgd', url: 'https://thuisbezorgd.nl' },
  ],
  reservationUrl: 'tel:+31200000003',
  halal: true,
  content: {
    nl: {
      tagline: 'Specialty koffie · all-day plates · 100% halal',
      description: 'Espresso, dayboard en bezorging. Geen alcoholkaart.',
      dailySpecial: 'Vandaag: kimchi-scramble bowl + oat cortado — €13,90',
      ctaLabel: 'Bel ons',
      secondaryCtaLabel: 'Bestel bezorging',
      menuSectionLabel: 'Dayboard',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:00 – 18:00' },
        { dayKey: 'sat', hours: '08:00 – 19:00' },
        { dayKey: 'sun', hours: '08:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Bar & brouwen',
          items: [
            { name: 'Pixel Flat', description: 'Dubbele ristretto, oat of zuivel', price: '€4,20', tags: ['vegetarian'] },
            { name: 'Batch Cold Brew', description: '20 uur, wisselende single origin', price: '€5,20', tags: ['vegan'] },
            { name: 'Huisgemaakte limo-munt', description: 'Vers geperst', price: '€4,40', tags: ['vegan'] },
          ],
        },
        {
          name: 'All-day plates',
          items: [
            { name: 'Kimchi scramble bowl', description: 'Kimchi, soft scramble, sesam, zuurdesem', price: '€13,90', tags: ['vegetarian', 'spicy'] },
            { name: 'Labneh toast stack', description: 'Chili-olie, komkommer, zaatar, gepocheerd ei', price: '€12,80', tags: ['vegetarian'] },
            { name: 'Halal smash double', description: 'Twee patties, pickles, secret sauce, brioche', price: '€14,50', tags: ['halal'] },
          ],
        },
        {
          name: 'Late lunch bites',
          items: [
            { name: 'Hot-honey chicken bun', description: 'Krokante kip, koolsalade, sesambun', price: '€13,20', tags: ['halal', 'spicy'] },
            { name: 'Misofriet', description: 'Nori-zout, mayo dip', price: '€6,80', tags: ['vegan'] },
            { name: 'Cookie flight', description: 'Drie warme koeken — wisselende batch', price: '€5,50', tags: ['vegetarian'] },
          ],
        },
      ],
      about: {
        heading: 'Pixel & Pour Café',
        content:
          'Café met specialty espresso, all-day dayboard en bezorgpartners. 100% halal, geen alcohol. Demoadres voor de template.',
      },
    },
    en: {
      tagline: 'Specialty coffee · all-day plates · 100% halal',
      description: 'Espresso, dayboard, and delivery. No alcohol list.',
      dailySpecial: 'Today: kimchi scramble bowl + oat cortado — €13.90',
      ctaLabel: 'Call us',
      secondaryCtaLabel: 'Order delivery',
      menuSectionLabel: 'Dayboard',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:00 – 18:00' },
        { dayKey: 'sat', hours: '08:00 – 19:00' },
        { dayKey: 'sun', hours: '08:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Bar & brew',
          items: [
            { name: 'Pixel Flat', description: 'Double ristretto, oat or dairy', price: '€4.20', tags: ['vegetarian'] },
            { name: 'Batch Cold Brew', description: '20-hour steep, rotating single origin', price: '€5.20', tags: ['vegan'] },
            { name: 'House lime-mint', description: 'Fresh pressed', price: '€4.40', tags: ['vegan'] },
          ],
        },
        {
          name: 'All-day plates',
          items: [
            { name: 'Kimchi scramble bowl', description: 'Kimchi, soft scramble, sesame, sourdough', price: '€13.90', tags: ['vegetarian', 'spicy'] },
            { name: 'Labneh toast stack', description: 'Chili oil, cucumber, zaatar, poached egg', price: '€12.80', tags: ['vegetarian'] },
            { name: 'Halal smash double', description: 'Two patties, pickles, secret sauce, brioche', price: '€14.50', tags: ['halal'] },
          ],
        },
        {
          name: 'Late lunch bites',
          items: [
            { name: 'Hot-honey chicken bun', description: 'Crispy chicken, slaw, sesame bun', price: '€13.20', tags: ['halal', 'spicy'] },
            { name: 'Miso fries', description: 'Nori salt, mayo dip', price: '€6.80', tags: ['vegan'] },
            { name: 'Cookie flight', description: 'Three warm cookies — rotating batch', price: '€5.50', tags: ['vegetarian'] },
          ],
        },
      ],
      about: {
        heading: 'Pixel & Pour Café',
        content:
          'Café with specialty espresso, all-day dayboard, and delivery partners. 100% halal, no alcohol. Demo address for the template.',
      },
    },
  },
};
