/**
 * Contract tests for OSM Buildings failure copy (mirrors src/lib/ionStatus.ts).
 */
import test from "node:test";
import assert from "node:assert/strict";

/**
 * @param {unknown} err
 * @param {boolean} hasIonToken
 */
function classifyOsmBuildingsError(err, hasIonToken) {
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

test("classifies missing token, permission, and network", () => {
  assert.match(classifyOsmBuildingsError(null, false), /未配置/);
  assert.match(
    classifyOsmBuildingsError(new Error("401 Unauthorized"), true),
    /权限/,
  );
  assert.match(
    classifyOsmBuildingsError(new Error("Failed to fetch"), true),
    /网络/,
  );
});
