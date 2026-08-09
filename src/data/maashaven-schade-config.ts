import type { SiteConfig } from '../types/site-config';

/**
 * Demo body-repair garage at Rotterdam Maashaven harbour.
 * Fictional business; services, prices and copy are illustrative.
 */
export const maashavenSchadeConfig = {
  slug: 'maashaven-schade',
  name: 'Schadeherstel Maashaven',
  businessType: 'garage',
  theme: {
    primary: '#1b6b8a',
    secondary: '#155a73',
    accent: '#1b6b8a',
    background: '#f4f6f8',
    surface: '#ffffff',
    text: '#1a2332',
    muted: '#5a6578',
    onPrimaryText: '#ffffff',
    onPrimaryMuted: '#b8d4e0',
    onAccentText: '#ffffff',
    fontHeading: '"Space Grotesk", system-ui, sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'maashaven-schade',
  },
  heroImage:
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80',
  phone: '+31 10 808 4520',
  email: 'info@schadeherstelmaashaven.nl',
  address: {
    street: 'Maashaven Noordzijde 24',
    city: 'Rotterdam',
    postalCode: '3081 CB',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9055, lng: 4.4852 },
  googleMapsEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2459.8!2d4.4852!3d51.9055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4337b8c8c8c8d%3A0x0!2sMaashaven%2C%20Rotterdam!5e0!3m2!1snl!2snl!4v1',
  socials: {},
  reservationUrl: 'tel:+31108084520',
  gallery: [
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.6, count: 87, source: 'Google' },
  content: {
    nl: {
      tagline: 'Carrosserie & verzekeringsschade',
      description:
        'Carrosserieherstel aan de Maashaven. Uitdeuken, spuiten en ruitvervanging — wij regelen ook de afhandeling met uw verzekeraar.',
      bookingNote: 'Bel voor een afspraak of schade-inspectie. Geen online formulieren — direct contact.',
      ctaLabel: 'Bel voor afspraak',
      secondaryCtaLabel: 'Bekijk diensten',
      menuSectionLabel: 'Diensten & tarieven',
      ratingNote: '87 beoordelingen op Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Carrosserie',
          items: [
            {
              name: 'Uitdeuken',
              description: 'Deuken verwijderen zonder spuitwerk, waar mogelijk',
              price: 'vanaf €95',
            },
            {
              name: 'Spuiten',
              description: 'Lakherstel en gedeeltelijke respuit per paneel',
              price: 'vanaf €350',
            },
            {
              name: 'Ruitvervanging',
              description: 'Voorruit, zijruit of achterruit — inclusief demontage',
              price: 'vanaf €180',
            },
            {
              name: 'Verzekeringsschade afhandeling',
              description: 'Schadeformulier, taxatie en directe facturering aan verzekeraar',
              price: 'gratis offerte',
            },
          ],
        },
      ],
      about: {
        heading: 'Schadeherstel Maashaven',
        content: 'Carrosseriebedrijf aan de Maashaven, Rotterdam. Verzekeringsschade welkom.',
      },
    },
    en: {
      tagline: 'Body repair & insurance claims',
      description:
        'Body repair at Maashaven harbour. Dent removal, respray and glass replacement — we also handle insurance claims on your behalf.',
      bookingNote: 'Call to book an appointment or damage inspection. No online forms — speak to us directly.',
      ctaLabel: 'Call to book',
      secondaryCtaLabel: 'View services',
      menuSectionLabel: 'Services & rates',
      ratingNote: '87 reviews on Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Body work',
          items: [
            {
              name: 'Dent removal',
              description: 'Paintless dent repair where possible',
              price: 'from €95',
            },
            {
              name: 'Respray',
              description: 'Paint repair and partial panel respray',
              price: 'from €350',
            },
            {
              name: 'Glass replacement',
              description: 'Windscreen, side or rear glass — fitting included',
              price: 'from €180',
            },
            {
              name: 'Insurance claim handling',
              description: 'Claim forms, assessment and direct billing to your insurer',
              price: 'free quote',
            },
          ],
        },
      ],
      about: {
        heading: 'Schadeherstel Maashaven',
        content: 'Body shop at Maashaven, Rotterdam. Insurance claims welcome.',
      },
    },
  },
} as SiteConfig;
