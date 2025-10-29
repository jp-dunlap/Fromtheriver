const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const HAMZA_REGEX = /[ʿ’‘'`´]/g;

export function normalizeText(value: unknown): string {
  if (value == null) {
    return '';
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return '';
  }

  return stringValue
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS_REGEX, '')
    .replace(HAMZA_REGEX, '')
    .replace(/\s+/g, ' ');
}

export function normalizeSlug(value: unknown): string {
  const normalized = normalizeText(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-');

  return normalized.replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
}

export function slugifyFallback(value: unknown): string {
  const slug = normalizeSlug(value);
  if (slug) {
    return slug;
  }

  const stringValue = String(value ?? '').trim();
  if (!stringValue) {
    return '';
  }

  return stringValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function ensureSlug(value: unknown, fallback: string): string {
  const slug = normalizeSlug(value);
  return slug || fallback;
}

