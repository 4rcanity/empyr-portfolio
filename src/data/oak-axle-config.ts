import type { SiteConfig } from '../types/site-config';

/** Family-owned trust shop — deep forest, calm confidence, multi-generation feel. */
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
  phone: '+31 20 000 0103',
  email: 'hello@oakandaxle.example',
  address: {
    street: 'Eikenlaan 4',
    city: 'Demostad',
    postalCode: '1234 EF',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.03, lng: 5.03 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.03,5.03&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000103',
  aboutImage:
    'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493238792120-b42e3a1b7b5e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1449965403121-adbf74930ec4?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.9, count: 241, source: 'Google' },
  content: {
    nl: {
      tagline: 'Drie generaties. Eén familiewagen.',
      description:
        'Rustige diagnoses, goed/beter/best-opties en foto-updates — voor huishoudens die de auto als tweede keuken zien.',
      bookingNote: 'Plan online; we appen zodra de diagnose klaar is (meestal voor lunch).',
      ctaLabel: 'Plan een familiebezoek',
      secondaryCtaLabel: 'Hoe wij werken',
      menuSectionLabel: 'Zorg voor het huishouden',
      ratingNote: '241+ families op Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Voor de deur',
          items: [
            {
              name: 'Schoolrun veiligheidscheck',
              description: 'Kindersloten, banden, remmen en ruiten — 30 minuten rust',
              price: '€42',
            },
            {
              name: 'Seizoenswissel compleet',
              description: 'Banden, opslaglabel, bandenspanning en een winter/zomerbriefje',
              price: 'vanaf €85',
            },
            {
              name: 'Hybrid gezondheidscheck',
              description: 'HV-accu-indicatie, koeling en regeneratiegedrag uitgelegd in gewoon Nederlands',
              price: 'vanaf €95',
            },
          ],
        },
        {
          name: 'Voorkomen i.p.v. schrikken',
          items: [
            {
              name: 'Riem & waterpomp plan',
              description: 'Preventief schema op jouw kilometerstand — geen verrassing bij 180k',
              price: 'op offerte',
            },
            {
              name: 'Foto-offerte pack',
              description: 'Elke slijtage met foto + drie keuzes: goed / beter / best',
              price: 'inbegrepen',
            },
            {
              name: 'Leenfiets of rit naar huis',
              description: 'Als de klus langer duurt dan beloofd — wij regelen de terugweg',
              price: 'op aanvraag',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Eindelijk goed / beter / best zonder druk. We kozen midden — en kregen foto\'s erbij.',
          author: 'Fatima H.',
          source: 'Google',
        },
        {
          quote: 'Oma\'s Polo en onze hybrid in dezelfde week. Beide netjes, beide uitgelegd.',
          author: 'Peter L.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Alsof je buur het sleutelgat kent',
        content:
          'Oak & Axle is een familiegarage: respect voor schooltijden, budgetten en de auto die iedereen deelt. Same-day updates, eerlijke opties en lokale nazorg als iets wat wij monteerden aandacht vraagt.',
        chefName: 'Els & Jan van Oak',
        chefTitle: 'Eigenaren',
      },
    },
    en: {
      tagline: 'Three generations. One family car.',
      description:
        'Calm diagnostics, good/better/best options, and photo updates — for households that treat the car like a second kitchen.',
      bookingNote: 'Book online; we text when diagnosis is done (usually before lunch).',
      ctaLabel: 'Book a family visit',
      secondaryCtaLabel: 'How we work',
      menuSectionLabel: 'Household car care',
      ratingNote: '241+ families on Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:30 – 17:30' },
        { dayKey: 'sat', hours: '09:00 – 13:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'At the curb',
          items: [
            {
              name: 'School-run safety check',
              description: 'Child locks, tires, brakes, and glass — thirty quiet minutes',
              price: '€42',
            },
            {
              name: 'Season swap complete',
              description: 'Tires, storage tag, pressures, and a winter/summer note on the dash',
              price: 'from €85',
            },
            {
              name: 'Hybrid health check',
              description: 'HV battery clue, cooling, and regen behavior explained in plain language',
              price: 'from €95',
            },
          ],
        },
        {
          name: 'Prevent, don’t panic',
          items: [
            {
              name: 'Belt & water-pump plan',
              description: 'Preventive schedule on your mileage — no surprise at 180k',
              price: 'on quote',
            },
            {
              name: 'Photo quote pack',
              description: 'Every wear item with a photo + three choices: good / better / best',
              price: 'included',
            },
            {
              name: 'Loan bike or ride home',
              description: 'If the job runs longer than promised — we cover the trip back',
              price: 'on request',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Finally good / better / best without pressure. We picked the middle — with photos.',
          author: 'Fatima H.',
          source: 'Google',
        },
        {
          quote: 'Gran’s Polo and our hybrid the same week. Both tidy, both explained.',
          author: 'Peter L.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Like a neighbor who knows the keyhole',
        content:
          'Oak & Axle is a family garage: respect for school runs, budgets, and the car everyone shares. Same-day updates, fair options, and local follow-up if something we fitted needs attention.',
        chefName: 'Els & Jan van Oak',
        chefTitle: 'Owners',
      },
    },
  },
};
