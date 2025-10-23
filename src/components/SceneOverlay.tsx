
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Village } from '../data/types';

interface SceneOverlayProps {
  sceneTitle: string;
  description: string;
  villages: Village[];
  onSelectVillage: (village: Village) => void;
  isVisible: boolean;
}

const SceneOverlay: React.FC<SceneOverlayProps> = ({
  sceneTitle,
  description,
  villages,
  onSelectVillage,
  isVisible,
}) => {
  const { t } = useTranslation(['common']);

  if (!isVisible || villages.length === 0) {
    return null;
  }

  const primaryVillage = villages[0];

  return (
    <aside
      className="fixed right-4 md:right-8 top-24 z-30 max-w-sm w-[90vw] md:w-80 bg-slate-950/80 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl p-5 text-sm text-text-secondary"
      aria-live="polite"
      aria-label={t('overlay.ariaLabel', { title: sceneTitle })}
    >
      <h3 className="font-serif text-xl text-white mb-2">{sceneTitle}</h3>
      <p className="mb-4 text-text-secondary/80 leading-relaxed">{description}</p>

      <div className="space-y-4">
        <article className="bg-slate-900/60 rounded-lg p-4 border border-border/40">
          <header className="mb-2">
            <h4 className="font-semibold text-white text-lg">{primaryVillage.names.en}</h4>
            <p className="text-xs uppercase tracking-wider text-muted">
              {primaryVillage.district} District · {primaryVillage.names.ar}
            </p>
          </header>
          <p className="text-xs text-text-secondary leading-relaxed max-h-32 overflow-hidden">
            {primaryVillage.narrative.summary}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white border border-border/60 rounded-full px-3 py-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            onClick={() => onSelectVillage(primaryVillage)}
          >
            {t('overlay.openCodex')}
          </button>
        </article>

        {villages.length > 1 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-2">{t('overlay.relatedVillages')}</p>
            <ul className="space-y-2">
              {villages.slice(1).map((village) => (
                <li key={village.id}>
                  <button
                    type="button"
                    className="w-full text-left text-xs text-text-secondary/90 hover:text-white transition-colors"
                    onClick={() => onSelectVillage(village)}
                  >
                    {village.names.en} · {village.district}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SceneOverlay;
