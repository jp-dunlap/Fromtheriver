import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExternalArchivePayload, ExternalArchiveItem } from '../data/external';

interface ExternalUpdatesPanelProps {
  payload: ExternalArchivePayload | null;
  error?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
}

const sourceLabel: Record<ExternalArchiveItem['source'], string> = {
  'visualizing-palestine': 'Visualizing Palestine',
  'bds-movement': 'BDS Movement',
};

const ExternalUpdatesPanel: React.FC<ExternalUpdatesPanelProps> = ({
  payload,
  error,
  isLoading = false,
  onRetry,
}) => {
  const { t } = useTranslation(['common', 'app']);

  const combinedUpdates = useMemo(() => {
    if (!payload) {
      return [] as ExternalArchiveItem[];
    }
    return [
      ...payload.visualizingPalestine,
      ...payload.bdsCampaigns,
    ].sort((a, b) => {
      const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bTime - aTime;
    });
  }, [payload]);

  return (
    <section
      className="border-t border-border pt-6 mt-6"
      aria-label={t('app:externalUpdatesLabel')}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <header className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-serif text-2xl text-white">{t('app:externalUpdatesLabel')}</h3>
          <p className="text-sm text-muted">
            Live threads from allied networks. Updates cached via Netlify Functions to preserve performance and respect rate limits.
          </p>
          {payload?.fetchedAt && (
            <p className="text-xs text-muted mt-1">
              Refreshed {new Date(payload.fetchedAt).toLocaleString()}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          {isLoading && (
            <span className="flex items-center gap-1 animate-pulse" role="status" aria-live="polite">
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="origin-center animate-spin"
                  style={{ animationDuration: '1s' }}
                />
              </svg>
              <span>{t('common:status.externalLoading')}</span>
            </span>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="resource-link text-xs"
              disabled={isLoading}
            >
              <span className="inline-flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M13.828 14.828a4 4 0 1 1 0-5.656l.586.586V6a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1h-5a1 1 0 0 1 0-2h3.172l-.586-.586a2 2 0 1 0 0 2.828l2 2a1 1 0 0 1-1.414 1.414l-2-2z" />
                </svg>
                {t('common:buttons.retry')}
              </span>
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          className="bg-red-900/40 border border-red-700 text-sm text-red-200 rounded-lg p-4 mb-4 flex items-start gap-2"
          role="alert"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 17h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10.073 3.51 1.824 18a2 2 0 0 0 1.754 3h16.844a2 2 0 0 0 1.754-3L13.176 3.51a2 2 0 0 0-3.103 0Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {combinedUpdates.length === 0 && !isLoading ? (
        <p className="text-sm text-muted">No updates available yet. Check back soon.</p>
      ) : (
        <ul className="space-y-4">
          {combinedUpdates.map((item) => (
            <li key={item.id} className="bg-slate-900/60 border border-border/40 rounded-lg p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h4 className="text-lg text-white font-semibold">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                    {item.title}
                  </a>
                </h4>
                <span className="text-xs uppercase tracking-wider text-muted">
                  {sourceLabel[item.source]}
                </span>
              </div>
              {item.publishedAt && (
                <p className="text-xs text-muted mt-1">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
              <p className="text-sm text-text-secondary leading-relaxed mt-2">
                {item.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ExternalUpdatesPanel;
