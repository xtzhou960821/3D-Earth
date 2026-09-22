import { ArrowUpRight, MapPin } from "lucide-react";
import {
  journeyAlbumLinks,
  journeyStops,
  type Journey,
} from "../data/journeys.ts";
import type { Place } from "../types.ts";

/**
 * Sidebar list of published heritage routes.
 */
export default function JourneyList({
  journeys,
  activeId,
  onOpen,
  onSelectStop,
}: {
  journeys: readonly Journey[];
  activeId: string | null;
  /** Frame the route on the globe. */
  onOpen: (journey: Journey) => void;
  /** Open one stop's place detail. */
  onSelectStop: (place: Place) => void;
}) {
  return (
    <div className="destinations">
      <div className="section-title">
        <h1>走过的线路</h1>
        <span>{journeys.length} 段旅程</span>
      </div>
      <p className="journey-lead">
        按公开相册的时间排列。点一条线路会飞到沿线城市；相册仍打开 xixia-heritage，不在这里复制照片。
      </p>
      <div className="journey-list">
        {journeys.map((journey) => {
          const open = journey.id === activeId;
          const stops = journeyStops(journey);
          const albums = journeyAlbumLinks(journey);
          return (
            <article
              key={journey.id}
              className={`journey ${open ? "open" : ""}`}
            >
              <button
                className="journey-main"
                onClick={() => onOpen(journey)}
                aria-expanded={open}
              >
                <span className="journey-period">{journey.period}</span>
                <strong>{journey.title}</strong>
                <span className="journey-summary">{journey.summary}</span>
              </button>
              {open && (
                <div className="journey-body">
                  <ol>
                    {stops.map((place, index) => (
                      <li key={place.id}>
                        <button onClick={() => onSelectStop(place)}>
                          <MapPin size={13} />
                          <span>
                            {index + 1}. {place.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div className="journey-albums">
                    {albums.map((album) => (
                      <a
                        key={album.href}
                        href={album.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        打开旅行相册 · {album.title}
                        <ArrowUpRight size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!journeys.length && (
        <div className="empty-state">
          <h3>没有符合搜索的旅程</h3>
          <p>试试城市名，例如青岛、黄山或阿里。</p>
        </div>
      )}
    </div>
  );
}
