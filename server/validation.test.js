import test from "node:test";
import assert from "node:assert/strict";
import { safeRelativePath, validateLayer } from "./validation.js";
test("retains nested DJI texture and tile paths", () => {
  assert.equal(
    safeRelativePath("scene/Data/Tile_1/Tile_1.b3dm"),
    "scene/Data/Tile_1/Tile_1.b3dm",
  );
});
test("rejects traversal, absolute paths and executable content", () => {
  for (const p of [
    "../.env",
    "a/../../x.glb",
    "/tmp/a.glb",
    "a\\x.glb",
    ".env",
    "index.html",
    "a/./b.json",
  ])
    assert.throws(() => safeRelativePath(p));
});
const valid = {
  name: "test",
  kind: "model",
  longitude: 104,
  latitude: 30,
  height: 0,
  scale: 1,
  heading: 0,
};
test("validates WGS84 coordinates and model scale", () => {
  assert.equal(validateLayer(valid).longitude, 104);
  for (const patch of [
    { longitude: 181 },
    { latitude: NaN },
    { scale: 0 },
    { height: Infinity },
    { heading: 400 },
  ])
    assert.throws(() => validateLayer({ ...valid, ...patch }));
});
test("requires positive integer ion asset identifiers", () => {
  assert.throws(() => validateLayer({ ...valid, kind: "ion", assetId: 1.3 }));
  assert.equal(
    validateLayer({ ...valid, kind: "ion", assetId: 123 }).assetId,
    123,
  );
});
