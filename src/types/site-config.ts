import type { Lang } from '../i18n/ui';

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free' | 'spicy' | 'halal';

export type TemplateVariant = 'trattoria' | 'noir' | 'corner' | 'ocakbasi' | 'barberhouse';

/** Drives schema.org type + light copy differences; the visual design is controlled by `TemplateVariant`/theme */
export type BusinessType = 'restaurant' | 'cafe' | 'barbershop';

export interface MenuItem {
  name: string;
  description: string;
  price: string;
  tags?: DietaryTag[];
}

export interface MenuCategory {
  name: string;
  /** Optional banner image shown above the category (used by photo-forward layouts) */
  image?: string;
  items: MenuItem[];
}

/** Day key maps to a translated range label in src/i18n/ui.ts (days.*) */
export type DayKey =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'mon_tue'
  | 'mon_fri'
  | 'tue_thu'
  | 'tue_sun'
  | 'wed_thu'
  | 'fri_sat'
  | 'sat'
  | 'sun';

export interface OpeningHour {
  dayKey: DayKey;
  /** Time range string (language-neutral), or null when closed */
  hours: string | null;
}

export interface Testimonial {
  quote: string;
  author: string;
  source?: string;
}

export interface WineItem {
  name: string;
  region?: string;
  price: string;
  note?: string;
}

export interface DeliveryLink {
  name: string;
  url: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image?: string;
}

/** Explicit contrast-safe colors, resolved per-theme rather than reused blindly */
export interface SiteTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  /** Text/muted colors to use on top of a `primary` colored section (e.g. footer, CTA band) */
  onPrimaryText: string;
  onPrimaryMuted: string;
  /** Text color to use on top of an `accent` colored button/badge */
  onAccentText: string;
  fontHeading: string;
  fontBody: string;
  variant: TemplateVariant;
}

export interface LocalizedContent {
  tagline: string;
  description: string;
  menu: MenuCategory[];
  wineList?: WineItem[];
  openingHours: OpeningHour[];
  about: {
    heading: string;
    content: string;
    chefName?: string;
    chefTitle?: string;
  };
  testimonials?: Testimonial[];
  dailySpecial?: string;
  bookingNote?: string;
  /** Overrides the default reserve/order CTA label from the ui dictionary */
  ctaLabel?: string;
  /** Overrides the Hero secondary button label (defaults to "View Menu") */
  secondaryCtaLabel?: string;
  /** Overrides both the Nav link text and the menu/services section heading */
  menuSectionLabel?: string;
  ratingNote?: string;
  team?: TeamMember[];
}

export interface SiteConfig {
  slug: string;
  name: string;
  businessType: BusinessType;
  theme: SiteTheme;
  /** Optional logo image URL (rendered in nav/footer instead of the text wordmark) */
  logo?: string;
  /** Optional dark-on-light logo variant for use on light backgrounds */
  logoLight?: string;
  heroImage: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  coordinates: { lat: number; lng: number };
  googleMapsEmbed: string;
  socials: { instagram?: string; facebook?: string };
  reservationUrl?: string;
  gallery: string[];
  aboutImage?: string;
  deliveryLinks?: DeliveryLink[];
  instagramFeed?: string[];
  rating?: { value: number; count: number; source: string };
  halal?: boolean;
  content: Record<Lang, LocalizedContent>;
}
