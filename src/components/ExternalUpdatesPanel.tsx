import React, { useMemo } from 'react';
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
    <section className="border-t border-border pt-6 mt-6" aria-label="Solidarity Signals">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-serif text-2xl text-white">Solidarity Signals</h3>
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
          {isLoading && <span className="animate-pulse">Refreshing…</span>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="resource-link text-xs"
              disabled={isLoading}
            >
              Retry now
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-sm text-red-200 rounded-lg p-4 mb-4">
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
