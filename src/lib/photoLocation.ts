import exifr from "exifr";

/** Normalized WGS84 photo position with optional ellipsoidal height. */
export interface PhotoLocation {
  longitude: number;
  latitude: number;
  height?: number;
}

/**
 * Clamp and round a raw GPS/altitude reading into a usable PhotoLocation.
 * @param input Candidate lon/lat/(optional) height from EXIF or UI
 * @returns Normalized location, or null when coordinates are missing / out of range
 */
export function normalizePhotoLocation(
  input:
    | {
        longitude?: number | null;
        latitude?: number | null;
        height?: number | null;
        altitude?: number | null;
      }
    | null
    | undefined,
): PhotoLocation | null {
  if (!input) return null;
  const longitude = Number(input.longitude);
  const latitude = Number(input.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)
    return null;

  const rawHeight =
    input.height != null
      ? Number(input.height)
      : input.altitude != null
        ? Number(input.altitude)
        : undefined;
  const result: PhotoLocation = {
    longitude: Number(longitude.toFixed(6)),
    latitude: Number(latitude.toFixed(6)),
  };
  if (rawHeight != null && Number.isFinite(rawHeight)) {
    result.height = Number(rawHeight.toFixed(1));
  }
  return result;
}

/**
 * Read GPS coordinates (and altitude when present) from an image file via EXIF.
 * @param file Panorama image Blob/File (JPEG/HEIC/etc.)
 * @returns Normalized location or null when GPS tags are absent / unreadable
 */
export async function readPhotoLocation(
  file: Blob,
): Promise<PhotoLocation | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || gps.latitude == null || gps.longitude == null) return null;

    let altitude: number | undefined;
    try {
      const parsed = await exifr.parse(file, {
        gps: true,
        pick: ["GPSAltitude", "GPSAltitudeRef", "latitude", "longitude"],
      });
      if (parsed && typeof parsed.GPSAltitude === "number") {
        // GPSAltitudeRef: 0 = above sea level, 1 = below
        const below = parsed.GPSAltitudeRef === 1 || parsed.GPSAltitudeRef === "1";
        altitude = below ? -Math.abs(parsed.GPSAltitude) : parsed.GPSAltitude;
      }
    } catch {
      // Altitude is optional; coordinate-only GPS is still useful.
    }

    return normalizePhotoLocation({
      longitude: gps.longitude,
      latitude: gps.latitude,
      altitude,
    });
  } catch {
    return null;
  }
}
