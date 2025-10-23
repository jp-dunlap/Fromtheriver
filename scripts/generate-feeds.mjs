#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const dataDir = path.join(projectRoot, 'data');

const legacyVillagesPath = path.join(publicDir, 'villages.json');
const legacyFeedsDir = path.join(publicDir, 'feeds');
const normalizedVillagesPath = path.join(dataDir, 'villages.normalized.json');
const normalizedFeedJsonPath = path.join(publicDir, 'feed.json');
const normalizedFeedRssPath = path.join(publicDir, 'feed.xml');

const siteUrl = process.env.SITE_URL ?? 'https://fromtheriver.example';

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeCdata = (text) => text.replace(/]]>/g, ']]]]><![CDATA[>');
const stripHtml = (text) => text.replace(/<[^>]*>/g, '');
const truncate = (text, length = 320) =>
  text.length <= length ? text : `${text.slice(0, length - 1).trim()}…`;

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code !== 'ENOENT') {
      console.warn(`[generate-feeds] unable to access ${filePath}:`, error);
    }
    return false;
  }
}

async function generateLegacyFeeds() {
  if (!(await pathExists(legacyVillagesPath))) {
    return null;
  }

  const villagesRaw = await fs.readFile(legacyVillagesPath, 'utf8');
  const villages = JSON.parse(villagesRaw);
  const updated = new Date().toISOString();

  await fs.mkdir(legacyFeedsDir, { recursive: true });

  const villagesSummary = villages.map((village) => ({
    id: village.id,
    name: village.name,
    name_arabic: village.name_arabic,
    district: village.district,
    story: village.story,
  }));

  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'From the River – Dispossessed villages',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feeds/villages.json`,
    description:
      'Stories from Palestinian villages documented within From the River.',
    items: villagesSummary.map((village) => ({
      id: `fromtheriver-village-${village.id}`,
      url: `${siteUrl}/?village=${encodeURIComponent(village.name ?? '')}`,
      title: village.name,
      content_text: village.story,
      date_modified: updated,
    })),
  };

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>From the River – Dispossessed villages</title>\n    <link>${siteUrl}</link>\n    <description>Stories from Palestinian villages documented within From the River.</description>\n    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>\n${villages
    .map(
      (village) => `    <item>\n      <title>${escapeHtml(village.name ?? 'Village')}</title>\n      <link>${siteUrl}/?village=${encodeURIComponent(
        village.name ?? ''
      )}</link>\n      <guid isPermaLink="false">fromtheriver-village-${village.id}</guid>\n      <description><![CDATA[${village.story ?? ''}]]></description>\n    </item>`
    )
    .join('\n')}\n  </channel>\n</rss>\n`;

  await Promise.all([
    fs.writeFile(
      path.join(legacyFeedsDir, 'villages.json'),
      JSON.stringify(jsonFeed, null, 2),
      'utf8'
    ),
    fs.writeFile(path.join(legacyFeedsDir, 'villages.xml'), rssFeed, 'utf8'),
  ]);

  console.log(`Generated ${villages.length} legacy village feed items.`);
  return villages.length;
}

async function generateNormalizedFeeds() {
  if (!(await pathExists(normalizedVillagesPath))) {
    return null;
  }

  const raw = await fs.readFile(normalizedVillagesPath, 'utf8');
  const dataset = JSON.parse(raw);
  const villages = Array.isArray(dataset.villages) ? dataset.villages : [];
  const latest = villages.slice(0, 25);
  const now = new Date().toUTCString();

  const rssItems = latest
    .map((village) => {
      const name = village.names?.en ?? village.name ?? 'Unknown Village';
      const summarySource =
        village.narrative?.summary ??
        village.story ??
        village.overview ??
        '';
      const summary = truncate(stripHtml(summarySource));
      const descriptionCdata = sanitizeCdata(summary);
      const slug = village.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const link = `${siteUrl}/archive/${slug}`;

      return `    <item>\n      <title><![CDATA[${sanitizeCdata(
        name
      )}]]></title>\n      <link>${link}</link>\n      <guid isPermaLink="false">villages/${slug}</guid>\n      <description><![CDATA[${descriptionCdata}]]></description>\n    </item>`;
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
      const name = village.names?.en ?? village.name ?? 'Unknown Village';
      const slug = village.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const summarySource =
        village.narrative?.summary ?? village.story ?? village.overview ?? '';
      const summary = truncate(stripHtml(summarySource));
      const keyEvents = Array.isArray(village.narrative?.key_events)
        ? village.narrative.key_events
            .map((event) => event?.value)
            .filter(Boolean)
        : [];

      return {
        id: `villages/${slug}`,
        url: `${siteUrl}/archive/${slug}`,
        title: name,
        content_text: summary,
        tags: [village.district, ...(keyEvents ?? [])].filter(Boolean),
      };
    }),
  };

  await Promise.all([
    fs.writeFile(normalizedFeedRssPath, rss, 'utf8'),
    fs.writeFile(normalizedFeedJsonPath, JSON.stringify(jsonFeed, null, 2) + '\n', 'utf8'),
  ]);

  console.log(`Generated ${latest.length} normalized village feed items.`);
  return latest.length;
}

async function main() {
  const [legacyCount, normalizedCount] = await Promise.all([
    generateLegacyFeeds(),
    generateNormalizedFeeds(),
  ]);

  if (legacyCount === null && normalizedCount === null) {
    console.warn('[generate-feeds] No village datasets were found.');
  }
}

main().catch((error) => {
  console.error('[generate-feeds] failed:', error);
  process.exitCode = 1;
});
