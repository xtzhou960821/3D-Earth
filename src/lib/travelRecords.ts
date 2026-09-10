import type { CheckIn } from "../types";

/** Exported travel-records document (favorites + check-ins). */
export interface TravelRecordsDoc {
  version: number;
  exportedAt?: string;
  favorites: string[];
  checkins: Record<string, CheckIn>;
}

/**
 * Validate a parsed travel-records JSON payload.
 * @param raw Unknown JSON value
 * @returns Normalized document
 */
export function parseTravelRecords(raw: unknown): TravelRecordsDoc {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("文件格式无效：需要包含 version / favorites / checkins 的对象");
  }
  const doc = raw as Record<string, unknown>;
  if (doc.version !== 1) {
    throw new Error("不支持的记录版本（仅支持 version: 1）");
  }
  if (!Array.isArray(doc.favorites) || !doc.favorites.every((x) => typeof x === "string")) {
    throw new Error("favorites 必须是字符串数组");
  }
  if (!doc.checkins || typeof doc.checkins !== "object" || Array.isArray(doc.checkins)) {
    throw new Error("checkins 必须是对象");
  }
  const checkins: Record<string, CheckIn> = {};
  for (const [id, value] of Object.entries(doc.checkins as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`打卡记录 ${id} 格式无效`);
    }
    const row = value as Record<string, unknown>;
    if (typeof row.date !== "string" || typeof row.note !== "string") {
      throw new Error(`打卡记录 ${id} 需要 date 与 note 字符串`);
    }
    checkins[id] = { date: row.date, note: row.note };
  }
  return {
    version: 1,
    exportedAt: typeof doc.exportedAt === "string" ? doc.exportedAt : undefined,
    favorites: [...new Set(doc.favorites as string[])],
    checkins,
  };
}

/**
 * Merge imported favorites/check-ins into existing local data.
 * Imported check-in entries overwrite the same place id.
 * @param current Favorites and check-ins already in localStorage
 * @param incoming Validated import document
 */
export function mergeTravelRecords(
  current: { favorites: string[]; checkins: Record<string, CheckIn> },
  incoming: TravelRecordsDoc,
): { favorites: string[]; checkins: Record<string, CheckIn> } {
  return {
    favorites: [...new Set([...current.favorites, ...incoming.favorites])],
    checkins: { ...current.checkins, ...incoming.checkins },
  };
}
