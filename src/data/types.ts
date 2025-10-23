export interface VillageNarrativeEvent {
  label?: string;
  value?: string;
}

export interface VillageTestimonySource {
  title?: string;
  url?: string;
}

export interface VillageTestimony {
  witness: string;
  quote: string;
  source?: VillageTestimonySource;
}

export interface VillageMediaItem {
  title: string;
  url: string;
  type?: string;
  credit?: string;
}

export interface VillageMedia {
  references?: VillageMediaItem[];
  galleries?: VillageMediaItem[];
  maps?: VillageMediaItem[];
}

export interface VillageNarrative {
  summary?: string;
  key_events?: VillageNarrativeEvent[];
}

export interface VillageDestruction {
  perpetrators?: string[];
  operation?: string;
}

export interface VillageAftermath {
  settlement?: string;
  notes?: string[];
}

export interface VillageCoordinates {
  lat: number;
  lon: number;
}

export interface VillageNames {
  en?: string;
  ar?: string;
  he?: string;
}

export interface Village {
  id: number | string;
  name?: string;
  name_arabic?: string;
  lat?: number;
  lon?: number;
  district?: string;
  story?: string;
  destroyed_by?: string;
  military_operation?: string;
  israeli_settlement?: string;
  slug?: string;
  names?: VillageNames;
  narrative?: VillageNarrative;
  destruction?: VillageDestruction;
  aftermath?: VillageAftermath;
  coordinates?: VillageCoordinates;
  testimonies?: VillageTestimony[];
  media?: VillageMedia;
  overview?: string;
}
