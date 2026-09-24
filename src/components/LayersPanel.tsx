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

/**
 * Sidebar list of user/demo layers with adjust / focus / delete actions.
 */
export default function LayersPanel({
  layers,
  statuses,
  onChange,
  onFocus,
  onPanorama,
  onImport,
  importEnabled = true,
  onBack,
  notify,
}: {
  layers: Layer[];
  statuses: Record<string, string>;
  onChange: (l: Layer[]) => void;
  onFocus: (l: Layer) => void;
  onPanorama: (l: Layer) => void;
  onImport: () => void;
  /** False on static Pages (no Express upload API). */
  importEnabled?: boolean;
  onBack: () => void;
  notify: (s: string) => void;
}) {
  const [edit, setEdit] = useState<Layer | null>(null),
    [busy, setBusy] = useState<string | null>(null),
    [deleting, setDeleting] = useState<string | null>(null);

  /**
   * Patch a layer via API, or locally for read-only demo layers.
   * @param l Target layer
   * @param values Partial fields to merge
   */
  async function patch(l: Layer, values: Partial<Layer>) {
    setBusy(l.id);
    try {
      if (l.readOnly || !importEnabled) {
        const changed = { ...l, ...values };
        onChange(layers.map((x) => (x.id === l.id ? changed : x)));
        setEdit(null);
        return;
      }
      const changed = await updateLayer(l.id, values);
      onChange(layers.map((x) => (x.id === l.id ? changed : x)));
      setEdit(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Delete a layer and its uploaded files (skipped for read-only demos).
   * @param id Layer id
   */
  async function remove(id: string) {
    const target = layers.find((l) => l.id === id);
    if (target?.readOnly) {
      notify("演示图层不可删除");
      setDeleting(null);
      return;
    }
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

  /**
   * Format lon/lat/height for the layer summary line.
   * @param l Layer
   */
  function positionLabel(l: Layer) {
    return `${l.longitude.toFixed(5)}, ${l.latitude.toFixed(5)} · h ${Math.round(l.height)} m`;
  }

  /**
   * Whether a status string means the layer is ready to focus.
   * @param status Layer status text
   */
  function canFocus(status: string | undefined) {
    if (!status) return false;
    return (
      status === "已加载" ||
      status === "正在准备模型" ||
      status.startsWith("加载瓦片") ||
      status.includes("部分瓦片")
    );
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
      <button
        className="outline-button full-width"
        onClick={onImport}
        disabled={!importEnabled}
        title={importEnabled ? undefined : "完整导入能力请本机 npm start"}
      >
        <Plus size={18} />
        导入内容
      </button>
      {!importEnabled && (
        <p className="import-disabled-tip">
          完整导入能力请本机 npm start。
          {layers.some((l) => l.kind === "panorama")
            ? " 下面的720全景是站点自带的压缩片，清晰度低于本机原片。"
            : ""}
        </p>
      )}
      {!layers.length ? (
        <div className="empty-state">
          <Layers size={38} />
          <h3>地球上，还差你的故事</h3>
          <p>导入 BIM 模型、航测实景或720全景照片，在地图上留下自己的视角。</p>
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
                  <strong>
                    {l.name}
                    {l.readOnly ? <em className="demo-badge">演示</em> : null}
                  </strong>
                  <small>
                    {l.sourceFormat || l.kind.toUpperCase()} ·{" "}
                    {l.bytes
                      ? (l.bytes / 1024 / 1024).toFixed(1) + " MB"
                      : "云端资源"}
                  </small>
                  {(l.kind === "model" || l.kind === "panorama") && (
                    <small className="layer-coords" title="WGS84 · 椭球高">
                      {positionLabel(l)}
                    </small>
                  )}
                  {l.kind === "tiles" && l.readOnly && (
                    <small className="layer-coords" title="示例大致位置">
                      成都附近 · tileset 自带变换
                    </small>
                  )}
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
                className={`layer-status ${
                  statuses[l.id]?.includes("失败") ? "error" : ""
                } ${statuses[l.id]?.includes("加载") && !statuses[l.id]?.includes("失败") && statuses[l.id] !== "已加载" ? "loading" : ""}`}
              >
                <i />
                {statuses[l.id] || "等待加载"}
                {!l.visible ? " · 已隐藏" : ""}
              </p>
              <div className="layer-actions">
                <button
                  disabled={!canFocus(statuses[l.id])}
                  onClick={() =>
                    l.kind === "panorama" ? onPanorama(l) : onFocus(l)
                  }
                >
                  <Focus size={14} />
                  {l.kind === "panorama" ? "打开720全景" : "定位"}
                </button>
                {(l.kind === "model" || l.kind === "panorama") &&
                  !l.readOnly &&
                  importEnabled && (
                  <button
                    onClick={() => setEdit(edit?.id === l.id ? null : { ...l })}
                  >
                    <SlidersHorizontal size={14} />
                    调整
                  </button>
                )}
                {!l.readOnly && importEnabled && (
                  <button
                    className="delete-button"
                    aria-label={"删除 " + l.name}
                    onClick={() => setDeleting(deleting === l.id ? null : l.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
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
                  <p className="layer-edit-summary">
                    当前：{positionLabel(edit)}
                  </p>
                  <label>
                    名称
                    <input
                      required
                      maxLength={100}
                      value={edit.name}
                      onChange={(e) =>
                        setEdit({ ...edit, name: e.target.value })
                      }
                    />
                  </label>
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
                        ...(edit.kind === "model"
                          ? ([
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
                            ] as const)
                          : []),
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
                  <div className="height-nudge" role="group" aria-label="高程微调">
                    <span>高程微调</span>
                    {[-10, -1, 1, 10].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setEdit({ ...edit, height: edit.height + delta })
                        }
                      >
                        {delta > 0 ? `+${delta}m` : `${delta}m`}
                      </button>
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
