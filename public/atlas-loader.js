function waitForLeaflet(maxMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tick() {
      if (window.L) return resolve(window.L);
      if (Date.now() - start > maxMs) return reject(new Error('Leaflet not loaded'));
      setTimeout(tick, 25);
    })();
  });
}

const mapContainer = document.getElementById('map-atlas');
const statusRegion = document.getElementById('map-loading-status');

const getCodexVersion = () => {
  const meta = document.querySelector('meta[name="codex:host-version"]');
  return meta?.content || '';
};

const ensureStylesheet = (href) => {
  if (document.querySelector(`link[data-dynamic-style="${href}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.dynamicStyle = href;
  link.addEventListener('error', () => {
    console.error(`Failed to load stylesheet: ${href}`);
  });
  document.head.append(link);
};

const scriptPromises = new Map();

const loadScript = (src) => {
  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-dynamic-script="${src}"]`);
    if (existing) {
      if (existing.dataset.scriptLoaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (event) => reject(event.error ?? new Error(`Failed to load ${src}`)));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.defer = false;
    script.dataset.dynamicScript = src;
    script.addEventListener('load', () => {
      script.dataset.scriptLoaded = 'true';
      resolve();
    });
    script.addEventListener('error', (event) => {
      reject(event.error ?? new Error(`Failed to load ${src}`));
    });
    document.head.append(script);
  });

  scriptPromises.set(src, promise);
  return promise;
};

let codexHostLoading = null;

function waitForCodexHost({ timeoutMs = 5000, pollMs = 50 } = {}) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const onReady = () => {
      if (window.CodexModal?.open) {
        cleanup(); resolve();
      }
    };
    const onError = (err) => { cleanup(); reject(err || new Error('Failed to load Codex host')); };
    const onEvent = () => onReady();
    let script = document.querySelector('script[src^="/codex-modal-host.iife.js"]');
    const cleanup = () => {
      window.removeEventListener('codex:host:ready', onEvent);
      if (script) {
        script.removeEventListener('load', onReady);
        script.removeEventListener('error', onError);
      }
    };
    // Listen before injecting, so a fast load can't race past us.
    window.addEventListener('codex:host:ready', onEvent, { once: true });
    const tick = () => {
      if (window.CodexModal?.open) return onReady();
      if (Date.now() > deadline) return onError(new Error('Codex host not ready after 5s'));
      setTimeout(tick, pollMs);
    };
    setTimeout(tick, pollMs);
    if (!script) {
      const ver = getCodexVersion();
      script = document.createElement('script');
      script.src = ver
        ? `/codex-modal-host.iife.js?v=${ver}`
        : '/codex-modal-host.iife.js';
      script.async = true;      // dynamic scripts execute on load
      script.defer = false;     // make intent explicit
      script.setAttribute('data-codex-host', '1');
      script.addEventListener('load', onReady, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    }
  });
}

const dispatchDebug = (message) => {
  try {
    window.dispatchEvent(
      new CustomEvent('atlas:debug', {
        detail: { source: 'codex-host', message }
      })
    );
  } catch (error) {
    console.debug('atlas codex debug dispatch failed', error);
  }
};

const ensureCodexHostLoaded = () => {
  if (window.CodexModal?.open) {
    dispatchDebug('host: ready');
    return Promise.resolve();
  }

  if (codexHostLoading) {
    return codexHostLoading;
  }

  dispatchDebug('host: injecting');

  // Ensure CSS exists before JS for visual stability.
  if (!document.querySelector('link[rel="stylesheet"][href^="/codex-modal-host.css"]')) {
    const ver = getCodexVersion();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ver
      ? `/codex-modal-host.css?v=${ver}`
      : '/codex-modal-host.css';
    link.setAttribute('data-codex-css', '1');
    document.head.appendChild(link);
  }
  codexHostLoading = waitForCodexHost({ timeoutMs: 5000, pollMs: 50 })
    .then(() => {
      dispatchDebug('host: ready');
    })
    .catch((error) => {
      dispatchDebug('host: failed');
      throw error;
    });

  codexHostLoading.finally(() => {
    codexHostLoading = null;
  });

  return codexHostLoading;
};

if (typeof window !== 'undefined') {
  window.ensureCodexHostLoaded = ensureCodexHostLoaded;
}

let hasLoaded = false;

const loadAtlas = async () => {
  if (hasLoaded || !mapContainer) {
    return;
  }
  hasLoaded = true;

  // Begin loading the Codex modal host in the background so it’s ready by first click.
  if (typeof ensureCodexHostLoaded === 'function') {
    // Fire-and-forget; the click path will retry if needed.
    ensureCodexHostLoaded().catch(() => {});
  }

  if (statusRegion) {
    statusRegion.textContent = 'Loading interactive atlas…';
  }

  ensureStylesheet('/vendor/leaflet/leaflet.css');
  ensureStylesheet('/vendor/leaflet/MarkerCluster.css');
  ensureStylesheet('/vendor/leaflet/MarkerCluster.Default.css');

  try {
    await loadScript('/vendor/leaflet/leaflet.js');
    await loadScript('/vendor/leaflet/leaflet.markercluster.js');
  } catch (error) {
    console.error('Failed to load Leaflet assets', error);
    if (statusRegion) {
      statusRegion.textContent = 'Unable to load the interactive atlas resources.';
    }
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="atlas-error"><p>Unable to load the interactive atlas. Please refresh and try again.</p></div>';
      mapContainer.setAttribute('aria-busy', 'false');
    }
    return;
  }

  try {
    await waitForLeaflet();
    const L = window.L;
    if (!L) {
      throw new Error('Leaflet library did not initialize.');
    }

    const atlasModule = await import('./atlas.js');
    if (typeof atlasModule.initializeAtlas === 'function') {
      await atlasModule.initializeAtlas(L);
    }

    if (statusRegion) {
      statusRegion.textContent = 'Interactive atlas ready. Focus the map to begin exploring.';
    }
  } catch (error) {
    console.error('Atlas boot failed:', error);
    if (statusRegion) {
      statusRegion.textContent = 'Unable to load the interactive atlas. Please refresh and try again.';
    }
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="atlas-error"><p>Unable to load the interactive atlas. Please refresh and try again.</p></div>';
      mapContainer.setAttribute('aria-busy', 'false');
    }
  }
};

if (mapContainer) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void loadAtlas();
      }
    }, { rootMargin: '200px' });

    observer.observe(mapContainer);
  } else {
    void loadAtlas();
  }
}
