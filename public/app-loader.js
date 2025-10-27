const manifestCandidates = ['/manifest.json', '/.vite/manifest.json'];
const fallbackEntries = ['/assets/index.js'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForElement = async (selector, timeoutMs = 4000, pollMs = 50) => {
  const deadline = Date.now() + timeoutMs;
  let element = document.querySelector(selector);
  while (!element && Date.now() < deadline) {
    await sleep(pollMs);
    element = document.querySelector(selector);
  }
  return element ?? null;
};

const toAbsolute = (path) => {
  if (!path) return null;
  if (path.startsWith('/')) return path;
  return `/${path.replace(/^\.\/?/, '')}`;
};

const preloadCss = (href) => {
  const existing = document.querySelector(`link[data-app-loader-css="${href}"]`);
  if (existing) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = toAbsolute(href);
  link.dataset.appLoaderCss = href;
  document.head.appendChild(link);
};

const preloadModule = (href) => {
  const existing = document.querySelector(`link[data-app-loader-preload="${href}"]`);
  if (existing) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = toAbsolute(href);
  link.dataset.appLoaderPreload = href;
  document.head.appendChild(link);
};

const importViaScript = (src) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to import ${src}`));
    document.head.appendChild(script);
  });

const waitForModalRoot = async () => {
  const root = await waitForElement('[data-codex-modal-root]', 5000);
  return Boolean(root);
};

const tryDevImport = async () => {
  try {
    await import('/src/main.tsx');
    await waitForModalRoot();
    return true;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn('[app-loader] dev import failed', error);
    }
    return false;
  }
};

const loadFromManifest = async (urls) => {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        continue;
      }
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        continue;
      }
      const manifest = await res.json();
      const entry = manifest['src/main.tsx'] || Object.values(manifest).find((value) => value && value.isEntry);
      if (!entry || !entry.file) {
        continue;
      }

      (entry.css || []).forEach(preloadCss);
      (entry.imports || []).forEach((key) => {
        const dep = manifest[key];
        if (dep?.file) {
          preloadModule(dep.file);
        }
      });

      await import(toAbsolute(entry.file));
      await waitForModalRoot();
      return true;
    } catch (error) {
      console.warn(`[app-loader] manifest attempt failed for ${url}`, error);
    }
  }
  return false;
};

const probeFallbackEntries = async () => {
  for (const entry of fallbackEntries) {
    try {
      const response = await fetch(entry, {
        method: 'HEAD',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        continue;
      }
      await importViaScript(entry);
      await waitForModalRoot();
      return true;
    } catch (error) {
      console.warn(`[app-loader] fallback probe failed for ${entry}`, error);
    }
  }
  return false;
};

(() => {
  let bootPromise = null;

  const boot = async () => {
    if (document.querySelector('[data-codex-modal-root]')) {
      return true;
    }

    if (bootPromise) {
      return bootPromise;
    }

    bootPromise = (async () => {
      if (await tryDevImport()) {
        return true;
      }

      if (await loadFromManifest(manifestCandidates)) {
        return true;
      }

      if (await probeFallbackEntries()) {
        return true;
      }

      throw new Error('Failed to bootstrap React app');
    })();

    return bootPromise;
  };

  window.appLoader = Object.freeze({
    boot,
  });

  boot().catch((error) => {
    console.error('[app-loader] failed to bootstrap React app on /atlas', error);
  });
})();
