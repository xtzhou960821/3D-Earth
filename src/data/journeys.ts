import { places } from "./places.ts";
import type { Place } from "../types.ts";
import {
  getHeritageAlbumUrl,
  getRelatedHeritageAlbums,
} from "./heritageAlbums.ts";

/**
 * Travel routes already published on xixia-heritage.
 * Place ids follow visit order. Stops that share one album page stay in one route.
 */
export interface Journey {
  id: string;
  title: string;
  /** Display period, matching the public album. */
  period: string;
  summary: string;
  /** Earth place ids in visit order. */
  placeIds: readonly string[];
}

/**
 * Newest first. Dates come from the public album index, not from check-in storage.
 */
export const journeys: readonly Journey[] = [
  {
    id: "jinan-qingdao-2026",
    title: "济南 · 青岛",
    period: "2026.9.19–21",
    summary: "济南大学与芙蓉街，随后一夜青岛奥帆。两城共用一页相册。",
    placeIds: ["jinan", "qingdao"],
  },
  {
    id: "tongjiang-2026",
    title: "台州仙居",
    period: "2026.9.12",
    summary: "仙居桐江书院。",
    placeIds: ["tongjiang"],
  },
  {
    id: "huizhou-2026",
    title: "徽州皖南",
    period: "2026.3.29–30",
    summary: "黄山与婺源。",
    placeIds: ["huangshan", "wuyuan"],
  },
  {
    id: "northwest-2026",
    title: "大西北",
    period: "2026",
    summary: "贺兰山、西夏陵、宝塔山、壶口瀑布。",
    placeIds: ["helan", "xixia", "baota", "hukou"],
  },
  {
    id: "chengdu-2024",
    title: "天府成都",
    period: "2024 春节",
    summary: "成都。",
    placeIds: ["chengdu"],
  },
  {
    id: "ali-2024",
    title: "西藏阿里大环线",
    period: "2024.5–6",
    summary: "拉萨与阿里。班公湖、圣湖雪山、扎达土林在公开子册。",
    placeIds: ["potala", "ali"],
  },
];

/**
 * Find a published route by id.
 * @param id Journey id
 */
export function getJourney(id: string): Journey | undefined {
  return journeys.find((journey) => journey.id === id);
}

/**
 * Resolve route stops that exist in the Earth catalog.
 * @param journey Published route
 */
export function journeyStops(journey: Journey): Place[] {
  return journey.placeIds
    .map((id) => places.find((place) => place.id === id))
    .filter((place): place is Place => Boolean(place));
}

/**
 * Album links for one route. Stops that share a page collapse to a single link.
 * @param journey Published route
 */
export function journeyAlbumLinks(
  journey: Journey,
): { title: string; href: string }[] {
  const links: { title: string; href: string }[] = [];
  const seen = new Set<string>();
  /**
   * @param title Link label
   * @param href Absolute album URL
   */
  const add = (title: string, href: string) => {
    if (seen.has(href)) return;
    seen.add(href);
    links.push({ title, href });
  };
  for (const id of journey.placeIds) {
    const href = getHeritageAlbumUrl(id);
    const names = journey.placeIds
      .filter((stopId) => getHeritageAlbumUrl(stopId) === href)
      .map((stopId) => places.find((place) => place.id === stopId)?.name)
      .filter((name): name is string => Boolean(name));
    if (href) add(names.join(" · ") || journey.title, href);
    for (const related of getRelatedHeritageAlbums(id))
      add(related.title, related.href);
  }
  return links;
}
