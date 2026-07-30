import type { SiteConfig } from '../types/site-config';

/** Express garage demo — compact services, hours, Call/WhatsApp. */
export const metroConfig: SiteConfig = {
  slug: 'metro',
  name: 'Metro Quick Lane',
  businessType: 'garage',
  theme: {
    primary: '#071018',
    secondary: '#0e1c2b',
    accent: '#2eb8ff',
    background: '#071018',
    surface: '#0e1c2b',
    text: '#eef5fb',
    muted: '#8fa6bc',
    onPrimaryText: '#eef5fb',
    onPrimaryMuted: '#8fa6bc',
    onAccentText: '#031018',
    fontHeading: '"Oswald", "Arial Narrow", sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 10 737 2200',
  email: 'info@metroquicklane.example',
  address: {
    street: 'Rotterdamseweg 120',
    city: 'Schiedam',
    postalCode: '3121 AB',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9281, lng: 4.4012 },
  googleMapsEmbed:
    'https://www.google.com/maps?q=Rotterdamseweg+120,+3121+AB+Schiedam&output=embed',
  socials: {},
  reservationUrl: 'https://wa.me/31107372200',
  aboutImage:
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520340356584-dc35d710b4aa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609521263047-f8f925109d25?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'Snelle olie · filters · APK',
      description: 'Express service. Bel of WhatsApp voor een lane.',
      bookingNote: 'Open 7 dagen. WhatsApp voor wachttijd.',
      ctaLabel: 'Bel / WhatsApp',
      secondaryCtaLabel: 'Prijzen',
      menuSectionLabel: 'Express menu',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:30 – 19:00' },
        { dayKey: 'sat', hours: '08:00 – 17:00' },
        { dayKey: 'sun', hours: '10:00 – 16:00' },
      ],
      menu: [
        {
          name: 'Express',
          items: [
            {
              name: 'Olie + filter',
              description: 'Synthetisch, incl. cabin-check',
              price: 'vanaf €59',
            },
            {
              name: 'APK express',
              description: 'Keuring terwijl u wacht (op afspraak)',
              price: '€54,50',
            },
            {
              name: 'Filter duo',
              description: 'Luchtfilter + interieurfilter',
              price: 'vanaf €38',
            },
          ],
        },
        {
          name: 'Extra',
          items: [
            {
              name: 'Airco bijvullen',
              description: 'Snelle airco-service',
              price: 'vanaf €49',
            },
            {
              name: 'Bandenrotatie',
              description: 'Rotatie, druk, balanceren',
              price: 'vanaf €32',
            },
            {
              name: 'Accu-test',
              description: 'Belastingstest + uitslag op de spot',
              price: '€12',
            },
            {
              name: 'Ruitenwissers + peil',
              description: 'Wissers, ruitensproeier, koelvloeistof',
              price: 'vanaf €22',
            },
          ],
        },
      ],
      about: {
        heading: 'Metro Quick Lane',
        content:
          'Express garage in Schiedam voor olie, filters, APK, airco en banden. Afspraak: bel of WhatsApp.',
      },
    },
    en: {
      tagline: 'Fast oil · filters · MOT',
      description: 'Express service. Call or WhatsApp for a lane.',
      bookingNote: 'Open 7 days. WhatsApp for wait time.',
      ctaLabel: 'Call / WhatsApp',
      secondaryCtaLabel: 'Prices',
      menuSectionLabel: 'Express menu',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:30 – 19:00' },
        { dayKey: 'sat', hours: '08:00 – 17:00' },
        { dayKey: 'sun', hours: '10:00 – 16:00' },
      ],
      menu: [
        {
          name: 'Express',
          items: [
            {
              name: 'Oil + filter',
              description: 'Synthetic, includes cabin check',
              price: 'from €59',
            },
            {
              name: 'MOT express',
              description: 'Inspection while you wait (by appointment)',
              price: '€54.50',
            },
            {
              name: 'Filter duo',
              description: 'Air filter + cabin filter',
              price: 'from €38',
            },
          ],
        },
        {
          name: 'Extras',
          items: [
            {
              name: 'A/C refill',
              description: 'Quick A/C service',
              price: 'from €49',
            },
            {
              name: 'Tyre rotation',
              description: 'Rotate, pressure, balance',
              price: 'from €32',
            },
            {
              name: 'Battery test',
              description: 'Load test with on-the-spot result',
              price: '€12',
            },
            {
              name: 'Wipers + levels',
              description: 'Wipers, washer fluid, coolant',
              price: 'from €22',
            },
          ],
        },
      ],
      about: {
        heading: 'Metro Quick Lane',
        content:
          'Express garage in Schiedam for oil, filters, MOT, A/C and tyres. Book by phone or WhatsApp.',
      },
    },
  },
};
