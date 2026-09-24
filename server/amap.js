/**
 * 高德 Web 服务（服务端 Key）。地球坐标按 WGS84 转成 GCJ-02 再查询。
 * 只返回城市预报和商户名录，不承诺票价、评分或景区实时开放。
 */

const AMAP_BASE = "https://restapi.amap.com";
const A = 6378245;
const EE = 0.006693421622965943;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function inRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * @param {number} lon
 * @param {number} lat
 */
function outsideChina(lon, lat) {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/**
 * @param {number} x
 * @param {number} y
 */
function deltaLat(x, y) {
  let value =
    -100 +
    2 * x +
    3 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  value += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  value += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  value +=
    ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3;
  return value;
}

/**
 * @param {number} x
 * @param {number} y
 */
function deltaLon(x, y) {
  let value = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  value += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  value += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  value +=
    ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return value;
}

/**
 * WGS84 转 GCJ-02。境外坐标原样返回。
 * @param {number} lon
 * @param {number} lat
 */
export function wgs84ToGcj02(lon, lat) {
  if (outsideChina(lon, lat)) return { longitude: lon, latitude: lat };
  const dLat = deltaLat(lon - 105, lat - 35);
  const dLon = deltaLon(lon - 105, lat - 35);
  const rad = (lat / 180) * Math.PI;
  let magic = Math.sin(rad);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const latitude = lat + (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  const longitude = lon + (dLon * 180) / ((A / sqrtMagic) * Math.cos(rad) * Math.PI);
  return { longitude, latitude };
}

/**
 * GCJ-02 转回 WGS84。用正向公式迭代，避免再把已是火星坐标的点转偏。
 * @param {number} lon
 * @param {number} lat
 */
export function gcj02ToWgs84(lon, lat) {
  if (outsideChina(lon, lat)) return { longitude: lon, latitude: lat };
  let longitude = lon;
  let latitude = lat;
  for (let i = 0; i < 8; i += 1) {
    const gcj = wgs84ToGcj02(longitude, latitude);
    longitude -= gcj.longitude - lon;
    latitude -= gcj.latitude - lat;
  }
  return { longitude, latitude };
}

/**
 * @param {unknown} value
 */
function text(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * @param {Record<string, unknown>} component
 */
export function cityName(component) {
  const city = component.city;
  if (typeof city === "string" && city.trim()) return city.trim();
  const province = text(component.province, 40);
  return province;
}

/**
 * @param {Record<string, unknown>} poi
 */
export function shapePoi(poi) {
  const [lon, lat] = String(poi.location || "").split(",").map(Number);
  const distance = Number(poi.distance);
  return {
    name: text(poi.name, 80),
    address: text(poi.address, 120),
    distance: Number.isFinite(distance) ? Math.round(distance) : null,
    longitude: Number.isFinite(lon) ? lon : null,
    latitude: Number.isFinite(lat) ? lat : null,
  };
}

/**
 * @param {typeof fetch} fetchImpl
 * @param {string} path
 * @param {Record<string, string>} params
 */
async function amapGet(fetchImpl, path, params) {
  const url = new URL(path, AMAP_BASE);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error("amap-http");
  const data = await response.json();
  if (data.status !== "1") throw new Error("amap-status");
  return data;
}

/**
 * @param {typeof fetch} fetchImpl
 * @param {string} key
 * @param {string} location
 * @param {{ keywords?: string, types?: string }} query
 */
async function around(fetchImpl, key, location, query) {
  const data = await amapGet(fetchImpl, "/v3/place/around", {
    key,
    location,
    radius: "1500",
    offset: "8",
    page: "1",
    extensions: "base",
    ...query,
  });
  return (Array.isArray(data.pois) ? data.pois : [])
    .map(shapePoi)
    .filter((poi) => poi.name)
    .slice(0, 6);
}

/**
 * @param {{
 *   key?: string,
 *   longitude: number,
 *   latitude: number,
 *   fetchImpl?: typeof fetch,
 * }} input
 */
export async function fetchPlaceContext({ key, longitude, latitude, fetchImpl = fetch }) {
  if (!key?.trim()) return { configured: false };
  const gcj = wgs84ToGcj02(longitude, latitude);
  const location = `${gcj.longitude.toFixed(6)},${gcj.latitude.toFixed(6)}`;
  let component = {};
  try {
    const regeo = await amapGet(fetchImpl, "/v3/geocode/regeo", {
      key,
      location,
      extensions: "base",
    });
    component = regeo.regeocode?.addressComponent || {};
  } catch {
    component = {};
  }
  const adcode = text(component.adcode, 12);
  let weather = null;
  if (adcode) {
    try {
      const forecast = await amapGet(fetchImpl, "/v3/weather/weatherInfo", {
        key,
        city: adcode,
        extensions: "all",
      });
      const cast = forecast.forecasts?.[0]?.casts?.[0];
      if (cast?.dayweather) {
        weather = {
          date: text(cast.date, 20),
          dayweather: text(cast.dayweather, 20),
          nightweather: text(cast.nightweather, 20),
          daytemp: text(cast.daytemp, 8),
          nighttemp: text(cast.nighttemp, 8),
        };
      }
    } catch {
      weather = null;
    }
  }
  const [dining, lodging] = await Promise.all([
    around(fetchImpl, key, location, { keywords: "餐饮" }).catch(() => []),
    around(fetchImpl, key, location, { types: "100100" }).catch(() => []),
  ]);
  return {
    configured: true,
    city: cityName(component),
    weather,
    dining,
    lodging,
  };
}

/**
 * 把高德折线压成地球用的 WGS84 点，避免一次返回上千个顶点。
 * @param {string} polyline
 * @param {number} maxPoints
 */
export function decodeDrivingPolyline(polyline, maxPoints = 240) {
  const raw = String(polyline || "")
    .split(";")
    .map((pair) => pair.split(",").map(Number))
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
    .map(([lon, lat]) => gcj02ToWgs84(lon, lat));
  if (raw.length <= maxPoints) return raw;
  const step = (raw.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints; i += 1) sampled.push(raw[Math.round(i * step)]);
  return sampled;
}

/**
 * 按途经点请求驾车路线。坐标必须是 WGS84。失败时返回 configured 但 path 为空，由前端改用测地线。
 * @param {{
 *   key?: string,
 *   stops: { longitude: number, latitude: number }[],
 *   fetchImpl?: typeof fetch,
 * }} input
 */
export async function fetchDrivingRoute({ key, stops, fetchImpl = fetch }) {
  if (!key?.trim() || stops.length < 2) return { configured: Boolean(key?.trim()), path: [] };
  const gcj = stops.map((stop) => wgs84ToGcj02(stop.longitude, stop.latitude));
  const origin = gcj[0];
  const destination = gcj[gcj.length - 1];
  const waypoints = gcj
    .slice(1, -1)
    .map((stop) => `${stop.longitude.toFixed(6)},${stop.latitude.toFixed(6)}`)
    .join(";");
  const params = {
    key,
    origin: `${origin.longitude.toFixed(6)},${origin.latitude.toFixed(6)}`,
    destination: `${destination.longitude.toFixed(6)},${destination.latitude.toFixed(6)}`,
    extensions: "base",
  };
  if (waypoints) params.waypoints = waypoints;
  const data = await amapGet(fetchImpl, "/v3/direction/driving", params);
  const steps = data.route?.paths?.[0]?.steps;
  const polyline = Array.isArray(steps) ? steps.map((step) => step.polyline || "").join(";") : "";
  return { configured: true, path: decodeDrivingPolyline(polyline) };
}
