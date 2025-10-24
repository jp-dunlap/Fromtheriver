#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUTPUT = path.resolve(ROOT, 'public/sitemap.xml');
const SITE_URL = 'https://fromtheriver.org';

const routes = ['/', '/atlas', '/feed.json', '/feed.xml'];

async function main() {
  const body = routes
    .map((route) => `  <url>\n    <loc>${SITE_URL}${route}</loc>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  await fs.writeFile(OUTPUT, xml, 'utf8');
}

main().catch((error) => {
  console.error('[generate-sitemap] failed:', error);
  process.exitCode = 1;
});
