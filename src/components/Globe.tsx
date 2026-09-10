import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as C from "cesium";
import type { Layer, MapHandle, Place } from "../types";
import { places } from "../data/places";
import { api } from "../lib/api";
interface Props {
  selected: Place | null;
  visibleIds: string[];
  layers: Layer[];
  onSelect: (p: Place) => void;
  onPanorama: (l: Layer) => void;
  onStatus: (s: string) => void;
  onLayerStatus: (id: string, status: string) => void;
  onCamera: (height: number) => void;
  terrain: boolean;
  buildings: boolean;
  labels: boolean;
}
type Item = C.Model | C.Cesium3DTileset | C.Entity;
export const Globe = forwardRef<MapHandle, Props>(function Globe(props, ref) {
  const container = useRef<HTMLDivElement>(null),
    viewer = useRef<C.Viewer | null>(null),
    latest = useRef(props),
    loaded = useRef(new Map<string, Item>()),
    loading = useRef(new Set<string>()),
    osm = useRef<C.Cesium3DTileset | null>(null),
    worldTerrain = useRef<C.CesiumTerrainProvider | null>(null);
  latest.current = props;
  const [ready, setReady] = useState(false);
  function request() {
    viewer.current?.scene.requestRender();
  }
  function flyTo(p: Place) {
    viewer.current?.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(
        p.lon,
        p.lat - 0.012,
        p.altitude + p.distance,
      ),
      orientation: { heading: 0, pitch: C.Math.toRadians(-65), roll: 0 },
      duration: 2.2,
    });
  }
  function home() {
    viewer.current?.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(105, 32, 9500000),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      duration: 1.8,
    });
  }
  useImperativeHandle(ref, () => ({
    flyTo,
    home,
    zoom(direction) {
      const v = viewer.current;
      if (v) {
        const distance = Math.max(
          20,
          v.camera.positionCartographic.height * 0.35,
        );
        direction > 0 ? v.camera.zoomIn(distance) : v.camera.zoomOut(distance);
        request();
      }
    },
    north() {
      const v = viewer.current;
      if (v)
        v.camera.flyTo({
          destination: v.camera.position,
          orientation: { heading: 0, pitch: v.camera.pitch, roll: 0 },
          duration: 0.6,
        });
    },
    tilt() {
      const v = viewer.current;
      if (!v) return;
      const point = v.camera.pickEllipsoid(
        new C.Cartesian2(v.canvas.clientWidth / 2, v.canvas.clientHeight / 2),
        v.scene.globe.ellipsoid,
      );
      if (!point) return;
      const range = C.Cartesian3.distance(v.camera.position, point);
      v.camera.lookAt(
        point,
        new C.HeadingPitchRange(
          v.camera.heading,
          v.camera.pitch < -1.2 ? -0.6 : -Math.PI / 2,
          range,
        ),
      );
      v.camera.lookAtTransform(C.Matrix4.IDENTITY);
      request();
    },
    focusLayer(layer) {
      const v = viewer.current;
      if (!v) return;
      const item = loaded.current.get(layer.id);
      if (item && !(item instanceof C.Entity) && item.isDestroyed()) return;
      if (
        item instanceof C.Cesium3DTileset ||
        (item instanceof C.Model && item.ready)
      ) {
        if (item.boundingSphere)
          v.camera.flyToBoundingSphere(
            C.BoundingSphere.clone(item.boundingSphere),
            {
              duration: 1.5,
              offset: new C.HeadingPitchRange(
                0,
                -0.6,
                Math.max(item.boundingSphere.radius * 3, 100),
              ),
            },
          );
      } else {
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(
            layer.longitude,
            layer.latitude,
            layer.height + 1000,
          ),
          duration: 1.5,
        });
      }
    },
    getPosition() {
      const v = viewer.current;
      if (!v) return { longitude: 104.06, latitude: 30.67, height: 0 };
      const target = v.scene.pickPositionSupported
        ? v.scene.pickPosition(
            new C.Cartesian2(
              v.canvas.clientWidth / 2,
              v.canvas.clientHeight / 2,
            ),
          )
        : undefined;
      const point =
        target ||
        v.camera.pickEllipsoid(
          new C.Cartesian2(v.canvas.clientWidth / 2, v.canvas.clientHeight / 2),
          v.scene.globe.ellipsoid,
        );
      const c = point
        ? C.Cartographic.fromCartesian(point)
        : v.camera.positionCartographic;
      return {
        longitude: Number(C.Math.toDegrees(c.longitude).toFixed(6)),
        latitude: Number(C.Math.toDegrees(c.latitude).toFixed(6)),
        height: Math.max(0, Math.round(point ? c.height : 0)),
      };
    },
  }));
  useEffect(() => {
    let disposed = false;
    let handler: C.ScreenSpaceEventHandler | undefined;
    (async () => {
      try {
        const v = new C.Viewer(container.current!, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          baseLayer: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
          msaaSamples: 2,
          showRenderLoopErrors: false,
        });
        viewer.current = v;
        v.scene.renderError.addEventListener(() =>
          latest.current.onStatus("三维渲染已停止，请刷新页面重试"),
        );
        v.scene.backgroundColor = C.Color.fromCssColorString("#07111b");
        if (v.scene.skyBox) v.scene.skyBox.show = false;
        v.scene.globe.baseColor = C.Color.fromCssColorString("#142d3a");
        v.scene.globe.depthTestAgainstTerrain = true;
        v.scene.globe.maximumScreenSpaceError = 2;
        v.scene.screenSpaceCameraController.minimumZoomDistance = 10;
        v.camera.setView({
          destination: C.Cartesian3.fromDegrees(105, 32, 9500000),
        });
        const natural = await C.TileMapServiceImageryProvider.fromUrl(
          "/cesium/Assets/Textures/NaturalEarthII",
        );
        if (disposed) return;
        v.imageryLayers.addImageryProvider(natural);
        for (const p of places) {
          const color = C.Color.fromCssColorString(
            p.category === "自然风光"
              ? "#9bdcc4"
              : p.category === "人文古迹"
                ? "#efc17a"
                : "#b5a4ed",
          );
          v.entities.add({
            id: p.id,
            name: p.name,
            position: C.Cartesian3.fromDegrees(p.lon, p.lat, p.altitude + 150),
            billboard: {
              image:
                "data:image/svg+xml," +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 1C7.7 1 1 7.7 1 16c0 10 15 25 15 25s15-15 15-25C31 7.7 24.3 1 16 1Z" fill="${color.toCssColorString()}" stroke="#193b3f" stroke-width="1.5"/><circle cx="16" cy="15" r="5" fill="#183a3c"/></svg>`,
                ),
              verticalOrigin: C.VerticalOrigin.BOTTOM,
              scaleByDistance: new C.NearFarScalar(1e4, 1.1, 2e7, 0.7),
            },
            label: {
              text: p.name,
              font: "12px sans-serif",
              fillColor: C.Color.WHITE,
              outlineColor: C.Color.fromCssColorString("#10202a"),
              outlineWidth: 3,
              style: C.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new C.Cartesian2(0, 10),
              scaleByDistance: new C.NearFarScalar(1e4, 1, 2e7, 0.85),
              distanceDisplayCondition: new C.DistanceDisplayCondition(0, 3e7),
            },
          });
        }
        handler = new C.ScreenSpaceEventHandler(v.scene.canvas);
        handler.setInputAction((e: { position: C.Cartesian2 }) => {
          const hit = v.scene.pick(e.position);
          if (hit?.id instanceof C.Entity) {
            const p = places.find((x) => x.id === hit.id.id);
            if (p) latest.current.onSelect(p);
            const layer = latest.current.layers.find(
              (l) => l.id === hit.id.id && l.kind === "panorama",
            );
            if (layer) latest.current.onPanorama(layer);
          }
        }, C.ScreenSpaceEventType.LEFT_CLICK);
        v.camera.changed.addEventListener(() =>
          latest.current.onCamera(v.camera.positionCartographic.height),
        );
        v.camera.percentageChanged = 0.03;
        latest.current.onStatus("基础地球已就绪 · 正在连接卫星影像");
        const config = await api<{ ionToken: string }>("/config");
        if (disposed) return;
        C.Ion.defaultAccessToken = config.ionToken;
        setReady(true);
        if (!config.ionToken) {
          latest.current.onStatus("基础地球模式 · 未配置 Cesium ion");
          return;
        }
        await Promise.allSettled([
          C.IonImageryProvider.fromAssetId(2)
            .then((provider) => {
              if (disposed) return;
              v.imageryLayers.addImageryProvider(provider);
              latest.current.onStatus("卫星影像已连接");
              request();
            })
            .catch(() =>
              latest.current.onStatus("卫星影像暂不可用 · 已显示基础地球"),
            ),
          C.createWorldTerrainAsync()
            .then((terrain) => {
              if (disposed) return;
              worldTerrain.current = terrain;
              if (latest.current.terrain) v.terrainProvider = terrain;
              request();
            })
            .catch(() =>
              latest.current.onStatus("地形加载失败 · 当前使用平滑地球"),
            ),
        ]);
      } catch {
        if (!disposed)
          latest.current.onStatus(
            "地球加载失败，请检查网络或浏览器 WebGL 支持",
          );
      }
    })();
    return () => {
      disposed = true;
      handler?.destroy();
      if (viewer.current && !viewer.current.isDestroyed())
        viewer.current.destroy();
      viewer.current = null;
      loaded.current.clear();
      loading.current.clear();
      osm.current = null;
      worldTerrain.current = null;
      setReady(false);
    };
  }, []);
  useEffect(() => {
    if (!ready || !viewer.current) return;
    const visible = new Set(props.visibleIds);
    for (const p of places) {
      const e = viewer.current.entities.getById(p.id);
      if (e) {
        e.show = visible.has(p.id);
        if (e.label) e.label.show = new C.ConstantProperty(props.labels);
        if (e.billboard)
          e.billboard.scale = new C.ConstantProperty(
            props.selected?.id === p.id ? 1.25 : 1,
          );
      }
    }
    request();
  }, [ready, props.visibleIds, props.labels, props.selected]);
  useEffect(() => {
    if (viewer.current)
      viewer.current.terrainProvider =
        props.terrain && worldTerrain.current
          ? worldTerrain.current
          : new C.EllipsoidTerrainProvider();
    request();
  }, [ready, props.terrain]);
  useEffect(() => {
    let cancelled = false;
    const v = viewer.current;
    if (!ready || !v) return;
    if (osm.current) {
      osm.current.show = props.buildings;
      request();
      return;
    }
    if (props.buildings) {
      latest.current.onStatus("正在加载 OSM 建筑");
      C.createOsmBuildingsAsync()
        .then((t) => {
          if (cancelled || v.isDestroyed()) {
            t.destroy();
            return;
          }
          osm.current = t;
          v.scene.primitives.add(t);
          latest.current.onStatus("OSM 建筑已加载");
          request();
        })
        .catch(() => {
          if (!cancelled)
            latest.current.onStatus("建筑数据加载失败，请检查 ion 资源权限");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [ready, props.buildings]);
  useEffect(() => {
    const v = viewer.current;
    if (!ready || !v) return;
    const ids = new Set(props.layers.map((l) => l.id));
    for (const [id, item] of loaded.current) {
      if (!ids.has(id)) {
        item instanceof C.Entity
          ? v.entities.remove(item)
          : v.scene.primitives.remove(item);
        loaded.current.delete(id);
      }
    }
    function apply(item: Item, layer: Layer) {
      item.show = layer.visible;
      if (item instanceof C.Model) {
        item.modelMatrix = C.Transforms.headingPitchRollToFixedFrame(
          C.Cartesian3.fromDegrees(
            layer.longitude,
            layer.latitude,
            layer.height,
          ),
          new C.HeadingPitchRoll(C.Math.toRadians(layer.heading), 0, 0),
        );
        item.scale = layer.scale;
      }
    }
    for (const layer of props.layers) {
      const existing = loaded.current.get(layer.id);
      if (existing) {
        apply(existing, layer);
        continue;
      }
      if (loading.current.has(layer.id)) continue;
      loading.current.add(layer.id);
      latest.current.onLayerStatus(layer.id, "加载中");
      (async () => {
        try {
          let item: Item;
          if (layer.kind === "panorama") {
            item = v.entities.add({
              id: layer.id,
              position: C.Cartesian3.fromDegrees(
                layer.longitude,
                layer.latitude,
                layer.height + 4,
              ),
              billboard: {
                image: new C.PinBuilder()
                  .fromText("360", C.Color.fromCssColorString("#b5a4ed"), 46)
                  .toDataURL(),
                verticalOrigin: C.VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Infinity,
              },
              label: {
                text: layer.name,
                font: "13px sans-serif",
                pixelOffset: new C.Cartesian2(0, 15),
                style: C.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 3,
                disableDepthTestDistance: Infinity,
              },
            });
          } else if (layer.kind === "tiles" || layer.kind === "ion") {
            item =
              layer.kind === "ion"
                ? await C.Cesium3DTileset.fromIonAssetId(layer.assetId!)
                : await C.Cesium3DTileset.fromUrl(layer.url!);
            if (v.isDestroyed()) {
              item.destroy();
              return;
            }
            v.scene.primitives.add(item);
            item.tileFailed.addEventListener(() =>
              latest.current.onLayerStatus(
                layer.id,
                "部分瓦片加载失败，请检查文件完整性",
              ),
            );
          } else {
            item = await C.Model.fromGltfAsync({
              url: layer.url!,
              modelMatrix: C.Transforms.headingPitchRollToFixedFrame(
                C.Cartesian3.fromDegrees(
                  layer.longitude,
                  layer.latitude,
                  layer.height,
                ),
                new C.HeadingPitchRoll(C.Math.toRadians(layer.heading), 0, 0),
              ),
              scale: layer.scale,
              minimumPixelSize: 0,
            });
            if (v.isDestroyed()) {
              item.destroy();
              return;
            }
            v.scene.primitives.add(item);
            item.errorEvent.addEventListener(() =>
              latest.current.onLayerStatus(layer.id, "模型资源加载失败"),
            );
          }
          const current = latest.current.layers.find((l) => l.id === layer.id);
          if (!current) {
            item instanceof C.Entity
              ? v.entities.remove(item)
              : v.scene.primitives.remove(item);
            return;
          }
          apply(item, current);
          loaded.current.set(layer.id, item);
          if (item instanceof C.Model && !item.ready) {
            latest.current.onLayerStatus(layer.id, "正在准备模型");
            item.readyEvent.addEventListener(() => {
              latest.current.onLayerStatus(layer.id, "已加载");
              request();
            });
          } else {
            latest.current.onLayerStatus(layer.id, "已加载");
          }
          request();
        } catch {
          latest.current.onLayerStatus(
            layer.id,
            "加载失败，请检查格式、资源路径或 ion 权限",
          );
        } finally {
          loading.current.delete(layer.id);
        }
      })();
    }
    request();
  }, [ready, props.layers]);
  return (
    <div ref={container} className="globe-canvas" aria-label="交互式三维地球" />
  );
});
