import type { SiteConfig } from '../types/site-config';

/**
 * Modeled on the real OTB's Barberhouse in Schiedam (Sint Liduinastraat 1).
 * Services, prices, hours, address and team names reflect the shop's own
 * published info; photography is hot-linked directly from the shop's own
 * live website with the owner's permission. Descriptions are original to
 * this demo.
 */
export const barberhouseConfig: SiteConfig = {
  slug: 'barberhouse',
  name: "OTB's Barberhouse",
  businessType: 'barbershop',
  theme: {
    primary: '#0A0A0A',
    secondary: '#161616',
    accent: '#D4AF37',
    background: '#0A0A0A',
    surface: '#141414',
    text: '#F5F2EA',
    muted: '#A89B82',
    onPrimaryText: '#F5F2EA',
    onPrimaryMuted: '#A89B82',
    onAccentText: '#0A0A0A',
    fontHeading: '"Oswald", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    variant: 'barberhouse',
  },
  logo: '/images/barberhouse/logo.png',
  heroImage: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2025/01/IMG_0408-scaled.jpeg?fit=1024%2C768&ssl=1',
  phone: '+31 6 40689924',
  email: 'otb.barberhouse@gmail.com',
  address: {
    street: 'Sint Liduinastraat 1',
    city: 'Schiedam',
    postalCode: '3117 CN',
    country: 'Netherlands',
  },
  coordinates: { lat: 51.9142504, lng: 4.3953397 },
  googleMapsEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2450.0!2d4.3953397!3d51.9142504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4354b5d388185%3A0x8b6a75368c9abf20!2sOTB%27s%20Barberhouse!5e0!3m2!1sen!2snl!4v1',
  socials: {
    instagram: 'https://www.instagram.com/otb_barberhouse',
    facebook: 'https://www.facebook.com',
  },
  reservationUrl: 'https://www.treatwell.nl/salon/otb-s-barberhouse/',
  aboutImage: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0150-scaled.jpeg?fit=1920%2C2560&ssl=1',
  gallery: [
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/11/IMG_7273-1-scaled.jpg?ssl=1',
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/11/IMG_7252-1-scaled.jpg?ssl=1',
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/11/IMG_7269-scaled.jpg?ssl=1',
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0152-scaled.jpeg?fit=1920%2C2560&ssl=1',
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0136-scaled.jpeg?fit=1920%2C2560&ssl=1',
    'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0153-scaled.jpeg?fit=1920%2C2560&ssl=1',
  ],
  instagramFeed: [
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/590417653_1266724748781819_3458367022058877310_nfull.webp',
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/588378824_1356778052860319_6057102124251756670_nfull.webp',
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/581822923_18243762610293638_84526943248989837_nfull.webp',
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/560547721_3145683415601064_5926258840203845504_nfull.webp',
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/558912485_1325141778986230_9140686965707864032_nfull.webp',
    'https://otbbarberhouse.nl/wp-content/uploads/sb-instagram-feed-images/522191972_655104020941936_7487684688826903195_nfull.webp',
  ],
  rating: { value: 4.9, count: 314, source: 'Treatwell' },
  content: {
    nl: {
      tagline: 'Dé plek voor stijl en kwaliteit',
      description:
        'Vakmanschap, persoonlijke aandacht en een relaxte sfeer sinds 2021. Ons team van topkappers geeft je precies de look die bij je past — van een strakke fade tot een volledige verzorgingsbehandeling.',
      bookingNote: 'Plan je afspraak online of bel ons direct op +31 6 40689924.',
      ctaLabel: 'Plan je afspraak',
      secondaryCtaLabel: 'Bekijk diensten',
      menuSectionLabel: 'Diensten & Prijzen',
      ratingNote: '314+ beoordelingen op Treatwell',
      openingHours: [
        { dayKey: 'mon', hours: '12:00 – 19:00' },
        { dayKey: 'tue', hours: '10:00 – 19:00' },
        { dayKey: 'wed', hours: '10:00 – 19:00' },
        { dayKey: 'thu', hours: '10:00 – 19:00' },
        { dayKey: 'fri', hours: '10:00 – 19:00' },
        { dayKey: 'sat', hours: '10:00 – 19:00' },
        { dayKey: 'sun', hours: '12:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Knippen',
          items: [
            { name: 'Haren Knippen', description: 'Klassiek tot modern, voor elk haartype en model', price: '€25' },
            { name: 'Haren en Baard', description: 'Complete knip- en baardbehandeling in één afspraak', price: '€30' },
            { name: 'Knippen Kinderen (t/m 12 jaar)', description: 'Knipbeurt voor de jongste klanten', price: '€20' },
            { name: 'Knippen Senioren (65+)', description: 'Knipbeurt voor onze oudere klanten', price: '€20' },
          ],
        },
        {
          name: 'Baard',
          items: [
            { name: 'Baard Scheren', description: 'Vakkundig getrimd en in model gebracht', price: '€10' },
            { name: 'Line-up Contouren', description: 'Scherpe contourlijnen voor een verzorgde afwerking', price: '€10' },
          ],
        },
        {
          name: 'Treatment',
          items: [
            { name: 'Gezichtsmasker met Scrub', description: 'Voor een frisse en verzorgde uitstraling', price: '€10' },
          ],
        },
      ],
      team: [
        { name: 'Onur Arzuman', role: 'Eigenaar & Meesterkapper', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0150-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Abdulkadir', role: 'Kapper', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0152-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Omer', role: 'Kapper', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0136-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Abdullah', role: 'Kapper', image: '/images/barberhouse/abdullah.png' },
      ],
      testimonials: [
        { quote: 'Elke keer weer een topbeurt. Je voelt je hier echt op je gemak, precies zoals ze zelf ook zeggen.', author: 'Kevin R.', source: 'Treatwell' },
        { quote: 'Beste barbershop in Schiedam. Strakke fade, goede sfeer, altijd op tijd.', author: 'Youssef T.', source: 'Google Reviews' },
      ],
      about: {
        heading: 'Van leerling tot eigenaar',
        content:
          'Onur begon zes jaar geleden als leerling in deze zaak, toen nog onder een andere naam. Zijn droom was om het vak te leren en op een dag de zaak over te nemen — iets wat hij ondanks de coronacrisis op zijn negentiende voor elkaar kreeg. Vandaag runt hij OTB\'s Barberhouse met een team van ervaren kappers, en werkt hij continu aan het uitbreiden van de service.',
        chefName: 'Onur Arzuman',
        chefTitle: 'Eigenaar & Meesterkapper',
      },
    },
    en: {
      tagline: 'The place for style and quality',
      description:
        'Craftsmanship, personal attention, and a relaxed vibe since 2021. Our team of expert barbers gives you exactly the look that suits you — from a sharp fade to a full grooming treatment.',
      bookingNote: 'Book your appointment online or call us directly at +31 6 40689924.',
      ctaLabel: 'Book Appointment',
      secondaryCtaLabel: 'View Services',
      menuSectionLabel: 'Services & Pricing',
      ratingNote: '314+ reviews on Treatwell',
      openingHours: [
        { dayKey: 'mon', hours: '12:00 – 19:00' },
        { dayKey: 'tue', hours: '10:00 – 19:00' },
        { dayKey: 'wed', hours: '10:00 – 19:00' },
        { dayKey: 'thu', hours: '10:00 – 19:00' },
        { dayKey: 'fri', hours: '10:00 – 19:00' },
        { dayKey: 'sat', hours: '10:00 – 19:00' },
        { dayKey: 'sun', hours: '12:00 – 17:00' },
      ],
      menu: [
        {
          name: 'Haircuts',
          items: [
            { name: 'Haircut', description: 'Classic to modern, for every hair type and style', price: '€25' },
            { name: 'Hair & Beard', description: 'Complete cut and beard treatment in one visit', price: '€30' },
            { name: "Kids' Haircut (up to 12)", description: 'Haircut for our youngest clients', price: '€20' },
            { name: 'Seniors\' Haircut (65+)', description: 'Haircut for our senior clients', price: '€20' },
          ],
        },
        {
          name: 'Beard',
          items: [
            { name: 'Beard Shave', description: 'Expertly trimmed and shaped', price: '€10' },
            { name: 'Line-up / Edge Up', description: 'Sharp contour lines for a clean finish', price: '€10' },
          ],
        },
        {
          name: 'Treatment',
          items: [
            { name: 'Face Mask with Scrub', description: 'For a fresh, well-groomed look', price: '€10' },
          ],
        },
      ],
      team: [
        { name: 'Onur Arzuman', role: 'Owner & Master Barber', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0150-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Abdulkadir', role: 'Barber', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0152-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Omer', role: 'Barber', image: 'https://i0.wp.com/otbbarberhouse.nl/wp-content/uploads/2024/12/IMG_0136-scaled.jpeg?fit=1920%2C2560&ssl=1' },
        { name: 'Abdullah', role: 'Barber', image: '/images/barberhouse/abdullah.png' },
      ],
      testimonials: [
        { quote: 'Great cut every single time. You really feel at ease here, exactly like they say themselves.', author: 'Kevin R.', source: 'Treatwell' },
        { quote: 'Best barbershop in Schiedam. Sharp fades, great vibe, always on time.', author: 'Youssef T.', source: 'Google Reviews' },
      ],
      about: {
        heading: 'From apprentice to owner',
        content:
          "Onur started as an apprentice at this shop six years ago, back when it operated under a different name. His dream was to master the craft and one day take over the business — something he managed to pull off at nineteen, despite the pandemic. Today he runs OTB's Barberhouse with a team of experienced barbers, constantly working to expand the service on offer.",
        chefName: 'Onur Arzuman',
        chefTitle: 'Owner & Master Barber',
      },
    },
  },
};
