#!/usr/bin/env node
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

const requiredFiles = [
  'public/vendor/leaflet/leaflet.js',
  'public/vendor/leaflet/leaflet.css',
  'public/vendor/leaflet/leaflet.markercluster.js',
  'public/vendor/leaflet/MarkerCluster.css',
  'public/vendor/leaflet/MarkerCluster.Default.css',
  'public/feed.json',
  'public/feed.xml',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/data/external-archive.json',
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

  const feedJson = JSON.parse(await readFile(path.resolve(ROOT, 'public/feed.json'), 'utf8'));
  if (!Array.isArray(feedJson.items)) {
    throw new Error('feed.json must contain an items array');
  }

  const feedXml = await readFile(path.resolve(ROOT, 'public/feed.xml'), 'utf8');
  if (!feedXml.includes('<rss')) {
    throw new Error('feed.xml must contain an RSS document');
  }

  const sitemapXml = await readFile(path.resolve(ROOT, 'public/sitemap.xml'), 'utf8');
  if (!sitemapXml.includes('<urlset')) {
    throw new Error('sitemap.xml must contain a urlset');
  }

  const fetchImpl = globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) {
    throw new Error('Fetch API is not available in this Node runtime');
  }

  const origin = process.env.SMOKE_ORIGIN || 'http://127.0.0.1:4173';

  const head = async (pathname) => fetchImpl(`${origin}${pathname}`, { method: 'HEAD' });

  const atlasResponse = await fetchImpl(`${origin}/atlas`);
  assert(atlasResponse.ok, 'GET /atlas should 200');

  const atlasHtmlHead = await head('/atlas.html');
  assert(String(atlasHtmlHead.status).startsWith('3'), 'atlas.html should redirect');

  const robotsHead = await head('/robots.txt');
  assert(robotsHead.ok, '/robots.txt should be present');

  const rssHead = await head('/feed.xml');
  assert(rssHead.ok, '/feed.xml should be present');

  const sitemapHead = await head('/sitemap.xml');
  assert(sitemapHead.ok, '/sitemap.xml should be present');

  const rootHead = await head('/');
  const hstsHeader = rootHead.headers.get('strict-transport-security') || '';
  assert(/strict-transport/i.test(hstsHeader), 'HSTS header should be set');

  const referrerPolicy = rootHead.headers.get('referrer-policy') || '';
  assert(/strict-origin-when-cross-origin/i.test(referrerPolicy), 'Referrer-Policy should be strict-origin-when-cross-origin');

  console.log('[smoke] All checks passed');
}

main().catch((error) => {
  console.error('[smoke] failed:', error.message ?? error);
  process.exitCode = 1;
});
