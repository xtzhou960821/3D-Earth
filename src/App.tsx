import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Mountain,
  Search,
  Compass,
  Heart,
  MapPin,
  Upload,
  Layers,
  ChevronRight,
  Globe2,
  Plus,
  Minus,
  Settings2,
  Mouse,
  Navigation2,
  LocateFixed,
  Check,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  LoaderCircle,
  Menu,
  Download,
  FileUp,
} from "lucide-react";
import { Globe } from "./components/Globe";
import PlaceDetail from "./components/PlaceDetail";
import LayersPanel from "./components/LayersPanel";
import Modal from "./components/Modal";
import { places } from "./data/places";
import type { Category, CheckIn, Layer, MapHandle, Place } from "./types";
import { api, persist, readStorage } from "./lib/api";
import { publicUrl } from "./lib/publicUrl";
import {
  mergeTravelRecords,
  parseTravelRecords,
  type TravelRecordsDoc,
} from "./lib/travelRecords";
const ImportDialog = lazy(() => import("./components/ImportDialog"));
const Panorama = lazy(() => import("./components/Panorama"));
const categories = ["全部", "自然风光", "人文古迹", "城市漫游"] as const;
export default function App() {
  const map = useRef<MapHandle>(null);
  const importRecordsRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState<Category | "全部">("全部"),
    [tab, setTab] = useState<"explore" | "favorites" | "checkins">("explore"),
    [selected, setSelected] = useState<Place | null>(null),
    [favorites, setFavorites] = useState<string[]>(() => {
      const d = readStorage<unknown>("shanhai-favorites", []);
      return Array.isArray(d) ? d.filter((x) => typeof x === "string") : [];
    }),
    [checkins, setCheckins] = useState<Record<string, CheckIn>>(() => {
      const d = readStorage<unknown>("shanhai-checkins", {});
      return d && typeof d === "object" && !Array.isArray(d)
        ? Object.fromEntries(
            Object.entries(d).filter(
              ([, v]) =>
                v && typeof v.date === "string" && typeof v.note === "string",
            ),
          )
        : {};
    }),
    [layers, setLayers] = useState<Layer[]>([]),
    [layerStatuses, setLayerStatuses] = useState<Record<string, string>>({}),
    [showLayers, setShowLayers] = useState(false),
    [importing, setImporting] = useState(false),
    /** Whether Express `/api/layers` is reachable (false on static Pages). */
    [apiAvailable, setApiAvailable] = useState(false),
    [panorama, setPanorama] = useState<Layer | null>(null),
    [settings, setSettings] = useState(false),
    [terrain, setTerrain] = useState(true),
    [buildings, setBuildings] = useState(false),
    [buildingsHint, setBuildingsHint] = useState(""),
    [labels, setLabels] = useState(true),
    [status, setStatus] = useState("正在载入地球…"),
    [height, setHeight] = useState(9500000),
    [toast, setToast] = useState(""),
    [checkPlace, setCheckPlace] = useState<Place | null>(null),
    [date, setDate] = useState(""),
    [note, setNote] = useState(""),
    [mobileOpen, setMobileOpen] = useState(false),
    [pendingRecords, setPendingRecords] = useState<TravelRecordsDoc | null>(
      null,
    );
  const notify = useCallback((text: string) => setToast(text), []);
  const closeImport = useCallback(() => setImporting(false), []),
    closePanorama = useCallback(() => setPanorama(null), []),
    closeSettings = useCallback(() => setSettings(false), []),
    closeCheck = useCallback(() => setCheckPlace(null), []);
  const onBuildingsFailed = useCallback((message: string) => {
    setBuildings(false);
    setBuildingsHint(message);
    setStatus(message);
  }, []);
  const openImport = useCallback(() => {
    if (!apiAvailable) {
      notify("完整导入能力请本机 npm start");
      return;
    }
    setImporting(true);
  }, [apiAvailable, notify]);
  useEffect(() => {
    api<Layer[]>("/layers")
      .then((list) => {
        setLayers(list);
        setApiAvailable(true);
      })
      .catch(() => {
        setApiAvailable(false);
        // Static Pages (or any host without Express): no noisy toast.
        // Local `npm run dev` without the API still gets a quiet disabled import tip.
      });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    try {
      persist("shanhai-favorites", next);
      setFavorites(next);
      notify(next.includes(id) ? "已加入收藏，旅途从这里开始" : "已取消收藏");
    } catch {
      notify("浏览器存储不可用，收藏未保存");
    }
  }
  const filtered = useMemo(
    () =>
      places.filter(
        (p) =>
          (category === "全部" || p.category === category) &&
          (!query ||
            `${p.name} ${p.region} ${p.en} ${p.highlights.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (tab !== "favorites" || favorites.includes(p.id)) &&
          (tab !== "checkins" || !!checkins[p.id]),
      ),
    [category, query, tab, favorites, checkins],
  );
  const visibleIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  function select(p: Place) {
    setSelected(p);
    setShowLayers(false);
    map.current?.flyTo(p);
  }
  function openCheck(p: Place) {
    setCheckPlace(p);
    setDate(checkins[p.id]?.date || new Date().toLocaleDateString("en-CA"));
    setNote(checkins[p.id]?.note || "");
  }
  function saveCheck(remove = false) {
    if (!checkPlace) return;
    const next = { ...checkins };
    if (remove) delete next[checkPlace.id];
    else next[checkPlace.id] = { date, note: note.trim() };
    try {
      persist("shanhai-checkins", next);
      setCheckins(next);
      setCheckPlace(null);
      notify(remove ? "已移除这条打卡记录" : "打卡已保存，又多了一段山海记忆");
    } catch {
      notify("浏览器存储不可用，打卡未保存");
    }
  }
  const importPosition = selected
    ? {
        longitude: selected.lon,
        latitude: selected.lat,
        height: selected.altitude,
      }
    : map.current?.getPosition() || {
        longitude: 104.06,
        latitude: 30.67,
        height: 0,
      };
  function exportRecords() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            favorites,
            checkins,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "山海-旅行记录.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("旅行记录已导出");
  }
  /**
   * Read and validate a travel-records JSON file, then ask merge vs replace.
   * @param file Selected JSON file
   */
  async function loadTravelRecordsFile(file: File) {
    try {
      const text = await file.text();
      const parsed = parseTravelRecords(JSON.parse(text) as unknown);
      setPendingRecords(parsed);
    } catch (e) {
      notify(e instanceof Error ? e.message : "无法读取旅行记录文件");
    } finally {
      if (importRecordsRef.current) importRecordsRef.current.value = "";
    }
  }
  /**
   * Apply pending import into localStorage keys `shanhai-favorites` / `shanhai-checkins`.
   * @param mode merge keeps local ids; replace overwrites both stores
   */
  function applyTravelRecords(mode: "merge" | "replace") {
    if (!pendingRecords) return;
    const next =
      mode === "replace"
        ? {
            favorites: pendingRecords.favorites,
            checkins: pendingRecords.checkins,
          }
        : mergeTravelRecords({ favorites, checkins }, pendingRecords);
    try {
      persist("shanhai-favorites", next.favorites);
      persist("shanhai-checkins", next.checkins);
      setFavorites(next.favorites);
      setCheckins(next.checkins);
      setPendingRecords(null);
      notify(
        mode === "replace"
          ? "旅行记录已替换"
          : "旅行记录已合并到本地收藏与打卡",
      );
    } catch {
      notify("浏览器存储不可用，导入未保存");
    }
  }
  const onLayerStatus = useCallback(
    (id: string, value: string) =>
      setLayerStatuses((s) => (s[id] === value ? s : { ...s, [id]: value })),
    [],
  );
  return (
    <main className="app">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <header className="brand">
          <div className="brand-icon">
            <Mountain size={43} strokeWidth={1.5} />
          </div>
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelected(null);
                setShowLayers(false);
                map.current?.home();
              }}
            >
              山海 <span>EARTH</span>
            </a>
            <p>让足迹，连成世界</p>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileOpen(false)}
            aria-label="收起面板"
          >
            <X />
          </button>
        </header>
        <div className="search-wrap">
          <Search size={18} />
          <input
            aria-label="搜索目的地"
            placeholder="搜索目的地、城市"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setShowLayers(false);
            }}
          />
          {query ? (
            <button
              className="inline-icon"
              aria-label="清除搜索"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          ) : (
            <SlidersHorizontal size={16} />
          )}
        </div>
        <nav className="main-tabs" aria-label="目的地分类">
          {(
            [
              { id: "explore", label: "探索", icon: Compass },
              { id: "favorites", label: "收藏", icon: Heart },
              { id: "checkins", label: "打卡", icon: MapPin },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id && !showLayers ? "active" : ""}
              onClick={() => {
                setTab(id);
                setSelected(null);
                setShowLayers(false);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "favorites" && favorites.length > 0 && (
                <sup>{favorites.length}</sup>
              )}
              {id === "checkins" && Object.keys(checkins).length > 0 && (
                <sup>{Object.keys(checkins).length}</sup>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-scroll">
          {showLayers ? (
            <LayersPanel
              layers={layers}
              statuses={layerStatuses}
              onChange={setLayers}
              onFocus={(l) => map.current?.focusLayer(l)}
              onPanorama={setPanorama}
              onImport={openImport}
              importEnabled={apiAvailable}
              onBack={() => setShowLayers(false)}
              notify={notify}
            />
          ) : selected ? (
            <PlaceDetail
              key={selected.id}
              place={selected}
              favorite={favorites.includes(selected.id)}
              checkin={checkins[selected.id]}
              onBack={() => setSelected(null)}
              onFavorite={() => toggleFavorite(selected.id)}
              onCheckin={() => openCheck(selected)}
              onFly={() => {
                map.current?.flyTo(selected);
                setMobileOpen(false);
              }}
              onImport={openImport}
              importEnabled={apiAvailable}
            />
          ) : (
            <div className="destinations">
              <div className="section-title">
                <h1>
                  {tab === "favorites"
                    ? "想去的远方"
                    : tab === "checkins"
                      ? "我的山海足迹"
                      : "发现中国"}
                </h1>
                <span>
                  {filtered.length} 个目的地
                  <ChevronRight size={13} />
                </span>
              </div>
              <div className="category-filters">
                {categories.map((c) => (
                  <button
                    key={c}
                    className={c === category ? "active" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="destination-list">
                {filtered.map((p) => (
                  <article className="destination" key={p.id}>
                    <button
                      className="destination-main"
                      onClick={() => select(p)}
                    >
                      <img
                        src={publicUrl(p.image)}
                        alt={p.name}
                        loading="lazy"
                      />
                      <span className="destination-text">
                        <strong>{p.name}</strong>
                        <span className="destination-location">
                          <MapPin size={12} />
                          {p.region}
                        </span>
                        <span className={`category-tag category-${p.category}`}>
                          <span />
                          {p.category}
                        </span>
                        {checkins[p.id] && (
                          <span className="been-there">
                            <Check size={11} />
                            {checkins[p.id].date}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      className={`favorite-button ${favorites.includes(p.id) ? "saved" : ""}`}
                      aria-label={`${favorites.includes(p.id) ? "取消收藏" : "收藏"}${p.name}`}
                      onClick={() => toggleFavorite(p.id)}
                    >
                      <Heart
                        size={18}
                        fill={
                          favorites.includes(p.id) ? "currentColor" : "none"
                        }
                        strokeWidth={1.5}
                      />
                    </button>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  {tab === "favorites" ? (
                    <Heart size={35} />
                  ) : tab === "checkins" ? (
                    <MapPin size={35} />
                  ) : (
                    <Search size={35} />
                  )}
                  <h3>
                    {query
                      ? "暂时没有找到这个目的地"
                      : tab === "favorites"
                        ? "收藏下一站的期待"
                        : tab === "checkins"
                          ? "第一段旅途，从这里开始"
                          : "这个分类暂时没有目的地"}
                  </h3>
                  <p>
                    {query
                      ? "试试景点名称、省份或城市。"
                      : "打开景点详情，收藏想去的地方，记录已经走过的风景。"}
                  </p>
                  {(category !== "全部" || query) && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setQuery("");
                        setCategory("全部");
                      }}
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="sidebar-footer">
          <button
            className="outline-button full-width"
            onClick={openImport}
            disabled={!apiAvailable}
            title={
              apiAvailable ? undefined : "完整导入能力请本机 npm start"
            }
          >
            <Upload size={18} />
            导入我的内容
          </button>
          {!apiAvailable && (
            <p className="import-disabled-tip">完整导入能力请本机 npm start</p>
          )}
          <button
            className={`layers-button ${showLayers ? "active" : ""}`}
            onClick={() => {
              setShowLayers(!showLayers);
              setSelected(null);
            }}
          >
            <Layers size={20} />
            <span>我的图层</span>
            <small>{layers.length}</small>
            <ChevronRight size={17} />
          </button>
        </footer>
      </aside>
      <section className="map-area">
        <Globe
          ref={map}
          selected={selected}
          visibleIds={visibleIds}
          layers={layers}
          onSelect={select}
          onPanorama={setPanorama}
          onStatus={setStatus}
          onLayerStatus={onLayerStatus}
          onBuildingsFailed={onBuildingsFailed}
          onCamera={setHeight}
          terrain={terrain}
          buildings={buildings}
          labels={labels}
        />
        <div className="map-top">
          <button
            className="mobile-menu icon-button"
            aria-label="打开探索面板"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </button>
          <button
            className="breadcrumb"
            onClick={() => {
              map.current?.home();
              setSelected(null);
            }}
          >
            <Globe2 size={16} />
            <strong>中国</strong>
            <span>/</span>
            <span>{selected?.name || "探索世界"}</span>
          </button>
          <button
            className="settings-button icon-button"
            aria-label="地图设置"
            onClick={() => setSettings(true)}
          >
            <Settings2 size={20} />
          </button>
        </div>
        <div className="map-tools">
          <button
            className="compass-button"
            aria-label="朝向正北"
            onClick={() => map.current?.north()}
          >
            <span>N</span>
            <Navigation2 size={30} fill="#ef866f" strokeWidth={0} />
          </button>
          <div className="zoom-tools">
            <button aria-label="放大地图" onClick={() => map.current?.zoom(1)}>
              <Plus size={23} />
            </button>
            <span />
            <button aria-label="缩小地图" onClick={() => map.current?.zoom(-1)}>
              <Minus size={23} />
            </button>
          </div>
          <button
            className="icon-button"
            aria-label="返回全球视角"
            onClick={() => map.current?.home()}
          >
            <Globe2 size={22} />
          </button>
          <button
            className="icon-button tilt-button"
            aria-label="切换倾斜视角"
            onClick={() => map.current?.tilt()}
          >
            3D
          </button>
          {selected && (
            <button
              className="icon-button"
              aria-label="重新定位选中景点"
              onClick={() => map.current?.flyTo(selected)}
            >
              <LocateFixed size={21} />
            </button>
          )}
        </div>
        <div className="map-bottom">
          <div className="map-legend">
            <span>
              <i className="nature" />
              自然风光
            </span>
            <span>
              <i className="culture" />
              人文古迹
            </span>
            <span>
              <i className="city" />
              城市漫游
            </span>
            <span className="mouse-hint">
              <Mouse size={16} />
              拖动旋转 · 滚轮缩放 · 右键倾斜
            </span>
          </div>
          <div className="altitude">
            <Mountain size={18} />
            <div>
              <small>视角高度</small>
              <strong>
                {height > 1000
                  ? (height / 1000).toLocaleString("en-US", {
                      maximumFractionDigits: 1,
                    })
                  : Math.round(height)}{" "}
                <span>{height > 1000 ? "km" : "m"}</span>
              </strong>
            </div>
          </div>
        </div>
        <div className="connection-status" title={status}>
          <i
            className={
              status.includes("失败") || status.includes("不可用")
                ? "warning"
                : ""
            }
          />
          {status}
        </div>
      </section>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            className="inline-icon"
            aria-label="关闭提示"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <Suspense
        fallback={
          <div className="modal-backdrop">
            <div className="center-message">
              <LoaderCircle className="spin" />
              正在加载…
            </div>
          </div>
        }
      >
        {importing && (
          <ImportDialog
            position={importPosition}
            onClose={closeImport}
            onImported={(l) => {
              setLayers((x) => [...x, l]);
              setShowLayers(true);
              setSelected(null);
              notify("内容已保存，正在加载到地球");
            }}
          />
        )}
        {panorama && <Panorama layer={panorama} onClose={closePanorama} />}
      </Suspense>
      {settings && (
        <Modal
          title="地图与旅行记录"
          subtitle="按你的方式，探索这颗星球。"
          onClose={closeSettings}
        >
          <div className="modal-body settings-body">
            {[
              {
                label: "三维地形",
                description: "呈现山脉、峡谷与地表起伏",
                value: terrain,
                action: setTerrain,
              },
              {
                label: "全球建筑",
                description: buildingsHint
                  ? `${buildingsHint} · 再次开启可重试。需 ion 令牌具备 OSM Buildings 资源权限。`
                  : "加载 Cesium OSM 建筑（需 ion 令牌开通 OSM Buildings 资产）",
                value: buildings,
                action: (on: boolean) => {
                  if (on) setBuildingsHint("");
                  setBuildings(on);
                },
              },
              {
                label: "景点名称",
                description: "在地图上显示目的地文字标签",
                value: labels,
                action: setLabels,
              },
            ].map((s) => (
              <div className="setting-row" key={s.label}>
                <div>
                  <strong>{s.label}</strong>
                  <p>{s.description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={s.value}
                  aria-label={s.label}
                  className={`switch ${s.value ? "on" : ""}`}
                  onClick={() => s.action(!s.value)}
                >
                  <span />
                </button>
              </div>
            ))}
            <div className="settings-info">
              <span className="service-dot" />
              {status}
              <p>
                卫星影像、地形与 OSM 建筑通过 Cesium ion
                加载。本地 `.env` 的 `CESIUM_ION_TOKEN` 经 `/api/config`
                下发；GitHub Pages 可选 Secret `VITE_CESIUM_ION_TOKEN`（未配置时保持基础地球，不报错）。令牌需具备所需资源（含
                OSM Buildings）的读取权限。
              </p>
            </div>
            <button
              className="secondary-button full-width"
              onClick={exportRecords}
            >
              <Download size={16} />
              导出收藏与打卡记录
            </button>
            <input
              ref={importRecordsRef}
              type="file"
              accept="application/json,.json"
              hidden
              aria-label="选择旅行记录 JSON"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadTravelRecordsFile(file);
              }}
            />
            <button
              className="secondary-button full-width"
              type="button"
              onClick={() => importRecordsRef.current?.click()}
            >
              <FileUp size={16} />
              导入收藏与打卡记录
            </button>
            {pendingRecords && (
              <div className="records-import-confirm">
                <p>
                  将导入收藏 {pendingRecords.favorites.length} 项、打卡{" "}
                  {Object.keys(pendingRecords.checkins).length}{" "}
                  项。请选择与本地记录的合并方式：
                </p>
                <div className="records-import-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => applyTravelRecords("merge")}
                  >
                    合并
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "将用文件内容替换当前浏览器中的全部收藏与打卡，确定吗？",
                        )
                      )
                        applyTravelRecords("replace");
                    }}
                  >
                    替换
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setPendingRecords(null)}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
            <a
              className="source-link"
              href={publicUrl("photo-sources.json")}
              target="_blank"
              rel="noreferrer"
            >
              景点照片来源 · Wikimedia <ArrowUpRight size={15} />
            </a>
          </div>
        </Modal>
      )}
      {checkPlace && (
        <Modal
          title={`在${checkPlace.name}，留下足迹`}
          subtitle="一次到访，一段属于你的记忆。"
          onClose={closeCheck}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCheck();
            }}
          >
            <div className="modal-body">
              <label>
                到访日期
                <input
                  required
                  type="date"
                  value={date}
                  max={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                旅行手记
                <textarea
                  rows={4}
                  maxLength={1000}
                  placeholder="天气、同行的人，或是让你记住这里的一瞬间…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <small className="muted">
                记录保存在当前浏览器，可在设置中导出或导入 JSON。
              </small>
            </div>
            <footer className="modal-footer">
              {checkins[checkPlace.id] ? (
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => saveCheck(true)}
                >
                  移除打卡
                </button>
              ) : (
                <span />
              )}
              <button className="primary-button">
                <Check size={16} />
                保存打卡
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </main>
  );
}
