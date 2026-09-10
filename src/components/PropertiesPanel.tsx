import { X, Box } from "lucide-react";
import type { BimPickInfo } from "../lib/bimPick";

/**
 * Floating panel showing best-effort BIM / feature properties after a pick.
 */
export default function PropertiesPanel({
  info,
  onClose,
}: {
  info: BimPickInfo;
  onClose: () => void;
}) {
  return (
    <aside className="bim-panel" aria-label="构件属性">
      <header>
        <div>
          <small>{info.layerName}</small>
          <strong>{info.title}</strong>
        </div>
        <button className="icon-button" aria-label="关闭属性面板" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {info.empty ? (
        <div className="bim-empty">
          <Box size={28} />
          <p>暂无构件元数据</p>
          <small>
            IFC 导入会写入 bim-properties.json；带 batch / feature
            表的 3D Tiles 点击后可显示属性。RVT / OSGB 请先外部转换为 IFC 或 3D
            Tiles。
          </small>
        </div>
      ) : (
        <ul className="bim-props">
          {info.properties.map((row) => (
            <li key={row.key}>
              <span>{row.key}</span>
              <strong>{row.value}</strong>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
