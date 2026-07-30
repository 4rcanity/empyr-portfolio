import type { SiteConfig } from '../types/site-config';

/** Specialty garage demo — contact, hours, priced services, Call/WhatsApp only. */
export const apexConfig: SiteConfig = {
  slug: 'apex',
  name: 'Apex Motorsport',
  businessType: 'garage',
  theme: {
    primary: '#08090c',
    secondary: '#12151c',
    accent: '#c8ff2e',
    background: '#08090c',
    surface: '#12151c',
    text: '#f2f5f8',
    muted: '#8e97a3',
    onPrimaryText: '#f2f5f8',
    onPrimaryMuted: '#8e97a3',
    onAccentText: '#0a0c10',
    fontHeading: '"Oswald", "Impact", sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 10 820 4410',
  email: 'info@apexmotorsport.example',
  address: {
    street: 'Vijfsluizenweg 18',
    city: 'Schiedam',
    postalCode: '3125 AE',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9352, lng: 4.3721 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Vijfsluizenweg+18,+3125+AE+Schiedam&output=embed',
  socials: {},
  reservationUrl: 'https://wa.me/31108204410',
  aboutImage:
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'APK-station · onderhoud · reparatie',
      description: 'Afspraak via bel of WhatsApp. Alle merken voertuigen.',
      bookingNote: 'Di–za open. Bel of WhatsApp voor een put.',
      ctaLabel: 'WhatsApp ons',
      secondaryCtaLabel: 'Bekijk diensten',
      menuSectionLabel: 'Prijzen',
      openingHours: [
        { dayKey: 'mon', hours: null },
        { dayKey: 'tue_thu', hours: '08:30 – 17:30' },
        { dayKey: 'fri', hours: '08:30 – 17:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Keuring',
          items: [
            {
              name: 'APK-keuring',
              description: 'RDW-erkend · personenauto',
              price: '€49,95',
            },
            {
              name: 'Aankoopkeuring',
              description: 'Grondige check vóór aankoop',
              price: 'vanaf €99',
            },
          ],
        },
        {
          name: 'Onderhoud',
          items: [
            {
              name: 'Kleine beurt',
              description: 'Olie + filter + veiligheidscheck',
              price: 'vanaf €79',
            },
            {
              name: 'Grote beurt',
              description: 'Volledig onderhoud volgens schema',
              price: 'vanaf €189',
            },
            {
              name: 'Airco service',
              description: 'Controle, reiniging, bijvullen',
              price: 'vanaf €49',
            },
          ],
        },
        {
          name: 'Reparatie',
          items: [
            {
              name: 'Remmen',
              description: 'Blokken, schijven, vloeistof',
              price: 'op offerte',
            },
            {
              name: 'Distributieriem',
              description: 'Vervanging incl. waterpomp op aanvraag',
              price: 'op offerte',
            },
            {
              name: 'Koppeling',
              description: 'Vervanging koppelingsset',
              price: 'op offerte',
            },
          ],
        },
      ],
      about: {
        heading: 'Apex Motorsport',
        content:
          'Garage in Schiedam voor APK, onderhoud en reparatie. Plan via telefoon of WhatsApp.',
      },
    },
    en: {
      tagline: 'MOT station · service · repair',
      description: 'Book by phone or WhatsApp. All vehicle makes.',
      bookingNote: 'Tue–Sat open. Call or WhatsApp for a bay.',
      ctaLabel: 'WhatsApp us',
      secondaryCtaLabel: 'See services',
      menuSectionLabel: 'Pricing',
      openingHours: [
        { dayKey: 'mon', hours: null },
        { dayKey: 'tue_thu', hours: '08:30 – 17:30' },
        { dayKey: 'fri', hours: '08:30 – 17:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Inspection',
          items: [
            {
              name: 'MOT inspection',
              description: 'Authorised station · passenger cars',
              price: '€49.95',
            },
            {
              name: 'Pre-purchase inspection',
              description: 'Full check before you buy',
              price: 'from €99',
            },
          ],
        },
        {
          name: 'Service',
          items: [
            {
              name: 'Minor service',
              description: 'Oil + filter + safety check',
              price: 'from €79',
            },
            {
              name: 'Major service',
              description: 'Full schedule-based maintenance',
              price: 'from €189',
            },
            {
              name: 'A/C service',
              description: 'Check, clean, refrigerant top-up',
              price: 'from €49',
            },
          ],
        },
        {
          name: 'Repair',
          items: [
            {
              name: 'Brakes',
              description: 'Pads, discs, fluid',
              price: 'on quote',
            },
            {
              name: 'Timing belt',
              description: 'Replacement; water pump on request',
              price: 'on quote',
            },
            {
              name: 'Clutch',
              description: 'Clutch kit replacement',
              price: 'on quote',
            },
          ],
        },
      ],
      about: {
        heading: 'Apex Motorsport',
        content:
          'Garage in Schiedam for MOT, servicing and repairs. Book by phone or WhatsApp.',
      },
    },
  },
};
