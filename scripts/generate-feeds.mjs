import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const villagesPath = path.join(publicDir, 'villages.json');
const feedsDir = path.join(publicDir, 'feeds');
const siteUrl = process.env.SITE_URL ?? 'https://fromtheriver.example';

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildRssItem = (village) => `    <item>
      <title>${escapeHtml(village.name)}</title>
      <link>${siteUrl}/?village=${encodeURIComponent(village.name)}</link>
      <guid isPermaLink="false">fromtheriver-village-${village.id}</guid>
      <description><![CDATA[${village.story}]]></description>
    </item>`;

async function generateFeeds() {
  const villagesRaw = await fs.readFile(villagesPath, 'utf8');
  const villages = JSON.parse(villagesRaw);
  const updated = new Date().toISOString();

  await fs.mkdir(feedsDir, { recursive: true });

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
      url: `${siteUrl}/?village=${encodeURIComponent(village.name)}`,
      title: village.name,
      content_text: village.story,
      date_modified: updated,
    })),
  };

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>From the River – Dispossessed villages</title>
      <link>${siteUrl}</link>
      <description>Stories from Palestinian villages documented within From the River.</description>
      <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
${villages.map(buildRssItem).join('\n')}
    </channel>
  </rss>\n`;

  await Promise.all([
    fs.writeFile(
      path.join(feedsDir, 'villages.json'),
      JSON.stringify(jsonFeed, null, 2),
      'utf8'
    ),
    fs.writeFile(path.join(feedsDir, 'villages.xml'), rssFeed, 'utf8'),
  ]);

  console.log(`Generated ${villages.length} village feed items.`);
}

try {
  await generateFeeds();
} catch (error) {
  console.error('Failed to generate feeds', error);
  process.exitCode = 1;
}
