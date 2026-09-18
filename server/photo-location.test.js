import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizePhotoLocation,
  readPhotoLocation,
} from "../src/lib/photoLocation.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

/** Candidate DJI / local panorama samples (never vendored into the repo). */
const DJI_SAMPLE_CANDIDATES = [
  path.join(root, "720全景"),
  path.join(root, "examples", "panorama-gps-sample.jpg"),
  path.join(root, "examples", "dji-panorama.jpg"),
];

/**
 * Find the first existing image under a candidate path (file or directory).
 * @param {string[]} candidates
 * @returns {string | null}
 */
function findSampleImage(candidates) {
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const st = fs.statSync(candidate);
    if (st.isFile() && /\.(jpe?g|heic|png|webp)$/i.test(candidate)) {
      return candidate;
    }
    if (st.isDirectory()) {
      const nested = fs
        .readdirSync(candidate)
        .map((name) => path.join(candidate, name))
        .find((p) => /\.(jpe?g|heic|png|webp)$/i.test(p) && fs.statSync(p).isFile());
      if (nested) return nested;
    }
  }
  return null;
}

describe("normalizePhotoLocation", () => {
  it("normalizes finite lon/lat and optional height", () => {
    assert.deepEqual(
      normalizePhotoLocation({
        longitude: 120.5373333,
        latitude: 28.7411111,
        height: 123.456,
      }),
      { longitude: 120.537333, latitude: 28.741111, height: 123.5 },
    );
  });

  it("accepts altitude alias and rejects out-of-range coords", () => {
    assert.deepEqual(
      normalizePhotoLocation({
        longitude: 104.06,
        latitude: 30.57,
        altitude: 500,
      }),
      { longitude: 104.06, latitude: 30.57, height: 500 },
    );
    assert.equal(
      normalizePhotoLocation({ longitude: 200, latitude: 30 }),
      null,
    );
    assert.equal(
      normalizePhotoLocation({ longitude: 104, latitude: 91 }),
      null,
    );
    assert.equal(normalizePhotoLocation(null), null);
    assert.equal(
      normalizePhotoLocation({ longitude: Number.NaN, latitude: 30 }),
      null,
    );
  });
});

describe("readPhotoLocation (optional DJI sample)", () => {
  it("skips when no local sample panorama is present", async (t) => {
    const sample = findSampleImage(DJI_SAMPLE_CANDIDATES);
    if (!sample) {
      t.skip(
        "No DJI/local panorama sample under 720全景/ or examples/; GPS integration skipped",
      );
      return;
    }
    const buf = fs.readFileSync(sample);
    const blob = new Blob([buf]);
    const loc = await readPhotoLocation(blob);
    // Sample may or may not embed GPS; assert the reader does not throw and
    // returns either null or a normalized in-range location.
    if (loc) {
      assert.ok(loc.longitude >= -180 && loc.longitude <= 180);
      assert.ok(loc.latitude >= -90 && loc.latitude <= 90);
    } else {
      assert.equal(loc, null);
    }
  });
});
