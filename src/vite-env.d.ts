/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Cesium ion token for static GitHub Pages builds (no Express `/api/config`). */
  readonly VITE_CESIUM_ION_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Cesium static assets base, injected by Vite (`define`). */
declare const CESIUM_BASE_URL: string;
