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
import { api } from "../lib/api";
interface Props {
  onClose: () => void;
  onImported: (l: Layer) => void;
  position: { longitude: number; latitude: number; height: number };
}
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
    [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null),
    folderInput = useRef<HTMLInputElement>(null);
  const choices = [
    { id: "model" as const, label: "BIM / 模型", icon: Box },
    { id: "tiles" as const, label: "三维实景", icon: FolderOpen },
    { id: "panorama" as const, label: "720° 全景", icon: Camera },
    { id: "ion" as const, label: "Cesium ion", icon: Cloud },
  ];
  const candidates = files.filter((f) =>
    type === "tiles"
      ? f.name.endsWith(".json")
      : type === "panorama"
        ? /\.(jpg|jpeg|png|webp)$/i.test(f.name)
        : /\.(glb|gltf|ifc|obj)$/i.test(f.name),
  );
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
  }
  function changeType(next: typeof type) {
    setType(next);
    setFiles([]);
    setEntry("");
    setError("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let uploadFiles = files;
      let chosen = files.find(
        (f) => (f.webkitRelativePath || f.name) === entry,
      );
      let uploadEntry = entry;
      let sourceFormat = chosen?.name.split(".").pop()?.toUpperCase();
      if (type !== "ion" && !chosen)
        throw new Error("请选择对应类型的入口文件");
      if (type === "panorama") {
        setStatus("正在检查全景图片…");
        const { validatePanorama } = await import("../lib/convert");
        await validatePanorama(chosen!);
        uploadFiles = [chosen!];
      }
      if (type === "model" && /\.(ifc|obj)$/i.test(chosen!.name)) {
        const { convertModel } = await import("../lib/convert");
        chosen = await convertModel(chosen!, files, setStatus);
        uploadFiles = [chosen];
        uploadEntry = chosen.name;
      }
      if (uploadFiles.length > 5000)
        throw new Error(
          "单次最多 5000 个文件，大型实景数据请通过 ion 资源加载",
        );
      if (uploadFiles.some((f) => f.size > 512 * 1024 * 1024))
        throw new Error("单个文件不能超过 512 MB");
      setStatus("正在保存到本地内容库…");
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
      };
      const form = new FormData();
      form.append("metadata", JSON.stringify(metadata));
      const paths = uploadFiles.map((f) => f.webkitRelativePath || f.name);
      form.append("paths", JSON.stringify(paths));
      for (const file of uploadFiles) form.append("files", file, file.name);
      const layer = await api<Layer>("/layers", { method: "POST", body: form });
      onImported(layer);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败，请重试");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="把你的世界，放上地球"
      subtitle="导入模型与全景，让每一个地点更立体。"
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
                      : "JPG · PNG · WebP / 2:1 等距柱状全景图"}
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
                    onChange={(e) => setEntry(e.target.value)}
                  >
                    <option value="">选择模型 / tileset.json / 全景图片</option>
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
                <small>WGS84 · 已取当前地图中心</small>
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
            </>
          )}
          <p className="import-note">
            {type === "model"
              ? "IFC 在浏览器本地转换（限 100 MB），保留几何与构件编号；RVT 请先导出 IFC。OBJ 请连同材质和贴图一起选择。"
              : type === "tiles"
                ? "请选择包含 tileset.json、瓦片和纹理的完整文件夹，使用模型自带地理定位。OSGB 请先转换为 3D Tiles；单独 B3DM 文件不能直接定位。"
                : type === "panorama"
                  ? "文件保存在这台电脑，导入后点击地图上的 360 标记即可进入全景。"
                  : "资源必须为已切片的 3D Tiles，且访问令牌具备该资源的读取权限。"}
          </p>
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
                {status}
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
