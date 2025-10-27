// public/app-loader.js
(function () {
  let bootPromise = null;

  // ---------- CSS helpers ----------
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
    link.setAttribute('data-codex-css', '1'); // for inspection/tests
    document.head.appendChild(link);
  }
  function collectCssFromManifest(manifest, key, seen = new Set(), out = []) {
    if (!key || seen.has(key)) return out;
    seen.add(key);
    const node = manifest[key];
    if (!node) return out;
    if (Array.isArray(node.css)) out.push(...node.css);
    if (Array.isArray(node.assets)) out.push(...node.assets.filter(a => /\.css($|\?)/i.test(a)));
    if (Array.isArray(node.imports)) {
      for (const dep of node.imports) collectCssFromManifest(manifest, dep, seen, out);
    }
    return out;
  }
  // ---------------------------------

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    const res = await fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' });
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

        // Inject CSS for entry + all recursive imports BEFORE JS import
        const cssFiles = Array.from(
          new Set(
            collectCssFromManifest(manifest, entryKey)
              .map(norm)
              .filter(Boolean)
          )
        );
        for (const css of cssFiles) ensureStylesheet(css);

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
        // Best-effort: inject sibling CSS if present (index.css/main.css)
        const guessCss = norm(p.replace(/\.js(\?.*)?$/i, '.css'));
        try {
          const head = await fetch(guessCss, { method: 'HEAD', credentials: 'same-origin' });
          if (head.ok) ensureStylesheet(guessCss);
        } catch (_) {}

        const headJs = await fetch(p, { method: 'HEAD', credentials: 'same-origin' });
        if (headJs.ok) {
          await importViaScript(p);
          return true;
        }
      } catch (_) { /* try next fallback */ }
    }
    return false;
  }

  async function boot() {
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      if (document.querySelector('[data-codex-modal-root]')) return;

      const ok = (await loadFromManifest()) || (await probeFallbacks());
      if (!ok) throw new Error('Codex boot failed: no manifest or entry script');

      for (let i = 0; i < 40; i++) {
        if (document.querySelector('[data-codex-modal-root]')) return;
        await sleep(50);
      }
    })();

    return bootPromise;
  }

  window.appLoader = { boot };
})();
