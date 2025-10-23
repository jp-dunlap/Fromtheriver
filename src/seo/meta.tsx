import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import pagesConfig from './pages.json';

const SUPPORTED_LOCALES = ['en', 'es', 'ar'] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type PageType = 'home' | 'collection' | 'narrative';

type LocaleMeta = {
  readonly title: string;
  readonly description: string;
};

type StaticPageConfig = {
  readonly id: string;
  readonly path: string;
  readonly type: Exclude<PageType, 'narrative'>;
  readonly ogImage: string;
  readonly accentColor?: string;
  readonly locales: Record<SupportedLocale, LocaleMeta>;
};

type PagesConfig = {
  readonly baseUrl: string;
  readonly localePrefixes: Record<SupportedLocale, string>;
  readonly pages: StaticPageConfig[];
};

const config = pagesConfig as PagesConfig;

const SITE_NAME = 'From The River';

const staticPageMap = new Map(config.pages.map((page) => [page.id, page]));

const DEFAULT_OG_IMAGE = '/og/home.svg';
const OG_DIMENSIONS = { width: '1200', height: '630' } as const;

const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en_US',
  es: 'es_ES',
  ar: 'ar',
};

const normalizeLocale = (locale: string): SupportedLocale => {
  const normalized = locale.toLowerCase();
  for (const candidate of SUPPORTED_LOCALES) {
    if (normalized === candidate || normalized.startsWith(`${candidate}-`)) {
      return candidate;
    }
  }
  return 'en';
};

export type MetaPageId = StaticPageConfig['id'];

export interface MetaProps {
  pageId?: MetaPageId;
  type?: PageType;
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImagePath?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  slug?: string;
  imageAlt?: string;
}

const ensureLeadingSlash = (path: string): string => {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
};

const buildLocaleUrl = (locale: SupportedLocale, path: string): string => {
  const prefix = config.localePrefixes[locale] ?? '';
  const normalizedPath = ensureLeadingSlash(path);
  return `${config.baseUrl}${prefix}${normalizedPath}`;
};

const prune = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const next = value
      .map((item) => prune(item))
      .filter((item) => {
        if (item === undefined) {
          return false;
        }
        if (Array.isArray(item)) {
          return item.length > 0;
        }
        if (item && typeof item === 'object') {
          return Object.keys(item as Record<string, unknown>).length > 0;
        }
        return true;
      });
    return next.length > 0 ? next : undefined;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => [key, prune(entryValue)] as const)
      .filter(([, entryValue]) => entryValue !== undefined);
    if (!entries.length) {
      return undefined;
    }
    return Object.fromEntries(entries);
  }

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value;
};

const serializeStructuredData = (data: unknown): string | null => {
  const pruned = prune(data);
  if (!pruned) {
    return null;
  }
  return JSON.stringify(pruned, null, 2);
};

const useDocumentMeta = (
  title: string,
  description: string,
  og: {
    url: string;
    type: string;
    image: { url: string; alt: string; type: string };
    locale: string;
    alternates: string[];
  },
  canonicalUrl: string,
  alternateUrls: Array<{ locale: SupportedLocale; href: string }>,
  structuredData: string | null,
  themeColor?: string,
  publishedTime?: string,
  modifiedTime?: string,
  tags?: string[]
): void => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousTitle = document.title;
    if (title) {
      document.title = title;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const head = document.head;

    const descriptionSelector = 'meta[name="description"]';
    let descriptionTag = head.querySelector(descriptionSelector) as
      | HTMLMetaElement
      | null;
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', description);
    descriptionTag.setAttribute('data-managed', 'seo-description');

    const managedNodes = head.querySelectorAll(
      'meta[data-managed="seo-meta"], link[data-managed="seo-meta"], script[data-managed="seo-meta"]'
    );
    managedNodes.forEach((node) => node.remove());

    const createMeta = (attributes: Record<string, string>): void => {
      const meta = document.createElement('meta');
      meta.setAttribute('data-managed', 'seo-meta');
      for (const [key, value] of Object.entries(attributes)) {
        meta.setAttribute(key, value);
      }
      head.appendChild(meta);
    };

    const createLink = (attributes: Record<string, string>): void => {
      const link = document.createElement('link');
      link.setAttribute('data-managed', 'seo-meta');
      for (const [key, value] of Object.entries(attributes)) {
        link.setAttribute(key, value);
      }
      head.appendChild(link);
    };

    const createScript = (id: string, content: string): void => {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', id);
      script.setAttribute('data-managed', 'seo-meta');
      script.textContent = content;
      head.appendChild(script);
    };

    createMeta({ name: 'og:site_name', content: SITE_NAME });
    createMeta({ property: 'og:title', content: title });
    createMeta({ property: 'og:description', content: description });
    createMeta({ property: 'og:url', content: og.url });
    createMeta({ property: 'og:type', content: og.type });
    createMeta({ property: 'og:image', content: og.image.url });
    createMeta({ property: 'og:image:alt', content: og.image.alt });
    createMeta({ property: 'og:image:type', content: og.image.type });
    createMeta({ property: 'og:image:width', content: OG_DIMENSIONS.width });
    createMeta({ property: 'og:image:height', content: OG_DIMENSIONS.height });
    createMeta({ property: 'og:locale', content: og.locale });
    og.alternates.forEach((alternate) => {
      createMeta({ property: 'og:locale:alternate', content: alternate });
    });

    createMeta({ name: 'twitter:card', content: 'summary_large_image' });
    createMeta({ name: 'twitter:title', content: title });
    createMeta({ name: 'twitter:description', content: description });
    createMeta({ name: 'twitter:image', content: og.image.url });
    createMeta({ name: 'twitter:image:alt', content: og.image.alt });

    if (publishedTime) {
      createMeta({ property: 'article:published_time', content: publishedTime });
    }
    if (modifiedTime) {
      createMeta({ property: 'article:modified_time', content: modifiedTime });
    }
    if (tags && tags.length) {
      createMeta({ name: 'keywords', content: tags.join(', ') });
    }
    if (themeColor) {
      createMeta({ name: 'theme-color', content: themeColor });
    }

    createLink({ rel: 'canonical', href: canonicalUrl });
    alternateUrls.forEach(({ locale, href }) => {
      createLink({ rel: 'alternate', href, hreflang: locale });
    });
    const defaultAlternate = alternateUrls.find((entry) => entry.locale === 'en');
    if (defaultAlternate) {
      createLink({ rel: 'alternate', href: defaultAlternate.href, hreflang: 'x-default' });
    }

    if (structuredData) {
      createScript('seo-structured-data', structuredData);
    }
  }, [
    title,
    description,
    og,
    canonicalUrl,
    alternateUrls,
    structuredData,
    themeColor,
    publishedTime,
    modifiedTime,
    tags,
  ]);
};

export const Meta = ({
  pageId,
  type,
  title: titleOverride,
  description: descriptionOverride,
  canonicalPath: canonicalPathOverride,
  ogImagePath: ogImageOverride,
  publishedTime,
  modifiedTime,
  tags,
  slug,
  imageAlt,
}: MetaProps): null => {
  const { i18n } = useTranslation();
  const activeLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language ?? 'en');

  const staticPage = pageId ? staticPageMap.get(pageId) : undefined;
  const pageType: PageType = type ?? staticPage?.type ?? 'home';

  const defaultLocaleMeta = staticPage?.locales?.[activeLocale];
  const fallbackLocaleMeta = staticPage?.locales?.en;

  const title = titleOverride ?? defaultLocaleMeta?.title ?? fallbackLocaleMeta?.title ?? SITE_NAME;
  const description =
    descriptionOverride ?? defaultLocaleMeta?.description ?? fallbackLocaleMeta?.description ?? '';

  const inferredPath = useMemo(() => {
    if (canonicalPathOverride) {
      return canonicalPathOverride;
    }
    if (pageType === 'narrative') {
      const basePath = staticPage?.path ?? '/narratives';
      if (slug) {
        return `${ensureLeadingSlash(basePath).replace(/\/$/, '')}/${slug}`;
      }
      return ensureLeadingSlash(basePath);
    }
    if (staticPage) {
      return ensureLeadingSlash(staticPage.path);
    }
    return '/';
  }, [canonicalPathOverride, pageType, staticPage, slug]);

  const ogImagePath = useMemo(() => {
    if (ogImageOverride) {
      return ogImageOverride;
    }
    if (pageType === 'narrative' && slug) {
      return `/og/narratives/${slug}.svg`;
    }
    return staticPage?.ogImage ?? DEFAULT_OG_IMAGE;
  }, [ogImageOverride, pageType, slug, staticPage]);

  const ogImageAlt = imageAlt ?? title;

  const canonicalUrl = useMemo(() => buildLocaleUrl(activeLocale, inferredPath), [activeLocale, inferredPath]);

  const alternateUrls = useMemo(
    () =>
      SUPPORTED_LOCALES.map((locale) => ({
        locale,
        href: buildLocaleUrl(locale, inferredPath),
      })),
    [inferredPath]
  );

  const ogLocaleAlternates = useMemo(
    () =>
      SUPPORTED_LOCALES.filter((locale) => locale !== activeLocale).map(
        (locale) => OG_LOCALE_MAP[locale]
      ),
    [activeLocale]
  );

  const ogImageUrl = `${config.baseUrl}${ensureLeadingSlash(ogImagePath)}`;

  const structuredData = useMemo(() => {
    if (pageType === 'narrative') {
      const article = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        inLanguage: activeLocale,
        mainEntityOfPage: canonicalUrl,
        datePublished: publishedTime,
        dateModified: modifiedTime ?? publishedTime,
        image: ogImageUrl ? [ogImageUrl] : undefined,
        keywords: tags && tags.length ? tags : undefined,
        author: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: config.baseUrl,
        },
      };
      return serializeStructuredData([article]);
    }

    const webSite = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description,
      url: config.baseUrl,
      inLanguage: activeLocale,
    };

    if (pageType === 'collection') {
      const collectionPage = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: activeLocale,
        isPartOf: {
          '@type': 'WebSite',
          url: config.baseUrl,
          name: SITE_NAME,
        },
      };
      return serializeStructuredData([webSite, collectionPage]);
    }

    if (pageType === 'home') {
      return serializeStructuredData(webSite);
    }

    return null;
  }, [
    activeLocale,
    canonicalUrl,
    description,
    pageType,
    publishedTime,
    modifiedTime,
    tags,
    title,
    ogImageUrl,
  ]);

  const themeColor = staticPage?.accentColor;

  useDocumentMeta(
    title,
    description,
    {
      url: canonicalUrl,
      type: pageType === 'narrative' ? 'article' : 'website',
      image: {
        url: ogImageUrl,
        alt: ogImageAlt,
        type: 'image/svg+xml',
      },
      locale: OG_LOCALE_MAP[activeLocale],
      alternates: ogLocaleAlternates,
    },
    canonicalUrl,
    alternateUrls,
    structuredData,
    themeColor,
    publishedTime,
    modifiedTime,
    tags
  );

  return null;
};

export default Meta;
