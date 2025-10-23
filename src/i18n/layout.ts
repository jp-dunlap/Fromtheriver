import { ensureArabicFontLoaded } from './arabicFont';

const RTL_LOCALES = new Set(['ar']);

export const getDirForLocale = (
  locale: string | undefined | null
): 'ltr' | 'rtl' => {
  if (!locale) {
    return 'ltr';
  }

  const normalizedLocale = locale.toLowerCase();
  for (const rtlLocale of RTL_LOCALES) {
    if (
      normalizedLocale === rtlLocale ||
      normalizedLocale.startsWith(`${rtlLocale}-`)
    ) {
      return 'rtl';
    }
  }

  return 'ltr';
};

export const applyDocumentLocale = (locale: string | undefined | null): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedLocale = locale ?? 'en';
  const direction = getDirForLocale(resolvedLocale);
  const htmlElement = document.documentElement;

  if (htmlElement.lang !== resolvedLocale) {
    htmlElement.lang = resolvedLocale;
  }

  if (htmlElement.dir !== direction) {
    htmlElement.dir = direction;
  }

  if (direction === 'rtl') {
    void ensureArabicFontLoaded();
  }
};

export default getDirForLocale;
