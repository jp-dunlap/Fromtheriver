// public/app-loader.js
(function () {
  let bootPromise = null;

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ---------- path + CSS helpers ----------
  function norm(path) {
    if (!path) return null;
    return path.startsWith('/') ? path : `/${path}`;
  }
  function resolvedHref(href) {
    try { return new URL(href, window.location.origin).href; }
    catch { return href; }
  }
  function hasStylesheet(href) {
    const full = resolvedHref(href);
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => l.href === full);
  }
  function ensureStylesheet(href) {
    const src = norm(href);
    if (!src || hasStylesheet(src)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = src;
    link.setAttribute('data-codex-css', '1'); // for easy inspection/tests
    document.head.appendChild(link);
  }
  function collectCssFromManifest(manifest, key, seen = new Set(), out = []) {
    if (!key || seen.has(key)) return out;
    seen.add(key);
    const node = manifest[key];
    if (!node) return out;

    // CSS listed by Vite for this entry/chunk
    if (Array.isArray(node.css)) out.push(...node.css);

    // Some configs list extra assets; include .css
    if (Array.isArray(node.assets)) {
      out.push(...node.assets.filter(a => /\.css($|\?)/i.test(a)));
    }

    // Recurse into imported chunks
    if (Array.isArray(node.imports)) {
      for (const dep of node.imports) collectCssFromManifest(manifest, dep, seen, out);
    }
    return out;
  }
  // ----------------------------------------

  async function importViaScript(src) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function tryManifest(url) {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) return null;
    return res.json();
  }

  async function loadFromManifest() {
    const candidates = ['/manifest.json', '/.vite/manifest.json'];
    for (const url of candidates) {
      try {
        const manifest = await tryManifest(url);
        if (!manifest) continue;

        const entryKey =
          manifest['src/main.tsx'] ? 'src/main.tsx' :
          manifest['src/main.ts']  ? 'src/main.ts'  :
          manifest['index.html']   ? 'index.html'   : null;
        if (!entryKey) continue;

        const entryNode = manifest[entryKey];
        const entryJs = entryNode?.file && norm(entryNode.file);
        if (!entryJs) continue;

        // Inject ALL CSS (entry + recursive imports) BEFORE importing JS
        const cssFiles = Array.from(new Set(collectCssFromManifest(manifest, entryKey)));
        for (const css of cssFiles) ensureStylesheet(norm(css));

        await importViaScript(entryJs);
        return true;
      } catch (_) { /* try next candidate */ }
    }
    return false;
  }

  async function probeFallbacks() {
    const probes = ['/assets/index.js', '/assets/main.js'];
    for (const p of probes) {
      try {
        // Best-effort: sibling CSS (index.css/main.css)
        const guessCss = p.replace(/\.js(\?.*)?$/i, '.css');
        try {
          const head = await fetch(guessCss, { method: 'HEAD', credentials: 'same-origin' });
          if (head.ok) ensureStylesheet(guessCss);
        } catch (_) {}

        const headJs = await fetch(p, { method: 'HEAD', credentials: 'same-origin' });
        if (headJs.ok) {
          await importViaScript(p);
          return true;
        }
      } catch (_) { /* continue */ }
    }
    return false;
  }

  async function waitFor(selector, timeoutMs = 4000, pollMs = 50) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(pollMs);
    }
    return null;
  }

  async function boot() {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      // If already mounted, bail
      if (document.querySelector('[data-codex-modal-root]')) return;

      const ok = (await loadFromManifest()) || (await probeFallbacks());
      if (!ok) throw new Error('Codex boot failed: no manifest or entry script');

      // allow time for React to mount modal root
      await waitFor('[data-codex-modal-root]', 4000);
    })();
    return bootPromise;
  }

  window.appLoader = { boot };
})();
