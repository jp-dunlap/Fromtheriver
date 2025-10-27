export type ArchiveSlugListener = (slug: string | null) => void;

type UpdateOptions = {
  replace?: boolean;
};

const ARCHIVE_PATH_PATTERN = /^\/archive\/([^/?#]+)/i;
const LEGACY_QUERY_KEY = "slug";

let lastKnownSlug: string | null = null;

type ParsedSlug = {
  slug: string | null;
  raw: string | null;
  reason: "empty" | "invalid" | null;
};

type SlugDetails = {
  slug: string | null;
  canonicalPath: string | null;
  needsCanonical: boolean;
  source: "path" | "query" | null;
  raw: string | null;
  parseReason: ParsedSlug["reason"];
};

function parseSlug(raw: string | null | undefined): ParsedSlug {
  if (raw == null) {
    return { slug: null, raw: null, reason: null };
  }

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return { slug: null, raw: "", reason: "empty" };
  }

  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded) {
      return { slug: null, raw: trimmed, reason: "empty" };
    }

    return { slug: decoded, raw: trimmed, reason: null };
  } catch {
    return { slug: null, raw: trimmed, reason: "invalid" };
  }
}

function getSlugDetails(location: Location): SlugDetails {
  const pathMatch = location.pathname.match(ARCHIVE_PATH_PATTERN);
  if (pathMatch) {
    const { slug, raw, reason } = parseSlug(pathMatch[1]);
    if (!slug) {
      return {
        slug: null,
        canonicalPath: null,
        needsCanonical: false,
        source: "path",
        raw,
        parseReason: reason,
      };
    }

    const canonicalPath = `/archive/${encodeURIComponent(slug)}`;
    const needsCanonical =
      location.pathname !== canonicalPath || (location.search ?? "") !== "";
    return {
      slug,
      canonicalPath,
      needsCanonical,
      source: "path",
      raw,
      parseReason: null,
    };
  }

  const params = new URLSearchParams(location.search);
  const hasQuerySlug = params.has(LEGACY_QUERY_KEY);
  const {
    slug: querySlug,
    raw: queryRaw,
    reason: queryReason,
  } = parseSlug(params.get(LEGACY_QUERY_KEY));

  if (querySlug) {
    return {
      slug: querySlug,
      canonicalPath: `/archive/${encodeURIComponent(querySlug)}`,
      needsCanonical: true,
      source: "query",
      raw: queryRaw,
      parseReason: null,
    };
  }

  if (hasQuerySlug) {
    return {
      slug: null,
      canonicalPath: null,
      needsCanonical: false,
      source: "query",
      raw: queryRaw,
      parseReason: queryReason ?? "empty",
    };
  }

  if (location.pathname.toLowerCase().startsWith("/archive")) {
    const remainder = location.pathname.slice("/archive".length);
    const normalizedRemainder = remainder.startsWith("/")
      ? remainder.slice(1)
      : remainder;

    return {
      slug: null,
      canonicalPath: null,
      needsCanonical: false,
      source: "path",
      raw: normalizedRemainder,
      parseReason: "empty",
    };
  }

  return {
    slug: null,
    canonicalPath: null,
    needsCanonical: false,
    source: null,
    raw: null,
    parseReason: null,
  };
}

export function updateArchiveDeepLink(
  slug: string | null,
  options: UpdateOptions = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const { slug: normalizedSlug } = parseSlug(slug);
  const encodedSlug = normalizedSlug ? encodeURIComponent(normalizedSlug) : "";
  const targetPath = normalizedSlug ? `/archive/${encodedSlug}` : "/";
  const { pathname, search } = window.location;

  if (pathname === targetPath && (search === "" || search === "?")) {
    lastKnownSlug = normalizedSlug;
    return;
  }

  const method: "replaceState" | "pushState" = options.replace
    ? "replaceState"
    : "pushState";
  window.history[method](null, "", targetPath);
  lastKnownSlug = normalizedSlug;
}

export function initArchiveDeepLink(listener: ArchiveSlugListener): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const applyFromLocation = () => {
    const { slug, canonicalPath, needsCanonical, source, raw, parseReason } =
      getSlugDetails(window.location);
    const previousSlug = lastKnownSlug;

    if (slug && canonicalPath && needsCanonical) {
      updateArchiveDeepLink(slug, { replace: true });
    }

    if (!slug && source && parseReason) {
      const context = source === "path" ? "path" : "query parameter";
      const descriptor = raw ? `"${raw}"` : "(empty)";
      console.warn(
        `[deeplink] Ignoring malformed archive slug from ${context}: ${descriptor}`,
      );
    }

    lastKnownSlug = slug;

    if (slug !== previousSlug || slug === null) {
      listener(slug);
    }
  };

  applyFromLocation();

  const handlePopState = () => {
    applyFromLocation();
  };

  window.addEventListener("popstate", handlePopState);
  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}
