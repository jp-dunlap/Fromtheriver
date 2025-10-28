import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import CodexModal from './components/CodexModal';
import type { Village } from './data/types';
import { villages } from './data/villages';

import './i18n';
import './index.css';

const villagesBySlug = new Map<string, Village>();
const villagesByName = new Map<string, Village>();

villages.forEach((village) => {
  villagesBySlug.set(village.slug.toLowerCase(), village);
  villagesByName.set(village.names.en.toLowerCase(), village);
});

let root: ReturnType<typeof createRoot> | null = null;
let hostEl: HTMLElement | null = null;
let isMounted = false;

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

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

  if (!hostEl) {
    hostEl = document.createElement('div');
    hostEl.id = 'codex-modal-host';
    hostEl.style.position = 'fixed';
    hostEl.style.inset = '0';
    hostEl.style.zIndex = '99999';
    hostEl.style.pointerEvents = 'none';
    document.body.appendChild(hostEl);
  }

  if (!root) {
    root = createRoot(hostEl);
  }
}

function render(village: Village | null) {
  ensureHost();

  const handleClose = () => {
    if (root) {
      root.render(<React.Fragment />);
    }
    if (isMounted) {
      isMounted = false;
      window.dispatchEvent(new Event('codex:close'));
    }
  };

  if (!village) {
    handleClose();
    return;
  }

  const ModalPortal: React.FC = () => {
    const currentVillage = useMemo(() => village, [village]);
    return (
      <div data-codex-modal-root data-codex-standalone style={{ pointerEvents: 'auto' }}>
        <CodexModal village={currentVillage} onClose={handleClose} />
      </div>
    );
  };

  isMounted = true;

  window.dispatchEvent(
    new CustomEvent('codex:open', {
      detail: { slug: village.slug },
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
};

function resolveVillage(slug: string): Village | null {
  const normalized = normalize(slug);
  if (!normalized) {
    return null;
  }

  return (
    villagesBySlug.get(normalized) ||
    villagesByName.get(normalized) ||
    null
  );
}

const api: CodexModalAPI = {
  open: (slug: string) => {
    const village = resolveVillage(slug);
    if (!village) {
      console.warn(`[CodexModal] Unknown village slug: ${slug}`);
      return;
    }

    render(village);
  },
  close: () => {
    closeModal();
  },
};

declare global {
  interface Window {
    CodexModal?: CodexModalAPI;
  }
}

(window as Window & typeof globalThis).CodexModal = api;

if (typeof window !== 'undefined') {
  window.dispatchEvent(new Event('codex:host:ready'));
}

export default api;
