import type { Layer, Place } from "../types.ts";

/** Ground distance within which a panorama is treated as being at a destination. */
export const PANORAMA_NEAR_KM = 20;

/**
 * Great-circle distance in kilometres.
 * @param lon1 Longitude of the first point, degrees
 * @param lat1 Latitude of the first point, degrees
 * @param lon2 Longitude of the second point, degrees
 * @param lat2 Latitude of the second point, degrees
 */
export function haversineKm(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Visible panorama layers whose marker sits near a destination.
 * Does not build a navigation graph between panoramas.
 * @param place Destination to measure from
 * @param layers Current globe layers, including Pages demos
 */
export function panoramasNearPlace(place: Place, layers: readonly Layer[]): Layer[] {
  return layers.filter(
    (layer) =>
      layer.kind === "panorama" &&
      layer.visible &&
      haversineKm(place.lon, place.lat, layer.longitude, layer.latitude) <=
        PANORAMA_NEAR_KM,
  );
}
