import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * Serve `public/heritage/index.html` for `/heritage` and `/heritage/`.
 * Vite's SPA fallback otherwise returns the globe app for the directory URL.
 */
function heritageIndex(): Plugin {
  return {
    name: "heritage-index",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split("?")[0];
        if (path === "/heritage" || path === "/heritage/") {
          const query = req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "";
          req.url = `/heritage/index.html${query}`;
        }
        next();
      });
    },
  };
}

/**
 * Site base path. Local Express/Vite use `/`.
 * GitHub project Pages uses `/3D-Earth/` via `VITE_BASE` in CI.
 */
const base = process.env.VITE_BASE || "/";
const cesiumBase = `${base.endsWith("/") ? base : `${base}/`}cesium`;

export default defineConfig({
  base,
  plugins: [
    heritageIndex(),
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
