export type ExternalSource = 'visualizing-palestine' | 'bds-movement';

export interface ExternalArchiveItem {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  publishedAt?: string;
  source: ExternalSource;
}

export interface ExternalArchivePayload {
  fetchedAt: string;
  visualizingPalestine: ExternalArchiveItem[];
  bdsCampaigns: ExternalArchiveItem[];
}
