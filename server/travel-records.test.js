/**
 * Contract tests for travel-records JSON (mirrors src/lib/travelRecords.ts).
 * Keeps the import/export schema pinned without a TS test runner.
 */
import test from "node:test";
import assert from "node:assert/strict";

/**
 * @param {unknown} raw
 */
function parseTravelRecords(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("文件格式无效：需要包含 version / favorites / checkins 的对象");
  }
  const doc = /** @type {Record<string, unknown>} */ (raw);
  if (doc.version !== 1) {
    throw new Error("不支持的记录版本（仅支持 version: 1）");
  }
  if (!Array.isArray(doc.favorites) || !doc.favorites.every((x) => typeof x === "string")) {
    throw new Error("favorites 必须是字符串数组");
  }
  if (!doc.checkins || typeof doc.checkins !== "object" || Array.isArray(doc.checkins)) {
    throw new Error("checkins 必须是对象");
  }
  const checkins = {};
  for (const [id, value] of Object.entries(
    /** @type {Record<string, unknown>} */ (doc.checkins),
  )) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`打卡记录 ${id} 格式无效`);
    }
    const row = /** @type {Record<string, unknown>} */ (value);
    if (typeof row.date !== "string" || typeof row.note !== "string") {
      throw new Error(`打卡记录 ${id} 需要 date 与 note 字符串`);
    }
    checkins[id] = { date: row.date, note: row.note };
  }
  return {
    version: 1,
    favorites: [...new Set(/** @type {string[]} */ (doc.favorites))],
    checkins,
  };
}

/**
 * @param {{ favorites: string[]; checkins: Record<string, { date: string; note: string }> }} current
 * @param {{ favorites: string[]; checkins: Record<string, { date: string; note: string }> }} incoming
 */
function mergeTravelRecords(current, incoming) {
  return {
    favorites: [...new Set([...current.favorites, ...incoming.favorites])],
    checkins: { ...current.checkins, ...incoming.checkins },
  };
}

test("accepts version-1 travel records export shape", () => {
  const doc = parseTravelRecords({
    version: 1,
    exportedAt: "2026-09-10T00:00:00.000Z",
    favorites: ["huangshan", "huangshan", "potala"],
    checkins: { huangshan: { date: "2026-03-29", note: "云海" } },
  });
  assert.deepEqual(doc.favorites, ["huangshan", "potala"]);
  assert.equal(doc.checkins.huangshan.note, "云海");
});

test("rejects bad version or checkin rows", () => {
  assert.throws(() => parseTravelRecords({ version: 2, favorites: [], checkins: {} }));
  assert.throws(() =>
    parseTravelRecords({
      version: 1,
      favorites: [],
      checkins: { x: { date: 1, note: "a" } },
    }),
  );
});

test("merge prefers imported checkin for same place id", () => {
  const merged = mergeTravelRecords(
    {
      favorites: ["a"],
      checkins: { a: { date: "2020-01-01", note: "old" } },
    },
    {
      favorites: ["b"],
      checkins: { a: { date: "2026-01-01", note: "new" } },
    },
  );
  assert.deepEqual(merged.favorites, ["a", "b"]);
  assert.equal(merged.checkins.a.note, "new");
});
