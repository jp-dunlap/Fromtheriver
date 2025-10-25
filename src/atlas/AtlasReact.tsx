import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

export default function AtlasReact() {
  const mapEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { L } = window;
    if (!L || !mapEl.current) {
      console.error('Leaflet not loaded');
      return undefined;
    }

    const map = L.map(mapEl.current, {
      zoomControl: false,
      minZoom: 6,
      maxZoom: 18,
    }).setView([31.9, 35.1], 8);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      disableClusteringAtZoom: 10,
      maxClusterRadius: 70,
      spiderfyOnMaxZoom: false,
    });
    map.addLayer(cluster);

    const villageIcon = L.divIcon({
      className: 'village-dot',
      html: '',
      iconSize: [10, 10],
    });

    function getCoords(v: any) {
      const lat = Number(v?.lat ?? v?.coordinates?.lat);
      const lon = Number(
        v?.lon ?? v?.lng ?? v?.coordinates?.lon ?? v?.coordinates?.lng,
      );
      return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
    }

    let cancelled = false;

    fetch('/villages.json')
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (cancelled) {
          return;
        }
        rows.forEach((v) => {
          const xy = getCoords(v);
          if (!xy) return;
          const marker = L.marker(xy, { icon: villageIcon });
          marker.on('click', () => {
            const slug = String(v.slug || '');
            if (!slug) return;
            window.dispatchEvent(
              new CustomEvent('codex:open', { detail: { slug } }),
            );
          });
          cluster.addLayer(marker);
        });
      })
      .catch((err) => console.error('villages.json load failed', err));

    return () => {
      cancelled = true;
      map.remove();
    };
  }, []);

  return <div id="atlas-root" ref={mapEl} style={{ width: '100%', height: '100vh' }} />;
}
