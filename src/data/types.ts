export interface VillageMediaLink {
  title: string;
  url: string;
  type: 'image' | 'map' | 'document' | 'storymap' | 'oral-history' | 'film' | 'article' | 'resource';
  credit?: string;
}

export interface VillageTestimonySource {
  title: string;
  url?: string;
  publication?: string;
  date?: string;
}

export interface VillageTestimony {
  witness: string;
  quote: string;
  source?: VillageTestimonySource;
}

export interface VillageKeyEvent {
  label: string;
  value: string;
}

export interface VillageNarrative {
  summary: string;
  key_events: VillageKeyEvent[];
}

export interface VillageDestructionDetails {
  perpetrators: string[];
  operation: string | null;
}

export interface VillageAftermath {
  settlement: string | null;
  notes: string[];
}

export interface VillageMedia {
  galleries: VillageMediaLink[];
  maps: VillageMediaLink[];
  references: VillageMediaLink[];
}

export interface VillageNames {
  en: string;
  ar: string;
  he?: string;
}

export interface Village {
  id: number;
  slug: string;
  names: VillageNames;
  district: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  narrative: VillageNarrative;
  destruction: VillageDestructionDetails;
  aftermath: VillageAftermath;
  media: VillageMedia;
  testimonies: VillageTestimony[];
}

export interface VillageDatasetMetadata {
  format: number;
  generated_at: string;
  source: string;
}

export interface VillageDataset {
  metadata: VillageDatasetMetadata;
  villages: Village[];
}
