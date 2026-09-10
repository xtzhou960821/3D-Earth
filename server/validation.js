import path from "node:path";
export function safeRelativePath(input) {
  if (
    typeof input !== "string" ||
    !input ||
    input.length > 500 ||
    input.includes("\\") ||
    input.includes("\0") ||
    path.posix.isAbsolute(input)
  )
    throw new Error("文件路径无效");
  const parts = input.split("/");
  if (parts.some((p) => !p || p === ".." || p === "." || p.startsWith(".")))
    throw new Error("不允许访问隐藏目录或上级目录");
  const ext = path.extname(input).toLowerCase();
  if (
    ![
      ".json",
      ".b3dm",
      ".i3dm",
      ".pnts",
      ".cmpt",
      ".glb",
      ".gltf",
      ".bin",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".ktx",
      ".ktx2",
      ".basis",
      ".ifc",
      ".obj",
      ".mtl",
      ".txt",
      ".xml",
    ].includes(ext)
  )
    throw new Error(`暂不支持 ${ext || "无扩展名"} 文件`);
  return input;
}
export function validateLayer(input) {
  const { name, kind, longitude, latitude, height, scale, heading } = input;
  if (typeof name !== "string" || !name.trim() || name.length > 100)
    throw new Error("请输入 1–100 字的内容名称");
  if (!["model", "tiles", "panorama", "ion"].includes(kind))
    throw new Error("内容类型无效");
  for (const [key, value, min, max] of [
    ["longitude", longitude, -180, 180],
    ["latitude", latitude, -90, 90],
    ["height", height, -10000, 1e7],
    ["scale", scale, 0.001, 10000],
    ["heading", heading, -360, 360],
  ]) {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      throw new Error(`${key} 超出有效范围`);
  }
  if (
    kind === "ion" &&
    (!Number.isSafeInteger(input.assetId) || input.assetId <= 0)
  )
    throw new Error("请输入正确的 Cesium ion Asset ID");
  return {
    name: name.trim(),
    kind,
    longitude,
    latitude,
    height,
    scale,
    heading,
    ...(kind === "ion" ? { assetId: input.assetId } : {}),
  };
}
