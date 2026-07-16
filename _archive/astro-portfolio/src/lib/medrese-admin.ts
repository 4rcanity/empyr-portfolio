import type { LocalizedText, MedreseLang, MedreseSectionId } from '../data/medrese';

export type MedreseContentType = 'post' | 'video' | 'podcast';

export interface MedreseAdminItem {
  id: string;
  type: MedreseContentType;
  section: MedreseSectionId;
  title: LocalizedText;
  summary: LocalizedText;
  meta: LocalizedText;
  tags: string[];
  source?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const MEDRESE_ADMIN_STORAGE_KEY = 'medrese-admin-content';
export const MEDRESE_ADMIN_SESSION_KEY = 'medrese-admin-session';

export const MEDRESE_ADMIN_CREDENTIALS = {
  email: 'admin@medrese.demo',
  password: 'medrese-demo',
} as const;

export function sectionForType(type: MedreseContentType): MedreseSectionId {
  return type === 'post' ? 'artikelen' : 'media';
}

export function defaultMeta(type: MedreseContentType): LocalizedText {
  if (type === 'post') {
    return { nl: 'Artikel', tr: 'Makale', en: 'Article' };
  }
  if (type === 'video') {
    return { nl: 'Video', tr: 'Video', en: 'Video' };
  }
  return { nl: 'Podcast', tr: 'Podcast', en: 'Podcast' };
}

export function isAdminAuthenticated(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(MEDRESE_ADMIN_SESSION_KEY) === 'authenticated';
}

export function adminLogin(email: string, password: string): boolean {
  const valid =
    email.trim().toLowerCase() === MEDRESE_ADMIN_CREDENTIALS.email &&
    password === MEDRESE_ADMIN_CREDENTIALS.password;
  if (valid) {
    sessionStorage.setItem(MEDRESE_ADMIN_SESSION_KEY, 'authenticated');
  }
  return valid;
}

export function adminLogout(): void {
  sessionStorage.removeItem(MEDRESE_ADMIN_SESSION_KEY);
}

export function readAdminContent(): MedreseAdminItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MEDRESE_ADMIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MedreseAdminItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAdminContent(items: MedreseAdminItem[]): void {
  localStorage.setItem(MEDRESE_ADMIN_STORAGE_KEY, JSON.stringify(items));
}

export function createAdminItem(
  input: Omit<MedreseAdminItem, 'id' | 'section' | 'createdAt' | 'updatedAt'>
): MedreseAdminItem {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    section: sectionForType(input.type),
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertAdminItem(item: MedreseAdminItem): MedreseAdminItem[] {
  const items = readAdminContent();
  const index = items.findIndex((entry) => entry.id === item.id);
  const next = [...items];
  if (index >= 0) {
    next[index] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    next.unshift(item);
  }
  writeAdminContent(next);
  return next;
}

export function deleteAdminItem(id: string): MedreseAdminItem[] {
  const next = readAdminContent().filter((item) => item.id !== id);
  writeAdminContent(next);
  return next;
}

export function localizeAdmin(text: LocalizedText, lang: MedreseLang): string {
  return text[lang] || text.en || text.nl || '';
}

export function adminItemsForSection(section: MedreseSectionId): MedreseAdminItem[] {
  return readAdminContent()
    .filter((item) => item.section === section)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function adminSearchIndex(lang: MedreseLang) {
  return readAdminContent().map((item) => ({
    id: item.id,
    section: item.section,
    title: localizeAdmin(item.title, lang),
    summary: localizeAdmin(item.summary, lang),
    meta: localizeAdmin(item.meta, lang),
    tags: item.tags,
    href: `/${lang}/medrese/${item.section}/#${item.id}`,
  }));
}
