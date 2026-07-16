import { ui, defaultLang, languages, type Lang } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (languages.includes(maybeLang as Lang)) {
    return maybeLang as Lang;
  }
  return defaultLang;
}

export function isValidLang(lang: string | undefined): lang is Lang {
  return !!lang && languages.includes(lang as Lang);
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    return ui[lang]?.[key] ?? ui[defaultLang][key] ?? key;
  };
}

export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang): string {
    return `/${targetLang}${path}`;
  };
}

export function translateDay(t: (key: string) => string, dayKey: string): string {
  return t(`days.${dayKey}`);
}
