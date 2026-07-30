import type { SiteConfig } from '../types/site-config';

/** Performance / specialty shop — graphite floor, signal yellow, motorsport energy. */
export const apexConfig: SiteConfig = {
  slug: 'apex',
  name: 'Apex Motorsport',
  businessType: 'garage',
  theme: {
    primary: '#0b0d10',
    secondary: '#14181f',
    accent: '#d6ff3a',
    background: '#0b0d10',
    surface: '#14181f',
    text: '#f4f6f8',
    muted: '#9aa3ad',
    onPrimaryText: '#f4f6f8',
    onPrimaryMuted: '#9aa3ad',
    onAccentText: '#0b0d10',
    fontHeading: '"Oswald", "Impact", sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80',
  phone: '+31 20 000 0102',
  email: 'builds@apexmotorsport.example',
  address: {
    street: 'Pitlane 7',
    city: 'Demostad',
    postalCode: '1234 CD',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.02, lng: 5.02 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.02,5.02&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000102',
  aboutImage:
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.9, count: 92, source: 'Google' },
  content: {
    nl: {
      tagline: 'Performance engineered. Track validated.',
      description:
        'Tuning, onderstel en track prep voor chauffeurs die weekends meten in rondetijden.',
      bookingNote: 'Vraag een build-slot aan — we plannen rond jouw racekalender.',
      ctaLabel: 'Vraag een build-slot',
      secondaryCtaLabel: 'Bekijk capabilities',
      menuSectionLabel: 'Shop capabilities',
      ratingNote: '92+ Google reviews',
      openingHours: [
        { dayKey: 'tue_thu', hours: '09:00 – 19:00' },
        { dayKey: 'fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '10:00 – 16:00' },
        { dayKey: 'sun', hours: null },
        { dayKey: 'mon', hours: null },
      ],
      menu: [
        {
          name: 'Power',
          items: [
            {
              name: 'ECU kalibratie',
              description: 'Custom maps voor power, rijdbaarheid en warmtemanagement',
              price: 'vanaf €450',
            },
            {
              name: 'Forced induction',
              description: 'Turbo/supercharger met fuel- en koelondersteuning',
              price: 'op project',
            },
            {
              name: 'Dyno sessie',
              description: 'Gemeten output — elke wijziging bewezen, niet geraden',
              price: '€175',
            },
          ],
        },
        {
          name: 'Chassis',
          items: [
            {
              name: 'Onderstel & geometrie',
              description: 'Coilovers, uitlijning en corner balance',
              price: 'vanaf €320',
            },
            {
              name: 'Rem-upgrades',
              description: 'Big brake kits die trackdays overleven',
              price: 'op offerte',
            },
            {
              name: 'Track support',
              description: 'Paddock-checklists en mid-event fixes',
              price: 'op afspraak',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Map voelde strak op straat én op circuit. Geen drama, gewoon data.',
          author: 'Lars K.',
          source: 'Instagram',
        },
        {
          quote: 'Eindelijk een shop die projectscopes serieus neemt.',
          author: 'Nina P.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Gebouwd voor serieuze drivers',
        content:
          'Apex Motorsport is een specialty shop voor street-legal power en full weekend warriors. Duidelijke scopes, gedocumenteerde builds, zero fluff.',
        chefName: 'Alex Visser',
        chefTitle: 'Lead calibrator',
      },
    },
    en: {
      tagline: 'Performance engineered. Track validated.',
      description:
        'Tuning, suspension, and track prep for drivers who measure weekends in lap times.',
      bookingNote: 'Request a build slot — we plan around your race calendar.',
      ctaLabel: 'Request a build slot',
      secondaryCtaLabel: 'View capabilities',
      menuSectionLabel: 'Shop capabilities',
      ratingNote: '92+ Google reviews',
      openingHours: [
        { dayKey: 'tue_thu', hours: '09:00 – 19:00' },
        { dayKey: 'fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '10:00 – 16:00' },
        { dayKey: 'sun', hours: null },
        { dayKey: 'mon', hours: null },
      ],
      menu: [
        {
          name: 'Power',
          items: [
            {
              name: 'ECU calibration',
              description: 'Custom maps for power, drivability, and heat management',
              price: 'from €450',
            },
            {
              name: 'Forced induction',
              description: 'Turbo/supercharger with supporting fuel and cooling',
              price: 'project based',
            },
            {
              name: 'Dyno session',
              description: 'Measured output so every change is proven, not guessed',
              price: '€175',
            },
          ],
        },
        {
          name: 'Chassis',
          items: [
            {
              name: 'Suspension geometry',
              description: 'Coilovers, alignment, and corner balance',
              price: 'from €320',
            },
            {
              name: 'Brake upgrades',
              description: 'Big brake kits that survive repeated track days',
              price: 'on quote',
            },
            {
              name: 'Track support',
              description: 'Paddock checklists and mid-event fixes',
              price: 'by appointment',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Map felt sharp on street and track. No drama, just data.',
          author: 'Lars K.',
          source: 'Instagram',
        },
        {
          quote: 'Finally a shop that takes project scopes seriously.',
          author: 'Nina P.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Built for serious drivers',
        content:
          'Apex Motorsport is a specialty shop for street-legal power and full weekend warriors. Clear scopes, documented builds, zero fluff.',
        chefName: 'Alex Visser',
        chefTitle: 'Lead calibrator',
      },
    },
  },
};
