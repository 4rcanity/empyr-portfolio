import type { SiteConfig } from '../types/site-config';

/** Classic neighborhood garage — warm steel, trustworthy, walk-in friendly. */
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
  phone: '+31 20 000 0101',
  email: 'hello@ridgewayauto.example',
  address: {
    street: 'Werkplaatsstraat 12',
    city: 'Demostad',
    postalCode: '1234 AB',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.01, lng: 5.01 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.01,5.01&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000101',
  aboutImage:
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae538?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.8, count: 186, source: 'Google' },
  content: {
    nl: {
      tagline: 'De garage die gewoon opneemt',
      description:
        'Buurtmonteurs met koffie klaar, APK zonder gedoe, en een prijs die je begrijpt vóór de sleutel valt.',
      bookingNote: 'Bel tussen 8 en 18 — meestal nog dezelfde dag een plek in de put.',
      ctaLabel: 'Bel voor een plek',
      secondaryCtaLabel: 'Wat we doen',
      menuSectionLabel: 'Buurtmenu',
      ratingNote: '186+ buren op Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Dagelijkse zorg',
          items: [
            {
              name: 'APK + snelle check',
              description: 'Keuring met gratis herkeuring bij kleine herstellingen die wij doen',
              price: '€54,50',
            },
            {
              name: 'Olie & filter buurtpakket',
              description: 'Merkolie, filter, peilvloeistoffen — klaar terwijl je koffie drinkt',
              price: 'vanaf €79',
            },
            {
              name: 'Schoolrun-inspectie',
              description: 'Remmen, banden, lichten en ruitener vóór de winter of vakantie',
              price: '€35',
            },
          ],
        },
        {
          name: 'Als het piept',
          items: [
            {
              name: 'Remmen eerlijk',
              description: 'Foto\'s van slijtage + offerte in twee lagen: nodig vs. straks',
              price: 'op offerte',
            },
            {
              name: 'Storingsdiagnose',
              description: 'Scan + wegtest — we zoeken de oorzaak, niet alleen de code',
              price: '€49',
            },
            {
              name: 'Startprobleem spoed',
              description: 'Accu, starters en dynamo — vaak nog dezelfde middag rijden',
              price: 'vanaf €65',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Tom belde zelf terug. Geen callcenter, geen upsell — gewoon: dit moet, dit kan wachten.',
          author: 'Sanne V.',
          source: 'Google',
        },
        {
          quote: 'APK + olie in één ochtend. De sleutel lag klaar met een briefje over de remblokken.',
          author: 'Mark D.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Sinds ’94 op dezelfde hoek',
        content:
          'Ridgeway Auto Care is de buurtgarage waar je binnenloopt zonder afspraaksscherm. We laten zien wat er speelt, geven een heldere offerte en gaan pas aan de slag als jij knikt. Geen theater — wel warme putten en eerlijke slang.',
        chefName: 'Tom Ridgeway',
        chefTitle: 'Eigenaar & monteur',
      },
    },
    en: {
      tagline: 'The garage that actually answers',
      description:
        'Neighborhood techs with coffee ready, MOT without the runaround, and a price you understand before the keys drop.',
      bookingNote: 'Call between 8 and 6 — usually a same-day bay.',
      ctaLabel: 'Call for a bay',
      secondaryCtaLabel: 'What we fix',
      menuSectionLabel: 'Neighborhood menu',
      ratingNote: '186+ neighbors on Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Everyday care',
          items: [
            {
              name: 'MOT + quick check',
              description: 'Inspection with free recheck on minor fixes we handle',
              price: '€54.50',
            },
            {
              name: 'Oil & filter corner pack',
              description: 'Brand oil, filter, fluids topped — done while you grab coffee',
              price: 'from €79',
            },
            {
              name: 'School-run inspection',
              description: 'Brakes, tires, lights and wipers before winter or holiday trips',
              price: '€35',
            },
          ],
        },
        {
          name: 'When it squeaks',
          items: [
            {
              name: 'Honest brakes',
              description: 'Wear photos + a two-tier quote: needed now vs. soon',
              price: 'on quote',
            },
            {
              name: 'Fault diagnosis',
              description: 'Scan plus road test — we chase the cause, not just the code',
              price: '€49',
            },
            {
              name: 'No-start rush',
              description: 'Battery, starter, alternator — often driving again that afternoon',
              price: 'from €65',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Tom called me back himself. No call center, no upsell — just: this now, this can wait.',
          author: 'Sanne V.',
          source: 'Google',
        },
        {
          quote: 'MOT and oil in one morning. Keys waiting with a note about the pads.',
          author: 'Mark D.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Same corner since ’94',
        content:
          'Ridgeway Auto Care is the walk-in garage without the booking maze. We show what is going on, quote it clearly, and only start once you nod. No theatre — warm bays and straight talk.',
        chefName: 'Tom Ridgeway',
        chefTitle: 'Owner & technician',
      },
    },
  },
};
