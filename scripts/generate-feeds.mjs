#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  const latest = villages.slice(0, 25);
  const siteUrl = 'https://fromtheriver.org';
  const now = new Date().toUTCString();

  const rssItems = latest
    .map((village) => {
      const summary = truncate(stripHtml(village.narrative?.summary ?? ''));
      const descriptionCdata = sanitizeCdata(summary);
      const link = `${siteUrl}/archive/${village.slug}`;
      return [
        '    <item>',
        `      <title><![CDATA[${sanitizeCdata(village.names?.en ?? 'Unknown Village')}]]></title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="false">villages/${village.slug}</guid>`,
        `      <description><![CDATA[${descriptionCdata}]]></description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const rss = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>From The River · Archive Updates</title>',
    `    <link>${siteUrl}</link>`,
    '    <description>Latest additions to the From The River archive.</description>',
    `    <lastBuildDate>${now}</lastBuildDate>`,
    `${rssItems}`,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1',
    title: 'From The River · Archive Updates',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: 'Latest additions to the From The River archive.',
    items: latest.map((village) => {
      const summary = truncate(stripHtml(village.narrative?.summary ?? ''));
      return {
        id: `villages/${village.slug}`,
        url: `${siteUrl}/archive/${village.slug}`,
        title: village.names?.en ?? 'Unknown Village',
        content_text: summary,
        tags: [village.district, ...(village.narrative?.key_events ?? []).map((event) => event.value)].filter(Boolean),
      };
    }),
  };

  await fs.writeFile(OUTPUT_RSS, rss, 'utf8');
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(jsonFeed, null, 2) + '\n', 'utf8');
}

main().catch((error) => {
  console.error('[generate-feeds] failed:', error);
  process.exitCode = 1;
});
