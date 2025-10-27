let __APP_BOOTED__ = false;

async function boot() {
  if (__APP_BOOTED__) return;
  // Dev: Vite serves /src/* directly
  try {
    await import('/src/main.tsx');
    __APP_BOOTED__ = true;
    return;
  } catch { /* fallthrough to prod */ }

  // Prod: import from manifest
  const manifestCandidates = ['/manifest.json', '/.vite/manifest.json'];
  let manifest = null;

  for (const href of manifestCandidates) {
    try {
      const res = await fetch(href, { credentials: 'same-origin' });
      if (!res.ok) continue;
      manifest = await res.json();
      break;
    } catch {
      // try next candidate
    }
  }

  if (!manifest) {
    throw new Error('Failed to fetch manifest.json from known locations');
  }

  const entry = manifest['src/main.tsx'] || Object.values(manifest).find(v => v && v.isEntry);
  if (!entry || !entry.file) throw new Error('No entry for src/main.tsx in manifest');

  // Preload CSS
  (entry.css || []).forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/${href}`;
    document.head.appendChild(link);
  });

  // Preload dependent chunks
  (entry.imports || []).forEach(key => {
    const dep = manifest[key];
    if (dep?.file) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = `/${dep.file}`;
      document.head.appendChild(link);
    }
  });

  await import(`/${entry.file}`);
  __APP_BOOTED__ = true;
}

boot().catch(err => console.error('[app-loader] failed to bootstrap React app on /atlas', err));
