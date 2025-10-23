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
  document.head.append(link);
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

  ensureStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  ensureStylesheet('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
  ensureStylesheet('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');

  try {
    const [leafletModule, markerClusterModule, atlasModule] = await Promise.all([
      import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js'),
      import('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js?module'),
      import('./atlas.js')
    ]);

    const L = leafletModule.default ?? leafletModule;
    const plugin = markerClusterModule?.default ?? markerClusterModule;
    if (typeof plugin === 'function') {
      plugin(L);
    } else if (plugin?.MarkerClusterGroup && typeof L.markerClusterGroup !== 'function') {
      L.MarkerClusterGroup = plugin.MarkerClusterGroup;
      L.markerClusterGroup = function markerClusterGroup(options) {
        return new L.MarkerClusterGroup(options);
      };
    }

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
