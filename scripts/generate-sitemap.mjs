#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_ARCHIVE_PAGE_LIMIT,
  ROOT,
  SITE_URL,
  getArchiveEntries,
} from "./lib/archive.mjs";

const OUTPUT = path.resolve(ROOT, "public/sitemap.xml");
const requestedLimit = Number.parseInt(
  process.env.SITEMAP_ARCHIVE_LIMIT ?? "",
  10,
);
const SITEMAP_ARCHIVE_LIMIT = Number.isNaN(requestedLimit)
  ? DEFAULT_ARCHIVE_PAGE_LIMIT
  : requestedLimit;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  const baseRoutes = ["/", "/atlas", "/feed.json", "/feed.xml"];
  const archiveEntries = await getArchiveEntries({
    limit: SITEMAP_ARCHIVE_LIMIT,
  });
  const archiveRoutes = archiveEntries.map(
    (entry) => `/archive/${entry.encodedSlug}`,
  );
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
