import type { SiteConfig, TemplateVariant } from '../types/site-config';

export const charloisConfig: SiteConfig = {
  slug: 'charlois',
  name: 'Autotechniek Charlois',
  businessType: 'garage',
  theme: {
    primary: '#0f1729',
    secondary: '#162036',
    accent: '#e85d04',
    background: '#0f1729',
    surface: '#162036',
    text: '#e8edf5',
    muted: '#8b95a8',
    onPrimaryText: '#e8edf5',
    onPrimaryMuted: '#8b95a8',
    onAccentText: '#0f1729',
    fontHeading: '"Oswald", system-ui, sans-serif',
    fontBody: '"Source Sans 3", system-ui, sans-serif',
    variant: 'charlois' as TemplateVariant,
  },
  heroImage:
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80',
  phone: '+31 10 486 2847',
  email: 'info@charlois.example',
  address: {
    street: 'Wolphaertsbocht 142',
    city: 'Rotterdam',
    postalCode: '3082 AR',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.8892, lng: 4.4785 },
  googleMapsEmbed: 'https://www.google.com/maps?q=51.8892,4.4785&output=embed',
  socials: {},
  reservationUrl: 'tel:+31104862847',
  rating: { value: 4.7, count: 214, source: 'Google' },
  gallery: [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  ],
  content: {
    nl: {
      tagline: 'RDW-erkend autobedrijf · Charlois',
      description: 'APK, onderhoud en reparatie voor alle merken. Bel voor een afspraak.',
      bookingNote: 'Prijzen indicatief — offerte na inspectie.',
      ctaLabel: 'Bel ons',
      menuSectionLabel: 'Diensten & tarieven',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'APK',
          items: [
            {
              name: 'APK keuring personenauto',
              description: 'Inclusief milieutest en rapportage',
              price: 'vanaf €49',
            },
            {
              name: 'APK herkeuring',
              description: 'Binnen 2 maanden na afkeur',
              price: 'vanaf €35',
            },
            {
              name: 'APK + kleine beurt',
              description: 'Keuring met olie- en vloeistofcontrole',
              price: 'vanaf €89',
            },
          ],
        },
        {
          name: 'Onderhoud',
          items: [
            {
              name: 'Kleine beurt',
              description: 'Olie, filters, bandenspanning en veiligheidscheck',
              price: 'vanaf €129',
            },
            {
              name: 'Grote beurt',
              description: 'Volgens fabrieksschema incl. rem- en uitlaatcontrole',
              price: 'vanaf €249',
            },
            {
              name: 'Olieservice',
              description: 'Motorolie en filter vervangen',
              price: 'vanaf €89',
            },
            {
              name: 'Airco service',
              description: 'Controle, bijvullen en desinfectie',
              price: 'vanaf €79',
            },
          ],
        },
        {
          name: 'Reparatie',
          items: [
            {
              name: 'Remmen vooras',
              description: 'Schijven en/of blokken vervangen (materiaal excl.)',
              price: 'vanaf €149',
            },
            {
              name: 'Uitlaatreparatie',
              description: 'Demper, flexibel deel of complete sectie',
              price: 'vanaf €95',
            },
            {
              name: 'Storing uitlezen',
              description: 'OBD-diagnose en foutcode-rapport',
              price: 'vanaf €45',
            },
            {
              name: 'Uurtarief mechaniek',
              description: 'Reparatiewerk aan motor, onderstel of aandrijving',
              price: '€69/uur',
            },
          ],
        },
      ],
      about: {
        heading: 'Autotechniek Charlois',
        content: 'RDW-erkend autobedrijf in Rotterdam-Charlois.',
      },
    },
    en: {
      tagline: 'RDW-approved garage · Charlois',
      description: 'MOT, maintenance and repairs for all makes. Call to book.',
      bookingNote: 'Prices indicative — quote after inspection.',
      ctaLabel: 'Call us',
      menuSectionLabel: 'Services & rates',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'MOT (APK)',
          items: [
            {
              name: 'Car MOT inspection',
              description: 'Including emissions test and report',
              price: 'from €49',
            },
            {
              name: 'MOT re-inspection',
              description: 'Within 2 months of failure',
              price: 'from €35',
            },
            {
              name: 'MOT + minor service',
              description: 'Inspection with oil and fluid check',
              price: 'from €89',
            },
          ],
        },
        {
          name: 'Maintenance',
          items: [
            {
              name: 'Minor service',
              description: 'Oil, filters, tyre pressure and safety check',
              price: 'from €129',
            },
            {
              name: 'Major service',
              description: 'Per manufacturer schedule incl. brake and exhaust check',
              price: 'from €249',
            },
            {
              name: 'Oil change',
              description: 'Engine oil and filter replacement',
              price: 'from €89',
            },
            {
              name: 'A/C service',
              description: 'Check, refill and disinfection',
              price: 'from €79',
            },
          ],
        },
        {
          name: 'Repairs',
          items: [
            {
              name: 'Front brake service',
              description: 'Discs and/or pads replaced (parts excl.)',
              price: 'from €149',
            },
            {
              name: 'Exhaust repair',
              description: 'Silencer, flex pipe or section replacement',
              price: 'from €95',
            },
            {
              name: 'Fault code scan',
              description: 'OBD diagnosis and error report',
              price: 'from €45',
            },
            {
              name: 'Labour rate',
              description: 'Engine, chassis or drivetrain repairs',
              price: '€69/hr',
            },
          ],
        },
      ],
      about: {
        heading: 'Autotechniek Charlois',
        content: 'RDW-approved garage in Rotterdam-Charlois.',
      },
    },
  },
};
