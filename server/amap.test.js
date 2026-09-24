import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cityName, fetchPlaceContext, shapePoi, wgs84ToGcj02 } from "./amap.js";

describe("wgs84 to gcj02", () => {
  it("shifts a mainland point and leaves overseas points unchanged", () => {
    const beijing = wgs84ToGcj02(116.3913, 39.9075);
    assert.ok(Math.abs(beijing.longitude - 116.3913) > 0.001);
    assert.ok(Math.abs(beijing.latitude - 39.9075) > 0.001);
    assert.ok(Math.abs(beijing.longitude - 116.3913) < 0.02);
    assert.deepEqual(wgs84ToGcj02(-0.12, 51.5), { longitude: -0.12, latitude: 51.5 });
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
