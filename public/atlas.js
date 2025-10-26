const normalizeText = (value) => (value ?? '').toString().trim().toLowerCase();
const normalizeSlug = (value) => normalizeText(value);
const slugifyFallback = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const escapeHtml = (value) =>
  (value ?? '')
    .toString()
    .replace(/[&<>"']/g, (char) => {
      switch (char) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return char;
      }
    });

const getVillageNames = (village) => ({
  primary: village?.name ?? village?.names?.en ?? '',
  secondary: village?.name_arabic ?? village?.names?.ar ?? ''
});

const getVillageStory = (village) => village?.story ?? village?.narrative?.summary ?? '';
const getVillageDistrict = (village) => village?.district ?? village?.region ?? '';
const getVillageOperation = (village) => {
  if (village?.military_operation) {
    return village.military_operation;
  }
  if (village?.destruction?.operation) {
    return village.destruction.operation;
  }
  const keyEvents = Array.isArray(village?.narrative?.key_events) ? village.narrative.key_events : [];
  const operationEvent = keyEvents.find((event) => normalizeText(event?.label) === 'military operation');
  return operationEvent?.value ?? '';
};
const getVillageDestroyedBy = (village) => {
  const destroyed = village?.destroyed_by ?? village?.destruction?.perpetrators ?? [];
  if (Array.isArray(destroyed)) {
    return destroyed.filter(Boolean).join(', ');
  }
  return destroyed ?? '';
};
const getVillageSettlement = (village) => village?.israeli_settlement ?? village?.aftermath?.settlement ?? '';

const getVillageCoordinates = (village) => {
  if (typeof village?.lat === 'number' && typeof village?.lon === 'number') {
    return [village.lat, village.lon];
  }
  if (village?.lat != null && village?.lon != null) {
    const lat = Number(village.lat);
    const lon = Number(village.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return [lat, lon];
    }
  }
  if (village?.coordinates) {
    const lat = Number(village.coordinates.lat);
    const lon = Number(village.coordinates.lon ?? village.coordinates.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return [lat, lon];
    }
  }
  return null;
};

const getVillageSlug = (village) => {
  if (village?.slug) {
    return normalizeSlug(village.slug);
  }
  if (village?.names?.slug) {
    return normalizeSlug(village.names.slug);
  }
  const { primary } = getVillageNames(village);
  if (primary) {
    return slugifyFallback(primary);
  }
  return '';
};

const getSearchableNames = (village) => {
  const results = [];
  const { primary, secondary } = getVillageNames(village);
  const slug = getVillageSlug(village);
  if (primary) {
    results.push(normalizeText(primary));
  }
  if (secondary) {
    results.push(normalizeText(secondary));
  }
  if (slug) {
    results.push(slug);
  }
  if (Array.isArray(village?.alternate_names)) {
    village.alternate_names.filter(Boolean).forEach((name) => {
      results.push(normalizeText(name));
    });
  }
  return results;
};

const getValueForCategory = (village, category) => {
  switch (category) {
    case 'destroyed_by':
      return village?.destroyed_by ?? village?.destruction?.perpetrators ?? [];
    case 'military_operation':
      return village?.military_operation ?? village?.destruction?.operation ?? '';
    default:
      return village?.[category];
  }
};

const sanitizeId = (value) => slugifyFallback(value || '').replace(/[^a-z0-9-]/g, '');

const getVillagesArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.villages)) {
    return payload.villages;
  }
  return [];
};

async function loadVillages() {
  const candidates = [
    '/villages.json',
    '/data/villages.json',
    'villages.json',
    'data/villages.json',
  ];
  let lastErr = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const rawVillages = getVillagesArray(payload);
      if (!Array.isArray(rawVillages)) {
        throw new Error('Villages payload not an array');
      }

      const normalized = rawVillages
        .map((village, index) => {
          const lat = Number(
            village.lat ??
              village.latitude ??
              village.lat_deg ??
              village.latDeg ??
              village?.coordinates?.lat,
          );
          const lng = Number(
            village.lng ??
              village.lon ??
              village.longitude ??
              village.lng_deg ??
              village.lonDeg ??
              village?.coordinates?.lng ??
              village?.coordinates?.lon,
          );

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          const slugSource =
            village.slug ??
            village.id ??
            village.names?.slug ??
            village.name ??
            village.names?.en ??
            village.title ??
            `village-${index}`;
          const fallbackSlug = slugifyFallback(slugSource) || `village-${index}`;
          const slug = normalizeSlug(slugSource) || fallbackSlug;
          const nameSource =
            village.name ??
            village.title ??
            village.names?.en ??
            village.names?.primary ??
            slugSource ??
            fallbackSlug;
          const name = typeof nameSource === 'string' && nameSource.trim() !== ''
            ? nameSource
            : fallbackSlug;
          const districtSource = village.district ?? village.region ?? village.governorate ?? '';
          const district = typeof districtSource === 'string' ? districtSource : '';

          return {
            ...village,
            slug,
            name,
            lat,
            lon: lng,
            lng,
            latitude: lat,
            longitude: lng,
            district,
            __normalized: { slug, name, lat, lng, district },
          };
        })
        .filter(Boolean);

      if (normalized.length > 0) {
        return normalized;
      }

      lastErr = new Error('Normalized list empty');
    } catch (error) {
      lastErr = error;
    }
  }

  throw lastErr ?? new Error('No villages dataset found');
}

export async function initializeAtlas(L) {
  const mapContainer = document.getElementById('map-atlas');
  if (!mapContainer) {
    return;
  }

  const statusRegion = document.getElementById('map-loading-status');
  const announcementsRegion = document.getElementById('map-announcements');
  const searchBox = document.getElementById('search-box');
  const searchResults = document.getElementById('search-results');
  const searchCombobox = document.getElementById('search-combobox');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const filterContainer = document.getElementById('filter-container');

  mapContainer.setAttribute('tabindex', '0');
  mapContainer.setAttribute('role', 'region');
  mapContainer.setAttribute('aria-label', 'Interactive atlas of depopulated Palestinian villages');
  mapContainer.setAttribute('aria-busy', 'true');

  if (statusRegion) {
    statusRegion.textContent = 'Loading villages…';
  }

  const map = L.map('map-atlas', {
    center: [31.5, 35.2],
    zoom: 8,
    minZoom: 7,
    maxZoom: 16,
    zoomControl: false,
    keyboard: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const clusterGroup = typeof L.markerClusterGroup === 'function'
    ? L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        spiderfyOnEveryZoom: false,
        spiderfyOnClick: false,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: 55,
        chunkedLoading: true
      })
    : L.layerGroup();

  clusterGroup.addTo(map);
  const districtLayer = L.layerGroup();

  const villageIcon = L.divIcon({
    className: 'village-dot village-pin',
    html: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  let allVillages = [];
  let filteredVillages = [];
  let markers = [];
  const slugToMarker = new Map();
  const slugToVillage = new Map();
  let keyboardIndex = -1;

  const pendingSlug = normalizeSlug(new URLSearchParams(window.location.search).get('slug') ?? '');

  try {
    allVillages = await loadVillages();
  } catch (error) {
    console.error('Atlas initialization failed to load villages.', error);
    if (statusRegion) {
      statusRegion.textContent = 'Unable to load village data.';
    }
    mapContainer.innerHTML = '<div class="atlas-error"><p>Error: Could not load the Atlas data. Please check your connection and try again.</p></div>';
    mapContainer.setAttribute('aria-busy', 'false');
    throw error;
  }

  console.info('atlas: villages loaded =', allVillages.length);

  if (!allVillages.length) {
    if (statusRegion) {
      statusRegion.textContent = 'No villages found.';
    }
    mapContainer.setAttribute('aria-busy', 'false');
    return;
  }

  allVillages.forEach((village) => {
    const slug = getVillageSlug(village);
    if (slug) {
      slugToVillage.set(slug, village);
    }
  });

  setupDistrictAnchors(allVillages);
  setupFilterControls(allVillages);
  filteredVillages = allVillages.slice();
  plotVillageMarkers(filteredVillages);
  setupFilterListeners();
  setupSearchInteractions();
  setupMapKeyboard();

  if (pendingSlug) {
    focusVillageBySlug(pendingSlug, {
      announce: true,
      ensureVisible: true,
      openModal: true
    });
  }

  if (statusRegion) {
    statusRegion.textContent = `Loaded ${allVillages.length} villages. Focus the map and use the arrow keys to cycle through markers.`;
  }

  mapContainer.setAttribute('aria-busy', 'false');
  map.whenReady(() => {
    mapContainer.dataset.mapReady = 'true';
  });

  return map;

  function plotVillageMarkers(villages) {
    clusterGroup.clearLayers();
    markers = [];
    slugToMarker.clear();
    keyboardIndex = -1;

    villages.forEach((village) => {
      const coordinates = getVillageCoordinates(village);
      if (!coordinates) {
        return;
      }

      const slug = getVillageSlug(village);
      const { primary } = getVillageNames(village);
      const marker = L.marker(coordinates, {
        icon: villageIcon,
        title: primary || 'Village',
        keyboard: false
      });

      marker.villageData = village;

      marker.on('click', (event) => {
        event?.originalEvent?.preventDefault?.();
        focusMarker(marker, {
          announce: true,
          setKeyboardIndex: true,
          ensureVisible: true,
          openModal: true
        });
        try {
          mapContainer.focus({ preventScroll: true });
        } catch (error) {
          mapContainer.focus();
        }
      });

      clusterGroup.addLayer(marker);
      markers.push(marker);

      if (slug) {
        slugToMarker.set(slug, marker);
      }
    });

    if (!markers.length && statusRegion) {
      statusRegion.textContent = 'No villages match your current filters.';
    }
  }

  function openCodexModal(slug) {
    if (!slug) {
      return;
    }

    try {
      window.dispatchEvent(
        new CustomEvent('codex:open', {
          detail: { slug }
        }),
      );
    } catch (error) {
      // Silently ignore environments that restrict CustomEvent constructors.
    }

    const codexRoot = document.querySelector('[data-codex-modal-root]');
    const reactRoot = document.getElementById('root');
    const hasReactApp = Boolean(reactRoot && reactRoot.childElementCount > 0);

    if (!codexRoot && !hasReactApp) {
      const encoded = encodeURIComponent(slug);
      window.location.href = `/archive/${encoded}`;
    }
  }

  function ensureMarkerVisible(marker, callback) {
    if (typeof clusterGroup.zoomToShowLayer === 'function') {
      clusterGroup.zoomToShowLayer(marker, callback);
    } else {
      callback();
    }
  }

  function focusMarker(
    marker,
    { announce = true, setKeyboardIndex = false, ensureVisible = false, openModal = false } = {},
  ) {
    if (!marker) {
      return;
    }

    const onReady = () => {
      const targetZoom = Math.max(map.getZoom(), 11);
      map.flyTo(marker.getLatLng(), targetZoom, { duration: 0.6 });

      if (setKeyboardIndex) {
        keyboardIndex = markers.indexOf(marker);
      }

      if (announce) {
        announceSelection(marker.villageData);
      }

      const slug = getVillageSlug(marker.villageData);
      if (slug) {
        updateHistorySlug(slug);
        if (openModal) {
          openCodexModal(slug);
        }
      }
    };

    if (ensureVisible) {
      ensureMarkerVisible(marker, onReady);
    } else {
      onReady();
    }
  }

  function focusVillageBySlug(
    slug,
    { announce = true, ensureVisible = false, openModal = false } = {},
  ) {
    const normalized = normalizeSlug(slug);
    if (!normalized) {
      return false;
    }

    let marker = slugToMarker.get(normalized);

    if (!marker && slugToVillage.has(normalized)) {
      clearAllFilters({ announce: false });
      marker = slugToMarker.get(normalized);
    }

    if (marker) {
      focusMarker(marker, {
        announce,
        setKeyboardIndex: true,
        ensureVisible: true,
        openModal
      });
      return true;
    }

    return false;
  }

  function updateHistorySlug(slug) {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('slug', slug);
    } else {
      url.searchParams.delete('slug');
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function announceSelection(village) {
    if (!announcementsRegion) {
      return;
    }

    const { primary, secondary } = getVillageNames(village);
    const district = getVillageDistrict(village);
    const operation = getVillageOperation(village);
    const settlement = getVillageSettlement(village);
    const segments = [];

    if (primary) {
      segments.push(`Selected village: ${primary}`);
    }
    if (secondary) {
      segments.push(secondary);
    }
    if (district) {
      segments.push(`District ${district}`);
    }
    if (operation) {
      segments.push(`Military operation ${operation}`);
    }
    if (settlement) {
      segments.push(`Built on its ruins: ${settlement}`);
    }

    announcementsRegion.textContent = segments.join('. ');
  }

  function setupDistrictAnchors(villages) {
    districtLayer.clearLayers();

    const anchors = buildDistrictAnchors(villages);
    if (!anchors.length) {
      map.off('zoomend', updateDistrictLayerVisibility);
      if (map.hasLayer(districtLayer)) {
        map.removeLayer(districtLayer);
      }
      return;
    }

    anchors.forEach(({ district, lat, lon }) => {
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'district-anchor',
          html: `<span class="district-anchor-label">${escapeHtml(district)}</span>`,
          iconSize: [0, 0]
        }),
        interactive: false,
        keyboard: false
      });

      marker.addTo(districtLayer);
    });

    updateDistrictLayerVisibility();
    map.off('zoomend', updateDistrictLayerVisibility);
    map.on('zoomend', updateDistrictLayerVisibility);
  }

  function buildDistrictAnchors(villages) {
    const byDistrict = new Map();

    villages.forEach((village) => {
      const district = getVillageDistrict(village);
      const coordinates = getVillageCoordinates(village);
      if (!district || !coordinates) {
        return;
      }

      const name = district.trim();
      if (!name) {
        return;
      }

      const current = byDistrict.get(name) ?? { lat: 0, lon: 0, count: 0 };
      current.lat += coordinates[0];
      current.lon += coordinates[1];
      current.count += 1;
      byDistrict.set(name, current);
    });

    return Array.from(byDistrict.entries()).map(([district, info]) => ({
      district,
      lat: info.lat / info.count,
      lon: info.lon / info.count
    }));
  }

  function updateDistrictLayerVisibility() {
    const shouldShow = map.getZoom() <= 8;
    if (shouldShow) {
      if (!map.hasLayer(districtLayer)) {
        districtLayer.addTo(map);
      }
    } else if (map.hasLayer(districtLayer)) {
      map.removeLayer(districtLayer);
    }
  }

  function matchesSearchTerm(village, term) {
    if (!term) {
      return true;
    }
    const names = getSearchableNames(village);
    return names.some((name) => name.includes(term));
  }

  function matchesFilters(village, selectedFilters) {
    return Object.entries(selectedFilters).every(([category, values]) => {
      if (!values.length) {
        return true;
      }
      const rawValue = getValueForCategory(village, category);
      if (Array.isArray(rawValue)) {
        return rawValue.some((value) => values.includes(value));
      }
      return rawValue ? values.includes(rawValue) : false;
    });
  }

  function applyFilters({ announce = true } = {}) {
    const searchTerm = normalizeText(searchBox?.value ?? '');
    const selectedFilters = {};
    const checkboxes = filterContainer ? filterContainer.querySelectorAll('.filter-checkbox') : [];

    checkboxes.forEach((checkbox) => {
      const category = checkbox.dataset.category;
      if (!category) {
        return;
      }
      selectedFilters[category] = selectedFilters[category] ?? [];
      if (checkbox.checked) {
        selectedFilters[category].push(checkbox.value);
      }
    });

    filteredVillages = allVillages.filter((village) => matchesSearchTerm(village, searchTerm) && matchesFilters(village, selectedFilters));
    plotVillageMarkers(filteredVillages);

    if (announce && statusRegion) {
      if (filteredVillages.length === 0) {
        statusRegion.textContent = 'No villages match your current search or filters.';
      } else if (filteredVillages.length === allVillages.length && !searchTerm && Object.values(selectedFilters).every((values) => !values.length)) {
        statusRegion.textContent = `Showing all ${filteredVillages.length} villages.`;
      } else {
        statusRegion.textContent = `${filteredVillages.length} villages match your search and filters.`;
      }
    }

    return filteredVillages;
  }

  function clearAllFilters({ announce = true, refocusSearch = false } = {}) {
    if (searchBox) {
      searchBox.value = '';
    }

    if (searchResults && searchCombobox) {
      searchResults.innerHTML = '';
      searchResults.setAttribute('aria-hidden', 'true');
      searchCombobox.setAttribute('aria-expanded', 'false');
      searchBox?.removeAttribute('aria-activedescendant');
    }

    const checkboxes = filterContainer ? filterContainer.querySelectorAll('.filter-checkbox') : [];
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    applyFilters({ announce });

    if (refocusSearch && searchBox) {
      searchBox.focus();
    }

    updateHistorySlug('');
  }

  function setupFilterControls(villages) {
    const createCheckboxes = (category, containerId) => {
      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }

      const values = new Set();
      villages.forEach((village) => {
        const raw = getValueForCategory(village, category);
        if (Array.isArray(raw)) {
          raw.filter(Boolean).forEach((entry) => values.add(entry));
        } else if (raw) {
          values.add(raw);
        }
      });

      const sorted = Array.from(values).sort((a, b) => a.localeCompare(b));
      const fragment = document.createDocumentFragment();

      sorted.forEach((value) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'filter-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-600';
        checkbox.id = `${category}-${sanitizeId(value)}`;
        checkbox.value = value;
        checkbox.dataset.category = category;

        const label = document.createElement('label');
        label.setAttribute('for', checkbox.id);
        label.className = 'ml-2 text-sm text-gray-300';
        label.textContent = value;

        wrapper.append(checkbox, label);
        fragment.append(wrapper);
      });

      container.innerHTML = '';
      container.append(fragment);
    };

    createCheckboxes('district', 'district-filters');
    createCheckboxes('military_operation', 'operation-filters');
    createCheckboxes('destroyed_by', 'destroyed-by-filters');
  }

  function setupFilterListeners() {
    if (filterContainer) {
      filterContainer.addEventListener('change', () => {
        applyFilters({ announce: true });
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', (event) => {
        event.preventDefault();
        clearAllFilters({ announce: true, refocusSearch: true });
      });
    }
  }

  function setupSearchInteractions() {
    if (!searchBox || !searchResults || !searchCombobox) {
      return;
    }

    const closeResults = () => {
      searchResults.innerHTML = '';
      searchResults.setAttribute('aria-hidden', 'true');
      searchCombobox.setAttribute('aria-expanded', 'false');
      searchBox.removeAttribute('aria-activedescendant');
    };

    const getOptions = () => Array.from(searchResults.querySelectorAll('button.search-result-option'));

    const activateOption = (button) => {
      const options = getOptions();
      options.forEach((option) => {
        option.setAttribute('aria-selected', option === button ? 'true' : 'false');
      });
      if (button) {
        searchBox.setAttribute('aria-activedescendant', button.id);
      }
    };

    const focusOptionAt = (index) => {
      const options = getOptions();
      const target = options[index];
      if (target) {
        target.focus();
        activateOption(target);
      }
    };

    const handleSelection = (slug) => {
      const normalized = normalizeSlug(slug);
      if (!normalized || !slugToVillage.has(normalized)) {
        return;
      }

      searchBox.value = '';
      closeResults();
      applyFilters({ announce: false });
      focusVillageBySlug(normalized, {
        announce: true,
        ensureVisible: true,
        openModal: true
      });
      try {
        mapContainer.focus({ preventScroll: true });
      } catch (error) {
        mapContainer.focus();
      }
    };

    const renderMatches = (term) => {
      const trimmed = normalizeText(term);
      if (!trimmed) {
        closeResults();
        return;
      }

      const matches = allVillages.filter((village) => matchesSearchTerm(village, trimmed)).slice(0, 8);

      if (!matches.length) {
        searchResults.innerHTML = '';
        const empty = document.createElement('li');
        empty.className = 'search-results-empty text-sm text-gray-400 px-3 py-2';
        empty.textContent = 'No villages found.';
        empty.setAttribute('role', 'presentation');
        searchResults.append(empty);
        searchResults.setAttribute('aria-hidden', 'false');
        searchCombobox.setAttribute('aria-expanded', 'true');
        return;
      }

      const fragment = document.createDocumentFragment();
      matches.forEach((village, index) => {
        const slug = getVillageSlug(village);
        if (!slug) {
          return;
        }
        const { primary, secondary } = getVillageNames(village);
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'presentation');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-result-option';
        button.dataset.slug = slug;
        button.id = `search-option-${slug}`;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');

        const primaryLabel = document.createElement('span');
        primaryLabel.className = 'search-result-primary';
        primaryLabel.textContent = primary || 'Unnamed village';
        button.append(primaryLabel);

        if (secondary) {
          const secondaryLabel = document.createElement('span');
          secondaryLabel.className = 'search-result-secondary';
          secondaryLabel.textContent = secondary;
          button.append(secondaryLabel);
        }

        button.addEventListener('click', () => {
          handleSelection(slug);
        });

        button.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const options = getOptions();
            const currentIndex = options.indexOf(button);
            focusOptionAt(Math.min(currentIndex + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const options = getOptions();
            const currentIndex = options.indexOf(button);
            if (currentIndex <= 0) {
              searchBox.focus();
              closeResults();
            } else {
              focusOptionAt(currentIndex - 1);
            }
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelection(slug);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            searchBox.focus();
            closeResults();
          }
        });

        if (index === 0) {
          button.dataset.firstOption = 'true';
        }

        listItem.append(button);
        fragment.append(listItem);
      });

      searchResults.innerHTML = '';
      searchResults.append(fragment);
      searchResults.setAttribute('aria-hidden', 'false');
      searchCombobox.setAttribute('aria-expanded', 'true');
      activateOption(null);
    };

    searchBox.addEventListener('input', (event) => {
      renderMatches(event.target.value);
      applyFilters({ announce: false });
    });

    searchBox.addEventListener('keydown', (event) => {
      const options = getOptions();
      if (event.key === 'ArrowDown' && options.length) {
        event.preventDefault();
        focusOptionAt(0);
      } else if (event.key === 'ArrowUp') {
        if (options.length) {
          event.preventDefault();
          focusOptionAt(options.length - 1);
        }
      } else if (event.key === 'Enter') {
        if (!options.length) {
          const term = normalizeText(searchBox.value);
          const match = allVillages.find((village) => matchesSearchTerm(village, term));
          if (match) {
            event.preventDefault();
            handleSelection(getVillageSlug(match));
          }
        }
      } else if (event.key === 'Escape') {
        searchBox.value = '';
        closeResults();
        applyFilters({ announce: true });
      }
    });

    searchBox.addEventListener('focus', (event) => {
      renderMatches(event.target.value);
    });

    searchBox.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!searchCombobox.contains(document.activeElement)) {
          closeResults();
        }
      }, 150);
    });
  }

  function setupMapKeyboard() {
    mapContainer.addEventListener('focus', () => {
      if (statusRegion) {
        statusRegion.textContent = markers.length
          ? 'Map focused. Use the arrow keys to move between villages, then press Enter to open the Codex entry.'
          : 'Map focused. Adjust filters to display villages.';
      }
    });

    mapContainer.addEventListener('keydown', (event) => {
      if (!markers.length) {
        return;
      }

      const total = markers.length;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        keyboardIndex = keyboardIndex < 0 ? 0 : (keyboardIndex + 1) % total;
        focusMarker(markers[keyboardIndex], { announce: true, ensureVisible: true });
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        keyboardIndex = keyboardIndex < 0 ? total - 1 : (keyboardIndex - 1 + total) % total;
        focusMarker(markers[keyboardIndex], { announce: true, ensureVisible: true });
      } else if (event.key === 'Home') {
        event.preventDefault();
        keyboardIndex = 0;
        focusMarker(markers[keyboardIndex], { announce: true, ensureVisible: true });
      } else if (event.key === 'End') {
        event.preventDefault();
        keyboardIndex = total - 1;
        focusMarker(markers[keyboardIndex], { announce: true, ensureVisible: true });
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const targetIndex = keyboardIndex >= 0 ? keyboardIndex : 0;
        const targetMarker = markers[targetIndex];
        focusMarker(targetMarker, {
          announce: true,
          ensureVisible: true,
          openModal: true,
          setKeyboardIndex: true
        });
      }
    });
  }
}

(function debugCounter() {
  try {
    const params = new URL(window.location.href).searchParams;
    if (params.get('debug') !== '1') {
      return;
    }
  } catch (error) {
    console.warn('atlas debug overlay unavailable', error);
    return;
  }

  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:10px;bottom:10px;background:#0b1321;color:#bfe3ff;border:1px solid #16305a;padding:6px 10px;border-radius:8px;font:12px/1.4 system-ui;z-index:9999';
  box.id = 'atlas-debug';
  box.textContent = 'atlas: loading…';
  document.body.appendChild(box);

  const originalInfo = console.info;
  console.info = function patchedConsoleInfo(...args) {
    try {
      if (args[0] === 'atlas: villages loaded =') {
        box.textContent = `atlas: pins=${args[1]}`;
      }
    } catch (error) {
      console.warn('atlas debug overlay update failed', error);
    }
    return originalInfo.apply(this, args);
  };
})();
