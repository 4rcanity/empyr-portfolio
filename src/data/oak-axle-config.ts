import type { SiteConfig } from '../types/site-config';

/** Family garage demo — hours, map, services, Call/WhatsApp. No filler lore. */
export const oakAxleConfig: SiteConfig = {
  slug: 'oak-axle',
  name: 'Oak & Axle Garage',
  businessType: 'garage',
  theme: {
    primary: '#0f2419',
    secondary: '#183226',
    accent: '#a8d4b5',
    background: '#0f2419',
    surface: '#183226',
    text: '#f0f7f2',
    muted: '#9fb5a6',
    onPrimaryText: '#f0f7f2',
    onPrimaryMuted: '#9fb5a6',
    onAccentText: '#0c1a12',
    fontHeading: '"Playfair Display", Georgia, serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 10 426 8800',
  email: 'info@oakandaxle.example',
  address: {
    street: 'Nieuwe Haven 42',
    city: 'Schiedam',
    postalCode: '3116 AC',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9158, lng: 4.3989 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Nieuwe+Haven+42,+3116+AC+Schiedam&output=embed',
  socials: {},
  reservationUrl: 'https://wa.me/31104268800',
  aboutImage:
    'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493238792120-b42e3a1b7b5e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1449965403121-adbf74930ec4?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Onderhoud, banden en APK',
      description: 'Plan online via bel of WhatsApp. Ma–vr + zaterdagmorgen.',
      bookingNote: 'Bel of WhatsApp — we plannen meestal binnen 1–2 werkdagen.',
      ctaLabel: 'Plan via WhatsApp',
      secondaryCtaLabel: 'Diensten',
      menuSectionLabel: 'Diensten & prijzen',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'APK & check',
          items: [
            {
              name: 'APK',
              description: 'Keuring personenauto',
              price: '€52,50',
            },
            {
              name: 'Veiligheidscheck',
              description: 'Remmen, banden, lichten, ruitenwissers',
              price: '€35',
            },
          ],
        },
        {
          name: 'Onderhoud',
          items: [
            {
              name: 'Oliebeurt',
              description: 'Synthetische olie + oliefilter',
              price: 'vanaf €85',
            },
            {
              name: 'Airco bijvullen',
              description: 'Vanaf €49 inclusief controle',
              price: 'vanaf €49',
            },
            {
              name: 'Automatische transmissie',
              description: 'Verversen ATF / transmissieolie',
              price: 'op offerte',
            },
          ],
        },
        {
          name: 'Banden',
          items: [
            {
              name: 'Seizoenswissel',
              description: 'Wissel + balanceren + opslaglabel',
              price: 'vanaf €40',
            },
            {
              name: 'Nieuwe banden',
              description: 'Levering en montage alle maten',
              price: 'op offerte',
            },
          ],
        },
      ],
      about: {
        heading: 'Oak & Axle Garage',
        content:
          'Garage in Schiedam. APK, onderhoud, airco, banden en reparatie. Contact: telefoon of WhatsApp.',
      },
    },
    en: {
      tagline: 'Service, tyres and MOT',
      description: 'Book by phone or WhatsApp. Weekdays + Saturday morning.',
      bookingNote: 'Call or WhatsApp — usually scheduled within 1–2 working days.',
      ctaLabel: 'Book via WhatsApp',
      secondaryCtaLabel: 'Services',
      menuSectionLabel: 'Services & prices',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'MOT & check',
          items: [
            {
              name: 'MOT',
              description: 'Passenger-car inspection',
              price: '€52.50',
            },
            {
              name: 'Safety check',
              description: 'Brakes, tyres, lights, wipers',
              price: '€35',
            },
          ],
        },
        {
          name: 'Service',
          items: [
            {
              name: 'Oil service',
              description: 'Synthetic oil + oil filter',
              price: 'from €85',
            },
            {
              name: 'A/C refill',
              description: 'From €49 including system check',
              price: 'from €49',
            },
            {
              name: 'Automatic transmission',
              description: 'ATF / transmission fluid change',
              price: 'on quote',
            },
          ],
        },
        {
          name: 'Tyres',
          items: [
            {
              name: 'Seasonal swap',
              description: 'Swap + balance + storage tag',
              price: 'from €40',
            },
            {
              name: 'New tyres',
              description: 'Supply and fit, all sizes',
              price: 'on quote',
            },
          ],
        },
      ],
      about: {
        heading: 'Oak & Axle Garage',
        content:
          'Garage in Schiedam. MOT, servicing, A/C, tyres and repairs. Contact by phone or WhatsApp.',
      },
    },
  },
};
