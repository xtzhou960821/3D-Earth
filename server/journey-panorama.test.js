import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { journeyAlbumLinks, journeyStops, journeys } from "../src/data/journeys.ts";
import { places } from "../src/data/places.ts";
import { haversineKm, panoramasNearPlace } from "../src/lib/nearbyPanorama.ts";

describe("heritage journeys", () => {
  it("covers published routes and resolves every stop", () => {
    assert.equal(journeys.length, 6);
    const ids = journeys.flatMap((journey) => [...journey.placeIds]);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(places.some((place) => place.id === id));
  });

  it("shares one album page for Jinan and Qingdao", () => {
    const journey = journeys.find((item) => item.id === "jinan-qingdao-2026");
    const links = journeyAlbumLinks(journey);
    const shared = links.filter((link) => link.href.endsWith("/jinan-qingdao.html"));
    assert.equal(shared.length, 1);
    assert.match(shared[0].title, /济南/);
    assert.match(shared[0].title, /青岛/);
    assert.equal(journeyStops(journey).length, 2);
  });
});

describe("nearby panoramas", () => {
  it("attaches the Tongjiang demo to 桐江书院 and not to Qingdao", () => {
    const base = {
      kind: "panorama",
      height: 0,
      heading: 0,
      scale: 1,
      visible: true,
      createdAt: "2026-09-12T00:00:00.000Z",
      bytes: 1,
    };
    const layers = [
      {
        ...base,
        id: "demo-pano-tongjiang-academy",
        name: "桐江",
        longitude: 120.55516,
        latitude: 28.744724,
      },
      {
        ...base,
        id: "demo-pano-jiaojiang-bridge-park",
        name: "椒江",
        longitude: 121.382287,
        latitude: 28.689258,
      },
    ];
    const tongjiang = places.find((place) => place.id === "tongjiang");
    const qingdao = places.find((place) => place.id === "qingdao");
    const nearTongjiang = panoramasNearPlace(tongjiang, layers);
    assert.ok(nearTongjiang.some((layer) => layer.id.includes("tongjiang")));
    assert.equal(
      nearTongjiang.some((layer) => layer.id.includes("jiaojiang")),
      false,
    );
    assert.equal(panoramasNearPlace(qingdao, layers).length, 0);
    assert.ok(
      haversineKm(tongjiang.lon, tongjiang.lat, 120.55516, 28.744724) < 20,
    );
  });
});
