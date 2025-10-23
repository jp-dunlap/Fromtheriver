import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ExternalArchivePayload } from '../data/external';

interface ExternalUpdatesPanelProps {
  payload: ExternalArchivePayload | null;
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
}

const ExternalUpdatesPanel: React.FC<ExternalUpdatesPanelProps> = ({
  payload,
  error,
  isLoading,
  onRetry,
}) => {
  const { t } = useTranslation();
  const entries = payload?.entries ?? [];

  return (
    <section className="mt-8 rounded-xl border border-border/60 bg-slate-950/70 p-5 text-sm text-text-secondary">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl text-white">
          {t('externalUpdates.title')}
        </h3>
        <div className="text-xs text-text-tertiary">
          {payload?.updatedAt
            ? t('externalUpdates.updated', {
                date: new Date(payload.updatedAt).toLocaleString(),
              })
            : null}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-text-tertiary">
          {t('externalUpdates.loading')}
        </p>
      ) : null}

      {!isLoading && error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-red-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400/70"
            onClick={onRetry}
          >
            {t('externalUpdates.retry')}
          </button>
        </div>
      ) : null}

      {!isLoading && !error && entries.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          {t('externalUpdates.empty')}
        </p>
      ) : null}

      {!isLoading && !error && entries.length > 0 ? (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border/40 bg-slate-900/50 p-4">
              <a
                href={entry.url}
                className="text-base font-semibold text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {entry.title}
              </a>
              {entry.source && (
                <p className="mt-1 text-xs uppercase tracking-wider text-text-tertiary">
                  {entry.source}
                </p>
              )}
              {entry.summary && (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {entry.summary}
                </p>
              )}
              {entry.publishedAt && (
                <p className="mt-2 text-xs text-text-tertiary">
                  {t('externalUpdates.published', {
                    date: new Date(entry.publishedAt).toLocaleDateString(),
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default ExternalUpdatesPanel;
