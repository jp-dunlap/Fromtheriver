#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const FEED_PATH = path.resolve(ROOT, "public/feed.json");
const OUTPUT_DIR = path.resolve(ROOT, "public/archive");
const SITE_URL = "https://fromtheriver.org";
const MAX_SHIMS = Number.parseInt(process.env.ARCHIVE_SHIM_LIMIT ?? "50", 10);
const ARCHIVE_PATH_PATTERN = /^\/archive\/([^/?#]+)/i;

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeDescription(value) {
  if (!value) {
    return "Explore the From The River archive.";
  }
  const condensed = value.replace(/\s+/g, " ").trim();
  if (condensed.length <= 280) {
    return condensed;
  }
  return `${condensed.slice(0, 277)}…`;
}

function extractSlugFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(ARCHIVE_PATH_PATTERN);
    if (match) {
      const segment = match[1].trim().replace(/\/+$/, "");
      try {
        return decodeURIComponent(segment);
      } catch (error) {
        return segment;
      }
    }
    return null;
  } catch (error) {
    const fallbackMatch = `${url}`.match(ARCHIVE_PATH_PATTERN);
    if (fallbackMatch) {
      const segment = fallbackMatch[1].trim().replace(/\/+$/, "");
      try {
        return decodeURIComponent(segment);
      } catch (fallbackError) {
        return segment;
      }
    }
    return null;
  }
}

function buildDocument({ slug, title, description }) {
  const canonicalUrl = `${SITE_URL}/archive/${encodeURIComponent(slug)}`;
  const redirectTarget = `/?slug=${encodeURIComponent(slug)}`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} — From The River</title>
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="From The River" />
    <meta property="og:title" content="${safeTitle} — From The River" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle} — From The River" />
    <meta name="twitter:description" content="${safeDescription}" />
    <script>
      (function () {
        var slug = ${JSON.stringify(slug)};
        var redirectTarget = '/?slug=' + encodeURIComponent(slug);
        if (window.location.pathname !== '/archive/' + slug) {
          history.replaceState(null, '', '/archive/' + slug);
        }
        window.location.replace(redirectTarget);
      })();
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=${redirectTarget}" />
    </noscript>
  </head>
  <body>
    <main>
      <p>Redirecting to the From The River archive entry for ${safeTitle}…</p>
    </main>
  </body>
</html>
`;
}

async function main() {
  const feedContents = await readFile(FEED_PATH, "utf8");
  const feed = JSON.parse(feedContents);
  const items = Array.isArray(feed.items) ? feed.items : [];

  if (items.length === 0) {
    console.warn(
      "[generate-archive-shims] feed contains no items; skipping shim generation",
    );
    return;
  }

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const selection = items.slice(0, MAX_SHIMS);

  await Promise.all(
    selection.map(async (item) => {
      const slug = extractSlugFromUrl(item.url);
      if (!slug) {
        console.warn(
          "[generate-archive-shims] unable to derive slug for item",
          item,
        );
        return;
      }

      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Archive Entry";
      const description = normalizeDescription(item.content_text);
      const dir = path.resolve(OUTPUT_DIR, slug);

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.resolve(dir, "index.html"),
        buildDocument({ slug, title, description }),
        "utf8",
      );
    }),
  );

  console.log(
    `[generate-archive-shims] wrote ${selection.length} shim pages to ${OUTPUT_DIR}`,
  );
}

main().catch((error) => {
  console.error("[generate-archive-shims] failed:", error);
  process.exitCode = 1;
});
