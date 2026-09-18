import type { Layer } from "../types";
import { publicUrl } from "./publicUrl";

/** Stable id for the Chengdu sample tileset shipped with Pages builds. */
export const DEMO_CHENGDU_TILES_ID = "demo-chengdu-tiles";

/** Stable id: Jiaojiang Bridge Park panorama (compressed demo). */
export const DEMO_PANO_JIAOJIANG_ID = "demo-pano-jiaojiang-bridge-park";

/** Stable id: Tongjiang Academy panorama (compressed demo). */
export const DEMO_PANO_TONGJIANG_ID = "demo-pano-tongjiang-academy";

/**
 * Read-only demo layers for static hosts (GitHub Pages) without Express upload.
 * References `examples/tiles` copied into dist as `demo-tiles/` via Vite, plus
 * compressed owner panoramas under `public/demo-panoramas/` (not gitignored
 * full-res files in `720全景/`).
 * @returns Demo layer list
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
    {
      id: DEMO_PANO_JIAOJIANG_ID,
      name: "示例 · 椒江大桥公园720全景",
      kind: "panorama",
      longitude: 121.382287,
      latitude: 28.689258,
      height: 82.952,
      heading: 0,
      scale: 1,
      url: publicUrl("demo-panoramas/DJI_20260911170527_0004_V.jpg"),
      visible: true,
      createdAt: "2026-09-11T10:55:21.686Z",
      bytes: 1665995,
      sourceFormat: "JPG",
      readOnly: true,
    },
    {
      id: DEMO_PANO_TONGJIANG_ID,
      name: "示例 · 仙居桐江书院720全景",
      kind: "panorama",
      longitude: 120.55516,
      latitude: 28.744724,
      height: 152.703,
      heading: 0,
      scale: 1,
      url: publicUrl("demo-panoramas/DJI_20260912110830_0002_V.jpg"),
      visible: true,
      createdAt: "2026-09-12T11:20:03.223Z",
      bytes: 2453279,
      sourceFormat: "JPG",
      readOnly: true,
    },
  ];
}
