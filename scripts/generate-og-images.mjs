#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const OG_DIR = path.resolve(PUBLIC_DIR, 'og');
const FONT_BASE64_PATH = path.resolve(PUBLIC_DIR, 'fonts', 'dejavu-sans-arabic.woff.base64');
const CONTENT_DIR = path.resolve(ROOT, 'content');
const NARRATIVES_DIR = path.resolve(CONTENT_DIR, 'narratives');
const PAGES_CONFIG_PATH = path.resolve(ROOT, 'src', 'seo', 'pages.json');

const SITE_LABEL = 'From The River';
const FALLBACK_ACCENT = '#0f172a';
const NARRATIVE_ACCENT = '#7f1d1d';

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const resetDirectory = async (dirPath) => {
  await fs.rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
};

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const wrapText = (text, maxChars, maxLines) => {
  if (!text) {
    return [];
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length <= maxChars) {
      current = attempt;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = '';
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  const totalWords = words.length;
  const usedWords = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (totalWords > usedWords) {
    const lastIndex = lines.length - 1;
    if (lastIndex >= 0) {
      let truncated = lines[lastIndex];
      if (truncated.length > maxChars) {
        truncated = truncated.slice(0, Math.max(0, maxChars - 1));
      }
      lines[lastIndex] = `${truncated.replace(/\s+$/u, '')}…`;
    }
  }

  return lines;
};

const loadFontBase64 = async () => {
  const raw = await fs.readFile(FONT_BASE64_PATH, 'utf8');
  return raw.replace(/\s+/g, '');
};

const createOgSvg = ({ title, description, accentColor, fontBase64 }) => {
  const titleLines = wrapText(title, 28, 3);
  const descriptionLines = wrapText(description, 56, 3);

  const titleStartY = 220;
  const titleLineHeight = 76;
  const descriptionStartY = titleStartY + titleLines.length * titleLineHeight + 30;
  const descriptionLineHeight = 42;

  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="80" y="${titleStartY + index * titleLineHeight}" fill="#f8fafc" font-size="72" font-weight="600">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const descriptionSvg = descriptionLines
    .map(
      (line, index) =>
        `<text x="80" y="${descriptionStartY + index * descriptionLineHeight}" fill="#e2e8f0" font-size="34" opacity="0.88">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <linearGradient id="og-bg" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0%" stop-color="${accentColor}" />\n      <stop offset="100%" stop-color="#0b1120" />\n    </linearGradient>\n    <style>\n      @font-face {\n        font-family: 'DejaVuOg';\n        src: url(data:font/woff;base64,${fontBase64}) format('woff');\n        font-style: normal;\n        font-weight: 400;\n      }\n      .og-text {\n        font-family: 'DejaVuOg', 'Inter', 'Arial', sans-serif;\n      }\n    </style>\n  </defs>\n  <rect width="1200" height="630" rx="48" fill="url(#og-bg)" />\n  <rect x="60" y="60" width="200" height="6" rx="3" fill="#f8fafc" opacity="0.6" />\n  <text x="80" y="110" fill="#cbd5f5" font-size="30" letter-spacing="6" class="og-text" opacity="0.9">${escapeXml(
    SITE_LABEL.toUpperCase()
  )}</text>\n  ${titleSvg}\n  ${descriptionSvg}\n  <text x="80" y="560" fill="#cbd5f5" font-size="28" class="og-text" opacity="0.8">fromtheriver.org</text>\n</svg>\n`;
};

const readFrontmatter = (raw) => {
  if (!raw.startsWith('---')) {
    return { data: {}, body: raw };
  }

  const endIndex = raw.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { data: {}, body: raw };
  }

  const frontmatterBlock = raw.slice(3, endIndex).trim();
  const body = raw.slice(endIndex + 4).trimStart();

  const extractValue = (key) => {
    const pattern = new RegExp(`^${key}:(.*)$`, 'mi');
    const match = frontmatterBlock.match(pattern);
    if (!match) {
      return undefined;
    }
    const value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  };

  return {
    data: {
      title: extractValue('title'),
      summary: extractValue('summary'),
      date: extractValue('date'),
    },
    body,
  };
};

const deriveSummary = (frontmatterSummary, body) => {
  if (frontmatterSummary) {
    return frontmatterSummary;
  }
  const plain = body.replace(/\r/g, '').split(/\n\n+/)[0] ?? '';
  return plain.replace(/\s+/g, ' ').trim().slice(0, 220);
};

const loadPagesConfig = async () => {
  const raw = await fs.readFile(PAGES_CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
};

const createStaticImages = async ({ fontBase64, pagesConfig }) => {
  const pages = Array.isArray(pagesConfig.pages) ? pagesConfig.pages : [];
  for (const page of pages) {
    const localeMeta = page.locales?.en ?? Object.values(page.locales ?? {})[0] ?? {
      title: page.id,
      description: '',
    };
    const svg = createOgSvg({
      title: localeMeta.title,
      description: localeMeta.description,
      accentColor: page.accentColor ?? FALLBACK_ACCENT,
      fontBase64,
    });
    const outputPath = path.resolve(OG_DIR, `${page.id}.svg`);
    await fs.writeFile(outputPath, svg, 'utf8');
    console.log(`[generate-og-images] wrote ${path.relative(ROOT, outputPath)}`);
  }
};

const createNarrativeImages = async ({ fontBase64 }) => {
  let entries = [];
  try {
    entries = await fs.readdir(NARRATIVES_DIR, { withFileTypes: true });
  } catch (error) {
    if ((error ?? {}).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  if (!entries.length) {
    return;
  }

  const outputDir = path.resolve(OG_DIR, 'narratives');
  await ensureDir(outputDir);

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    const slug = entry.name.replace(/\.md$/, '');
    const filePath = path.resolve(NARRATIVES_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, body } = readFrontmatter(raw);
    const title = (data.title ?? slug).trim();
    const summary = deriveSummary(data.summary, body);

    const svg = createOgSvg({
      title,
      description: summary,
      accentColor: NARRATIVE_ACCENT,
      fontBase64,
    });

    const outputPath = path.resolve(outputDir, `${slug}.svg`);
    await fs.writeFile(outputPath, svg, 'utf8');
    console.log(`[generate-og-images] wrote ${path.relative(ROOT, outputPath)}`);
  }
};

const main = async () => {
  const fontBase64 = await loadFontBase64();
  const pagesConfig = await loadPagesConfig();
  await resetDirectory(OG_DIR);
  await createStaticImages({ fontBase64, pagesConfig });
  await createNarrativeImages({ fontBase64 });
};

main().catch((error) => {
  console.error('[generate-og-images] failed:', error);
  process.exitCode = 1;
});
