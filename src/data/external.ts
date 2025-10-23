export interface ExternalArchiveEntry {
  id: string;
  title: string;
  url: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
}

export interface ExternalArchivePayload {
  updatedAt?: string;
  entries: ExternalArchiveEntry[];
}

export const isExternalArchivePayload = (
  value: unknown
): value is ExternalArchivePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as ExternalArchivePayload;
  if (!Array.isArray(payload.entries)) {
    return false;
  }

  return payload.entries.every((entry) => entry && typeof entry.id === 'string');
};
