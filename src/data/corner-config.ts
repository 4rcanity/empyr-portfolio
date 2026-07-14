import type { SiteConfig } from '../types/site-config';

export const cornerConfig: SiteConfig = {
  slug: 'corner',
  name: 'Pixel & Pour Café',
  businessType: 'cafe',
  theme: {
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#FFD23F',
    background: '#FFFDF8',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    muted: '#5C5C7A',
    onPrimaryText: '#1A1A2E',
    onPrimaryMuted: '#3D3D5C',
    onAccentText: '#1A1A2E',
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
  content: {
    nl: {
      tagline: 'Verse koffie. Bold flavours. Hele dag door.',
      description:
        'Jouw buurtplek voor specialty coffee, all-day brunch en smashburgers. Loop gewoon binnen — reserveren is niet nodig.',
      dailySpecial: 'Vandaag: gesmashte avocadotoast + flat white — €12,50',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:00 – 18:00' },
        { dayKey: 'sat', hours: '08:00 – 19:00' },
        { dayKey: 'sun', hours: '08:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Koffie & Drinken',
          items: [
            { name: 'Flat White', description: 'Dubbele ristretto, zijdezachte microfoam', price: '€4,50', tags: ['vegetarian'] },
            { name: 'Cold Brew', description: '18 uur gezet, wisselende single origin', price: '€5,00', tags: ['vegan'] },
            { name: 'Verse Sinaasappelsap', description: 'Vers geperst', price: '€4,00', tags: ['vegan'] },
          ],
        },
        {
          name: 'Brunch',
          items: [
            { name: 'Gesmashte Avocadotoast', description: 'Zuurdesem, feta, chilivlokken, gepocheerd ei', price: '€12,50', tags: ['vegetarian'] },
            { name: 'Shakshuka', description: 'Gekruide tomatenbasis, gebakken eieren, labneh, pita', price: '€13,50', tags: ['vegetarian', 'spicy'] },
            { name: 'Granolabowl', description: 'Griekse yoghurt, seizoensfruit, honing, amandelen', price: '€10,00', tags: ['vegetarian'] },
          ],
        },
        {
          name: 'Burgers & Bites',
          items: [
            { name: 'Smash Burger', description: 'Dubbele patty, Amerikaanse kaas, augurk, geheim sausje', price: '€14,00' },
            { name: 'Krokante Kipsandwich', description: 'Buttermilk gefrituurd, koolsalade, hot honey', price: '€13,50', tags: ['spicy'] },
            { name: 'Truffelfriet', description: 'Parmezaan, truffelolie, kruiden', price: '€6,50', tags: ['vegetarian'] },
          ],
        },
      ],
      about: {
        heading: 'Jouw hoek, jouw café',
        content:
          'Pixel & Pour Café is een fictief caféconcept dat laat zien hoe een kleurrijke buurtzaak online kan opvallen. Alle namen, locaties en contactgegevens op deze demo zijn placeholders.',
      },
    },
    en: {
      tagline: 'Fresh coffee. Bold flavours. All day.',
      description:
        'Your neighbourhood spot for specialty coffee, all-day brunch, and smash burgers. Walk in anytime — no reservation needed.',
      dailySpecial: 'Today: Smashed avocado toast + flat white — €12.50',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:00 – 18:00' },
        { dayKey: 'sat', hours: '08:00 – 19:00' },
        { dayKey: 'sun', hours: '08:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Coffee & Drinks',
          items: [
            { name: 'Flat White', description: 'Double ristretto, silky microfoam', price: '€4.50', tags: ['vegetarian'] },
            { name: 'Cold Brew', description: '18-hour steep, single origin rotating', price: '€5.00', tags: ['vegan'] },
            { name: 'Fresh Orange Juice', description: 'Squeezed to order', price: '€4.00', tags: ['vegan'] },
          ],
        },
        {
          name: 'Brunch',
          items: [
            { name: 'Smashed Avo Toast', description: 'Sourdough, feta, chilli flakes, poached egg', price: '€12.50', tags: ['vegetarian'] },
            { name: 'Shakshuka', description: 'Spiced tomato base, baked eggs, labneh, pita', price: '€13.50', tags: ['vegetarian', 'spicy'] },
            { name: 'Granola Bowl', description: 'Greek yogurt, seasonal fruit, honey, almonds', price: '€10.00', tags: ['vegetarian'] },
          ],
        },
        {
          name: 'Burgers & Bites',
          items: [
            { name: 'Smash Burger', description: 'Double patty, American cheese, pickles, secret sauce', price: '€14.00' },
            { name: 'Crispy Chicken Sandwich', description: 'Buttermilk fried, slaw, hot honey', price: '€13.50', tags: ['spicy'] },
            { name: 'Truffle Fries', description: 'Parmesan, truffle oil, herbs', price: '€6.50', tags: ['vegetarian'] },
          ],
        },
      ],
      about: {
        heading: 'Your corner, your café',
        content:
          'Pixel & Pour Café is a fictional café concept showing how a colourful neighbourhood business can stand out online. All names, locations and contact details in this demo are placeholders.',
      },
    },
  },
};
