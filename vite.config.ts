import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * Site base path. Local Express/Vite use `/`.
 * GitHub project Pages uses `/3D-Earth/` via `VITE_BASE` in CI.
 */
const base = process.env.VITE_BASE || "/";
const cesiumBase = `${base.endsWith("/") ? base : `${base}/`}cesium`;

export default defineConfig({
  base,
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        ...["Workers", "Assets", "Widgets", "ThirdParty"].map((name) => ({
          src: `node_modules/cesium/Build/Cesium/${name}`,
          dest: "cesium",
          rename: { stripBase: 4 },
        })),
        {
          src: "node_modules/web-ifc/web-ifc.wasm",
          dest: "wasm",
          rename: { stripBase: true },
        },
      ],
    }),
  ],
  define: { CESIUM_BASE_URL: JSON.stringify(cesiumBase) },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3001",
      "/uploads": "http://127.0.0.1:3001",
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes("/cesium/") || id.includes("/@cesium/")
            ? "cesium"
            : id.includes("/three/")
              ? "three"
              : undefined,
      },
    },
  },
});
