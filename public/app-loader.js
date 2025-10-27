// public/app-loader.js
(function () {
  let bootPromise = null;

  // --- CSS helpers ---------------------------------------------------------
  function norm(path) {
    if (!path) return null;
    return path.startsWith('/') ? path : `/${path}`;
  }

  function resolvedHref(href) {
    try {
      return new URL(href, window.location.origin).href;
    } catch {
      return href;
    }
  }

  function hasStylesheet(href) {
    const full = resolvedHref(href);
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
      (link) => link.href === full,
    );
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
    if (Array.isArray(node.assets)) out.push(...node.assets.filter((asset) => /\.css($|\?)/.test(asset)));
    if (Array.isArray(node.imports)) {
      for (const dep of node.imports) collectCssFromManifest(manifest, dep, seen, out);
    }
    return out;
  }
  // -------------------------------------------------------------------------

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function importViaScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function tryManifest(url) {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) return null;
    return response.json();
  }

  async function loadFromManifest() {
    const candidates = ['/manifest.json', '/.vite/manifest.json'];
    for (const candidate of candidates) {
      try {
        const manifest = await tryManifest(candidate);
        if (!manifest) continue;
        const entryKey = manifest['src/main.tsx']
          ? 'src/main.tsx'
          : manifest['src/main.ts']
          ? 'src/main.ts'
          : manifest['index.html']
          ? 'index.html'
          : null;
        if (!entryKey) continue;
        const entryNode = manifest[entryKey];
        const entryJs = entryNode?.file && norm(entryNode.file);
        if (!entryJs) continue;

        // NEW: inject CSS for entry + imported chunks BEFORE JS import
        const cssFiles = Array.from(new Set(collectCssFromManifest(manifest, entryKey)));
        for (const css of cssFiles) ensureStylesheet(css);

        await importViaScript(entryJs);
        return true;
      } catch (_) {
        /* try next candidate */
      }
    }
    return false;
  }

  async function probeFallbacks() {
    const probes = ['/assets/index.js', '/assets/main.js'];
    for (const probe of probes) {
      try {
        const guessCss = probe.replace(/\.js(\?.*)?$/, '.css');
        try {
          const cssHead = await fetch(guessCss, { method: 'HEAD', credentials: 'same-origin' });
          if (cssHead.ok) ensureStylesheet(guessCss);
        } catch (_) {
          /* ignore css fetch errors */
        }

        const headResponse = await fetch(probe, { method: 'HEAD', credentials: 'same-origin' });
        if (!headResponse.ok) continue;
        await importViaScript(probe);
        return true;
      } catch (_) {
        /* try next fallback */
      }
    }
    return false;
  }

  async function boot() {
    if (bootPromise) return bootPromise;

    bootPromise = (async () => {
      if (document.querySelector('[data-codex-modal-root]')) {
        return;
      }

      const ok = (await loadFromManifest()) || (await probeFallbacks());
      if (!ok) {
        throw new Error('Codex boot failed: no manifest or entry script');
      }

      for (let i = 0; i < 40; i += 1) {
        if (document.querySelector('[data-codex-modal-root]')) {
          return;
        }
        await sleep(50);
      }
    })();

    return bootPromise;
  }

  window.appLoader = { boot };
})();
