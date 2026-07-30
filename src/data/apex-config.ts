import type { SiteConfig } from '../types/site-config';

/** Performance / specialty shop — graphite floor, acid lime, motorsport energy. */
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
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.9, count: 92, source: 'Google' },
  content: {
    nl: {
      tagline: 'Lap times first. Street manners second.',
      description:
        'Dyno-backed maps, chassis geometry en brake packages voor drivers die hun weekend in sectoren splitsen.',
      bookingNote: 'Build-slots gaan naar racekalenders — stuur je events mee.',
      ctaLabel: 'Claim een build-slot',
      secondaryCtaLabel: 'Shop spec',
      menuSectionLabel: 'Bay capabilities',
      ratingNote: '92+ gemeten reviews',
      openingHours: [
        { dayKey: 'tue_thu', hours: '09:00 – 19:00' },
        { dayKey: 'fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '10:00 – 16:00' },
        { dayKey: 'sun', hours: null },
        { dayKey: 'mon', hours: null },
      ],
      menu: [
        {
          name: 'Powerlab',
          items: [
            {
              name: 'Stage map + log review',
              description: 'Custom flash met warmte- en knock-grenzen voor jouw brandstof',
              price: 'vanaf €520',
            },
            {
              name: 'Boost hardware package',
              description: 'Turbo of supercharger met fuel rail, intercooler en wastegate',
              price: 'project',
            },
            {
              name: 'Half-day dyno',
              description: 'Vier pulls, delta-log en een print die je in de paddock hangt',
              price: '€195',
            },
          ],
        },
        {
          name: 'Chassis lab',
          items: [
            {
              name: 'Corner-balance setup',
              description: 'Coilovers, camber plates, weight distribution voor jouw banden',
              price: 'vanaf €380',
            },
            {
              name: 'Endurance brake kit',
              description: 'Big brake + high-temp pads die een double-stint overleven',
              price: 'op offerte',
            },
            {
              name: 'Paddock retainer',
              description: 'Pre-event checklist + mid-weekend fixes op locatie',
              price: 'op seizoen',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Map was scherp op straat, stabiel op Zandvoort. Logs speken voor zich.',
          author: 'Lars K.',
          source: 'Instagram',
        },
        {
          quote: 'Eindelijk een shop die een scope tekent vóór ze bouten aandraaien.',
          author: 'Nina P.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Data boven drama',
        content:
          'Apex Motorsport bouwt street-legal power en weekend weapons met dezelfde discipline: scope, meet, documenteer. Geen sticker-horsepower — wel dyno-curves en chassis-notes die je kunt herhalen.',
        chefName: 'Alex Visser',
        chefTitle: 'Lead calibrator',
      },
    },
    en: {
      tagline: 'Lap times first. Street manners second.',
      description:
        'Dyno-backed maps, chassis geometry, and brake packages for drivers who split weekends into sectors.',
      bookingNote: 'Build slots follow race calendars — send your event list.',
      ctaLabel: 'Claim a build slot',
      secondaryCtaLabel: 'Shop spec',
      menuSectionLabel: 'Bay capabilities',
      ratingNote: '92+ measured reviews',
      openingHours: [
        { dayKey: 'tue_thu', hours: '09:00 – 19:00' },
        { dayKey: 'fri', hours: '09:00 – 18:00' },
        { dayKey: 'sat', hours: '10:00 – 16:00' },
        { dayKey: 'sun', hours: null },
        { dayKey: 'mon', hours: null },
      ],
      menu: [
        {
          name: 'Power lab',
          items: [
            {
              name: 'Stage map + log review',
              description: 'Custom flash with heat and knock limits for your fuel',
              price: 'from €520',
            },
            {
              name: 'Boost hardware package',
              description: 'Turbo or supercharger with fuel rail, cooler, and wastegate',
              price: 'project',
            },
            {
              name: 'Half-day dyno',
              description: 'Four pulls, delta log, and a sheet you hang in the paddock',
              price: '€195',
            },
          ],
        },
        {
          name: 'Chassis lab',
          items: [
            {
              name: 'Corner-balance setup',
              description: 'Coilovers, camber plates, weight distribution for your tires',
              price: 'from €380',
            },
            {
              name: 'Endurance brake kit',
              description: 'Big brake + high-temp pads that survive a double stint',
              price: 'on quote',
            },
            {
              name: 'Paddock retainer',
              description: 'Pre-event checklist + mid-weekend fixes on site',
              price: 'seasonal',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Map was sharp on street, stable at Zandvoort. The logs speak.',
          author: 'Lars K.',
          source: 'Instagram',
        },
        {
          quote: 'Finally a shop that drafts a scope before they turn a bolt.',
          author: 'Nina P.',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Data over drama',
        content:
          'Apex Motorsport builds street-legal power and weekend weapons with the same discipline: scope, measure, document. No sticker horsepower — dyno curves and chassis notes you can repeat.',
        chefName: 'Alex Visser',
        chefTitle: 'Lead calibrator',
      },
    },
  },
};
