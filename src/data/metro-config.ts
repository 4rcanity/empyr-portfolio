import type { SiteConfig } from '../types/site-config';

/** Fast convenience / oil-change lane — clean industrial blue, speed and clarity. */
export const metroConfig: SiteConfig = {
  slug: 'metro',
  name: 'Metro Quick Lane',
  businessType: 'garage',
  theme: {
    primary: '#0c1520',
    secondary: '#132233',
    accent: '#3db8ff',
    background: '#0c1520',
    surface: '#132233',
    text: '#f0f5fa',
    muted: '#9fb0c3',
    onPrimaryText: '#f0f5fa',
    onPrimaryMuted: '#9fb0c3',
    onAccentText: '#041018',
    fontHeading: '"Oswald", "Arial Narrow", sans-serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    variant: 'garage',
  },
  heroImage:
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=2000&q=80',
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
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  ],
  rating: { value: 4.7, count: 512, source: 'Google' },
  content: {
    nl: {
      tagline: 'In. Geserviced. Weg.',
      description:
        'Olie, filters en express onderhoud terwijl je wacht — gebouwd voor drukke agenda\'s en lichte fleets.',
      bookingNote: 'Reserveer een bay — de meeste bezoeken onder het uur.',
      ctaLabel: 'Reserveer een bay',
      secondaryCtaLabel: 'Express menu',
      menuSectionLabel: 'Express menu',
      ratingNote: '512+ Google reviews',
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
              name: 'Olie & filter',
              description: 'Conventioneel, blend of volledig synthetisch — terwijl je wacht',
              price: 'vanaf €49',
            },
            {
              name: 'Banden wisselen / rotatie',
              description: 'Eveneens slijtage en drukcheck voor je wegrijdt',
              price: 'vanaf €29',
            },
            {
              name: 'Cabin- & luchtfilter',
              description: 'Schonere lucht en betere doorstroming in één stop',
              price: 'vanaf €35',
            },
          ],
        },
        {
          name: 'Checks',
          items: [
            {
              name: 'Accutest',
              description: 'Belastingstest zodat je weet of hij moet worden vervangen',
              price: '€15',
            },
            {
              name: 'Ruitenwissers & vloeistoffen',
              description: 'Zicht en spoelsystemen in één keer geregeld',
              price: 'vanaf €19',
            },
            {
              name: 'Fleet express',
              description: 'Accounts voor busjes en lichte trucks met maandfactuur',
              price: 'op aanvraag',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Live bay board is goud waard. Geen mystery wait times.',
          author: 'Joris M.',
          source: 'Google',
        },
        {
          quote: 'Digitale bon met kilometerstand — perfect voor onze bestelbusjes.',
          author: 'FleetCo NL',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Waarom het snel is',
        content:
          'Metro Quick Lane is process-first: live bay board, blijf in je auto of pak koffie, en een digitale bon met volgende onderhoudsdatum. Geen mystery wait times.',
        chefName: 'Metro Team',
        chefTitle: 'Express service',
      },
    },
    en: {
      tagline: 'In. Serviced. Out.',
      description:
        'Oil, filters, and express maintenance while you wait — built for busy schedules and light fleets.',
      bookingNote: 'Reserve a bay — most visits under an hour.',
      ctaLabel: 'Reserve a bay',
      secondaryCtaLabel: 'Express menu',
      menuSectionLabel: 'Express menu',
      ratingNote: '512+ Google reviews',
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
              name: 'Oil & filter',
              description: 'Conventional, blend, or full synthetic — while you wait',
              price: 'from €49',
            },
            {
              name: 'Tire rotation',
              description: 'Even wear and a quick pressure check before you leave',
              price: 'from €29',
            },
            {
              name: 'Cabin & engine filters',
              description: 'Cleaner air and better airflow without a second appointment',
              price: 'from €35',
            },
          ],
        },
        {
          name: 'Checks',
          items: [
            {
              name: 'Battery test',
              description: 'Load-tested so you know if it needs replacing',
              price: '€15',
            },
            {
              name: 'Wiper & fluid top-up',
              description: 'Visibility and wash systems sorted in one stop',
              price: 'from €19',
            },
            {
              name: 'Fleet express',
              description: 'Accounts for vans and light trucks with monthly invoicing',
              price: 'on request',
            },
          ],
        },
      ],
      testimonials: [
        {
          quote: 'Live bay board is gold. No mystery wait times.',
          author: 'Joris M.',
          source: 'Google',
        },
        {
          quote: 'Digital receipt with mileage — perfect for our vans.',
          author: 'FleetCo NL',
          source: 'Google',
        },
      ],
      about: {
        heading: 'Why it is quick',
        content:
          'Metro Quick Lane is process-first: live bay board, stay in your car or grab coffee, and a digital receipt with the next due date. No mystery wait times.',
        chefName: 'Metro Team',
        chefTitle: 'Express service',
      },
    },
  },
};
