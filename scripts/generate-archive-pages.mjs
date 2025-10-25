#!/usr/bin/env node
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  DEFAULT_ARCHIVE_PAGE_LIMIT,
  ROOT,
  SITE_URL,
  escapeHtml,
  getArchiveEntries,
} from './lib/archive.mjs';

const OUTPUT_DIR = path.resolve(ROOT, 'public/archive');

const limit = Number.parseInt(process.env.ARCHIVE_PAGE_LIMIT ?? '', 10);
const ARCHIVE_PAGE_LIMIT = Number.isNaN(limit)
  ? DEFAULT_ARCHIVE_PAGE_LIMIT
  : limit;

function buildDocument({ slug, encodedSlug, title, excerpt, canonicalUrl }) {
  const safeTitle = escapeHtml(title);
  const safeExcerpt = escapeHtml(excerpt);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} — From The River</title>
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="description" content="${safeExcerpt}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeExcerpt}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="From The River" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeExcerpt}" />
    <style>
      *,*::before,*::after{box-sizing:border-box;}
      body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#050a12;color:#e8edf7;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;}
      main{max-width:40rem;width:100%;background:rgba(8,15,25,0.88);border:1px solid rgba(255,255,255,0.08);border-radius:1rem;padding:2.5rem;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.45);}
      h1{font-size:2rem;margin:0 0 1rem;font-weight:700;line-height:1.2;color:#f5f8ff;}
      p{margin:0 0 1.5rem;font-size:1rem;line-height:1.65;color:#d1daeb;}
      a{color:#8bd5ff;text-decoration:none;font-weight:600;}
      a:focus,a:hover{outline:none;text-decoration:underline;}
    </style>
    <script>
      (function () {
        var slug = ${JSON.stringify(slug)};
        if (!slug) {
          return;
        }
        var target = '/?slug=' + encodeURIComponent(slug);
        var encodedSlug = ${JSON.stringify(encodedSlug)};
        if (window.location.pathname !== '/archive/' + encodedSlug) {
          history.replaceState(null, '', '/archive/' + encodedSlug);
        }
        window.location.replace(target);
      })();
    </script>
  </head>
  <body>
    <noscript>
      <main>
        <h1>${safeTitle}</h1>
        <p>${safeExcerpt}</p>
        <p><a href="${SITE_URL}">Return to From The River</a></p>
      </main>
    </noscript>
  </body>
</html>
`;
}

async function main() {
  const entries = await getArchiveEntries({ limit: ARCHIVE_PAGE_LIMIT });
  if (entries.length === 0) {
    console.warn('[generate-archive-pages] feed contains no entries; skipping');
    return;
  }

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    entries.map(async (entry) => {
      const dir = path.resolve(OUTPUT_DIR, entry.encodedSlug);
      await mkdir(dir, { recursive: true });
      await writeFile(path.resolve(dir, 'index.html'), buildDocument(entry), 'utf8');
    }),
  );

  console.log(
    `[generate-archive-pages] wrote ${entries.length} pages to ${OUTPUT_DIR}`,
  );
}

main().catch((error) => {
  console.error('[generate-archive-pages] failed:', error);
  process.exitCode = 1;
});
