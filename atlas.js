/* --- Fromtheriver.org | atlas.js --- */
/* Logic for The Nakba: An Interactive Atlas of Erasure */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MAP INITIALIZATION ---
    // Initialize the Leaflet map. The view is centered on historic Palestine.
    // The zoom level is set to 8, which provides a good overview of the entire region.
    const map = L.map('map-atlas', {
        center: [31.5, 35.2], // Centered on historic Palestine
        zoom: 8,
        minZoom: 7, // Prevents zooming out too far
        maxZoom: 16, // Allows for detailed exploration
        zoomControl: false // We use the bottom-right zoom control
    });
    
    // Add a zoom control to the bottom right for better ergonomics on mobile
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // --- 2. TILE LAYER CONFIGURATION ---
    // The tile layer provides the visual map background.
    // We use CartoDB's "DarkMatter" tiles, which provide a dark, minimalist aesthetic.
    // This choice is deliberate: it ensures our data points (the villages) are the primary focus,
    // and it matches the overall design of fromtheriver.org.
=// CORRECTED AND VERIFIED - USES A NEUTRAL, DARK MAP LAYER
L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    minZoom: 7,
    maxZoom: 16
}).addTo(map);

    // --- 3. INFO PANEL TOGGLE LOGIC (IMPLEMENTED) ---
    // This section handles the functionality for the collapsible info panel.
    const infoBoxToggle = document.getElementById('info-box-toggle');
    const infoBoxContent = document.getElementById('info-box-content');

    if (infoBoxToggle && infoBoxContent) {
        infoBoxToggle.addEventListener('click', () => {
            // Check the current state from the 'aria-expanded' attribute.
            const isExpanded = infoBoxToggle.getAttribute('aria-expanded') === 'true';
            
            // Toggle the ARIA attribute for accessibility.
            infoBoxToggle.setAttribute('aria-expanded', String(!isExpanded));
            
            // Toggle the visibility class on the content panel.
            infoBoxContent.classList.toggle('is-hidden');
        });
    } else {
        // Log an error if the required elements aren't found, for easier debugging.
        console.error("Praxis Analysis: Info box toggle elements are missing. Interactivity cannot be initialized.");
    }

    // --- 4. DATA FETCHING & PROCESSING ---
    // We asynchronously fetch the `villages.json` file.
    // This file contains the array of depopulated Palestinian villages and their stories.
    fetch('villages.json')
        .then(response => {
            // Check if the network response is successful
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(villages => {
            // Once the data is successfully fetched and parsed, we call the function to plot the markers.
            plotVillageMarkers(villages);
        })
        .catch(error => {
            // If there's an error during the fetch operation, we log it to the console.
            // This is crucial for debugging and ensuring the application is robust.
            console.error("Praxis Analysis: Failed to fetch or process village data.", error);
            // Optionally, display an error message to the user on the map itself.
            const mapContainer = document.getElementById('map-atlas');
            mapContainer.innerHTML = `<div class="flex items-center justify-center h-full text-center text-red-400 p-8">
                <h2 class="text-2xl font-serif">Error: Could not load the Atlas data.</h2>
                <p>The historical record could not be retrieved. Please check the console for details or try refreshing the page.</p>
            </div>`;
        });

    // --- 5. MARKER & POPUP PLOTTING FUNCTION ---
    /**
     * Iterates through the village data and plots a marker for each one on the map.
     * @param {Array<Object>} villages - An array of village objects from villages.json.
     */
    function plotVillageMarkers(villages) {
        // We create a custom icon for our markers. A simple red dot is visually effective
        // and serves as a symbolic representation of a wound on the map.
        const villageIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#E53E3E; width:10px; height:10px; border-radius:50%; border: 1px solid #FFF;'></div>",
            iconSize: [10, 10],
            iconAnchor: [5, 5]
        });

        villages.forEach(village => {
            // For each village, create a marker at its latitude and longitude.
            const marker = L.marker([village.lat, village.lon], { icon: villageIcon }).addTo(map);

            // MODIFICATION: Conditionally create the settlement info string.
            // This prevents "Built on its ruins: N/A" or "undefined" from appearing.
            const settlementInfo = village.israeli_settlement
                ? `<p class="text-sm text-gray-500">
                       <strong class="text-gray-400">Built on its ruins:</strong> ${village.israeli_settlement}
                   </p>`
                : '';

            // Create the HTML content for the popup. This content is styled with Tailwind CSS classes
            // to match the aesthetic of the `node-card` elements on the main page.
            // This provides a consistent and immersive user experience.
            const popupContent = `
                <div class="space-y-2">
                    <h3 class="font-serif text-2xl text-white">${village.name}</h3>
                    <h4 class="font-sans text-lg text-gray-400 -mt-2">${village.name_arabic}</h4>
                    <p class="text-gray-300">${village.story}</p>
                    <div class="pt-2 border-t border-gray-600">
                        <p class="text-sm text-gray-500">
                            <strong class="text-gray-400">District:</strong> ${village.district}
                        </p>
                        <p class="text-sm text-gray-500">
                            <strong class="text-gray-400">Destroyed by:</strong> ${village.destroyed_by}
                        </p>
                        ${settlementInfo}
                    </div>
                </div>
            `;

            // Bind the popup to the marker. The popup will appear when the marker is clicked.
            marker.bindPopup(popupContent);
        });
    }
});
