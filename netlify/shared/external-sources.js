const fs = require('node:fs/promises');
const path = require('node:path');

const CACHE_PATH = path.join('/tmp', 'external-archive-cache.json');
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

const VISUALIZING_PALESTINE_ENDPOINT =
  'https://visualizingpalestine.org/wp-json/wp/v2/posts?per_page=5';
const BDS_ENDPOINT = 'https://bdsmovement.net/wp-json/wp/v2/posts?per_page=5';

const stripHtml = (input = '') => input.replace(/<[^>]*>/g, '').trim();

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function writeCache(payload) {
  try {
    await fs.writeFile(CACHE_PATH, JSON.stringify(payload), 'utf8');
  } catch (error) {
    console.warn('[external-sources] failed to persist cache', error);
  }
}

async function fetchVisualizingPalestine() {
  try {
    const response = await fetch(VISUALIZING_PALESTINE_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Visualizing Palestine HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.map((item) => ({
      id: `visualizing-palestine:${item.id}`,
      title: stripHtml(item.title?.rendered ?? item.title ?? 'Untitled'),
      link: item.link ?? `https://visualizingpalestine.org/?p=${item.id}`,
      excerpt: stripHtml(item.excerpt?.rendered ?? ''),
      publishedAt: item.date ?? null,
      source: 'visualizing-palestine',
    }));
  } catch (error) {
    console.error('[external-sources] visualizing palestine fetch failed', error);
    return [];
  }
}

async function fetchBdsCampaigns() {
  try {
    const response = await fetch(BDS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`BDS HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.map((item) => ({
      id: `bds-movement:${item.id}`,
      title: stripHtml(item.title?.rendered ?? item.title ?? 'Untitled'),
      link: item.link ?? `https://bdsmovement.net/?p=${item.id}`,
      excerpt: stripHtml(item.excerpt?.rendered ?? ''),
      publishedAt: item.date ?? null,
      source: 'bds-movement',
    }));
  } catch (error) {
    console.error('[external-sources] bds fetch failed', error);
    return [];
  }
}

async function fetchFreshPayload() {
  const [visualizingPalestine, bdsCampaigns] = await Promise.all([
    fetchVisualizingPalestine(),
    fetchBdsCampaigns(),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    visualizingPalestine,
    bdsCampaigns,
  };
}

async function getExternalArchive(forceRefresh = false) {
  const cache = await readCache();
  if (!forceRefresh && cache) {
    const fetchedAt = cache.fetchedAt ? Date.parse(cache.fetchedAt) : 0;
    const age = Date.now() - fetchedAt;
    if (Number.isFinite(age) && age < CACHE_TTL) {
      return cache;
    }
  }

  const fresh = await fetchFreshPayload();
  if (fresh.visualizingPalestine.length > 0 || fresh.bdsCampaigns.length > 0) {
    await writeCache(fresh);
    return fresh;
  }

  if (cache) {
    return cache;
  }

  return {
    fetchedAt: new Date().toISOString(),
    visualizingPalestine: [],
    bdsCampaigns: [],
  };
}

module.exports = {
  getExternalArchive,
  fetchFreshPayload,
  CACHE_PATH,
  CACHE_TTL,
};
