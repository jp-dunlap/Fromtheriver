const mapContainer = document.getElementById('map-atlas');
const statusRegion = document.getElementById('map-loading-status');

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

let hasLoaded = false;

const loadAtlas = async () => {
  if (hasLoaded || !mapContainer) {
    return;
  }
  hasLoaded = true;

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

  const L = window.L;
  if (!L) {
    console.error('Leaflet library did not initialize.');
    if (statusRegion) {
      statusRegion.textContent = 'Atlas unavailable. Map library failed to initialize.';
    }
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="atlas-error"><p>Atlas unavailable. Map library failed to initialize.</p></div>';
      mapContainer.setAttribute('aria-busy', 'false');
    }
    return;
  }

  try {
    const atlasModule = await import('./atlas.js');
    if (typeof atlasModule.initializeAtlas === 'function') {
      await atlasModule.initializeAtlas(L);
    }

    if (statusRegion) {
      statusRegion.textContent = 'Interactive atlas ready. Focus the map to begin exploring.';
    }
  } catch (error) {
    console.error('Failed to load atlas resources', error);
    if (statusRegion) {
      statusRegion.textContent = 'Unable to load the interactive atlas.';
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
