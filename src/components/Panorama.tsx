import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { X, RotateCcw, Expand, LoaderCircle } from "lucide-react";
import type { Layer } from "../types";
export default function Panorama({
  layer,
  onClose,
}: {
  layer: Layer;
  onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef({ yaw: 0, pitch: 0, fov: 75 }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError("当前浏览器无法创建全景视图，请检查 WebGL 支持");
      setLoading(false);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: "#111c20" });
    scene.add(new THREE.Mesh(geometry, material));
    let disposed = false;
    new THREE.TextureLoader().load(
      layer.url!,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        if (texture.image.width > renderer.capabilities.maxTextureSize) {
          texture.dispose();
          setError("图片分辨率超出当前显卡限制，请缩小后重新导入");
          setLoading(false);
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
        setLoading(false);
        render();
      },
      undefined,
      () => {
        setLoading(false);
        setError("全景图片加载失败，请检查文件是否仍然存在");
      },
    );
    function render() {
      const { yaw, pitch, fov } = view.current;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      const phi = THREE.MathUtils.degToRad(90 - pitch),
        theta = THREE.MathUtils.degToRad(yaw);
      camera.lookAt(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        ),
      );
      renderer.render(scene, camera);
    }
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      render();
    });
    resize.observe(el);
    let dragging = false,
      x = 0,
      y = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      x = e.clientX;
      y = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      view.current.yaw += (x - e.clientX) * 0.15;
      view.current.pitch = Math.max(
        -85,
        Math.min(85, view.current.pitch + (e.clientY - y) * 0.15),
      );
      x = e.clientX;
      y = e.clientY;
      render();
    };
    const up = () => {
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      view.current.fov = Math.max(
        30,
        Math.min(100, view.current.fov + e.deltaY * 0.04),
      );
      render();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        view.current.yaw +=
          e.key === "ArrowRight" ? 3 : e.key === "ArrowLeft" ? -3 : 0;
        view.current.pitch = Math.max(
          -85,
          Math.min(
            85,
            view.current.pitch +
              (e.key === "ArrowUp" ? 3 : e.key === "ArrowDown" ? -3 : 0),
          ),
        );
        render();
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    const reset = () => {
      view.current = { yaw: 0, pitch: 0, fov: 75 };
      render();
    };
    el.addEventListener("reset-view", reset);
    return () => {
      disposed = true;
      resize.disconnect();
      window.removeEventListener("keydown", key);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("reset-view", reset);
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [layer, onClose]);
  return (
    <div
      className="panorama-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="720° 全景浏览"
    >
      <div className="panorama-canvas" ref={host} />
      <div className="panorama-heading">
        <span className="panorama-tag">720°</span>
        <div>
          <h2>{layer.name}</h2>
          <p>拖动环视 · 滚轮缩放 · 方向键转动</p>
        </div>
      </div>
      <div className="panorama-actions">
        <button
          className="icon-button"
          aria-label="重置全景视角"
          onClick={() => host.current?.dispatchEvent(new Event("reset-view"))}
        >
          <RotateCcw />
        </button>
        <button
          className="icon-button"
          aria-label="全屏全景"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else
              void host.current?.parentElement
                ?.requestFullscreen()
                .catch(() => setError("浏览器暂不支持全屏"));
          }}
        >
          <Expand />
        </button>
        <button
          autoFocus
          className="icon-button"
          aria-label="关闭全景"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {loading && (
        <div className="center-message">
          <LoaderCircle className="spin" />
          正在载入全景…
        </div>
      )}
      {error && <div className="center-message error">{error}</div>}
      <div className="panorama-footer">
        {layer.longitude.toFixed(5)}° E &nbsp; / &nbsp;{" "}
        {layer.latitude.toFixed(5)}° N
      </div>
    </div>
  );
}
