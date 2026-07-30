import type { SiteConfig } from '../types/site-config';

/** Classic neighborhood garage — warm steel, trustworthy, walk-in friendly. */
export const ridgewayConfig: SiteConfig = {
  slug: 'ridgeway',
  name: 'Ridgeway Auto Care',
  businessType: 'garage',
  theme: {
    primary: '#1a1512',
    secondary: '#241e1a',
    accent: '#e08a2e',
    background: '#1a1512',
    surface: '#241e1a',
    text: '#f3ebe3',
    muted: '#b7a89a',
    onPrimaryText: '#f3ebe3',
    onPrimaryMuted: '#b7a89a',
    onAccentText: '#1a1512',
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
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.8, count: 186, source: 'Google' },
  content: {
    nl: {
      tagline: 'Jouw buurtgarage sinds 1994',
      description:
        'Eerlijke diagnose en reparaties op dezelfde dag — voor chauffeurs die een garage willen die gewoon opneemt.',
      bookingNote: 'Bel of plan online. Meestal dezelfde dag een plek.',
      ctaLabel: 'Plan een service',
      secondaryCtaLabel: 'Bekijk diensten',
      menuSectionLabel: 'Diensten & tarieven',
      ratingNote: '186+ beoordelingen op Google',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Onderhoud',
          items: [
            {
              name: 'Grote beurt',
              description: 'Volledige controle, olie, filters en veiligheidscheck',
              price: 'vanaf €189',
            },
            {
              name: 'Kleine beurt',
              description: 'Olie, filter en snelle veiligheidsinspectie',
              price: 'vanaf €89',
            },
            {
              name: 'APK keuring',
              description: 'Inclusief herkeuring bij kleine herstellingen',
              price: '€54,50',
            },
          ],
        },
        {
          name: 'Reparatie',
          items: [
            {
              name: 'Remmen',
              description: 'Blokken, schijven, klauwen — met duidelijke offerte vooraf',
              price: 'op offerte',
            },
            {
              name: 'Diagnose',
              description: 'Computerscan die de echte oorzaak vindt',
              price: '€45',
            },
            {
              name: 'Airco & elektra',
              description: 'Accu, dynamo, sensoren en cabinecomfort',
              price: 'op offerte',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Eindelijk een garage die uitlegt wat er speelt zonder op te dringen.',
          author: 'Sanne V.',
          source: 'Google',
        },
        {
          quote: 'Zelfde dag geholpen. Duidelijke prijs, nette afwerking.',
          author: 'Mark D.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Buurtgarage met rechte rug',
        content:
          'Ridgeway Auto Care is de buurtgarage waar je gewoon kunt binnenlopen. Geen upsell-theater: we laten zien wat er nodig is, geven een offerte en gaan pas aan de slag als jij akkoord geeft.',
        chefName: 'Tom Ridgeway',
        chefTitle: 'Eigenaar & monteur',
      },
    },
    en: {
      tagline: 'Your neighborhood garage since 1994',
      description:
        'Honest diagnostics and same-day repairs for drivers who want a shop that picks up the phone.',
      bookingNote: 'Call or book online. Usually a same-day slot.',
      ctaLabel: 'Book a service',
      secondaryCtaLabel: 'See services',
      menuSectionLabel: 'Services & pricing',
      ratingNote: '186+ Google reviews',
      openingHours: [
        { dayKey: 'mon_fri', hours: '08:00 – 18:00' },
        { dayKey: 'sat', hours: '09:00 – 14:00' },
        { dayKey: 'sun', hours: null },
      ],
      menu: [
        {
          name: 'Maintenance',
          items: [
            {
              name: 'Full service',
              description: 'Full check, oil, filters and safety inspection',
              price: 'from €189',
            },
            {
              name: 'Oil service',
              description: 'Oil, filter and quick safety check',
              price: 'from €89',
            },
            {
              name: 'MOT inspection',
              description: 'Includes recheck for minor fixes',
              price: '€54.50',
            },
          ],
        },
        {
          name: 'Repairs',
          items: [
            {
              name: 'Brakes',
              description: 'Pads, rotors, calipers — clear quote up front',
              price: 'on quote',
            },
            {
              name: 'Diagnostics',
              description: 'Computer scan that finds the real issue',
              price: '€45',
            },
            {
              name: 'AC & electrics',
              description: 'Batteries, alternators, sensors and cabin comfort',
              price: 'on quote',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Finally a garage that explains what is going on without the upsell.',
          author: 'Sanne V.',
          source: 'Google',
        },
        {
          quote: 'Helped the same day. Clear price, clean work.',
          author: 'Mark D.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Neighborhood shop, straight talk',
        content:
          'Ridgeway Auto Care is the walk-in garage that picks up the phone. No upsell theatre: we show what is needed, quote it, and only start once you approve.',
        chefName: 'Tom Ridgeway',
        chefTitle: 'Owner & technician',
      },
    },
  },
};
