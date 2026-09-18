/**
 * Resolve a path under Vite `public/` against the configured base URL.
 * Required for GitHub project Pages (`/3D-Earth/`) as well as local `/`.
 * @param path Absolute-from-site-root or relative public asset path
 * @returns Browser-ready URL including Vite base
 */
export function publicUrl(path: string): string {
  const env =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env
      : undefined;
  const base = env?.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
