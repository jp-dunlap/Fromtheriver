#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  ROOT,
  getArchiveEntries,
  normalizeExcerpt,
} from './lib/archive.mjs';

const OUTPUT_DIR = path.resolve(ROOT, 'public/og');
const MAX_EXCERPT_LENGTH = 200;

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateLabel(isoDate) {
  if (!isoDate) {
    return '';
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function createSvg({ title, excerpt, dateLabel }) {
  const safeTitle = escapeXml(title);
  const safeExcerpt = escapeXml(excerpt);
  const safeDate = dateLabel ? escapeXml(dateLabel) : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="og-card-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#112240" />
    </linearGradient>
    <style><![CDATA[
      :root {
        color-scheme: dark;
      }
      .og-body {
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #e2e8f0;
      }
      .og-mark {
        letter-spacing: 0.32em;
        text-transform: uppercase;
        font-size: 28px;
        font-weight: 600;
        color: #94a3b8;
        margin: 0 0 32px;
      }
      .og-title {
        font-size: 72px;
        line-height: 1.05;
        font-weight: 700;
        color: #f8fafc;
        margin: 0 0 24px;
      }
      .og-excerpt {
        font-size: 34px;
        line-height: 1.35;
        margin: 0 0 32px;
        color: #cbd5f5;
      }
      .og-date {
        font-size: 28px;
        font-weight: 500;
        margin: 0;
        color: #94a3b8;
      }
      .og-card {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 80px 120px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.76));
      }
    ]]></style>
  </defs>
  <rect width="1200" height="630" fill="url(#og-card-bg)" rx="48" />
  <foreignObject x="0" y="0" width="1200" height="630">
    <div xmlns="http://www.w3.org/1999/xhtml" class="og-body">
      <div class="og-card">
        <p class="og-mark">From The River</p>
        <h1 class="og-title">${safeTitle}</h1>
        <p class="og-excerpt">${safeExcerpt}</p>
        ${safeDate ? `<p class="og-date">${safeDate}</p>` : ''}
      </div>
    </div>
  </foreignObject>
</svg>
`;
}

async function main() {
  const entries = await getArchiveEntries();
  if (entries.length === 0) {
    console.warn('[generate-og-svg] no archive entries found; skipping');
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    entries.map(async (entry) => {
      const excerpt = normalizeExcerpt(entry.excerpt, MAX_EXCERPT_LENGTH);
      const dateLabel = formatDateLabel(entry.date);
      const svg = createSvg({
        title: entry.title,
        excerpt,
        dateLabel,
      });
      const outputPath = path.resolve(OUTPUT_DIR, `${entry.slug}.svg`);
      await writeFile(outputPath, svg, 'utf8');
      console.log(`[generate-og-svg] wrote ${path.relative(ROOT, outputPath)}`);
    }),
  );
}

main().catch((error) => {
  console.error('[generate-og-svg] failed:', error);
  process.exitCode = 1;
});
