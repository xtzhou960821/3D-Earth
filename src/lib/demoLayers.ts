import type { Layer } from "../types";
import { publicUrl } from "./publicUrl";

/** Stable id for the Chengdu sample tileset shipped with Pages builds. */
export const DEMO_CHENGDU_TILES_ID = "demo-chengdu-tiles";

/**
 * Read-only demo layers for static hosts (GitHub Pages) without Express upload.
 * References `examples/tiles` copied into dist as `demo-tiles/` via Vite.
 * @returns Demo layer list (small B3DM sample near Chengdu)
 */
export function getDemoLayers(): Layer[] {
  return [
    {
      id: DEMO_CHENGDU_TILES_ID,
      name: "示例 · 成都 3D Tiles",
      kind: "tiles",
      longitude: 104.0665,
      latitude: 30.5728,
      height: 520,
      heading: 0,
      scale: 1,
      url: publicUrl("demo-tiles/tileset.json"),
      visible: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      bytes: 2400,
      sourceFormat: "B3DM",
      readOnly: true,
    },
  ];
}
