#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const IIFE = path.join(ROOT, 'dist-modal', 'codex-modal-host.iife.js');
const CSS  = path.join(ROOT, 'dist-modal', 'codex-modal-host.css');
const ATLAS = path.join(DIST, 'atlas.html');

function shortHash(buf, n = 12) {
  return createHash('sha256').update(buf).digest('hex').slice(0, n);
}

async function main() {
  const [jsBuf, cssBuf, atlasHtml] = await Promise.all([
    readFile(IIFE),
    readFile(CSS),
    readFile(ATLAS, 'utf8')
  ]);

  const ver = shortHash(Buffer.concat([jsBuf, cssBuf]));

  // Insert/update a meta marker
  let html = atlasHtml;
  if (!/name="codex:host-version"/.test(html)) {
    html = html.replace(
      /<meta name="viewport"[^>]*>/i,
      (m) => `${m}\n    <meta name="codex:host-version" content="${ver}">`
    );
  } else {
    html = html.replace(
      /(name="codex:host-version" content=")[^"]*(")/,
      `$1${ver}$2`
    );
  }

  // Append ?v=... to host CSS/JS includes
  html = html
    .replace(/href="\/codex-modal-host\.css(\?[^\"]*)?"/g, `href="/codex-modal-host.css?v=${ver}"`)
    .replace(/src="\/codex-modal-host\.iife\.js(\?[^\"]*)?"/g, `src="/codex-modal-host.iife.js?v=${ver}"`);

  await writeFile(ATLAS, html, 'utf8');
  console.log(`[codex-version] Injected host version ${ver} into dist/atlas.html`);
}

main().catch((e) => {
  console.error('[codex-version] failed:', e);
  process.exit(1);
});
