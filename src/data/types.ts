export interface Village {
  id: number;
  name: string;
  name_arabic: string;
  lat: number;
  lon: number;
  district: string;
  story: string;
  destroyed_by?: string;
  military_operation?: string;
  israeli_settlement?: string;
}
