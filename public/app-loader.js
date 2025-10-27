// public/app-loader.js
let __APP_BOOTED__ = false;

async function boot() {
  if (__APP_BOOTED__) return;
  try {
    // Dev: Vite serves /src/* as modules
    await import('/src/main.tsx');
    __APP_BOOTED__ = true;
    return;
  } catch {
    // Prod: no /src — fall through to manifest lookup
  }

  const res = await fetch('/manifest.json', { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Failed to fetch manifest.json: ${res.status}`);
  const manifest = await res.json();

  // Prefer explicit key; otherwise pick the first isEntry
  const entry = manifest['src/main.tsx'] || Object.values(manifest).find(v => v && v.isEntry);
  if (!entry || !entry.file) throw new Error('No entry for src/main.tsx in manifest');

  // Preload CSS (if present)
  (entry.css || []).forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/${href}`;
    document.head.appendChild(link);
  });

  // Optionally preload dependent chunks
  (entry.imports || []).forEach(key => {
    const dep = manifest[key];
    if (dep && dep.file) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = `/${dep.file}`;
      document.head.appendChild(link);
    }
  });

  // Import the built entry (executes side effects in main.tsx)
  await import(`/${entry.file}`);
  __APP_BOOTED__ = true;
}

boot().catch(err => {
  console.error('[app-loader] failed to bootstrap React app on /atlas', err);
});
