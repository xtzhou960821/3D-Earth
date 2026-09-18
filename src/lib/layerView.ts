/** Inputs for placing a panorama marker / label on the globe. */
export interface PanoramaLayerLike {
  name: string;
  longitude: number;
  latitude: number;
  height: number;
}

/** Presentation values for a Cesium panorama Entity. */
export interface PanoramaPresentation {
  longitude: number;
  latitude: number;
  /** Ground / ellipsoidal height stored on the layer. */
  height: number;
  /** Marker height: layer height raised slightly above terrain/ground. */
  markerHeight: number;
  label: string;
}

/** Extra meters so the 720 panorama pin sits above the ground sample. */
export const PANORAMA_MARKER_OFFSET_M = 4;

/**
 * Derive Cesium presentation (marker height + label) for a panorama layer.
 * @param layer Panorama layer fields
 */
export function getPanoramaPresentation(
  layer: PanoramaLayerLike,
): PanoramaPresentation {
  const height = Number.isFinite(layer.height) ? layer.height : 0;
  return {
    longitude: layer.longitude,
    latitude: layer.latitude,
    height,
    markerHeight: height + PANORAMA_MARKER_OFFSET_M,
    label: layer.name,
  };
}
