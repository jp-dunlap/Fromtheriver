#!/usr/bin/env node
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

  console.log('[smoke] All checks passed');
}

main().catch((error) => {
  console.error('[smoke] failed:', error.message ?? error);
  process.exitCode = 1;
});
