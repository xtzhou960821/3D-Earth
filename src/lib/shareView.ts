/**
 * Camera share deep-link helpers for GitHub Pages (`/3D-Earth/#v=…`) and local `/`.
 * Format: `#v=lon,lat,height,heading,pitch,roll` (degrees; height in meters).
 * Optional destination: `#v=…&p=placeId`.
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
  /^#?v=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:&p=([a-z0-9-]{1,40}))?$/;

/** Camera pose plus an optional Earth place id. */
export interface SharedLink {
  view: CameraView;
  placeId?: string;
}

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
 * A trailing `&p=placeId` is accepted and ignored here.
 * @param raw Hash (`#v=…`), fragment (`v=…`), or full URL search/hash
 * @returns Valid pose or null when missing / out of range
 */
export function parseCameraView(raw: string | null | undefined): CameraView | null {
  return parseShareLink(raw)?.view ?? null;
}

/**
 * Parse a share fragment into a camera pose and optional place id.
 * @param raw Hash (`#v=…&p=…`), fragment, or full URL
 */
export function parseShareLink(raw: string | null | undefined): SharedLink | null {
  if (!raw) return null;
  let text = raw.trim();
  try {
    if (text.includes("://") || text.startsWith("/") || text.startsWith("?")) {
      const url = text.includes("://")
        ? new URL(text)
        : new URL(text, "https://example.invalid");
      const queryPlace = url.searchParams.get("p") || "";
      const place =
        /^[a-z0-9-]{1,40}$/.test(queryPlace) && !url.hash.includes("&p=")
          ? `&p=${queryPlace}`
          : "";
      const hash = url.hash.replace(/^#/, "");
      if (hash.startsWith("v=")) text = `${hash}${place}`;
      else if (url.searchParams.has("v"))
        text = `v=${url.searchParams.get("v")}${place}`;
      else text = hash;
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
  const candidate = text.startsWith("v=") || text.startsWith("#v=") ? text : `v=${text}`;
  const match = VIEW_RE.exec(candidate.startsWith("#") ? candidate : candidate);
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  const height = Number(match[3]);
  const heading = Number(match[4]);
  const pitch = Number(match[5]);
  const roll = Number(match[6]);
  const placeId = match[7] || undefined;
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
  return {
    view: { longitude: lon, latitude: lat, height, heading, pitch, roll },
    placeId,
  };
}

/**
 * Serialize a camera pose and optional place id (`v=…&p=placeId`).
 * @param view Camera pose
 * @param placeId Earth place id, omitted when empty or invalid
 */
export function encodeShareLink(view: CameraView, placeId?: string): string {
  const base = encodeCameraView(view);
  if (placeId && /^[a-z0-9-]{1,40}$/.test(placeId)) return `${base}&p=${placeId}`;
  return base;
}

/**
 * Build a shareable absolute URL for the current page + camera hash.
 * Preserves Vite base path (e.g. `/3D-Earth/`).
 * @param view Camera pose
 * @param locationLike Optional location (defaults to `window.location`)
 * @param placeId Optional destination id appended as `&p=`
 */
export function buildShareUrl(
  view: CameraView,
  locationLike: Pick<Location, "origin" | "pathname" | "search"> = window.location,
  placeId?: string,
): string {
  const hash = encodeShareLink(view, placeId);
  return `${locationLike.origin}${locationLike.pathname}${locationLike.search}#${hash}`;
}

/**
 * Read a shared camera and optional place id from the page hash (or `?v=` fallback).
 */
export function readShareViewFromLocation(
  locationLike: Pick<Location, "hash" | "search" | "href"> = window.location,
): SharedLink | null {
  return (
    parseShareLink(locationLike.hash) ||
    parseShareLink(locationLike.search) ||
    parseShareLink(locationLike.href)
  );
}
