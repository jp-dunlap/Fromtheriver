// public/app-loader.js
(function () {
  let bootPromise = null;

  // ---------------- utils ----------------
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function norm(path) { return !path ? null : (path.startsWith('/') ? path : `/${path}`); }
  function abs(href) { try { return new URL(href, location.origin).href; } catch { return href; } }

  // CSS helpers
  function hasStylesheet(href) {
    const full = abs(href);
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => l.href === full);
  }
  function ensureStylesheet(href) {
    const src = norm(href);
    if (!src || hasStylesheet(src)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = src;
    link.setAttribute('data-codex-css', '1');
    document.head.appendChild(link);
  }
  function collectCssFromManifest(manifest, key, seen = new Set(), out = []) {
    if (!key || seen.has(key)) return out;
    seen.add(key);
    const node = manifest[key];
    if (!node) return out;
    if (Array.isArray(node.css)) out.push(...node.css);
    if (Array.isArray(node.assets)) out.push(...node.assets.filter(a => /\.css($|\?)/i.test(a)));
    if (Array.isArray(node.imports)) for (const dep of node.imports) collectCssFromManifest(manifest, dep, seen, out);
    return out;
  }

  // ensure a React root exists (some builds expect #root)
  function ensureRoot() {
    if (!document.getElementById('root')) {
      const div = document.createElement('div');
      div.id = 'root';
      // avoid layout shift; real UI renders in portals
      div.style.display = 'contents';
      document.body.appendChild(div);
    }
  }

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

  function pickEntry(manifest) {
    // 1) canonical
    let key = Object.keys(manifest).find(k => manifest[k]?.isEntry);
    if (key) return key;
    // 2) prefer files that look like a main/app/codex JS entry
    const keys = Object.keys(manifest);
    key = keys.find(k => /(codex|main|app)\.(m?js|tsx?)$/i.test(manifest[k]?.file || ''));
    if (key) return key;
    // 3) any JS-like file entry
    return keys.find(k => /\.[mc]?js$/.test(manifest[k]?.file || '')) || null;
  }

  async function loadFromManifest() {
    const candidates = ['/manifest.json', '/.vite/manifest.json'];
    for (const url of candidates) {
      try {
        const manifest = await tryManifest(url);
        if (!manifest) continue;

        const entryKey = pickEntry(manifest);
        if (!entryKey) continue;

        const entryNode = manifest[entryKey];
        const entryJs = entryNode?.file && norm(entryNode.file);
        if (!entryJs) continue;

        // root BEFORE importing app
        ensureRoot();

        // inject ALL CSS (entry + imports) BEFORE JS
        const cssFiles = Array.from(new Set(collectCssFromManifest(manifest, entryKey)));
        for (const css of cssFiles) ensureStylesheet(css);

        await importViaScript(entryJs);
        return true;
      } catch { /* try next */ }
    }
    return false;
  }

  async function probeFallbacks() {
    const probes = ['/assets/index.js', '/assets/main.js'];
    for (const p of probes) {
      try {
        ensureRoot();
        const guessCss = p.replace(/\.js(\?.*)?$/i, '.css');
        try {
          const headCss = await fetch(guessCss, { method: 'HEAD', credentials: 'same-origin' });
          if (headCss.ok) ensureStylesheet(guessCss);
        } catch {}
        const headJs = await fetch(p, { method: 'HEAD', credentials: 'same-origin' });
        if (headJs.ok) { await importViaScript(p); return true; }
      } catch {}
    }
    return false;
  }

  async function waitFor(selector, timeoutMs = 12000, pollMs = 50) {
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
      if (document.querySelector('[data-codex-modal-root]')) return;

      const ok = (await loadFromManifest()) || (await probeFallbacks());
      if (!ok) throw new Error('Codex boot failed: no manifest or entry script');

      const root = await waitFor('[data-codex-modal-root]', 12000);
      if (root) {
        window.dispatchEvent(new Event('codex:mounted'));
      } else {
        throw new Error('Codex bundle loaded but modal root never appeared');
      }
    })();
    return bootPromise;
  }

  window.appLoader = { boot };
})();
