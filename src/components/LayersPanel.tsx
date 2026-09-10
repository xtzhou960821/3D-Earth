import { useState } from "react";
import {
  Box,
  Camera,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Focus,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  Save,
  LoaderCircle,
} from "lucide-react";
import type { Layer } from "../types";
import { api, updateLayer } from "../lib/api";
export default function LayersPanel({
  layers,
  statuses,
  onChange,
  onFocus,
  onPanorama,
  onImport,
  onBack,
  notify,
}: {
  layers: Layer[];
  statuses: Record<string, string>;
  onChange: (l: Layer[]) => void;
  onFocus: (l: Layer) => void;
  onPanorama: (l: Layer) => void;
  onImport: () => void;
  onBack: () => void;
  notify: (s: string) => void;
}) {
  const [edit, setEdit] = useState<Layer | null>(null),
    [busy, setBusy] = useState<string | null>(null),
    [deleting, setDeleting] = useState<string | null>(null);
  async function patch(l: Layer, values: Partial<Layer>) {
    setBusy(l.id);
    try {
      const changed = await updateLayer(l.id, values);
      onChange(layers.map((x) => (x.id === l.id ? changed : x)));
      setEdit(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function remove(id: string) {
    setBusy(id);
    try {
      await api(`/layers/${id}`, { method: "DELETE" });
      onChange(layers.filter((l) => l.id !== id));
      setDeleting(null);
      notify("已移除图层及本地文件");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="layers-panel">
      <div className="panel-heading">
        <button className="icon-button" aria-label="返回探索" onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <h2>我的图层</h2>
        <span>{layers.length}</span>
      </div>
      <p className="panel-description">属于你的建筑、山河与街角。</p>
      <button className="outline-button full-width" onClick={onImport}>
        <Plus size={18} />
        导入内容
      </button>
      {!layers.length ? (
        <div className="empty-state">
          <Layers size={38} />
          <h3>地球上，还差你的故事</h3>
          <p>导入 BIM 模型、航测实景或全景照片，在地图上留下自己的视角。</p>
        </div>
      ) : (
        <div className="layer-list">
          {layers.map((l) => (
            <div className="layer-item" key={l.id}>
              <div className="layer-top">
                <span className="layer-icon">
                  {l.kind === "panorama" ? (
                    <Camera size={20} />
                  ) : l.kind === "model" ? (
                    <Box size={20} />
                  ) : (
                    <Layers size={20} />
                  )}
                </span>
                <div>
                  <strong>{l.name}</strong>
                  <small>
                    {l.sourceFormat || l.kind.toUpperCase()} ·{" "}
                    {l.bytes
                      ? (l.bytes / 1024 / 1024).toFixed(1) + " MB"
                      : "云端资源"}
                  </small>
                </div>
                <button
                  className="icon-button"
                  disabled={busy === l.id}
                  aria-label={l.visible ? "隐藏 " + l.name : "显示 " + l.name}
                  onClick={() => void patch(l, { visible: !l.visible })}
                >
                  {l.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
              <p
                className={`layer-status ${statuses[l.id]?.includes("失败") ? "error" : ""}`}
              >
                <i />
                {statuses[l.id] || "等待加载"}
                {!l.visible ? " · 已隐藏" : ""}
              </p>
              <div className="layer-actions">
                <button
                  disabled={
                    !["已加载", "正在准备模型"].includes(statuses[l.id])
                  }
                  onClick={() =>
                    l.kind === "panorama" ? onPanorama(l) : onFocus(l)
                  }
                >
                  <Focus size={14} />
                  {l.kind === "panorama" ? "打开全景" : "定位"}
                </button>
                {l.kind === "model" && (
                  <button
                    onClick={() => setEdit(edit?.id === l.id ? null : { ...l })}
                  >
                    <SlidersHorizontal size={14} />
                    调整
                  </button>
                )}
                <button
                  className="delete-button"
                  aria-label={"删除 " + l.name}
                  onClick={() => setDeleting(deleting === l.id ? null : l.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {deleting === l.id && (
                <div className="delete-confirm">
                  <p>从本地内容库永久删除此内容？</p>
                  <button
                    disabled={busy === l.id}
                    onClick={() => void remove(l.id)}
                  >
                    删除文件
                  </button>
                  <button onClick={() => setDeleting(null)}>取消</button>
                </div>
              )}
              {edit?.id === l.id && (
                <form
                  className="layer-edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void patch(l, edit);
                  }}
                >
                  <div className="form-grid">
                    {(
                      [
                        {
                          key: "longitude",
                          label: "经度",
                          min: -180,
                          max: 180,
                        },
                        { key: "latitude", label: "纬度", min: -90, max: 90 },
                        {
                          key: "height",
                          label: "高程（米）",
                          min: -10000,
                          max: 1e7,
                        },
                        {
                          key: "heading",
                          label: "旋转（度）",
                          min: -360,
                          max: 360,
                        },
                        {
                          key: "scale",
                          label: "缩放比例",
                          min: 0.001,
                          max: 10000,
                        },
                      ] as const
                    ).map((f) => (
                      <label key={f.key}>
                        {f.label}
                        <input
                          required
                          type="number"
                          step="any"
                          min={f.min}
                          max={f.max}
                          value={edit[f.key]}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              [f.key]: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button className="primary-button" disabled={busy === l.id}>
                    {busy === l.id ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    应用调整
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
