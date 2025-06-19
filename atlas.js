/* --- Fromtheriver.org | atlas.js --- */
/* Logic for The Nakba: An Interactive Atlas of Erasure - V2 (Comprehensive Filtering) */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL VARIABLES & MAP INITIALIZATION ---
    let allVillages = [];
    let villageMarkersLayer = L.layerGroup(); // Use a layer group for easy marker management

    const map = L.map('map-atlas', {
        center: [31.5, 35.2],
        zoom: 8,
        minZoom: 7,
        maxZoom: 16,
        zoomControl: false,
        layers: [villageMarkersLayer] // Add the layer group to the map
    });
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // --- 2. DOM ELEMENT SELECTION ---
    const infoBoxToggle = document.getElementById('info-box-toggle');
    const infoBoxContent = document.getElementById('info-box-content');
    const searchBox = document.getElementById('search-box');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const filterAccordions = document.querySelectorAll('.filter-accordion-trigger');

    // --- 3. UI INTERACTIVITY SETUP ---
    // Main panel toggle
    infoBoxToggle?.addEventListener('click', () => {
        const isExpanded = infoBoxToggle.getAttribute('aria-expanded') === 'true';
        infoBoxToggle.setAttribute('aria-expanded', String(!isExpanded));
        infoBoxContent.classList.toggle('is-hidden');
    });
    
    // Filter accordion toggles
    filterAccordions.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const panel = trigger.nextElementSibling;
            trigger.setAttribute('aria-expanded', String(!isExpanded));
            panel.classList.toggle('open');
        });
    });

    // --- 4. DATA FETCHING & INITIALIZATION ---
    fetch('villages.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(villages => {
            allVillages = villages;
            plotVillageMarkers(allVillages);
            setupFilterControls(allVillages);
            setupEventListeners();
        })
        .catch(error => {
            console.error("Praxis Analysis: Failed to fetch or process village data.", error);
            const mapContainer = document.getElementById('map-atlas');
            if(mapContainer) {
                mapContainer.innerHTML = `<div class="flex items-center justify-center h-full text-center text-red-400 p-8">
                    <h2 class="text-2xl font-serif">Error: Could not load the Atlas data.</h2>
                    <p>The historical record could not be retrieved. Please check the console for details.</p>
                </div>`;
            }
        });

    // --- 5. MARKER & POPUP PLOTTING ---
    function plotVillageMarkers(villages) {
        villageMarkersLayer.clearLayers(); // Clear previous markers

        const villageIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#E53E3E; width:10px; height:10px; border-radius:50%; border: 1px solid #FFF;'></div>",
            iconSize: [10, 10],
            iconAnchor: [5, 5]
        });

        villages.forEach(village => {
            const marker = L.marker([village.lat, village.lon], { icon: villageIcon });
            marker.villageData = village;

            const settlementInfo = village.israeli_settlement ? `<p class="text-sm text-gray-500"><strong class="text-gray-400">Built on its ruins:</strong> ${village.israeli_settlement}</p>` : '';
            const operationInfo = village.military_operation ? `<p class="text-sm text-gray-500"><strong class="text-gray-400">Military Operation:</strong> ${village.military_operation}</p>` : '';
            
            const popupContent = `
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    <h3 class="font-serif text-2xl text-white">${village.name}</h3>
                    <h4 class="font-sans text-lg text-gray-400 -mt-2">${village.name_arabic}</h4>
                    <p class="text-gray-300">${village.story}</p>
                    <div class="pt-2 border-t border-gray-600">
                        <p class="text-sm text-gray-500"><strong class="text-gray-400">District:</strong> ${village.district}</p>
                        <p class="text-sm text-gray-500"><strong class="text-gray-400">Destroyed by:</strong> ${village.destroyed_by}</p>
                        ${operationInfo}
                        ${settlementInfo}
                    </div>
                </div>`;

            marker.bindPopup(popupContent);
            villageMarkersLayer.addLayer(marker);
        });
    }

    // --- 6. FILTERING LOGIC & UI SETUP ---
    function setupFilterControls(villages) {
        // Helper function to create checkboxes for a given category
        const createCheckboxes = (category, containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Extract unique, non-empty, sorted values for the category
            const items = [...new Set(villages.map(v => v[category]).flat().filter(Boolean))].sort();

            let checkboxesHTML = '';
            items.forEach(item => {
                checkboxesHTML += `
                    <div class="flex items-center">
                        <input type="checkbox" id="${item.replace(/\s+/g, '-')}" value="${item}" class="filter-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-600" data-category="${category}">
                        <label for="${item.replace(/\s+/g, '-')}" class="ml-2 text-sm text-gray-300">${item}</label>
                    </div>`;
            });
            container.innerHTML = checkboxesHTML;
        };

        // Create filters for each category
        createCheckboxes('district', 'district-filters');
        createCheckboxes('military_operation', 'operation-filters');
        createCheckboxes('destroyed_by', 'destroyed-by-filters');
    }

    function applyFilters() {
        const searchTerm = searchBox.value.toLowerCase();

        // Get selected filters from all categories
        const selectedFilters = {};
        document.querySelectorAll('.filter-checkbox:checked').forEach(cb => {
            const category = cb.dataset.category;
            if (!selectedFilters[category]) {
                selectedFilters[category] = [];
            }
            selectedFilters[category].push(cb.value);
        });

        const filteredVillages = allVillages.filter(village => {
            // Search filter
            const matchesSearch = village.name.toLowerCase().includes(searchTerm) || village.name_arabic.includes(searchTerm);

            // Checkbox filters
            const matchesFilters = Object.entries(selectedFilters).every(([category, values]) => {
                if (values.length === 0) return true; // No filter for this category, so it passes
                // Handle cases where the village data might be an array (like destroyed_by)
                const villageValue = village[category];
                if (Array.isArray(villageValue)) {
                    return villageValue.some(v => values.includes(v));
                }
                return values.includes(villageValue);
            });

            return matchesSearch && matchesFilters;
        });

        plotVillageMarkers(filteredVillages);
    }
    
    // --- 7. EVENT LISTENERS ---
    function setupEventListeners() {
        // Debounce search input to avoid excessive filtering on every keypress
        let searchTimeout;
        searchBox?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });

        // Listen for changes in the entire filter container
        const filterContainer = document.getElementById('filter-container');
        filterContainer?.addEventListener('change', applyFilters);

        // Reset button functionality
        resetFiltersBtn?.addEventListener('click', () => {
            searchBox.value = '';
            document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
            applyFilters();
        });
    }
});
