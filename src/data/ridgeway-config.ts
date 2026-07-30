import type { SiteConfig } from '../types/site-config';

/** Neighborhood garage demo — practical contact, hours, and priced services only. */
export const ridgewayConfig: SiteConfig = {
  slug: 'ridgeway',
  name: 'Ridgeway Auto Care',
  businessType: 'garage',
  theme: {
    primary: '#2a1f18',
    secondary: '#3a2c22',
    accent: '#d9772c',
    background: '#2a1f18',
    surface: '#3a2c22',
    text: '#f7efe6',
    muted: '#c4b0a0',
    onPrimaryText: '#f7efe6',
    onPrimaryMuted: '#c4b0a0',
    onAccentText: '#1f160f',
    fontHeading: '"Oswald", "Arial Narrow", sans-serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 6 3801 1091',
  email: 'info@ridgewayauto.example',
  address: {
    street: 'Van Beverenstraat 5B',
    city: 'Schiedam',
    postalCode: '3117 KS',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9194, lng: 4.3883 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Van+Beverenstraat+5B,+3117+KS+Schiedam&output=embed',
  socials: {},
  reservationUrl: 'https://wa.me/31638011091',
  aboutImage:
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae538?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'APK, onderhoud en reparatie in Schiedam',
      description: 'Bel of WhatsApp voor een afspraak. Alle merken.',
      bookingNote: 'Ma–za 09:00–18:00. WhatsApp voor snelle planning.',
      ctaLabel: 'Bel of WhatsApp',
      secondaryCtaLabel: 'Diensten & prijzen',
      menuSectionLabel: 'Diensten',
      openingHours: [
        { dayKey: 'mon_fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 18:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Keuring & onderhoud',
          items: [
            {
              name: 'APK-keuring',
              description: 'Personenauto’s; gratis herkeuring bij herstel bij ons',
              price: '€54,50',
            },
            {
              name: 'APK bij grote beurt',
              description: 'Gratis APK bij een grote onderhoudsbeurt',
              price: 'gratis',
            },
            {
              name: 'Onderhoudsbeurt',
              description: 'Olie, filters, peilvloeistoffen — op maat per merk',
              price: 'vanaf €89',
            },
          ],
        },
        {
          name: 'Service & reparatie',
          items: [
            {
              name: 'Airco bijvullen',
              description: 'Controle + bijvullen koudemiddel',
              price: 'vanaf €49',
            },
            {
              name: 'Banden & balanceren',
              description: 'Nieuwe banden, wissel, balanceren',
              price: 'op offerte',
            },
            {
              name: 'Storingsdiagnose',
              description: 'Uitlezen storingslampje + diagnose',
              price: '€45',
            },
            {
              name: 'Accu controleren / vervangen',
              description: 'Test en montage op locatie',
              price: 'vanaf €95',
            },
          ],
        },
      ],
      about: {
        heading: 'Ridgeway Auto Care',
        content:
          'Autobedrijf in Schiedam voor APK, onderhoud, airco, banden en reparatie. Afspraak via telefoon of WhatsApp.',
      },
    },
    en: {
      tagline: 'MOT, service and repair in Schiedam',
      description: 'Call or WhatsApp to book. All makes.',
      bookingNote: 'Mon–Sat 09:00–18:00. WhatsApp for quick scheduling.',
      ctaLabel: 'Call or WhatsApp',
      secondaryCtaLabel: 'Services & prices',
      menuSectionLabel: 'Services',
      openingHours: [
        { dayKey: 'mon_fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 18:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Inspection & service',
          items: [
            {
              name: 'MOT inspection',
              description: 'Passenger cars; free recheck when we fix the issues',
              price: '€54.50',
            },
            {
              name: 'MOT with major service',
              description: 'Free MOT with a major maintenance service',
              price: 'free',
            },
            {
              name: 'Maintenance service',
              description: 'Oil, filters, fluids — priced per make',
              price: 'from €89',
            },
          ],
        },
        {
          name: 'Repair & care',
          items: [
            {
              name: 'A/C refill',
              description: 'System check + refrigerant top-up',
              price: 'from €49',
            },
            {
              name: 'Tyres & balancing',
              description: 'New tyres, seasonal swap, balancing',
              price: 'on quote',
            },
            {
              name: 'Fault diagnosis',
              description: 'Warning-light scan + diagnosis',
              price: '€45',
            },
            {
              name: 'Battery test / replace',
              description: 'Load test and on-site fitting',
              price: 'from €95',
            },
          ],
        },
      ],
      about: {
        heading: 'Ridgeway Auto Care',
        content:
          'Garage in Schiedam for MOT, servicing, A/C, tyres and repairs. Book by phone or WhatsApp.',
      },
    },
  },
};
