# 山海 Earth

本地运行的中文 3D 地图应用，以 CesiumJS 的真实地球为主视图，结合中国大陆预设目的地、旅行记录、本地三维模型及 720° 全景。

公开仓库与 GitHub Pages：https://xtzhou960821.github.io/3D-Earth/

## 启动

环境：Node.js 22.12+（或当前 Node.js LTS）。

```sh
npm install
npm run build
npm start
```

打开 http://127.0.0.1:3001 。开发模式运行 `npm run dev`，打开 http://127.0.0.1:5173 。服务仅监听本机。

Cesium ion 令牌配置在 `.env`（该文件被版本控制忽略）。新机器请参考 `.env.example` 设置 `CESIUM_ION_TOKEN`。这是 Cesium 浏览器客户端需要读取的令牌，会通过本机 `/api/config` 发送给浏览器；并非对浏览器使用者保密的服务端密钥。它不会写入前端打包产物（本机路径）。发布到公网前应使用仅能读取所需资源、限制来源的客户端令牌。

**OSM Buildings：**「全球建筑」依赖 Cesium ion 的 OSM Buildings 资产。令牌除基础影像/地形外，还需开通对该资产的访问权限；否则界面会提示权限/网络原因并自动关闭开关，再次开启可重试。

## 旅行相册（深链，不镜像图片）

相册与全部图片继续托管在公开站 [xixia-heritage Pages](https://xtzhou960821.github.io/xixia-heritage/)。**不会**把约 860MB 的 `images/`（或完整相册 HTML）打进本仓库。

| 入口 | 说明 |
| --- | --- |
| 景点详情「打开旅行相册」 | `src/data/heritageAlbums.ts`：place id → 公开 URL；预览以外链为主，内嵌为可选回退 |
| 轻量索引 | `/heritage/`（`public/heritage/index.html`）仅向外深链 |
| 公开相册本体 | https://xtzhou960821.github.io/xixia-heritage/ |

已匹配互链（仅映射公开站确有 `*.html` 的目的地，未捏造其它对应）：

- **黄山** → `…/huangshan.html`
- **布达拉宫** → `…/tibet-lhasa.html`
- **贺兰山** → `…/helan-mountain.html`
- **西夏陵** → `…/xixia-tomb.html`
- **宝塔山** → `…/baota-mountain.html`
- **壶口瀑布** → `…/hukou-waterfall.html`
- **西藏阿里** → `…/tibet-ali.html`
- **成都** → `…/chengdu.html`
- **婺源** → `…/wuyuan.html`
- **桐江书院** → `…/tongjiang-academy.html`

公开相册（README 列出且 Pages 200，但不另建地球目的地）：`tibet-bangong.html` 班公湖、`tibet-sacred.html` 圣湖雪山、`tibet-zhada.html` 扎达土林——仅在 `/heritage/` 索引中深链。

故宫 / 长城 / 九寨沟 / 西湖 / 张家界 / 兵马俑 / 漓江 / 外滩 / 莫高窟 / 丽江等地球目的地暂无对应公开相册页，故不互链。相册 `images/` 树仍托管在 xixia-heritage，本仓库不镜像。

本地：http://127.0.0.1:5173/heritage/ 或 http://127.0.0.1:3001/heritage/

## GitHub Pages

工作流：`.github/workflows/pages.yml`（`npm ci && npm run build`，发布 `dist`）。仓库已公开；Settings → Pages → Source = **GitHub Actions**。推送到 `main` 或手动 `workflow_dispatch` 即可更新。

站点：https://xtzhou960821.github.io/3D-Earth/

### Pages 相对本机工作站的能力降级

| 能力 | 本机 `npm run dev` / `npm start` | GitHub Pages |
| --- | --- | --- |
| 三维地球浏览 / 目的地 / 相册深链 | ✅ | ✅（相册内容在 xixia 公开 Pages） |
| 收藏 / 打卡 / 旅行记录导入导出 | ✅（当前浏览器 localStorage） | ✅（当前浏览器 localStorage） |
| `/api/layers` 上传、持久化、删除 | ✅ Express | ❌ 无后端；灰显导入；自动挂载只读成都 `demo-tiles` + 两张压缩演示全景（椒江大桥公园 / 仙居桐江书院） |
| 分享视角深链 `#v=…` | ✅ | ✅（hash，无后端） |
| BIM 点击属性面板 | ✅（有元数据时） | ✅（无 batch/extras 时为空状态） |
| Cesium ion 令牌 | `.env` → `/api/config` | 可选 Secret `VITE_CESIUM_ION_TOKEN`（写入前端包；请用受限客户端令牌；**未配置时静默基础地球**） |
| OSM Buildings | 需令牌具备该资产权限 | 同上；失败自动关闭开关 |
| 未配置 ion | 基础地球 | 基础地球（NaturalEarthII） |

本地路径保持不变：继续用 Express + Vite 做完整工作站体验。

## 已实现

- 全屏三维地球、卫星影像、真实地形、可选 OSM 建筑、缩放、正北和倾斜视角。
- **分享视角深链**：地图右上角复制链接（`#v=lon,lat,height,heading,pitch,roll`），Pages `/3D-Earth/` 与本地均可还原相机。
- 20 个中国大陆目的地：九寨沟、故宫、张家界、西湖、黄山、八达岭、兵马俑、漓江阳朔、布达拉宫、外滩、莫高窟、丽江、贺兰山、西夏陵、宝塔山、壶口瀑布、西藏阿里、成都、婺源、桐江书院。
- 搜索景点 / 城市 / 省份 / 亮点，按自然、人文、城市主题筛选；点击列表或地图标记飞行定位。
- 景点介绍、开放时间资料、官方来源链接。能确认的时段附核对日期；其余明确提示需查阅当日公告，不推断实时营业状态。
- 收藏、打卡日期、旅行手记，刷新后保留；可导出 / 导入 JSON 旅行记录（合并或替换）。
- 每个景点提供一间有公开来源的具体酒店参考、周边住宿区域与地方美食查询入口，点击查看酒店资料或在高德地图搜索。**当前不包含内嵌的实时酒店房价、餐厅评分和商户 POI 列表。**
- 本地模型 / 全景文件持久化、图层加载状态（含 3D Tiles 瓦片进度与失败文件名）、隐藏显示、定位、经纬度/高程微调（±1m/±10m）/ 旋转 / 比例、删除（本机 Express）。
- **BIM 轻量拾取**：点击模型或带属性表的瓦片 → 高亮 + 属性面板；IFC→GLB 写入 `bim-properties.json` / glTF extras。无元数据时显示空状态。不含 RVT/OSGB 直转。
- **GitHub Pages 只读示例**：无 Express 时自动加载 `examples/tiles`（成都 B3DM → `demo-tiles/`），以及 `public/demo-panoramas/` 中两张约 4K 压缩全景（椒江大桥公园、桐江书院；原片仍在本机 `720全景/`，已 gitignore，勿提交）。
- **本机加载已有全景**：项目根保留 gitignore 的 `720全景/`（或任意 JPG），执行 `npm start`（或 `npm run dev`），用「导入我的内容」选全景；清单写入本机 `data/layers.json`，文件进 `uploads/`。Pages 只显示仓库内 `public/demo-panoramas/` 压缩演示片，不会自动同步本机原片。
- 桌面布局与手机折叠侧栏、键盘可用的对话框和全景转动。
- 旅行相册深链（`heritageAlbums` 映射 + `/heritage/` 轻量索引），上述 10 处已互链公开站相册；另有 3 处西藏子册为公开相册深链。

## 导入格式

| 内容                     | 如何导入                                                                    | 边界                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| BIM / IFC                | 在“BIM / 模型”选择 `.ifc`；本地解析后生成 GLB + 属性索引                    | 单 IFC 不超过 100 MB；点击可看属性树（best-effort）。RVT 需从 Revit 导出 IFC；不含 RVT/OSGB 直导                       |
| GLB                      | 选择单个 `.glb`                                                             | 模型以米计，默认 glTF Y-up；用 WGS84 经纬度和椭球高放置；无 extras 时属性面板为空                                       |
| glTF                     | 选择含 `.gltf`、`.bin`、纹理的完整文件夹，选择入口                          | 文件相对目录必须保持完整                                                                                                |
| OBJ mesh                 | 选择 `.obj`，同时选择 `.mtl` 与贴图，或整个目录                             | 浏览器转换为 GLB；大型航测网格建议先切片为 3D Tiles                                                                     |
| DJI Terra / 大疆智图实景 | 优先导出 B3DM / 3D Tiles，导入包含 `tileset.json`、子瓦片、纹理的完整文件夹 | 保留模型原有地理变换；单个 B3DM、OSGB、S3MB、PLY 均不直接导入。OSGB 先使用外部工具转换                                  |
| Cesium ion               | 输入已完成切片的 3D Tiles Asset ID                                          | 令牌需要具有该资源读取权限；不自动上传、创建资源或开启付费任务                                                          |
| 720° 全景                | 选择 JPG / PNG / WebP；若含 EXIF GPS（如大疆）自动预填经纬高，可在图层中再改 | 约 2:1 的等距柱状投影；最大宽度 16384 像素，并受实际显卡纹理限制；不支持六面立方体或自动街景导航网络。本地 `720全景/` 目录已 gitignore，请勿把原片提交进仓库 |
| 旅行记录 JSON            | 地图设置 → 导入收藏与打卡记录                                               | `version: 1`，字段 `favorites` / `checkins`；可与本地合并或整份替换                                                     |

本地上传单文件上限 512 MB、单次最多 5000 个文件。导入对话框显示转换/上传进度与更明确的失败原因。此版本是本机工作站应用，超大航测数据建议使用离线切片 + ion 或专用静态资源服务。GitHub Pages 无上传 API。

### 放置和浏览

1. 先定位到景点或目标区域，再点击“导入我的内容”（Pages 上该按钮不可用，可浏览只读示例瓦片）。
2. 普通模型和全景默认取当前地图中心；**全景若照片带 EXIF GPS，导入时自动预填**经纬高（无 GPS 则回退地图中心）。景点详情页导入时取景点预设坐标。经纬度为 WGS84，高程为椭球高（米）；可用 ±1m / ±10m 微调高程。全景图层也可在「我的图层 → 调整」中改名称与位置。
3. 无地理坐标的 IFC 和 OBJ 在转换时将包围盒水平居中、底部归零；原始工程地理坐标不会自动转换。导入后务必核对坐标、高程和方向。
4. 点击“我的图层 → 定位”；模型在地面下时可提高高程，尺寸不符时调整比例。地形显示高度与本地工程高程基准可能不同。
5. 全景既可由“打开720全景”进入，也可点击地图上的 `720全景` 标记。拖动环视，滚轮缩放，方向键转动，Esc 返回。
6. 3D Tiles 以 `tileset.json` 的地理变换为准，不重复套用普通模型的经纬度变换；图层状态显示瓦片加载进度与失败片段。
7. 点击 BIM / 模型或带 feature 属性的瓦片，打开右侧属性面板；点击空白处关闭高亮。

### 分享视角（Share camera）

- 地图顶栏 **链接图标** 复制当前相机：`#v=经度,纬度,高度m,航向°,俯仰°,滚转°`。
- 打开带该 hash 的 URL（含 `https://…/3D-Earth/#v=…`）会在地球就绪后飞到同一视角。无后端，适合 Pages。

## 示例

`examples/sample-building.glb` 是本项目生成的简易建筑几何；`examples/sample.obj` 是简单网格；`examples/tiles/` 是位于成都的 B3DM + tileset 示例。Pages / `vite build` 会把该目录复制为 `demo-tiles/`，静态站自动挂载只读演示图层。它们仅用于测试导入，不代表真实建筑或航测成果。

## 数据位置

- 模型及全景浏览资源（IFC / OBJ 为转换后的 GLB）：`data/uploads/<图层 ID>/`；IFC 另存 `bim-properties.json`。
- 图层目录和位置参数：`data/layers.json`。
- 收藏与打卡：当前浏览器、当前网址的 localStorage（键名 `shanhai-favorites` / `shanhai-checkins`）。`5173` 和 `3001` 是不同来源，不会共享浏览器收藏。
- 数据备份：复制整个 `data/` 目录；浏览器旅行记录在设置中导出 / 导入 JSON。
- 删除图层会删除对应本地资源；对话框会在执行前确认。Pages 演示图层不可删除。

## 验证

```sh
npm test
npm run typecheck
npm run build
```

已完成桌面端、移动端、景点跳转、收藏打卡、搜索筛选，以及 GLB、IFC、OBJ、3D Tiles 和 720° 全景图的浏览器验收。真实素材来自 Wikimedia，作者、许可证和源文件页见 `public/photo-sources.json`；界面中“地图设置 → 景点照片来源”可打开。

## 服务边界

Cesium ion 网络不可用或未配置时优先保留内置基础地球，并在界面提示。OSM Buildings 失败时自动关闭开关并区分令牌缺失 / 权限 / 网络等原因。此应用并不包含 Google Earth 的专有摄影测量模型或 Street View 数据。景点酒店美食入口不是酒店预订系统，也不提供实时房态。

此版本不含账号系统、跨设备同步、共享权限、自动 BIM 切片、RVT/OSGB 直接导入或地图商用发布配置。完整图层上传仍依赖本机 Express；GitHub Pages 承载静态浏览 + 只读成都示例瓦片（见上文降级表）。

### English notes (P2)

- **Layer UX**: upload progress + clearer API/tileset errors; 3D Tiles load progress / `tileFailed` filenames; lon/lat/height display and ±1m/±10m height nudges; Pages ships read-only Chengdu demo from `examples/tiles` → `demo-tiles/`.
- **BIM light**: click model/feature → highlight + properties panel (IFC sidecar / glTF extras / tileset batch tables when present; empty state otherwise). No RVT/OSGB importers.
- **Share camera**: copy `#v=lon,lat,height,heading,pitch,roll`; restores on load under `/3D-Earth/` base. No backend.
- **Deferred (P3)**: account sync, live hotel APIs, large asset vendors.
