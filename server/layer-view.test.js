import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPanoramaPresentation,
  PANORAMA_MARKER_OFFSET_M,
} from "../src/lib/layerView.ts";

describe("getPanoramaPresentation", () => {
  it("raises marker height by the fixed offset", () => {
    const view = getPanoramaPresentation({
      name: "村口全景",
      longitude: 120.537,
      latitude: 28.741,
      height: 100,
    });
    assert.equal(view.markerHeight, 100 + PANORAMA_MARKER_OFFSET_M);
    assert.equal(view.markerHeight, 104);
    assert.equal(view.height, 100);
    assert.equal(view.label, "村口全景");
    assert.equal(view.longitude, 120.537);
    assert.equal(view.latitude, 28.741);
  });

  it("treats non-finite height as 0", () => {
    const view = getPanoramaPresentation({
      name: "无高程",
      longitude: 104,
      latitude: 30,
      height: Number.NaN,
    });
    assert.equal(view.height, 0);
    assert.equal(view.markerHeight, PANORAMA_MARKER_OFFSET_M);
  });
});
