import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
export async function convertModel(
  file: File,
  files: File[],
  progress: (message: string) => void,
): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const group = new THREE.Group();
  const urls: string[] = [];
  let release = () => {};
  try {
    if (ext === "ifc") {
      if (file.size > 100 * 1024 * 1024)
        throw new Error(
          "浏览器 IFC 转换限 100 MB，较大模型请转换为 3D Tiles 后导入",
        );
      progress("正在解析 IFC 建筑构件…");
      const { IfcAPI } = await import("web-ifc");
      const ifc = new IfcAPI();
      ifc.SetWasmPath("/wasm/", true);
      await ifc.Init();
      const id = ifc.OpenModel(new Uint8Array(await file.arrayBuffer()), {
        COORDINATE_TO_ORIGIN: true,
      });
      release = () => ifc.CloseModel(id);
      ifc.StreamAllMeshes(id, (flat) => {
        for (let i = 0; i < flat.geometries.size(); i++) {
          const part = flat.geometries.get(i);
          const geom = ifc.GetGeometry(id, part.geometryExpressID);
          const raw = ifc.GetVertexArray(
            geom.GetVertexData(),
            geom.GetVertexDataSize(),
          );
          const indices = ifc.GetIndexArray(
            geom.GetIndexData(),
            geom.GetIndexDataSize(),
          );
          const positions = new Float32Array(raw.length / 2),
            normals = new Float32Array(raw.length / 2);
          for (let j = 0, k = 0; j < raw.length; j += 6, k += 3) {
            positions.set(raw.subarray(j, j + 3), k);
            normals.set(raw.subarray(j + 3, j + 6), k);
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3),
          );
          geometry.setAttribute(
            "normal",
            new THREE.BufferAttribute(normals, 3),
          );
          geometry.setIndex(
            new THREE.BufferAttribute(new Uint32Array(indices), 1),
          );
          const color = part.color;
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(color.x, color.y, color.z),
              opacity: color.w,
              transparent: color.w < 1,
              side: THREE.DoubleSide,
            }),
          );
          mesh.applyMatrix4(
            new THREE.Matrix4().fromArray(part.flatTransformation),
          );
          mesh.name = `IFC-${flat.expressID}`;
          const props = ifc.GetLine(id, flat.expressID);
          mesh.userData = {
            expressID: flat.expressID,
            ifcType: props?.type,
            ifcName: props?.Name?.value || "",
          };
          group.add(mesh);
          geom.delete();
        }
      });
    } else if (ext === "obj") {
      progress("正在转换 OBJ 网格与材质…");
      const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js");
      const { MTLLoader } = await import("three/addons/loaders/MTLLoader.js");
      const manager = new THREE.LoadingManager();
      const objText = await file.text();
      const materialName = objText.match(/^mtllib\s+(.+)$/m)?.[1].trim();
      const mtlCandidates = files.filter((f) =>
        f.name.toLowerCase().endsWith(".mtl"),
      );
      const mtl = materialName
        ? mtlCandidates.find((f) =>
            (f.webkitRelativePath || f.name).endsWith(materialName),
          )
        : mtlCandidates[0];
      if (materialName && !mtl)
        throw new Error(`找不到材质文件：${materialName}`);
      const materialDirectory = mtl?.webkitRelativePath
        ? mtl.webkitRelativePath.slice(
            0,
            mtl.webkitRelativePath.lastIndexOf("/") + 1,
          )
        : "";

      manager.setURLModifier((url) => {
        const clean = decodeURIComponent(url).replace(/^\.\//, "");
        const exact = files.find(
          (f) =>
            (f.webkitRelativePath || f.name) === clean ||
            f.webkitRelativePath === materialDirectory + clean,
        );
        const basename = clean.split("/").pop();
        const matches = files.filter((f) => f.name === basename);
        if (!exact && matches.length > 1)
          throw new Error(`贴图名称重复，请保留完整目录：${clean}`);
        const found = exact || matches[0];
        if (!found) throw new Error(`找不到模型资源：${clean}`);
        const blob = URL.createObjectURL(found);
        urls.push(blob);
        return blob;
      });
      const loader = new OBJLoader(manager);
      let textures: Promise<void> | undefined;
      if (mtl) {
        textures = new Promise((resolve, reject) => {
          manager.onLoad = resolve;
          manager.onError = () => reject(new Error("模型纹理加载失败"));
        });
        const materials = new MTLLoader(manager).parse(await mtl.text(), "");
        materials.preload();
        loader.setMaterials(materials);
        if (urls.length === 0) textures = undefined;
      }
      const object = loader.parse(objText);
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const convertMaterial = (material: THREE.Material) => {
          if (
            material instanceof THREE.MeshStandardMaterial ||
            material instanceof THREE.MeshBasicMaterial
          )
            return material;
          const original = material as THREE.MeshPhongMaterial;
          const replacement = new THREE.MeshStandardMaterial({
            color: original.color,
            map: original.map,
            opacity: original.opacity,
            transparent: original.transparent,
            side: original.side,
            roughness: 0.8,
          });
          material.dispose();
          return replacement;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(convertMaterial)
          : convertMaterial(child.material);
      });
      group.add(object);
      if (textures) await textures;
    } else throw new Error("不支持转换此模型格式");
    if (!group.children.length)
      throw new Error("文件中没有可显示的三维几何构件");
    progress("正在生成可浏览的三维模型…");
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.set(-center.x, -box.min.y, -center.z);
    group.updateMatrixWorld(true);
    const data = await new GLTFExporter().parseAsync(group, {
      binary: true,
      onlyVisible: false,
    });
    return new File(
      [data as ArrayBuffer],
      file.name.replace(/\.[^.]+$/, ".glb"),
      { type: "model/gltf-binary" },
    );
  } finally {
    release();
    urls.forEach(URL.revokeObjectURL);
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(
          (m: THREE.Material) => m.dispose(),
        );
      }
    });
  }
}
export async function validatePanorama(file: File) {
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (Math.abs(image.width / image.height - 2) > 0.08)
          reject(
            new Error(
              "请选择宽高比约为 2:1 的等距柱状全景图（例如 6000×3000）",
            ),
          );
        else if (image.width > 16384)
          reject(new Error("全景图宽度不能超过 16384 像素，请先缩小图片"));
        else resolve();
      };
      image.onerror = () =>
        reject(new Error("图片无法解码，请选择 JPG、PNG 或 WebP"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
