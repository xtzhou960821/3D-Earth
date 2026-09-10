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
  /** Optional sidecar of IFC/glTF feature metadata (JSON). */
  propertiesUrl?: string;
  /** Demo / static layers that cannot be deleted via API. */
  readOnly?: boolean;
}
export interface CheckIn {
  date: string;
  note: string;
}
/** Camera pose for share links (degrees + meters). */
export interface CameraView {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}
export interface MapHandle {
  flyTo: (place: Place) => void;
  home: () => void;
  zoom: (direction: number) => void;
  tilt: () => void;
  north: () => void;
  focusLayer: (layer: Layer) => void;
  getPosition: () => { longitude: number; latitude: number; height: number };
  /** Current camera pose for share deep links. */
  getCameraView: () => CameraView;
  /** Restore a shared camera pose. */
  setCameraView: (view: CameraView, duration?: number) => void;
}
