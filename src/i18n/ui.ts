export type Lang = 'nl' | 'en';

export const languages: Lang[] = ['nl', 'en'];
export const defaultLang: Lang = 'nl';

export const languageLabels: Record<Lang, string> = {
  nl: 'Nederlands',
  en: 'English',
};

export const ui: Record<Lang, Record<string, string>> = {
  nl: {
    'nav.menu': 'Menu',
    'nav.about': 'Over ons',
    'nav.gallery': 'Galerij',
    'nav.contact': 'Contact',
    'nav.reserve': 'Reserveren',
    'nav.order': 'Bestellen',

    'hero.bookTable': 'Reserveer een tafel',
    'hero.viewMenu': 'Bekijk menu',
    'hero.callToOrder': 'Bel om te bestellen',
    'hero.orderDelivery': 'Bestel bezorging',

    'menu.title': 'Menu',
    'gallery.title': 'Galerij',
    'testimonials.title': 'Wat gasten zeggen',
    'hours.title': 'Openingstijden',
    'contact.title': 'Bezoek ons',
    'contact.visitUs': 'Bezoek ons',

    'cta.reserveTitle': 'Reserveer je tafel',
    'cta.bookNow': 'Nu reserveren',
    'cta.orderNow': 'Nu bestellen',
    'cta.callNow': 'Bel nu',

    'delivery.title': 'Bestel bezorging',
    'instagram.title': 'Op Instagram',
    'instagram.follow': 'Volg ons →',

    'badge.halal': 'Halal',
    'badge.rating': 'beoordeling',
    'badge.reviews': 'beoordelingen',

    'footer.impressum': 'Colofon',
    'footer.privacy': 'Privacybeleid',
    'footer.rights': 'Alle rechten voorbehouden.',

    'legal.impressumTitle': 'Colofon',
    'legal.privacyTitle': 'Privacybeleid',
    'legal.backTo': '← Terug naar',
    'legal.impressumBody':
      'Verantwoordelijk voor de inhoud volgens de toepasselijke regelgeving.',
    'legal.privacyIntro':
      'respecteert je privacy. Deze website gebruikt geen trackingcookies of analysescripts. Er worden geen persoonsgegevens verzameld, behalve wanneer je zelf telefonisch of per e-mail contact opneemt.',
    'legal.dataController': 'Verwerkingsverantwoordelijke',
    'legal.hosting': 'Hosting',
    'legal.hostingBody':
      'Deze website wordt gehost via Netlify/Vercel (EU-regio). Serverlogs kunnen tijdelijk IP-adressen opslaan voor beveiligingsdoeleinden.',
    'legal.rights': 'Jouw rechten',
    'legal.rightsBody':
      'Volgens de AVG heb je het recht om je persoonsgegevens in te zien, te corrigeren of te laten verwijderen. Neem contact op via',
    'legal.demoNotice': 'Demo template — vervang door klantspecifieke juridische tekst vóór livegang.',

    'days.mon': 'Maandag',
    'days.tue': 'Dinsdag',
    'days.wed': 'Woensdag',
    'days.thu': 'Donderdag',
    'days.fri': 'Vrijdag',
    'days.mon_tue': 'Maandag – Dinsdag',
    'days.mon_fri': 'Maandag – Vrijdag',
    'days.tue_thu': 'Dinsdag – Donderdag',
    'days.tue_sun': 'Dinsdag – Zondag',
    'days.wed_thu': 'Woensdag – Donderdag',
    'days.fri_sat': 'Vrijdag – Zaterdag',
    'days.sat': 'Zaterdag',
    'days.sun': 'Zondag',
    'days.closed': 'Gesloten',

    'portfolio.tag': 'Empyr Portfolio',
    'portfolio.title1': 'Websites en webapps die',
    'portfolio.title2': 'echt resultaat opleveren',
    'portfolio.subtitle':
      'Professionele templates voor lokale ondernemers — snel, mobielvriendelijk en gebouwd met Astro.',
    'portfolio.viewPricing': 'Bekijk prijzen',
    'portfolio.viewDemo': 'Bekijk live demo →',
    'portfolio.pricingTitle': 'Aanbevolen prijzen (EU)',
    'portfolio.pricingSubtitle':
      'Begin iets onder de marktprijs om je eerste klanten te winnen, verhoog daarna zodra je referenties hebt.',
    'portfolio.pitch': '"Als deze site je een paar extra klanten per maand oplevert, heeft hij zichzelf terugbetaald."',
    'portfolio.contactWhatsApp': 'WhatsApp ons',
    'portfolio.contactEmail': 'Stuur een e-mail',
    'portfolio.footer': 'Gebouwd met Astro · Statisch · Gehost op GitHub Pages',

  },
  en: {
    'nav.menu': 'Menu',
    'nav.about': 'About',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',
    'nav.reserve': 'Reserve',
    'nav.order': 'Order',

    'hero.bookTable': 'Book a Table',
    'hero.viewMenu': 'View Menu',
    'hero.callToOrder': 'Call to Order',
    'hero.orderDelivery': 'Order Delivery',

    'menu.title': 'Menu',
    'gallery.title': 'Gallery',
    'testimonials.title': 'What Guests Say',
    'hours.title': 'Opening Hours',
    'contact.title': 'Visit Us',
    'contact.visitUs': 'Visit Us',

    'cta.reserveTitle': 'Reserve Your Table',
    'cta.bookNow': 'Book Now',
    'cta.orderNow': 'Order Now',
    'cta.callNow': 'Call Now',

    'delivery.title': 'Order Delivery',
    'instagram.title': 'On Instagram',
    'instagram.follow': 'Follow us →',

    'badge.halal': 'Halal',
    'badge.rating': 'rating',
    'badge.reviews': 'reviews',

    'footer.impressum': 'Impressum',
    'footer.privacy': 'Privacy Policy',
    'footer.rights': 'All rights reserved.',

    'legal.impressumTitle': 'Impressum',
    'legal.privacyTitle': 'Privacy Policy',
    'legal.backTo': '← Back to',
    'legal.impressumBody': 'Responsible for content according to applicable regulations.',
    'legal.privacyIntro':
      'respects your privacy. This website does not use tracking cookies or analytics scripts. No personal data is collected unless you contact us directly via phone or email.',
    'legal.dataController': 'Data Controller',
    'legal.hosting': 'Hosting',
    'legal.hostingBody':
      'This site is hosted on Netlify/Vercel (EU region). Server logs may temporarily store IP addresses for security purposes.',
    'legal.rights': 'Your Rights',
    'legal.rightsBody':
      'Under GDPR, you have the right to access, rectify, or delete your personal data. Contact us at',
    'legal.demoNotice': 'Demo template — replace with client-specific legal text before launch.',

    'days.mon': 'Monday',
    'days.tue': 'Tuesday',
    'days.wed': 'Wednesday',
    'days.thu': 'Thursday',
    'days.fri': 'Friday',
    'days.mon_tue': 'Monday – Tuesday',
    'days.mon_fri': 'Monday – Friday',
    'days.tue_thu': 'Tuesday – Thursday',
    'days.tue_sun': 'Tuesday – Sunday',
    'days.wed_thu': 'Wednesday – Thursday',
    'days.fri_sat': 'Friday – Saturday',
    'days.sat': 'Saturday',
    'days.sun': 'Sunday',
    'days.closed': 'Closed',

    'portfolio.tag': 'Empyr Portfolio',
    'portfolio.title1': 'Websites and web apps that',
    'portfolio.title2': 'deliver real results',
    'portfolio.subtitle':
      'Professional, ready-to-customize templates for local businesses — fast, mobile-first, and built with Astro.',
    'portfolio.viewPricing': 'View Pricing',
    'portfolio.viewDemo': 'View Live Demo →',
    'portfolio.pricingTitle': 'Suggested Pricing (EU)',
    'portfolio.pricingSubtitle':
      'Start slightly under market to win first clients, then raise as you build references.',
    'portfolio.pitch': '"If this site brings you a few extra customers a month, it\'s paid for itself."',
    'portfolio.contactWhatsApp': 'WhatsApp us',
    'portfolio.contactEmail': 'Send an email',
    'portfolio.footer': 'Built with Astro · Static · Hosted on GitHub Pages',

  },
};
