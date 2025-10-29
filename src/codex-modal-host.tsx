import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import CodexModal from './components/CodexModal';
import type { Village } from './data/types';
import { villages } from './data/villages';

import './i18n';
import './index.css';

let root: ReturnType<typeof createRoot> | null = null;
let hostEl: HTMLElement | null = null;
let isMounted = false;
let lastFocused: Element | null = null;

// --- Robust slug normalization (hyphens, spacing, diacritics, hamza-like marks) ---
function normalizeSlug(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʿ’‘'`´]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type AnyVillage = Village & {
  slug?: string;
  names?: { en?: string; ar?: string };
  altNames?: string[];
};

const _bySlug = new Map<string, AnyVillage>();
const _aliases = new Map<string, AnyVillage>();

for (const v of villages as AnyVillage[]) {
  const candidates = new Set<string>();
  if (v.slug) candidates.add(v.slug);
  if (v.names?.en) candidates.add(v.names.en);
  if (v.names?.ar) candidates.add(v.names.ar);
  (v.altNames || []).forEach((alias) => candidates.add(alias));
  if (v.names?.en) {
    candidates.add(v.names.en.replace(/\s+/g, '-'));
    candidates.add(v.names.en.replace(/[-\s]+/g, ' '));
  }

  const normalized = Array.from(candidates)
    .map(normalizeSlug)
    .filter(Boolean);
  const primary = normalized[0];
  if (primary) _bySlug.set(primary, v);
  for (const n of normalized) _aliases.set(n, v);
}

function resolveVillageStrict(slug: string): AnyVillage | null {
  const key = normalizeSlug(slug);
  return _bySlug.get(key) || _aliases.get(key) || null;
}

const HOST_VERSION = 'atlas-host-v2';

function ensureStylesInjected() {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.querySelector('link[data-codex-css="1"]')) {
    return;
  }

  let cssHref: string | null = null;
  try {
    cssHref = new URL(/* @vite-ignore */ './codex-modal-host.css', import.meta.url).href;
  } catch (error) {
    const currentScript = document.currentScript as HTMLScriptElement | null;
    if (currentScript?.src) {
      const url = new URL(currentScript.src, window.location.href);
      url.pathname = url.pathname.replace(/[^/]+$/, 'codex-modal-host.css');
      cssHref = url.toString();
    } else {
      cssHref = '/codex-modal-host.css';
    }
  }

  if (!cssHref) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssHref;
  link.setAttribute('data-codex-css', '1');
  document.head.appendChild(link);
}

function ensureHost() {
  if (typeof document === 'undefined') {
    throw new Error('Codex modal host can only be used in a browser environment.');
  }

  ensureStylesInjected();

  if (!hostEl || !document.body.contains(hostEl)) {
    hostEl = (hostEl || document.querySelector('[data-codex-host-root]')) as HTMLElement | null;
    if (!hostEl) {
      hostEl = document.createElement('div');
      hostEl.setAttribute('data-codex-host-root', '1');
      Object.assign(hostEl.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483647',
        pointerEvents: 'none',
      } as Partial<CSSStyleDeclaration>);
      document.body.appendChild(hostEl);

      if (!document.head.querySelector('style[data-codex-host-safety="1"]')) {
        const style = document.createElement('style');
        style.setAttribute('data-codex-host-safety', '1');
        style.textContent = `
      [data-codex-host-root]{position:fixed;inset:0;z-index:2147483647;pointer-events:none;}
      [data-codex-modal-root]{pointer-events:auto;}
    `;
        document.head.appendChild(style);
      }
    }
  }

  if (!root && hostEl) {
    root = createRoot(hostEl);
  }
}

function render(village: AnyVillage | null) {
  ensureHost();

  const handleClose = () => {
    if (root) {
      root.render(<React.Fragment />);
    }
    if (isMounted) {
      isMounted = false;
      window.dispatchEvent(new Event('codex:close'));
      try {
        (lastFocused as HTMLElement | null)?.focus?.();
      } catch {}
      try {
        document.body.style.overflow = '';
      } catch {}
    }
  };

  if (!village) {
    handleClose();
    return;
  }

  const ModalPortal: React.FC = () => {
    const currentVillage = useMemo(() => village, [village]);
    const dialogRef = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
      try {
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus?.();
      } catch {}
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, []);
    return (
      <div
        ref={dialogRef}
        data-codex-modal-root
        data-codex-standalone
        role="dialog"
        aria-modal="true"
        aria-label={currentVillage?.names?.en || (currentVillage as AnyVillage)?.slug}
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
      >
        <CodexModal village={currentVillage} onClose={handleClose} />
      </div>
    );
  };

  isMounted = true;

  window.dispatchEvent(
    new CustomEvent('codex:open', {
      detail: {
        slug:
          (village as AnyVillage).slug ||
          (village?.names ? normalizeSlug((village as AnyVillage).names?.en) : undefined),
      },
    }),
  );

  root!.render(<ModalPortal />);
}

function closeModal() {
  if (!root || !isMounted) {
    return;
  }
  root.render(<React.Fragment />);
  isMounted = false;
  window.dispatchEvent(new Event('codex:close'));
}

type CodexModalAPI = {
  open: (slug: string) => void;
  close: () => void;
  __debugResolve?: (slug: string) => { found: boolean; resolvedSlug: string | null };
  version?: string;
};

const api: CodexModalAPI = {
  open: (slug: string) => {
    try {
      lastFocused = document.activeElement;
    } catch {
      lastFocused = null;
    }
    const village = resolveVillageStrict(slug);
    if (!village) {
      console.warn(`[CodexModal] Unknown village slug: ${slug}`);
      try {
        window.dispatchEvent(new CustomEvent('codex:open:unknown-slug', { detail: { slug } }));
      } catch {}
      return;
    }

    render(village);
  },
  close: () => {
    closeModal();
  },
  __debugResolve: (slug: string) => {
    const match = resolveVillageStrict(slug);
    return {
      found: !!match,
      resolvedSlug: match
        ? (match as AnyVillage).slug || normalizeSlug((match as AnyVillage).names?.en)
        : null,
    };
  },
  version: HOST_VERSION,
};

declare global {
  interface Window {
    CodexModal?: CodexModalAPI;
  }
}

try {
  (window as Window & typeof globalThis).CodexModal = api;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('codex:host:ready'));
  }
} catch (err) {
  console.error('[CodexModalHost] failed to attach', err);
}

export default api;
