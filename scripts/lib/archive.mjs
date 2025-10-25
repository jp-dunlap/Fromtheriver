import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
export const FEED_PATH = path.resolve(ROOT, 'public/feed.json');
export const SITE_URL = 'https://fromtheriver.org';
export const DEFAULT_ARCHIVE_PAGE_LIMIT = 100;

const ARCHIVE_PATH_PATTERN = /^\/archive\/([^/?#]+)/i;
const FALLBACK_EXCERPT = 'Explore the From The River archive.';

export function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeExcerpt(value, maxLength = 280) {
  if (typeof value !== 'string' || value.trim() === '') {
    return FALLBACK_EXCERPT;
  }

  const condensed = value.replace(/\s+/g, ' ').trim();
  if (condensed.length <= maxLength) {
    return condensed;
  }

  const limit = Math.max(0, maxLength - 1);
  return `${condensed.slice(0, limit)}…`;
}

export function coerceIsoDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function normalizeTitle(value) {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return 'Archive Entry';
}

export function extractSlugFromUrl(url) {
  if (!url) {
    return null;
  }

  const ensureDecoded = (segment) => {
    const trimmed = segment.trim().replace(/\/+$/, '');
    if (!trimmed) {
      return null;
    }
    try {
      return decodeURIComponent(trimmed);
    } catch (error) {
      return trimmed;
    }
  };

  try {
    const parsed = new URL(url, 'https://fromtheriver.org');
    const match = parsed.pathname.match(ARCHIVE_PATH_PATTERN);
    if (match) {
      return ensureDecoded(match[1]);
    }
  } catch (error) {
    const fallbackMatch = `${url}`.match(ARCHIVE_PATH_PATTERN);
    if (fallbackMatch) {
      return ensureDecoded(fallbackMatch[1]);
    }
  }

  return null;
}

export async function getArchiveEntries({
  limit = DEFAULT_ARCHIVE_PAGE_LIMIT,
  feedPath = FEED_PATH,
} = {}) {
  let feedContents;
  try {
    feedContents = await readFile(feedPath, 'utf8');
  } catch (error) {
    console.warn('[archive] unable to read feed.json:', error.message ?? error);
    return [];
  }

  let feed;
  try {
    feed = JSON.parse(feedContents);
  } catch (error) {
    console.warn('[archive] unable to parse feed.json:', error.message ?? error);
    return [];
  }

  const items = Array.isArray(feed.items) ? feed.items : [];
  if (items.length === 0) {
    return [];
  }

  const entries = [];
  for (const item of items) {
    if (entries.length >= limit) {
      break;
    }

    const slug = extractSlugFromUrl(item?.url);
    if (!slug) {
      continue;
    }

    const title = normalizeTitle(item?.title);
    const excerpt = normalizeExcerpt(item?.summary ?? item?.content_text);
    const encodedSlug = encodeURIComponent(slug);
    const isoDate =
      coerceIsoDate(
        item?.date ??
          item?.date_published ??
          item?.datePublished ??
          item?.published ??
          item?.published_at ??
          item?.publishedAt,
      ) ?? null;
    const imageUrl =
      typeof item?.image === 'string' && item.image.trim() !== ''
        ? item.image.trim()
        : `${SITE_URL}/og/${encodedSlug}.svg`;

    entries.push({
      slug,
      encodedSlug,
      title,
      excerpt,
      canonicalUrl: `${SITE_URL}/archive/${encodedSlug}`,
      imageUrl,
      date: isoDate,
    });
  }

  return entries;
}
