import type { Layer } from "../types";
import { publicUrl } from "./publicUrl";

/** Stable id: Jiaojiang Bridge Park panorama. */
export const DEMO_PANO_JIAOJIANG_ID = "demo-pano-jiaojiang-bridge-park";

/** Stable id: Tongjiang Academy panorama. */
export const DEMO_PANO_TONGJIANG_ID = "demo-pano-tongjiang-academy";

/**
 * Built-in panoramas for static hosts (GitHub Pages) without Express upload.
 * Files live under `public/demo-panoramas/` (compressed). Full-resolution
 * originals stay in gitignored `720全景/`.
 * @returns Built-in panorama layers
 */
export function getDemoLayers(): Layer[] {
  return [
    {
      id: DEMO_PANO_JIAOJIANG_ID,
      name: "椒江大桥公园720全景",
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
    },
    {
      id: DEMO_PANO_TONGJIANG_ID,
      name: "仙居桐江书院720全景",
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
    },
  ];
}
