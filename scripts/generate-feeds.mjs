#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_ARCHIVE_PAGE_LIMIT,
  SITE_URL,
  coerceIsoDate,
} from './lib/archive.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const DATA_PATH = path.resolve(ROOT, 'data/villages.normalized.json');
const OUTPUT_RSS = path.resolve(ROOT, 'public/feed.xml');
const OUTPUT_JSON = path.resolve(ROOT, 'public/feed.json');

function sanitizeCdata(text) {
  return text.replace(/]]>/g, ']]]]><![CDATA[>');
}

function stripHtml(text) {
  return text.replace(/<[^>]*>/g, '');
}

function truncate(text, length = 320) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trim()}…`;
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const dataset = JSON.parse(raw);
  const villages = Array.isArray(dataset.villages) ? dataset.villages : [];
  const latest = villages.slice(0, DEFAULT_ARCHIVE_PAGE_LIMIT);
  const siteUrl = SITE_URL;
  const generatedAt =
    coerceIsoDate(dataset?.metadata?.generated_at) ?? new Date().toISOString();
  const now = new Date(generatedAt).toUTCString();

  const resolveVillageDate = (village) =>
    coerceIsoDate(
      village?.narrative?.published_at ??
        village?.narrative?.publishedAt ??
        village?.published_at ??
        village?.publishedAt ??
        dataset?.metadata?.generated_at,
    ) ?? generatedAt;

  const formatRssDate = (isoDate) => new Date(isoDate).toUTCString();

  const rssItems = latest
    .map((village) => {
      const summary = truncate(stripHtml(village.narrative?.summary ?? ''));
      const descriptionCdata = sanitizeCdata(summary);
      const slug = village.slug;
      const link = `${siteUrl}/archive/${slug}`;
      const isoDate = resolveVillageDate(village);
      const imageUrl = `${siteUrl}/og/${slug}.svg`;
      return `    <item>\n      <title><![CDATA[${sanitizeCdata(
        village.names?.en ?? 'Unknown Village'
      )}]]></title>\n      <link>${link}</link>\n      <guid isPermaLink=\"false\">villages/${slug}</guid>\n      <description><![CDATA[${descriptionCdata}]]></description>\n      <pubDate>${formatRssDate(
        isoDate
      )}</pubDate>\n      <enclosure url="${imageUrl}" length="0" type="image/svg+xml" />\n    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>From The River · Archive Updates</title>\n    <link>${siteUrl}</link>\n    <description>Latest additions to the From The River archive.</description>\n    <lastBuildDate>${now}</lastBuildDate>\n${rssItems}\n  </channel>\n</rss>\n`;

  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1',
    title: 'From The River · Archive Updates',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: 'Latest additions to the From The River archive.',
    items: latest.map((village) => {
      const summary = truncate(stripHtml(village.narrative?.summary ?? ''));
      const isoDate = resolveVillageDate(village);
      const slug = village.slug;
      const imageUrl = `${siteUrl}/og/${slug}.svg`;
      return {
        id: `villages/${slug}`,
        url: `${siteUrl}/archive/${slug}`,
        title: village.names?.en ?? 'Unknown Village',
        content_text: summary,
        summary,
        date: isoDate,
        date_published: isoDate,
        image: imageUrl,
        tags: [
          village.district,
          ...(village.narrative?.key_events ?? []).map((event) => event.value),
        ].filter(Boolean),
      };
    }),
    metadata: {
      generated_at: generatedAt,
    },
  };

  await fs.writeFile(OUTPUT_RSS, rss, 'utf8');
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(jsonFeed, null, 2) + '\n', 'utf8');
}

main().catch((error) => {
  console.error('[generate-feeds] failed:', error);
  process.exitCode = 1;
});
