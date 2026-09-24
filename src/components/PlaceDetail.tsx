import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  MapPin,
  Clock,
  Navigation,
  Check,
  BedDouble,
  Utensils,
  ExternalLink,
  Camera,
  Images,
} from "lucide-react";
import type { CheckIn, Layer, Place } from "../types";
import { hotels } from "../data/hotels";
import { publicUrl } from "../lib/publicUrl";
import { api } from "../lib/api";
import { getHeritageAlbumUrl, getRelatedHeritageAlbums } from "../data/heritageAlbums";

/** 高德返回的附近商户，不含评分和价格。 */
interface LivePoi {
  name: string;
  address: string;
  distance: number | null;
  longitude: number | null;
  latitude: number | null;
}

/** 城市预报与 1.5 公里内餐饮、酒店名录。 */
interface PlaceContext {
  configured: boolean;
  city?: string;
  weather?: {
    date: string;
    dayweather: string;
    nightweather: string;
    daytemp: string;
    nighttemp: string;
  } | null;
  dining?: LivePoi[];
  lodging?: LivePoi[];
}

/**
 * 打开高德标注。坐标已是 GCJ-02。
 * @param poi 商户
 */
function amapMarker(poi: LivePoi) {
  if (poi.longitude == null || poi.latitude == null) {
    return `https://uri.amap.com/search?keyword=${encodeURIComponent(poi.name)}&src=shanhai-earth&view=map`;
  }
  return `https://uri.amap.com/marker?position=${poi.longitude},${poi.latitude}&name=${encodeURIComponent(poi.name)}&src=shanhai-earth&coordinate=gaode&callnative=0`;
}

/**
 * @param meters 距离（米）
 */
function formatDistance(meters: number | null) {
  if (meters == null) return "";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} 公里`;
  return `${meters} 米`;
}

/**
 * Destination detail panel: intro, nearby lodging, optional heritage album link/iframe.
 */
export default function PlaceDetail({
  place,
  favorite,
  checkin,
  onBack,
  onFavorite,
  onCheckin,
  onFly,
  onImport,
  importEnabled = true,
  nearbyPanoramas = [],
  onOpenPanorama,
}: {
  place: Place;
  favorite: boolean;
  checkin?: CheckIn;
  onBack: () => void;
  onFavorite: () => void;
  onCheckin: () => void;
  onFly: () => void;
  onImport: () => void;
  /** False on static Pages (no Express upload API). */
  importEnabled?: boolean;
  /** Panorama layers within 20 km of this place. */
  nearbyPanoramas?: Layer[];
  /** Open an existing panorama viewer for a nearby layer. */
  onOpenPanorama?: (layer: Layer) => void;
}) {
  const [tab, setTab] = useState<"intro" | "nearby">("intro");
  const [live, setLive] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; data: PlaceContext }
  >({ status: "idle" });
  const [showAlbum, setShowAlbum] = useState(false);
  /** `trying` loads iframe; `blocked` falls back to open-only card. */
  const [embedState, setEmbedState] = useState<"idle" | "trying" | "ok" | "blocked">(
    "idle",
  );
  const albumUrl = getHeritageAlbumUrl(place.id);
  const relatedAlbums = getRelatedHeritageAlbums(place.id);
  const search = (q: string) =>
    `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent(place.region.split(" · ")[1])}&view=map&src=shanhai-earth`;

  useEffect(() => {
    setShowAlbum(false);
    setEmbedState("idle");
    setLive({ status: "idle" });
  }, [place.id]);

  useEffect(() => {
    if (tab !== "nearby" || !importEnabled) return;
    let cancel = false;
    setLive({ status: "loading" });
    api<PlaceContext>(
      `/place-context?lon=${encodeURIComponent(place.lon)}&lat=${encodeURIComponent(place.lat)}`,
    )
      .then((data) => {
        if (!cancel) setLive({ status: "ready", data });
      })
      .catch(() => {
        if (!cancel) setLive({ status: "error" });
      });
    return () => {
      cancel = true;
    };
  }, [tab, place.id, place.lon, place.lat, importEnabled]);

  useEffect(() => {
    if (!showAlbum || embedState !== "trying") return;
    /** Cross-origin X-Frame blocks often still fire load; treat long blank as blocked. */
    const timer = window.setTimeout(() => {
      setEmbedState((s) => (s === "trying" ? "blocked" : s));
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [showAlbum, embedState, albumUrl]);

  return (
    <div className="detail-view">
      <div className="detail-photo">
        <img src={publicUrl(place.image)} alt={place.name} />
        <div className="detail-photo-shade" />
        <button
          className="photo-back icon-button"
          onClick={onBack}
          aria-label="返回目的地列表"
        >
          <ArrowLeft />
        </button>
        <button
          className={`photo-save icon-button ${favorite ? "saved" : ""}`}
          onClick={onFavorite}
          aria-label={favorite ? "取消收藏" : "收藏景点"}
        >
          <Heart fill={favorite ? "currentColor" : "none"} />
        </button>
        <div className="detail-title">
          <span>{place.en}</span>
          <h1>{place.name}</h1>
          <p>
            <MapPin size={14} />
            {place.region}
          </p>
        </div>
      </div>
      <div className="detail-content">
        <div className="detail-actions">
          <button className="primary-button" onClick={onFly}>
            <Navigation size={16} />
            飞到这里
          </button>
          <button
            className={`secondary-button ${checkin ? "checked" : ""}`}
            onClick={onCheckin}
          >
            {checkin ? <Check size={16} /> : <MapPin size={16} />}
            {checkin ? "已打卡" : "记录打卡"}
          </button>
        </div>
        {checkin && (
          <div className="checkin-summary">
            <Check size={14} />
            <div>
              <span>{checkin.date} 来过这里</span>
              {checkin.note && <p>{checkin.note}</p>}
            </div>
          </div>
        )}
        <div className="detail-tabs">
          <button
            className={tab === "intro" ? "active" : ""}
            onClick={() => setTab("intro")}
          >
            目的地介绍
          </button>
          <button
            className={tab === "nearby" ? "active" : ""}
            onClick={() => setTab("nearby")}
          >
            周边酒店与美食
          </button>
        </div>
        {tab === "intro" ? (
          <>
            <p className="description">{place.description}</p>
            <div className="highlights">
              {place.highlights.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {albumUrl && (
              <div className="heritage-block">
                <a
                  className="heritage-link"
                  href={albumUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="round-icon">
                    <Images size={20} />
                  </span>
                  <span>
                    <strong>打开旅行相册</strong>
                    <small>托管于公开站 xixia-heritage（新标签页）</small>
                  </span>
                  <ArrowUpRight size={18} />
                </a>
                <button
                  type="button"
                  className="heritage-embed-toggle"
                  onClick={() => {
                    if (showAlbum) {
                      setShowAlbum(false);
                      setEmbedState("idle");
                    } else {
                      setShowAlbum(true);
                      setEmbedState("idle");
                    }
                  }}
                  aria-expanded={showAlbum}
                >
                  {showAlbum ? "收起预览" : "预览相册卡片"}
                </button>
                {showAlbum && (
                  <div className="heritage-fallback">
                    <img
                      src={publicUrl(place.image)}
                      alt=""
                      className="heritage-fallback-thumb"
                    />
                    <div>
                      <strong>{place.name} · 旅行相册</strong>
                      <p>
                        内嵌预览可能被相册站点的安全策略拦截；优先在新标签页打开完整相册。
                      </p>
                      <a href={albumUrl} target="_blank" rel="noreferrer">
                        打开旅行相册 <ArrowUpRight size={14} />
                      </a>
                      {embedState === "idle" && (
                        <button
                          type="button"
                          className="heritage-embed-try"
                          onClick={() => setEmbedState("trying")}
                        >
                          仍尝试内嵌（可能失败）
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {showAlbum && embedState === "blocked" && (
                  <p className="heritage-embed-error" role="status">
                    内嵌被拦截或加载失败，请使用「打开旅行相册」。
                  </p>
                )}
                {showAlbum &&
                  (embedState === "trying" || embedState === "ok") && (
                    <iframe
                      className="heritage-iframe"
                      title={`${place.name}旅行相册`}
                      src={albumUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      onLoad={(e) => {
                        try {
                          const win = e.currentTarget.contentWindow;
                          if (!win) {
                            setEmbedState("blocked");
                            return;
                          }
                          const href = win.location.href;
                          if (!href || href === "about:blank") {
                            setEmbedState("blocked");
                            return;
                          }
                          setEmbedState("ok");
                        } catch {
                          /** Cross-origin document loaded → framing allowed. */
                          setEmbedState("ok");
                        }
                      }}
                      onError={() => setEmbedState("blocked")}
                    />
                  )}
                {relatedAlbums.length > 0 && (
                  <p className="heritage-related">
                    <span>阿里大环线公开子册：</span>
                    {relatedAlbums.map((item, i) => (
                      <span key={item.href}>
                        {i > 0 ? " · " : ""}
                        <a href={item.href} target="_blank" rel="noreferrer">
                          {item.title}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
            <section className="hours">
              <div>
                <Clock size={18} />
                <h3>开放时间</h3>
              </div>
              <strong>{place.hours}</strong>
              <p>{place.hoursNote}</p>
              <a href={place.source} target="_blank" rel="noreferrer">
                查看官方信息 <ArrowUpRight size={14} />
              </a>
              {place.verified ? (
                <small>资料核对：{place.verified} · 非实时营业状态</small>
              ) : (
                <small>尚未逐条核对开放时间，以官方当日公告为准。</small>
              )}
            </section>
            {nearbyPanoramas.map((layer) => (
              <button
                key={layer.id}
                className="panorama-link"
                onClick={() => onOpenPanorama?.(layer)}
              >
                <span className="round-icon">
                  <Camera size={20} />
                </span>
                <span>
                  <strong>打开720全景</strong>
                  <small>{layer.name}</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
            <button
              className="panorama-link"
              onClick={onImport}
              disabled={!importEnabled}
              title={
                importEnabled ? undefined : "完整导入能力请本机 npm start"
              }
            >
              <span className="round-icon">
                <Camera size={20} />
              </span>
              <span>
                <strong>换个视角，看这里</strong>
                <small>
                  {importEnabled
                    ? "导入你拍摄的720全景"
                    : "完整导入能力请本机 npm start"}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          </>
        ) : (
          <div className="nearby">
            <p className="nearby-note">
              酒店资料供出行参考；价格、房态与距离请在酒店官网或地图中核实。
            </p>
            {!importEnabled && (
              <p className="nearby-note">实时天气与周边名录需本机 npm start。</p>
            )}
            {importEnabled && live.status === "loading" && (
              <p className="nearby-note">正在查询城市预报与周边名录…</p>
            )}
            {importEnabled && live.status === "error" && (
              <p className="nearby-note">
                周边实时信息暂时无法获取，仍可使用下方搜索链接。
              </p>
            )}
            {importEnabled && live.status === "ready" && !live.data.configured && (
              <p className="nearby-note">
                未配置高德 Web 服务 Key，仍可使用下方搜索链接。
              </p>
            )}
            {importEnabled && live.status === "ready" && live.data.configured && (
              <div className="nearby-live">
                {live.data.weather && (
                  <p className="nearby-note">
                    {live.data.city || place.region}今日预报：白天
                    {live.data.weather.dayweather} {live.data.weather.daytemp}°C，夜间
                    {live.data.weather.nightweather} {live.data.weather.nighttemp}°C。
                    这是城市预报，不是景区实时开放状态。
                  </p>
                )}
                {(live.data.dining?.length ?? 0) > 0 && (
                  <>
                    <h3>
                      <Utensils size={18} />
                      附近餐饮
                    </h3>
                    {live.data.dining?.map((poi) => (
                      <a
                        className="nearby-row"
                        key={`dining-${poi.name}-${poi.distance}`}
                        href={amapMarker(poi)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>
                          <strong>{poi.name}</strong>
                          <small>
                            {[formatDistance(poi.distance), poi.address]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        </span>
                        <ExternalLink size={15} />
                      </a>
                    ))}
                  </>
                )}
                {(live.data.lodging?.length ?? 0) > 0 && (
                  <>
                    <h3>
                      <BedDouble size={18} />
                      附近酒店
                    </h3>
                    {live.data.lodging?.map((poi) => (
                      <a
                        className="nearby-row"
                        key={`lodging-${poi.name}-${poi.distance}`}
                        href={amapMarker(poi)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>
                          <strong>{poi.name}</strong>
                          <small>
                            {[formatDistance(poi.distance), poi.address]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        </span>
                        <ExternalLink size={15} />
                      </a>
                    ))}
                  </>
                )}
                <p className="nearby-note">
                  名录来自高德，约 1.5 公里内。不含评分、价格或景区开放状态。
                </p>
              </div>
            )}
            <h3>
              <BedDouble size={18} />
              住宿参考
            </h3>
            {hotels[place.id] && (
              <a
                className="nearby-row hotel-reference"
                href={hotels[place.id].source}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <strong>{hotels[place.id].name}</strong>
                  <small>{hotels[place.id].area}</small>
                  <small>查看酒店资料来源</small>
                </span>
                <ExternalLink size={15} />
              </a>
            )}
            {place.stay.map((s) => (
              <a
                className="nearby-row"
                key={s}
                href={search(s)}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <strong>{s}</strong>
                  <small>查询附近酒店与房源</small>
                </span>
                <ExternalLink size={15} />
              </a>
            ))}
            <h3>
              <Utensils size={18} />
              当地味道
            </h3>
            {place.food.map((s) => (
              <a
                className="nearby-row"
                key={s}
                href={search(place.name + " " + s)}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <strong>{s}</strong>
                  <small>查找供应这道美食的餐厅</small>
                </span>
                <ExternalLink size={15} />
              </a>
            ))}
            <p className="nearby-note">
              各条酒店资料以对应官网为准。上方名录与美食链接均不含实时房价、评分或房态。
            </p>
          </div>
        )}
        <div className="detail-coordinates">
          {place.lat.toFixed(4)}° N <span>/</span> {place.lon.toFixed(4)}° E
        </div>
      </div>
    </div>
  );
}
