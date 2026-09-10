import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { safeRelativePath, validateLayer } from "./validation.js";
const app = express();
const root = path.resolve(import.meta.dirname, "..");
const dataRoot = path.join(root, "data");
const uploadRoot = path.join(dataRoot, "uploads");
const staging = path.join(dataRoot, "staging");
await fs.mkdir(uploadRoot, { recursive: true });
await fs.mkdir(staging, { recursive: true });
const catalog = path.join(dataRoot, "layers.json");
let layers = JSON.parse(await fs.readFile(catalog, "utf8").catch(() => "[]"));
let pending = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(layers, null, 2);
  pending = pending
    .catch(() => {})
    .then(async () => {
      await fs.writeFile(catalog + ".tmp", snapshot);
      await fs.rename(catalog + ".tmp", catalog);
    });
  return pending;
}
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (
    origin &&
    ![
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      `http://localhost:${process.env.PORT || 3001}`,
      `http://127.0.0.1:${process.env.PORT || 3001}`,
    ].includes(origin)
  )
    return res.status(403).json({ error: "仅允许本机应用访问" });
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ionConfigured: !!process.env.CESIUM_ION_TOKEN }),
);
app.get("/api/config", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ionToken: process.env.CESIUM_ION_TOKEN || "" });
});
app.get("/api/layers", (_req, res) => res.json(layers));
const upload = multer({
  dest: staging,
  limits: {
    fileSize: 512 * 1024 * 1024,
    files: 5000,
    fields: 10,
    fieldSize: 2 * 1024 * 1024,
  },
}).array("files");
app.post("/api/layers", (req, res) => {
  upload(req, res, async (error) => {
    const files = req.files || [];
    let directory;
    try {
      if (error)
        throw new Error(
          error.code === "LIMIT_FILE_SIZE"
            ? "单个文件不能超过 512 MB"
            : `上传失败：${error.message}`,
        );
      const input = JSON.parse(req.body.metadata || "{}");
      const metadata = validateLayer(input);
      const id = randomUUID();
      let url;
      if (metadata.kind !== "ion") {
        if (!files.length) throw new Error("请选择需要导入的文件");
        const paths = JSON.parse(req.body.paths || "[]");
        if (paths.length !== files.length) throw new Error("文件清单不完整");
        const cleanPaths = paths.map(safeRelativePath);
        if (new Set(cleanPaths).size !== cleanPaths.length)
          throw new Error("文件路径重复");
        const entry = safeRelativePath(input.entry);
        if (!cleanPaths.includes(entry)) throw new Error("找不到入口文件");
        const ext = path.extname(entry).toLowerCase();
        if (metadata.kind === "tiles") {
          if (ext !== ".json")
            throw new Error("3D Tiles 需要选择 tileset.json 入口");
          const tileset = JSON.parse(
            await fs.readFile(files[cleanPaths.indexOf(entry)].path, "utf8"),
          );
          if (!tileset.asset || !tileset.root)
            throw new Error("该 JSON 不是有效的 3D Tiles tileset");
        }
        if (metadata.kind === "model" && ![".glb", ".gltf"].includes(ext))
          throw new Error("模型需要转换为 GLB 或 glTF 后导入");
        if (
          metadata.kind === "panorama" &&
          ![".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        )
          throw new Error("请选择全景图片");
        directory = path.join(uploadRoot, id);
        await fs.mkdir(directory, { recursive: true });
        for (let i = 0; i < files.length; i++) {
          const target = path.join(directory, cleanPaths[i]);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.rename(files[i].path, target);
        }
        url = `/uploads/${id}/${entry.split("/").map(encodeURIComponent).join("/")}`;
      }
      const layer = {
        id,
        ...metadata,
        url,
        visible: true,
        createdAt: new Date().toISOString(),
        bytes: files.reduce((n, f) => n + f.size, 0),
        sourceFormat:
          typeof input.sourceFormat === "string"
            ? input.sourceFormat.slice(0, 30)
            : undefined,
      };
      layers.push(layer);
      try {
        await save();
      } catch (e) {
        layers = layers.filter((l) => l.id !== id);
        throw e;
      }
      res.status(201).json(layer);
    } catch (e) {
      if (directory) await fs.rm(directory, { recursive: true, force: true });
      res
        .status(400)
        .json({ error: e instanceof Error ? e.message : "导入失败" });
    } finally {
      await Promise.all(files.map((f) => fs.rm(f.path, { force: true })));
    }
  });
});
app.patch("/api/layers/:id", async (req, res) => {
  const layer = layers.find((l) => l.id === req.params.id);
  if (!layer) return res.status(404).json({ error: "图层不存在" });
  const before = { ...layer };
  try {
    const values = validateLayer({ ...layer, ...req.body, kind: layer.kind });
    Object.assign(layer, values);
    if (typeof req.body.visible === "boolean") layer.visible = req.body.visible;
    await save();
    res.json(layer);
  } catch (e) {
    Object.assign(layer, before);
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/layers/:id", async (req, res) => {
  const index = layers.findIndex((l) => l.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "图层不存在" });
  const [removed] = layers.splice(index, 1);
  try {
    await save();
    await fs.rm(path.join(uploadRoot, removed.id), {
      recursive: true,
      force: true,
    });
    res.json({ ok: true });
  } catch {
    layers.splice(index, 0, removed);
    res.status(500).json({ error: "删除失败，请重试" });
  }
});
app.use(
  "/uploads",
  express.static(uploadRoot, {
    dotfiles: "deny",
    setHeaders(res) {
      res.setHeader("Content-Security-Policy", "default-src 'none'");
    },
  }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "dist/index.html")),
  );
}
app.use((err, _req, res, _next) =>
  res.status(500).json({
    error: err instanceof SyntaxError ? "请求格式错误" : "服务暂时不可用",
  }),
);
app.listen(Number(process.env.PORT) || 3001, "127.0.0.1", () =>
  console.log(
    `山海 Earth 本地服务已启动：http://127.0.0.1:${process.env.PORT || 3001}`,
  ),
);
