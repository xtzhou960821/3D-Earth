import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cityName,
  decodeDrivingPolyline,
  fetchPlaceContext,
  gcj02ToWgs84,
  shapePoi,
  wgs84ToGcj02,
} from "./amap.js";

describe("wgs84 to gcj02", () => {
  it("shifts a mainland point and leaves overseas points unchanged", () => {
    const beijing = wgs84ToGcj02(116.3913, 39.9075);
    assert.ok(Math.abs(beijing.longitude - 116.3913) > 0.001);
    assert.ok(Math.abs(beijing.latitude - 39.9075) > 0.001);
    assert.ok(Math.abs(beijing.longitude - 116.3913) < 0.02);
    assert.deepEqual(wgs84ToGcj02(-0.12, 51.5), { longitude: -0.12, latitude: 51.5 });
  });

  it("inverts a GCJ-02 point back to WGS84", () => {
    const gcj = { longitude: 116.973585, latitude: 36.613864 };
    const wgs = gcj02ToWgs84(gcj.longitude, gcj.latitude);
    const back = wgs84ToGcj02(wgs.longitude, wgs.latitude);
    assert.ok(Math.abs(back.longitude - gcj.longitude) < 0.00001);
    assert.ok(Math.abs(back.latitude - gcj.latitude) < 0.00001);
  });
});

describe("driving polyline", () => {
  it("turns GCJ-02 vertices into WGS84 and keeps both ends", () => {
    const path = decodeDrivingPolyline("116.973585,36.613864;120.398303,36.054584", 10);
    assert.equal(path.length, 2);
    assert.ok(path[0].longitude < 116.973585);
    assert.ok(path[1].longitude < 120.398303);
  });
});

describe("place context shaping", () => {
  it("uses the province when the city field is empty", () => {
    assert.equal(cityName({ city: [], province: "北京市" }), "北京市");
    assert.equal(cityName({ city: "青岛市", province: "山东省" }), "青岛市");
  });

  it("keeps only name, address, distance, and coordinates", () => {
    const poi = shapePoi({
      name: "蓝港海鲜厨房",
      address: "奥帆中心",
      distance: "420.4",
      location: "120.398000,36.055000",
      biz_ext: { rating: "4.8", cost: "120" },
    });
    assert.deepEqual(poi, {
      name: "蓝港海鲜厨房",
      address: "奥帆中心",
      distance: 420,
      longitude: 120.398,
      latitude: 36.055,
    });
  });

  it("does not call the network when the key is missing", async () => {
    let called = false;
    const result = await fetchPlaceContext({
      key: "",
      longitude: 120.398,
      latitude: 36.055,
      fetchImpl: async () => {
        called = true;
        throw new Error("should not fetch");
      },
    });
    assert.equal(called, false);
    assert.deepEqual(result, { configured: false });
  });
});
