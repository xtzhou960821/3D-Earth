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
} from "lucide-react";
import { Globe } from "./components/Globe";
import PlaceDetail from "./components/PlaceDetail";
import LayersPanel from "./components/LayersPanel";
import Modal from "./components/Modal";
import { places } from "./data/places";
import type { Category, CheckIn, Layer, MapHandle, Place } from "./types";
import { api, persist, readStorage } from "./lib/api";
const ImportDialog = lazy(() => import("./components/ImportDialog"));
const Panorama = lazy(() => import("./components/Panorama"));
const categories = ["全部", "自然风光", "人文古迹", "城市漫游"] as const;
export default function App() {
  const map = useRef<MapHandle>(null);
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
    [panorama, setPanorama] = useState<Layer | null>(null),
    [settings, setSettings] = useState(false),
    [terrain, setTerrain] = useState(true),
    [buildings, setBuildings] = useState(false),
    [labels, setLabels] = useState(true),
    [status, setStatus] = useState("正在载入地球…"),
    [height, setHeight] = useState(9500000),
    [toast, setToast] = useState(""),
    [checkPlace, setCheckPlace] = useState<Place | null>(null),
    [date, setDate] = useState(""),
    [note, setNote] = useState(""),
    [mobileOpen, setMobileOpen] = useState(false);
  const notify = useCallback((text: string) => setToast(text), []);
  const closeImport = useCallback(() => setImporting(false), []),
    closePanorama = useCallback(() => setPanorama(null), []),
    closeSettings = useCallback(() => setSettings(false), []),
    closeCheck = useCallback(() => setCheckPlace(null), []);
  useEffect(() => {
    api<Layer[]>("/layers")
      .then(setLayers)
      .catch(() => notify("内容库连接失败，请确认本地服务已启动"));
  }, [notify]);
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
              onImport={() => setImporting(true)}
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
              onImport={() => setImporting(true)}
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
                      <img src={p.image} alt={p.name} loading="lazy" />
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
            onClick={() => setImporting(true)}
          >
            <Upload size={18} />
            导入我的内容
          </button>
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
                description: "加载 Cesium OSM 建筑，近距离可见",
                value: buildings,
                action: setBuildings,
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
                卫星影像与地形通过 Cesium ion
                加载。浏览器使用客户端访问令牌；本地文件保存在此电脑。
              </p>
            </div>
            <button
              className="secondary-button full-width"
              onClick={exportRecords}
            >
              <Download size={16} />
              导出收藏与打卡记录
            </button>
            <a
              className="source-link"
              href="/photo-sources.json"
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
                记录保存在当前浏览器，可在设置中导出。
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
