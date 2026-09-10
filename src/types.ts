export type Category = "自然风光" | "人文古迹" | "城市漫游";
export interface Place {
  id: string;
  name: string;
  en: string;
  region: string;
  category: Category;
  lon: number;
  lat: number;
  altitude: number;
  distance: number;
  description: string;
  hours: string;
  hoursNote: string;
  source: string;
  verified?: string;
  image: string;
  imageCredit?: string;
  highlights: string[];
  stay: string[];
  food: string[];
  /**
   * Optional travel-album page under `/heritage/` (static sub-site).
   * Path is site-relative without leading slash, e.g. `heritage/huangshan.html`.
   */
  heritageAlbum?: string;
}
export interface Layer {
  id: string;
  name: string;
  kind: "model" | "tiles" | "panorama" | "ion";
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  scale: number;
  url?: string;
  assetId?: number;
  visible: boolean;
  createdAt: string;
  bytes: number;
  sourceFormat?: string;
}
export interface CheckIn {
  date: string;
  note: string;
}
export interface MapHandle {
  flyTo: (place: Place) => void;
  home: () => void;
  zoom: (direction: number) => void;
  tilt: () => void;
  north: () => void;
  focusLayer: (layer: Layer) => void;
  getPosition: () => { longitude: number; latitude: number; height: number };
}
