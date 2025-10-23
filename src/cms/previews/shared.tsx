import type { ReactNode } from 'react';

type ImmutableLike<T = unknown> = {
  toJS?: () => T;
  toArray?: () => T[];
};

export interface PreviewProps {
  entry: {
    getIn: (path: (string | number)[]) => unknown;
  };
  widgetFor: (field: string) => ReactNode;
}

const isImmutableLike = <T,>(value: unknown): value is ImmutableLike<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'toJS' in value || 'toArray' in value;
};

const toPlain = <T,>(value: unknown): T | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (isImmutableLike<T>(value)) {
    if (typeof value.toJS === 'function') {
      return value.toJS();
    }

    if (typeof value.toArray === 'function') {
      return value.toArray() as unknown as T;
    }
  }

  return value as T;
};

export const getEntryValue = <T,>(entry: PreviewProps['entry'], path: string[]): T | undefined => {
  const value = entry.getIn(path);
  return toPlain<T>(value);
};

export interface ArticlePreviewProps extends PreviewProps {
  collectionLabel: string;
}

export const ArticlePreview = ({ entry, widgetFor, collectionLabel }: ArticlePreviewProps) => {
  const title = getEntryValue<string>(entry, ['data', 'title']);
  const summary = getEntryValue<string>(entry, ['data', 'summary']);
  const tags = getEntryValue<(string | { tag?: string })[]>(entry, ['data', 'tags']) ?? [];
  const sources = getEntryValue<Array<{ title?: string; url?: string }>>(entry, ['data', 'sources']) ?? [];

  const normalizedTags = tags.map((tag) => (typeof tag === 'string' ? tag : tag?.tag ?? ''))
    .filter((tag): tag is string => Boolean(tag));

  const normalizedSources = sources
    .map((source) => ({
      title: source?.title ?? '',
      url: source?.url ?? '',
    }))
    .filter((source) => source.title || source.url);

  return (
    <article style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.6, color: '#111827', padding: '1.5rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: '#6b7280' }}>
          {collectionLabel}
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.75rem' }}>{title || 'Untitled entry'}</h1>
        {summary ? <p style={{ fontSize: '1rem', color: '#374151' }}>{summary}</p> : null}
        {normalizedTags.length ? (
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', padding: 0, listStyle: 'none' }}>
            {normalizedTags.map((tag) => (
              <li
                key={tag}
                style={{
                  backgroundColor: '#e5e7eb',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Body</h2>
        <div style={{ fontSize: '1rem', color: '#1f2937' }}>{widgetFor('body') || <p>No content yet.</p>}</div>
      </section>
      {normalizedSources.length ? (
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Sources</h2>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {normalizedSources.map((source, index) => (
              <li key={`${source.title}-${index}`} style={{ marginBottom: '0.5rem' }}>
                {source.url ? (
                  <a href={source.url} rel="noreferrer noopener" target="_blank" style={{ color: '#2563eb' }}>
                    {source.title || source.url}
                  </a>
                ) : (
                  <span>{source.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
};
