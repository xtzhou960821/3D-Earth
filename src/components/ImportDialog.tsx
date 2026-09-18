import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Box,
  Camera,
  Cloud,
  FolderOpen,
  Upload,
  FileCheck,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import Modal from "./Modal";
import type { Layer } from "../types";
import { uploadLayer } from "../lib/api";
import { readPhotoLocation } from "../lib/photoLocation";

interface Props {
  onClose: () => void;
  onImported: (l: Layer) => void;
  position: { longitude: number; latitude: number; height: number };
}

/** UI status while reading panorama EXIF GPS. */
type GpsStatus = "" | "reading" | "gps-found" | "no-gps";

/**
 * Import dialog for models, tilesets, panoramas, and ion assets.
 */
export default function ImportDialog({ onClose, onImported, position }: Props) {
  const [type, setType] = useState<"model" | "tiles" | "panorama" | "ion">(
      "model",
    ),
    [files, setFiles] = useState<File[]>([]),
    [name, setName] = useState(""),
    [lon, setLon] = useState(String(position.longitude)),
    [lat, setLat] = useState(String(position.latitude)),
    [height, setHeight] = useState(String(position.height)),
    [scale, setScale] = useState("1"),
    [heading, setHeading] = useState("0"),
    [asset, setAsset] = useState(""),
    [entry, setEntry] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState(""),
    [gpsStatus, setGpsStatus] = useState<GpsStatus>("");
  const fileInput = useRef<HTMLInputElement>(null),
    folderInput = useRef<HTMLInputElement>(null),
    gpsToken = useRef(0);
  const choices = [
    { id: "model" as const, label: "BIM / 模型", icon: Box },
    { id: "tiles" as const, label: "三维实景", icon: FolderOpen },
    { id: "panorama" as const, label: "720全景", icon: Camera },
    { id: "ion" as const, label: "Cesium ion", icon: Cloud },
  ];
  const candidates = files.filter((f) =>
    type === "tiles"
      ? f.name.endsWith(".json")
      : type === "panorama"
        ? /\.(jpg|jpeg|png|webp)$/i.test(f.name)
        : /\.(glb|gltf|ifc|obj)$/i.test(f.name),
  );
  /**
   * Prefill lon/lat/height from panorama EXIF GPS when available.
   * @param file Selected panorama image
   */
  async function applyPanoramaGps(file: File) {
    const token = ++gpsToken.current;
    setGpsStatus("reading");
    const loc = await readPhotoLocation(file);
    if (token !== gpsToken.current) return;
    if (!loc) {
      setGpsStatus("no-gps");
      return;
    }
    setLon(String(loc.longitude));
    setLat(String(loc.latitude));
    if (loc.height != null) setHeight(String(loc.height));
    setGpsStatus("gps-found");
  }

  /**
   * Apply a file list selection and guess the entry path.
   * @param list Files from picker or drop
   */
  function pick(list: File[]) {
    setFiles(list);
    setError("");
    const file = list.find((f) =>
      type === "tiles"
        ? f.name === "tileset.json"
        : type === "panorama"
          ? /\.(jpg|jpeg|png|webp)$/i.test(f.name)
          : /\.(glb|gltf|ifc|obj)$/i.test(f.name),
    );
    setEntry(file?.webkitRelativePath || file?.name || "");
    if (file && !name) setName(file.name.replace(/\.[^.]+$/, ""));
    if (type === "panorama" && file) {
      void applyPanoramaGps(file);
    } else {
      setGpsStatus("");
    }
  }
  /**
   * Switch import kind and clear the current selection.
   * @param next Import type tab
   */
  function changeType(next: typeof type) {
    setType(next);
    setFiles([]);
    setEntry("");
    setError("");
    setProgress(null);
    setGpsStatus("");
    gpsToken.current += 1;
  }
  /**
   * Validate, convert when needed, and upload to the local Express API.
   * @param e Form submit event
   */
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setProgress(null);
    try {
      let uploadFiles = files;
      let chosen = files.find(
        (f) => (f.webkitRelativePath || f.name) === entry,
      );
      let uploadEntry = entry;
      let sourceFormat = chosen?.name.split(".").pop()?.toUpperCase();
      let bimProperties: unknown[] | undefined;
      if (type !== "ion" && !chosen)
        throw new Error("请选择对应类型的入口文件");
      if (type === "panorama") {
        setStatus("正在检查720全景图片…");
        const { validatePanorama } = await import("../lib/convert");
        await validatePanorama(chosen!);
        uploadFiles = [chosen!];
      }
      if (type === "model" && /\.(ifc|obj)$/i.test(chosen!.name)) {
        const { convertModel } = await import("../lib/convert");
        const converted = await convertModel(chosen!, files, setStatus);
        chosen = converted.file;
        uploadFiles = [converted.file];
        uploadEntry = converted.file.name;
        bimProperties = converted.properties;
      }
      if (uploadFiles.length > 5000)
        throw new Error(
          "单次最多 5000 个文件，大型实景数据请通过 ion 资源加载",
        );
      if (uploadFiles.some((f) => f.size > 512 * 1024 * 1024))
        throw new Error("单个文件不能超过 512 MB");
      if (type === "tiles") {
        const tilesetFile = uploadFiles.find(
          (f) => (f.webkitRelativePath || f.name) === uploadEntry,
        );
        if (!tilesetFile)
          throw new Error("找不到 tileset.json，请选择完整 3D Tiles 文件夹");
        try {
          const tileset = JSON.parse(await tilesetFile.text());
          if (!tileset.asset || !tileset.root)
            throw new Error("该 JSON 不是有效的 3D Tiles tileset");
        } catch (err) {
          if (err instanceof Error && err.message.includes("3D Tiles"))
            throw err;
          throw new Error("tileset.json 无法解析，请检查文件编码与内容");
        }
      }
      setStatus("正在保存到本地内容库…");
      setProgress(0);
      const metadata = {
        name,
        kind: type,
        longitude: Number(lon),
        latitude: Number(lat),
        height: Number(height),
        heading: Number(heading),
        scale: Number(scale),
        entry: uploadEntry,
        assetId: Number(asset),
        sourceFormat,
        hasProperties: Boolean(bimProperties?.length),
      };
      const form = new FormData();
      form.append("metadata", JSON.stringify(metadata));
      const paths = uploadFiles.map((f) => f.webkitRelativePath || f.name);
      if (bimProperties?.length) {
        const propFile = new File(
          [JSON.stringify(bimProperties)],
          "bim-properties.json",
          { type: "application/json" },
        );
        uploadFiles = [...uploadFiles, propFile];
        paths.push("bim-properties.json");
      }
      form.append("paths", JSON.stringify(paths));
      for (const file of uploadFiles) form.append("files", file, file.name);
      const layer = await uploadLayer(form, (pct) => {
        setProgress(pct);
        setStatus(`正在上传到本地内容库… ${pct}%`);
      });
      onImported(layer);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "导入失败，请重试";
      setError(message);
      setStatus("");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="把你的世界，放上地球"
      subtitle="导入模型与720全景，让每一个地点更立体。"
      onClose={onClose}
      wide
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="import-tabs">
          {choices.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              className={type === id ? "active" : ""}
              onClick={() => changeType(id)}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {type === "ion" ? (
            <div className="ion-input">
              <Cloud size={30} />
              <label>
                Cesium ion Asset ID
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={asset}
                  placeholder="输入已完成切片的 3D Tiles 资源 ID"
                  onChange={(e) => setAsset(e.target.value)}
                />
              </label>
              <p>
                使用本地已配置的访问令牌。此入口加载已有资源，不会上传文件。
              </p>
            </div>
          ) : (
            <>
              <div
                className={`dropzone ${files.length ? "has-files" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!busy) pick(Array.from(e.dataTransfer.files));
                }}
              >
                {files.length ? <FileCheck size={30} /> : <Upload size={30} />}
                <strong>
                  {files.length
                    ? `已选择 ${files.length} 个文件`
                    : "将文件拖到这里，或从电脑选择"}
                </strong>
                <p>
                  {type === "model"
                    ? "IFC · GLB · glTF · OBJ（含 MTL 与纹理）"
                    : type === "tiles"
                      ? "大疆智图 B3DM / 3D Tiles 完整目录"
                      : "JPG · PNG · WebP / 2:1 等距柱状720全景图"}
                </p>
                <div className="file-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => fileInput.current?.click()}
                  >
                    选择文件
                  </button>
                  {type !== "panorama" && (
                    <button
                      type="button"
                      className="text-button"
                      disabled={busy}
                      onClick={() => folderInput.current?.click()}
                    >
                      <FolderOpen size={16} />
                      选择完整文件夹
                    </button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  hidden
                  multiple={type !== "panorama"}
                  accept={
                    type === "panorama" ? ".jpg,.jpeg,.png,.webp" : undefined
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    pick(Array.from(e.target.files || []))
                  }
                />
                <input
                  ref={folderInput}
                  type="file"
                  hidden
                  multiple
                  {...{ webkitdirectory: "", directory: "" }}
                  onChange={(e) => pick(Array.from(e.target.files || []))}
                />
              </div>
              {files.length > 0 && (
                <label className="entry-label">
                  入口文件
                  <select
                    required
                    value={entry}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEntry(next);
                      if (type === "panorama") {
                        const file = files.find(
                          (f) => (f.webkitRelativePath || f.name) === next,
                        );
                        if (file) void applyPanoramaGps(file);
                      }
                    }}
                  >
                    <option value="">选择模型 / tileset.json / 720全景图片</option>
                    {candidates.map((f) => (
                      <option
                        key={f.webkitRelativePath || f.name}
                        value={f.webkitRelativePath || f.name}
                      >
                        {f.webkitRelativePath || f.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          <label>
            内容名称
            <input
              required
              maxLength={100}
              placeholder="例如：我的桥梁 BIM、古镇航测模型"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {type !== "ion" && type !== "tiles" && (
            <>
              <div className="form-section-title">
                <MapPin size={15} />
                <span>放置位置</span>
                <small>
                  {type === "panorama" && gpsStatus === "reading"
                    ? "WGS84 · 正在读取照片 GPS…"
                    : type === "panorama" && gpsStatus === "gps-found"
                      ? "WGS84 · 已从 EXIF GPS 预填"
                      : type === "panorama" && gpsStatus === "no-gps"
                        ? "WGS84 · 未找到 GPS，已用当前地图中心"
                        : "WGS84 · 已取当前地图中心"}
                </small>
              </div>
              <div className="form-grid">
                <label>
                  经度
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    required
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                  />
                </label>
                <label>
                  纬度
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </label>
                <label>
                  高程（米）
                  <input
                    type="number"
                    step="any"
                    min="-10000"
                    max="10000000"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </label>
                {type === "model" && (
                  <>
                    <label>
                      旋转（度）
                      <input
                        type="number"
                        step="any"
                        min="-360"
                        max="360"
                        required
                        value={heading}
                        onChange={(e) => setHeading(e.target.value)}
                      />
                    </label>
                    <label>
                      缩放比例
                      <input
                        type="number"
                        min="0.001"
                        max="10000"
                        step="any"
                        required
                        value={scale}
                        onChange={(e) => setScale(e.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="height-nudge" role="group" aria-label="高程微调">
                <span>高程微调</span>
                {[-10, -1, 1, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      setHeight(String(Number(height || 0) + delta))
                    }
                  >
                    {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="import-note">
            {type === "model"
              ? "IFC 在浏览器本地转换（限 100 MB），保留几何与构件属性到 glTF extras / bim-properties.json；点击模型可查看属性树。RVT 请先导出 IFC，OSGB/RVT 不直接导入。"
              : type === "tiles"
                ? "请选择包含 tileset.json、瓦片和纹理的完整文件夹，使用模型自带地理定位。OSGB 请先转换为 3D Tiles；单独 B3DM 文件不能直接定位。"
                : type === "panorama"
                  ? "文件保存在这台电脑。若照片含 EXIF GPS（如大疆全景），将自动预填经纬高；也可手动修改。导入后点击地图上的 720全景 标记即可进入全景。"
                  : "资源必须为已切片的 3D Tiles，且访问令牌具备该资源的读取权限。"}
          </p>
          {busy && progress != null && (
            <div
              className="import-progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{ width: `${progress}%` }} />
              <span>{progress}%</span>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="modal-footer">
          <span>
            {busy ? (
              <>
                <LoaderCircle size={15} className="spin" />
                {status || "处理中…"}
              </>
            ) : (
              "本地内容库 · 不自动上传云端"
            )}
          </span>
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "正在处理…" : "导入到地球"}
            <Upload size={16} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}
