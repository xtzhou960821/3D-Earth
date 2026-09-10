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
import type { CheckIn, Place } from "../types";
import { hotels } from "../data/hotels";
import { publicUrl } from "../lib/publicUrl";
import { getHeritageAlbumUrl } from "../data/heritageAlbums";

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
}) {
  const [tab, setTab] = useState<"intro" | "nearby">("intro");
  const [showAlbum, setShowAlbum] = useState(false);
  /** `trying` loads iframe; `blocked` falls back to open-only card. */
  const [embedState, setEmbedState] = useState<"idle" | "trying" | "ok" | "blocked">(
    "idle",
  );
  const albumUrl = getHeritageAlbumUrl(place.id);
  const search = (q: string) =>
    `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent(place.region.split(" · ")[1])}&view=map&src=shanhai-earth`;

  useEffect(() => {
    setShowAlbum(false);
    setEmbedState("idle");
  }, [place.id]);

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
              {place.verified && (
                <small>资料核对：{place.verified} · 非实时营业状态</small>
              )}
            </section>
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
                    ? "导入你拍摄的 720° 全景"
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
              酒店资料核对：2026-09-05。美食链接为地图搜索；当前不提供实时房价、评分或房态。
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
