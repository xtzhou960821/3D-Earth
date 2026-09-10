/**
 * Classify a Cesium OSM Buildings / ion failure for UI copy.
 * @param err Caught error
 * @param hasIonToken Whether a Cesium ion token is configured
 * @returns Short Chinese status suitable for the map status bar
 */
export function classifyOsmBuildingsError(
  err: unknown,
  hasIonToken: boolean,
): string {
  if (!hasIonToken) {
    return "未配置 Cesium ion 令牌 · 已关闭全球建筑";
  }
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/401|403|unauthor|denied|forbidden|permission|not authorized|access/i.test(msg)) {
    return "ion 令牌缺少 OSM Buildings 权限 · 已关闭全球建筑";
  }
  if (/404|not found|unknown asset|asset/i.test(msg)) {
    return "无法访问 OSM Buildings 资源 · 请确认令牌已开通该资产 · 已关闭";
  }
  if (/network|fetch|timeout|offline|failed to fetch|load failed/i.test(msg)) {
    return "网络异常，OSM 建筑加载失败 · 已关闭全球建筑";
  }
  return "OSM 建筑加载失败 · 请检查 ion 权限或网络 · 已关闭";
}
