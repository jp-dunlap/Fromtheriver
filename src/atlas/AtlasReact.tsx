// src/atlas/AtlasReact.tsx
import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    L: any;
  }
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If a script with this src already exists, wait for it to finish
    const existing = Array.from(document.scripts).find((s) => s.src.endsWith(src));
    if (existing) {
      if ((existing as any)._loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)));
      return;
    }

    const el = document.createElement("script");
    el.src = src;
    el.defer = true;
    (el as any)._loaded = false;
    el.addEventListener("load", () => {
      (el as any)._loaded = true;
      resolve();
    });
    el.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)));
    document.head.appendChild(el);
  });
}

async function ensureLeaflet(): Promise<any> {
  // 1) Core Leaflet
  if (!window.L) {
    await loadScriptOnce("/vendor/leaflet/leaflet.js");
  }
  // 2) MarkerCluster plugin
  if (typeof window.L?.markerClusterGroup !== "function") {
    await loadScriptOnce("/vendor/leaflet/leaflet.markercluster.js");
  }
  if (!window.L) throw new Error("Leaflet failed to load");
  return window.L;
}

export default function AtlasReact() {
  const mapEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any | null = null;

    (async () => {
      try {
        const L = await ensureLeaflet();
        if (cancelled || !mapEl.current) return;

        map = L.map(mapEl.current, {
          zoomControl: false,
          minZoom: 6,
          maxZoom: 18,
        }).setView([31.9, 35.1], 8);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          disableClusteringAtZoom: 10,
          maxClusterRadius: 70,
          spiderfyOnMaxZoom: false,
          zoomToBoundsOnClick: true,
          chunkedLoading: true,
        });
        map.addLayer(cluster);

        const villageIcon = L.divIcon({
          className: "village-dot",
          html: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const resp = await fetch("/villages.json", { credentials: "same-origin" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const villages = await resp.json();

        const getCoords = (v: any) => {
          const lat = Number(v?.lat ?? v?.coordinates?.lat);
          const lon = Number(v?.lon ?? v?.lng ?? v?.coordinates?.lon ?? v?.coordinates?.lng);
          return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
        };

        villages.forEach((v: any) => {
          const xy = getCoords(v);
          if (!xy) return;
          const m = L.marker(xy, { icon: villageIcon, title: v?.name || v?.slug || "Village" });
          m.on("click", () => {
            const slug = String(v?.slug || "");
            if (!slug) return;
            // Ask the SPA to open the same transparent Codex modal:
            window.dispatchEvent(new CustomEvent("codex:open", { detail: { slug } }));
          });
          cluster.addLayer(m);
        });
      } catch (err) {
        console.error("Atlas ready failure:", err);
      }
    })();

    return () => {
      cancelled = true;
      try {
        map?.remove();
      } catch {
        /* noop */
      }
    };
  }, []);

  return <div id="atlas-root" ref={mapEl} style={{ width: "100%", height: "100vh" }} />;
}
