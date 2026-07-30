import type { SiteConfig } from '../types/site-config';

/** Fast convenience / oil-change lane — clean industrial cyan, speed and clarity. */
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
  phone: '+31 20 000 0104',
  email: 'hello@metroquicklane.example',
  address: {
    street: 'Ringweg 88',
    city: 'Demostad',
    postalCode: '1234 GH',
    country: 'Netherlands',
  },
  coordinates: { lat: 52.04, lng: 5.04 },
  googleMapsEmbed: 'https://www.google.com/maps?q=52.04,5.04&output=embed',
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
  reservationUrl: 'tel:+31200000104',
  aboutImage:
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520340356584-dc35d710b4aa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609521263047-f8f925109d25?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.7, count: 512, source: 'Google' },
  content: {
    nl: {
      tagline: '45 minuten. Digitale bon. Doorrijden.',
      description:
        'Express olie, filters en fleet-lanes voor wie de ringweg niet wil verlaten voor een lange garage-ochtend.',
      bookingNote: 'Reserveer een lane — live board toont je wachttijd in minuten.',
      ctaLabel: 'Reserveer een lane',
      secondaryCtaLabel: 'Express prijzen',
      menuSectionLabel: 'Lane menu',
      ratingNote: '512+ snelle stops',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:30 – 19:00' },
        { dayKey: 'sat', hours: '08:00 – 17:00' },
        { dayKey: 'sun', hours: '10:00 – 16:00' },
      ],
      menu: [
        {
          name: 'Drive-through zorg',
          items: [
            {
              name: 'Synth olie + filter lane',
              description: 'Volledig synthetisch, cabin-check, QR-bon — target 35 minuten',
              price: 'vanaf €59',
            },
            {
              name: 'Bandenrotatie express',
              description: 'Rotatie, druk, slijtagefoto — terug op de ring binnen het uur',
              price: 'vanaf €32',
            },
            {
              name: 'Filter duo',
              description: 'Lucht + cabin in één stop, geen tweede afspraak',
              price: 'vanaf €38',
            },
          ],
        },
        {
          name: 'Fleet & checks',
          items: [
            {
              name: 'Accu load-test',
              description: 'Meetresultaat op je telefoon vóór je wegrijdt',
              price: '€12',
            },
            {
              name: 'Zichtpakket',
              description: 'Wissers + ruitensproeier + koelvloeistof peil',
              price: 'vanaf €22',
            },
            {
              name: 'Fleet lane account',
              description: 'Busjes & lichte trucks, maandfactuur, SLA op wachttijd',
              price: 'op aanvraag',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Live lane board klopte. Ik bleef in de auto, 38 minuten later reed ik weg.',
          author: 'Joris M.',
          source: 'Google',
        },
        {
          quote: 'QR-bon met kilometerstand — finance van onze fleets is eindelijk stil.',
          author: 'FleetCo NL',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Gebouwd als een doorrijbaan',
        content:
          'Metro Quick Lane is process-first: live bay board, blijf zitten of pak koffie, en een digitale bon met volgende onderhoudsdatum. Geen mystery wait — alleen minuten die je kunt plannen.',
        chefName: 'Metro Crew',
        chefTitle: 'Lane operations',
      },
    },
    en: {
      tagline: '45 minutes. Digital receipt. Roll out.',
      description:
        'Express oil, filters, and fleet lanes for drivers who will not leave the ring road for a long garage morning.',
      bookingNote: 'Reserve a lane — the live board shows wait time in minutes.',
      ctaLabel: 'Reserve a lane',
      secondaryCtaLabel: 'Express pricing',
      menuSectionLabel: 'Lane menu',
      ratingNote: '512+ quick stops',
      openingHours: [
        { dayKey: 'mon_fri', hours: '07:30 – 19:00' },
        { dayKey: 'sat', hours: '08:00 – 17:00' },
        { dayKey: 'sun', hours: '10:00 – 16:00' },
      ],
      menu: [
        {
          name: 'Drive-through care',
          items: [
            {
              name: 'Synth oil + filter lane',
              description: 'Full synthetic, cabin check, QR receipt — 35-minute target',
              price: 'from €59',
            },
            {
              name: 'Tire rotation express',
              description: 'Rotate, pressure, wear photo — back on the ring inside an hour',
              price: 'from €32',
            },
            {
              name: 'Filter duo',
              description: 'Air + cabin in one stop, no second appointment',
              price: 'from €38',
            },
          ],
        },
        {
          name: 'Fleet & checks',
          items: [
            {
              name: 'Battery load test',
              description: 'Result on your phone before you leave the lane',
              price: '€12',
            },
            {
              name: 'Visibility pack',
              description: 'Wipers + washer fluid + coolant level',
              price: 'from €22',
            },
            {
              name: 'Fleet lane account',
              description: 'Vans & light trucks, monthly invoice, wait-time SLA',
              price: 'on request',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Live lane board was right. Stayed in the car, rolled out in 38 minutes.',
          author: 'Joris M.',
          source: 'Google',
        },
        {
          quote: 'QR receipt with mileage — fleet finance finally went quiet.',
          author: 'FleetCo NL',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Built like a drive-through',
        content:
          'Metro Quick Lane is process-first: live bay board, stay seated or grab coffee, and a digital receipt with the next due date. No mystery wait — only minutes you can plan.',
        chefName: 'Metro Crew',
        chefTitle: 'Lane operations',
      },
    },
  },
};
