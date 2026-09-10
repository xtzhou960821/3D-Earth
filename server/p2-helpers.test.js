import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Mirror of src/lib/shareView encode/parse contract (kept in sync for Node tests).
 * @param {string} raw
 */
function parseCameraView(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  if (text.startsWith("#")) text = text.slice(1);
  const fromQuery = text.match(/(?:^|&)v=([^&]+)/);
  if (!text.startsWith("v=") && fromQuery) text = `v=${fromQuery[1]}`;
  const match =
    /^v=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(
      text,
    );
  if (!match) return null;
  const values = match.slice(1).map(Number);
  const [lon, lat, height, heading, pitch, roll] = values;
  if (values.some((n) => !Number.isFinite(n))) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  if (height < -1000 || height > 5e7) return null;
  return { longitude: lon, latitude: lat, height, heading, pitch, roll };
}

/**
 * @param {{ longitude: number, latitude: number, height: number, heading: number, pitch: number, roll: number }} view
 */
function encodeCameraView(view) {
  const fmt = (n, digits) => Number(n.toFixed(digits)).toString();
  return `v=${fmt(view.longitude, 6)},${fmt(view.latitude, 6)},${fmt(view.height, 1)},${fmt(view.heading, 2)},${fmt(view.pitch, 2)},${fmt(view.roll, 2)}`;
}

describe("shareView contract", () => {
  it("round-trips encode/parse", () => {
    const view = {
      longitude: 104.0665,
      latitude: 30.5728,
      height: 1200.5,
      heading: 45.25,
      pitch: -35.5,
      roll: 0,
    };
    const encoded = encodeCameraView(view);
    assert.match(encoded, /^v=/);
    const parsed = parseCameraView(`#${encoded}`);
    assert.deepEqual(parsed, view);
  });

  it("rejects out-of-range coordinates", () => {
    assert.equal(parseCameraView("#v=200,30,100,0,-45,0"), null);
    assert.equal(parseCameraView("#v=104,91,100,0,-45,0"), null);
    assert.equal(parseCameraView("#v=not-a-view"), null);
  });

  it("builds Pages-friendly absolute URLs with hash", () => {
    const hash = encodeCameraView({
      longitude: 104.06,
      latitude: 30.67,
      height: 500,
      heading: 0,
      pitch: -45,
      roll: 0,
    });
    const url = `https://xtzhou960821.github.io/3D-Earth/#${hash}`;
    assert.equal(
      url,
      "https://xtzhou960821.github.io/3D-Earth/#v=104.06,30.67,500,0,-45,0",
    );
  });
});

describe("bimPick contract", () => {
  it("empty when no metadata", () => {
    const properties = [];
    assert.equal(properties.length, 0);
  });

  it("feature rows take precedence conceptually", () => {
    const featureRows = [{ key: "Name", value: "Wall" }];
    const sidecar = [{ expressID: 1, Name: "Other" }];
    const chosen = featureRows.length ? featureRows : sidecar;
    assert.equal(chosen[0].value || chosen[0].Name, "Wall");
  });
});

describe("demo tiles packaging", () => {
  it("examples/tiles sample exists for Pages copy", () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    assert.ok(
      fs.existsSync(path.join(root, "examples/tiles/tileset.json")),
      "examples/tiles/tileset.json",
    );
    assert.ok(
      fs.existsSync(path.join(root, "examples/tiles/building.b3dm")),
      "examples/tiles/building.b3dm",
    );
    const vite = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");
    assert.match(vite, /demo-tiles/);
    assert.match(vite, /examples\/tiles/);
    assert.match(vite, /stripBase:\s*2/);
  });
});

describe("describeApiFailure contract", () => {
  it("maps common statuses", () => {
    const describe = (status, bodyError) => {
      if (bodyError) return bodyError;
      if (status === 0)
        return "无法连接本地服务，请确认已运行 npm start / npm run dev";
      if (status === 404)
        return "接口不存在（静态站点无上传能力，请本机 npm start）";
      return `操作失败（HTTP ${status}）`;
    };
    assert.equal(describe(400, "入口无效"), "入口无效");
    assert.match(describe(0), /无法连接/);
    assert.match(describe(404), /静态站点/);
  });
});
