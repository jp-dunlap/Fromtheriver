#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUTPUT = path.resolve(ROOT, "public/sitemap.xml");
const FEED_PATH = path.resolve(ROOT, "public/feed.json");
const SITE_URL = "https://fromtheriver.org";
const ARCHIVE_LIMIT = Number.parseInt(
  process.env.SITEMAP_ARCHIVE_LIMIT ?? "50",
  10,
);
const ARCHIVE_PATH_PATTERN = /^\/archive\/([^/?#]+)/i;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractArchivePath(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(ARCHIVE_PATH_PATTERN);
    if (match) {
      const segment = match[1].trim().replace(/\/+$/, "");
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch (error) {
        decoded = segment;
      }
      return `/archive/${encodeURIComponent(decoded)}`;
    }
  } catch (error) {
    const fallbackMatch = `${url}`.match(ARCHIVE_PATH_PATTERN);
    if (fallbackMatch) {
      const segment = fallbackMatch[1].trim().replace(/\/+$/, "");
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch (error) {
        decoded = segment;
      }
      return `/archive/${encodeURIComponent(decoded)}`;
    }
  }

  return null;
}

async function loadArchiveRoutes() {
  try {
    const feedContents = await readFile(FEED_PATH, "utf8");
    const feed = JSON.parse(feedContents);
    const items = Array.isArray(feed.items) ? feed.items : [];

    return items
      .slice(0, ARCHIVE_LIMIT)
      .map((item) => extractArchivePath(item.url))
      .filter((route) => typeof route === "string")
      .map((route) => route ?? "")
      .filter(Boolean);
  } catch (error) {
    console.warn(
      "[generate-sitemap] unable to read feed.json for archive entries:",
      error.message ?? error,
    );
    return [];
  }
}

async function main() {
  const baseRoutes = ["/", "/atlas", "/feed.json", "/feed.xml"];
  const archiveRoutes = await loadArchiveRoutes();
  const uniqueRoutes = Array.from(new Set([...baseRoutes, ...archiveRoutes]));

  const body = uniqueRoutes
    .map(
      (route) =>
        `  <url>\n    <loc>${escapeXml(`${SITE_URL}${route}`)}</loc>\n  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  await writeFile(OUTPUT, xml, "utf8");
}

main().catch((error) => {
  console.error("[generate-sitemap] failed:", error);
  process.exitCode = 1;
});
