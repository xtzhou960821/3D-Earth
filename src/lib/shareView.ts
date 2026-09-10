/**
 * Camera share deep-link helpers for GitHub Pages (`/3D-Earth/#v=…`) and local `/`.
 * Format: `#v=lon,lat,height,heading,pitch,roll` (degrees; height in meters).
 */

/** Camera pose used for share links and restore-on-load. */
export interface CameraView {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}

const VIEW_RE =
  /^#?v=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

/**
 * Serialize a camera pose into a compact hash fragment (without leading `#`).
 * @param view Camera pose in degrees / meters
 */
export function encodeCameraView(view: CameraView): string {
  const fmt = (n: number, digits: number) =>
    Number(n.toFixed(digits)).toString();
  return `v=${fmt(view.longitude, 6)},${fmt(view.latitude, 6)},${fmt(view.height, 1)},${fmt(view.heading, 2)},${fmt(view.pitch, 2)},${fmt(view.roll, 2)}`;
}

/**
 * Parse a hash or query-style view string into a camera pose.
 * @param raw Hash (`#v=…`), fragment (`v=…`), or full URL search/hash
 * @returns Valid pose or null when missing / out of range
 */
export function parseCameraView(raw: string | null | undefined): CameraView | null {
  if (!raw) return null;
  let text = raw.trim();
  try {
    if (text.includes("://") || text.startsWith("/") || text.startsWith("?")) {
      const url = text.includes("://")
        ? new URL(text)
        : new URL(text, "https://example.invalid");
      text = url.hash || url.searchParams.get("v") || "";
      if (text.startsWith("?")) text = text.slice(1);
      if (text.startsWith("v=") || text.startsWith("#v=")) {
        /* keep */
      } else if (url.searchParams.has("v")) {
        text = `v=${url.searchParams.get("v")}`;
      }
    }
  } catch {
    /* treat as bare fragment */
  }
  if (text.startsWith("#")) text = text.slice(1);
  if (text.startsWith("v=")) {
    /* ok */
  } else {
    const fromQuery = text.match(/(?:^|&)v=([^&]+)/);
    if (fromQuery) text = `v=${fromQuery[1]}`;
  }
  const match = VIEW_RE.exec(text.startsWith("v=") ? text : `v=${text}`);
  if (!match) return null;
  const [, lon, lat, height, heading, pitch, roll] = match.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(height) ||
    !Number.isFinite(heading) ||
    !Number.isFinite(pitch) ||
    !Number.isFinite(roll)
  )
    return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  if (height < -1000 || height > 5e7) return null;
  return { longitude: lon, latitude: lat, height, heading, pitch, roll };
}

/**
 * Build a shareable absolute URL for the current page + camera hash.
 * Preserves Vite base path (e.g. `/3D-Earth/`).
 * @param view Camera pose
 * @param locationLike Optional location (defaults to `window.location`)
 */
export function buildShareUrl(
  view: CameraView,
  locationLike: Pick<Location, "origin" | "pathname" | "search"> = window.location,
): string {
  const hash = encodeCameraView(view);
  return `${locationLike.origin}${locationLike.pathname}${locationLike.search}#${hash}`;
}

/**
 * Read camera view from the current page hash (or `?v=` fallback).
 */
export function readShareViewFromLocation(
  locationLike: Pick<Location, "hash" | "search" | "href"> = window.location,
): CameraView | null {
  return (
    parseCameraView(locationLike.hash) ||
    parseCameraView(locationLike.search) ||
    parseCameraView(locationLike.href)
  );
}
