#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { escapeHtml, extractSlugFromUrl } from "./lib/archive.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);

const requiredFiles = [
  "public/vendor/leaflet/leaflet.js",
  "public/vendor/leaflet/leaflet.css",
  "public/vendor/leaflet/leaflet.markercluster.js",
  "public/vendor/leaflet/MarkerCluster.css",
  "public/vendor/leaflet/MarkerCluster.Default.css",
  "public/feed.json",
  "public/feed.xml",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/data/external-archive.json",
];

async function assertFileExists(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  try {
    await access(absolute);
  } catch (error) {
    throw new Error(`Required file missing: ${relativePath}`);
  }
}

async function main() {
  await Promise.all(requiredFiles.map((file) => assertFileExists(file)));

  const feedJson = JSON.parse(
    await readFile(path.resolve(ROOT, "public/feed.json"), "utf8"),
  );
  if (!Array.isArray(feedJson.items)) {
    throw new Error("feed.json must contain an items array");
  }

  const firstItem = feedJson.items[0] ?? null;
  const firstSlug = extractSlugFromUrl(firstItem?.url);
  const encodedSlug = firstSlug ? encodeURIComponent(firstSlug) : null;
  const archivePath = encodedSlug ? `/archive/${encodedSlug}` : "/archive/al-birwa";
  const ogPath = encodedSlug ? `/og/${encodedSlug}.svg` : "/og/al-birwa.svg";
  const firstTitle =
    typeof firstItem?.title === "string" && firstItem.title.trim() !== ""
      ? firstItem.title.trim()
      : null;

  const feedXml = await readFile(path.resolve(ROOT, "public/feed.xml"), "utf8");
  if (!feedXml.includes("<rss")) {
    throw new Error("feed.xml must contain an RSS document");
  }

  const sitemapXml = await readFile(
    path.resolve(ROOT, "public/sitemap.xml"),
    "utf8",
  );
  if (!sitemapXml.includes("<urlset")) {
    throw new Error("sitemap.xml must contain a urlset");
  }

  if (/https?:\/\/.+--fromtheriver\.netlify\.app\//i.test(sitemapXml)) {
    throw new Error("sitemap.xml must not contain Netlify preview URLs");
  }

  if (!/https:\/\/fromtheriver\.org\//i.test(sitemapXml)) {
    throw new Error(
      "sitemap.xml must contain production URLs (fromtheriver.org)",
    );
  }

  const robotsTxt = await readFile(
    path.resolve(ROOT, "public/robots.txt"),
    "utf8",
  );
  if (!/Sitemap:\s*https:\/\/fromtheriver\.org\/sitemap\.xml/i.test(robotsTxt)) {
    throw new Error(
      "robots.txt must point to https://fromtheriver.org/sitemap.xml",
    );
  }

  if (encodedSlug) {
    assert(
      sitemapXml.includes(`/archive/${encodedSlug}`),
      "sitemap.xml must include the first archive slug",
    );
  } else if (!sitemapXml.includes("/archive/")) {
    throw new Error("sitemap.xml must include archive entries");
  }

  const fetchImpl = globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) {
    throw new Error("Fetch API is not available in this Node runtime");
  }

  const origin = process.env.SMOKE_ORIGIN || "http://127.0.0.1:4173";

  const head = async (pathname, { manualRedirect = false } = {}) =>
    fetchImpl(`${origin}${pathname}`, {
      method: "HEAD",
      ...(manualRedirect ? { redirect: "manual" } : {}),
    });

  const get = async (pathname) => fetchImpl(`${origin}${pathname}`);

  const villagesHead = await head("/villages.json");
  if (villagesHead.status !== 200) {
    throw new Error("/villages.json must return 200");
  }

  const villagesResponse = await get("/villages.json");
  if (!villagesResponse.ok) {
    throw new Error("/villages.json must be readable");
  }

  const villagesJson = await villagesResponse.json();
  if (!Array.isArray(villagesJson) || villagesJson.length < 50) {
    throw new Error("villages.json should be an array with many entries");
  }

  const invalidVillage = villagesJson.find((village) => {
    const lat = Number(
      village?.lat ??
        village?.latitude ??
        village?.lat_deg ??
        village?.latDeg ??
        village?.coordinates?.lat,
    );
    const lng = Number(
      village?.lng ??
        village?.lon ??
        village?.longitude ??
        village?.lng_deg ??
        village?.lonDeg ??
        village?.coordinates?.lng ??
        village?.coordinates?.lon,
    );
    return !(Number.isFinite(lat) && Number.isFinite(lng));
  });
  if (invalidVillage) {
    throw new Error("villages.json contains entries without numeric lat/lng");
  }

  const atlasResponse = await fetchImpl(`${origin}/atlas`);
  assert(atlasResponse.ok, "GET /atlas should 200");

  const atlasHtmlHead = await head("/atlas.html", { manualRedirect: true });
  assert(
    String(atlasHtmlHead.status).startsWith("3"),
    "atlas.html should redirect",
  );

  const robotsHead = await head("/robots.txt");
  assert(robotsHead.ok, "/robots.txt should be present");

  const feedJsonHead = await head("/feed.json");
  assert(feedJsonHead.ok, "/feed.json should be present");

  const rssHead = await head("/feed.xml");
  assert(rssHead.ok, "/feed.xml should be present");

  const modalJsHead = await head("/codex-modal-host.iife.js");
  assert.equal(
    modalJsHead.status,
    200,
    "/codex-modal-host.iife.js should return 200",
  );
  {
    const ct = (modalJsHead.headers.get("content-type") || "").toLowerCase();
    assert(
      /javascript|ecmascript/.test(ct) && !/text\/html/.test(ct),
      "codex-modal-host.iife.js must be served as JavaScript (not HTML)",
    );
  }
  {
    const jsRes = await get("/codex-modal-host.iife.js");
    const text = await jsRes.text();
    assert(
      text && text.length > 1024,
      "codex-modal-host.iife.js appears too small; ensure Netlify did not rewrite it to HTML",
    );
    assert(
      text.includes("atlas-host-v2") && text.includes("__debugResolve"),
      "codex-modal-host.iife.js does not include expected debug/version markers (atlas-host-v2, __debugResolve).",
    );
    assert(
      !/process\.env/.test(text),
      'Host bundle still contains process.env; would crash at runtime',
    );
    console.log('✓ Host JS has no process.env substrings');
  }
  const modalCssHead = await head("/codex-modal-host.css");
  assert.equal(
    modalCssHead.status,
    200,
    "/codex-modal-host.css should return 200",
  );
  {
    const ct = (modalCssHead.headers.get("content-type") || "").toLowerCase();
    assert(
      /text\/css/.test(ct) && !/text\/html/.test(ct),
      "codex-modal-host.css must be served as CSS (not HTML)",
    );
  }
  {
    const cssRes = await get("/codex-modal-host.css");
    const text = await cssRes.text();
    assert(
      text && text.length > 256,
      "codex-modal-host.css appears too small; ensure Netlify did not rewrite it to HTML",
    );
  }

  const ogHead = await head(ogPath);
  assert(ogHead.ok, `${ogPath} should be present`);
  const ogContentType = ogHead.headers.get("content-type") || "";
  assert(
    /image\/svg\+xml/i.test(ogContentType),
    "OG image should be served as image/svg+xml",
  );

  const archiveHead = await head(archivePath);
  assert(archiveHead.ok, `${archivePath} should be present`);

  const archiveResponse = await fetchImpl(`${origin}${archivePath}`);
  assert(archiveResponse.ok, `${archivePath} should return HTML`);
  const archiveHtml = await archiveResponse.text();
  assert(
    archiveResponse.url.endsWith(archivePath),
    `${archivePath} should not redirect to another pathname`,
  );
  assert(
    archiveHtml.includes("data-codex-modal-root"),
    `${archivePath} HTML should include the codex modal root marker`,
  );
  if (firstTitle) {
    const escapedTitle = escapeHtml(firstTitle);
    assert(
      archiveHtml.includes(
        `<meta property="og:title" content="${escapedTitle}"`,
      ),
      "archive HTML should include og:title meta tag",
    );
  }
  if (encodedSlug) {
    assert(
      archiveHtml.includes(
        `<link rel="canonical" href="https://fromtheriver.org/archive/${encodedSlug}`,
      ),
      "archive HTML should include canonical link",
    );
  }

  const expectedOgImage = `https://fromtheriver.org${ogPath}`;
  assert(
    archiveHtml.includes(
      `<meta property="og:image" content="${escapeHtml(expectedOgImage)}`,
    ),
    "archive HTML should include og:image meta tag",
  );
  assert(
    archiveHtml.includes(
      `<meta name="twitter:image" content="${escapeHtml(expectedOgImage)}`,
    ),
    "archive HTML should include twitter:image meta tag",
  );

  const sitemapHead = await head("/sitemap.xml");
  assert(sitemapHead.ok, "/sitemap.xml should be present");

  const rootHead = await head("/");
  const hstsHeader = rootHead.headers.get("strict-transport-security") || "";
  assert(/strict-transport/i.test(hstsHeader), "HSTS header should be set");

  const cspHeader = rootHead.headers.get("content-security-policy") || "";
  assert(
    cspHeader.includes("default-src 'self'"),
    "CSP header should restrict default-src to 'self'",
  );

  const referrerPolicy = rootHead.headers.get("referrer-policy") || "";
  assert(
    /strict-origin-when-cross-origin/i.test(referrerPolicy),
    "Referrer-Policy should be strict-origin-when-cross-origin",
  );

  // 404 page should exist with proper status and CSP
  const fourOhFourHead = await head("/404");
  assert.equal(fourOhFourHead.status, 404, "/404 should return 404");
  const fourOhFourCsp =
    fourOhFourHead.headers.get("content-security-policy") || "";
  assert(
    fourOhFourCsp.includes("default-src 'self'"),
    "404 should include our CSP header",
  );

  const feedJsonContentType = feedJsonHead.headers.get("content-type") || "";
  assert(
    /application\/json/i.test(feedJsonContentType),
    "feed.json should return application/json",
  );

  const feedJsonCacheControl = feedJsonHead.headers.get("cache-control") || "";
  assert(
    /max-age=300/.test(feedJsonCacheControl),
    "feed.json should be cached for 5 minutes",
  );

  const rssContentType = rssHead.headers.get("content-type") || "";
  assert(
    /application\/rss\+xml/i.test(rssContentType),
    "feed.xml should return application/rss+xml",
  );

  const rssCacheControl = rssHead.headers.get("cache-control") || "";
  assert(
    /max-age=300/.test(rssCacheControl),
    "feed.xml should be cached for 5 minutes",
  );

  const externalArchiveHead = await head("/data/external-archive.json");
  assert(
    externalArchiveHead.ok,
    "/data/external-archive.json should be present",
  );

  const externalCacheControl =
    externalArchiveHead.headers.get("cache-control") || "";
  assert(
    /max-age=300/.test(externalCacheControl),
    "external archive cache should be 5 minutes",
  );

  const healthResponse = await fetchImpl(`${origin}/health.json`);
  assert(healthResponse.ok, "/health.json should be present");
  const healthBody = await healthResponse.json();
  assert.equal(healthBody.ok, true, "healthcheck ok flag should be true");
  const healthCacheControl =
    healthResponse.headers.get("cache-control") || "";
  assert(
    /no-store/i.test(healthCacheControl),
    "health.json should be marked as no-store",
  );

  console.log("[smoke] All checks passed");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[smoke] failed:", error.message ?? error);
    process.exit(1);
  });
