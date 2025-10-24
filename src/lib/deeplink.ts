export type ArchiveSlugListener = (slug: string | null) => void;

type UpdateOptions = {
  replace?: boolean;
};

const ARCHIVE_PATH_PATTERN = /^\/archive\/([^/?#]+)/i;
const LEGACY_QUERY_KEY = "slug";

let lastKnownSlug: string | null = null;

function sanitizeSlug(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  return decodeURIComponent(trimmed);
}

function getSlugDetails(location: Location): {
  slug: string | null;
  canonicalPath: string | null;
  needsCanonical: boolean;
} {
  const pathMatch = location.pathname.match(ARCHIVE_PATH_PATTERN);
  if (pathMatch) {
    const slug = sanitizeSlug(pathMatch[1]);
    if (!slug) {
      return { slug: null, canonicalPath: null, needsCanonical: false };
    }
    const canonicalPath = `/archive/${encodeURIComponent(slug)}`;
    const needsCanonical =
      location.pathname !== canonicalPath || (location.search ?? "") !== "";
    return { slug, canonicalPath, needsCanonical };
  }

  const params = new URLSearchParams(location.search);
  const slug = sanitizeSlug(params.get(LEGACY_QUERY_KEY));
  if (!slug) {
    return { slug: null, canonicalPath: null, needsCanonical: false };
  }

  return {
    slug,
    canonicalPath: `/archive/${encodeURIComponent(slug)}`,
    needsCanonical: true,
  };
}

export function updateArchiveDeepLink(
  slug: string | null,
  options: UpdateOptions = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSlug = sanitizeSlug(slug);
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
    const { slug, canonicalPath, needsCanonical } = getSlugDetails(
      window.location,
    );
    const previousSlug = lastKnownSlug;

    if (slug && canonicalPath && needsCanonical) {
      updateArchiveDeepLink(slug, { replace: true });
    } else if (
      !slug &&
      (window.location.search.includes(`${LEGACY_QUERY_KEY}=`) ||
        window.location.pathname.startsWith("/archive/"))
    ) {
      updateArchiveDeepLink(null, { replace: true });
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
