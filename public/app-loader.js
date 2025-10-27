// public/app-loader.js
(function () {
  let bootPromise = null;

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
    if (!response.ok) {
      return null;
    }
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return null;
    }
    return response.json();
  }

  function normalizePath(path) {
    if (!path) return null;
    return path.startsWith('/') ? path : `/${path}`;
  }

  async function loadFromManifest() {
    const candidates = ['/manifest.json', '/.vite/manifest.json'];
    for (const candidate of candidates) {
      try {
        const manifest = await tryManifest(candidate);
        if (!manifest) {
          continue;
        }

        const entryFile = manifest['src/main.tsx']?.file
          || manifest['src/main.ts']?.file
          || manifest['index.html']?.file
          || Object.values(manifest).find((value) => value && typeof value === 'object' && value.isEntry)?.file;

        if (entryFile) {
          const src = normalizePath(entryFile);
          await importViaScript(src);
          return true;
        }
      } catch (error) {
        console.warn('[app-loader] manifest load failed', error);
      }
    }
    return false;
  }

  async function probeFallbacks() {
    const probes = ['/assets/index.js', '/assets/main.js'];
    for (const probe of probes) {
      try {
        const response = await fetch(probe, {
          method: 'HEAD',
          credentials: 'same-origin',
        });
        if (!response.ok) {
          continue;
        }
        await importViaScript(probe);
        return true;
      } catch (error) {
        console.warn('[app-loader] fallback probe failed', error);
      }
    }
    return false;
  }

  function shouldTryDevEntry() {
    if (typeof window === 'undefined') {
      return false;
    }
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  async function tryDevEntry() {
    if (!shouldTryDevEntry()) {
      return false;
    }
    try {
      await importViaScript('/src/main.tsx');
      return true;
    } catch (error) {
      console.warn('[app-loader] dev import failed', error);
      return false;
    }
  }

  async function waitForCodexRoot() {
    for (let i = 0; i < 40; i += 1) {
      if (document.querySelector('[data-codex-modal-root]')) {
        return true;
      }
      await sleep(50);
    }
    return false;
  }

  async function boot() {
    if (bootPromise) {
      return bootPromise;
    }

    bootPromise = (async () => {
      if (document.querySelector('[data-codex-modal-root]')) {
        return true;
      }

      const loaded = (await tryDevEntry()) || (await loadFromManifest()) || (await probeFallbacks());
      if (!loaded) {
        throw new Error('Codex boot failed: no manifest or entry script');
      }

      const mounted = await waitForCodexRoot();
      if (!mounted) {
        throw new Error('Codex boot failed: modal root missing after load');
      }

      return true;
    })();

    return bootPromise;
  }

  window.appLoader = { boot };
})();
