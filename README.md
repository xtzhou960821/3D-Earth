# 山海 Earth

本地运行的中文 3D 地图应用，以 CesiumJS 的真实地球为主视图，结合中国大陆预设目的地、旅行记录、本地三维模型及 720° 全景。

## 启动

环境：Node.js 22.12+（或当前 Node.js LTS）。

```sh
npm install
npm run build
npm start
```

打开 http://127.0.0.1:3001 。开发模式运行 `npm run dev`，打开 http://127.0.0.1:5173 。服务仅监听本机。

Cesium ion 令牌已经配置在 `.env`，该文件被版本控制忽略。新机器请参考 `.env.example` 设置 `CESIUM_ION_TOKEN`。这是 Cesium 浏览器客户端需要读取的令牌，会通过本机 `/api/config` 发送给浏览器；并非对浏览器使用者保密的服务端密钥。它不会写入前端打包产物。发布到公网前应使用仅能读取所需资源、限制来源的客户端令牌。

## 旅行相册子站 `/heritage/`

已将公开相册站 [xixia-heritage](https://github.com/xtzhou960821/xixia-heritage) 集成为静态子站：

| 环境 | 入口 |
| --- | --- |
| 开发 | http://127.0.0.1:5173/heritage/ |
| 本地生产 | http://127.0.0.1:3001/heritage/ |
| 独立公开站（图片源） | https://xtzhou960821.github.io/xixia-heritage/ |
| 本仓库 Pages（启用后） | https://xtzhou960821.github.io/3D-Earth/heritage/ |

地球景点详情中，已匹配相册的目的地会显示「打开旅行相册」：

- **黄山** → `/heritage/huangshan.html`
- **布达拉宫** → `/heritage/tibet-lhasa.html`（相册页即为拉萨·布达拉宫）

其余相册（贺兰山、西夏陵、壶口、成都、婺源、阿里分站等）可从 `/heritage/` 首页进入；未在地球预设中强行捏造对应关系。

### 体积策略（为何不用整包图片）

完整 `images/` 约 **860MB**。本仓库采用 **方案 b**：

1. 仅复制 HTML / CSS / JS 到 `public/heritage/`（约 200KB）
2. 将相对 `images/...` 改写为绝对地址 `https://xtzhou960821.github.io/xixia-heritage/images/...`
3. 相册版式与页面完整保留；浏览图片需能访问上述公开 Pages

备选：若要坚持离线整包图片，可用 `git submodule` 把 `xixia-heritage` 挂到 `public/heritage`（需自行 `git submodule update --init`），但会显著增大仓库体积，不适合作为默认 PR 策略。详见 `public/heritage/README.md`。

## GitHub Pages

工作流：`.github/workflows/pages.yml`（`npm ci && npm run build`，发布 `dist`，含 `/heritage/`）。

### 私有仓库限制（重要）

当前 `3D-Earth` 为 **private**。GitHub Free 对私有仓库 **通常不能托管 Pages**；需要：

1. 将仓库设为 **public**，或
2. 使用 **GitHub Pro / Team** 等支持私有 Pages 的方案

然后：Settings → Pages → Source 选 **GitHub Actions**，合并本 PR 到 `main` 或手动 `workflow_dispatch`。

预期站点：`https://xtzhou960821.github.io/3D-Earth/`

### Pages 相对本机工作站的能力降级

| 能力 | 本机 `npm run dev` / `npm start` | GitHub Pages |
| --- | --- | --- |
| 三维地球浏览 / 目的地 / 相册子站 | ✅ | ✅（相册图片走 xixia 公开 Pages） |
| `/api/layers` 上传、持久化、删除 | ✅ Express | ❌ 无后端 |
| Cesium ion 令牌 | `.env` → `/api/config` | 可选仓库 Secret `VITE_CESIUM_ION_TOKEN`（会打进前端包；请用受限客户端令牌） |
| 未配置 ion | 基础地球 | 基础地球（NaturalEarthII） |

本地路径保持不变：继续用 Express + Vite 做完整工作站体验。

## 已实现

- 全屏三维地球、卫星影像、真实地形、可选 OSM 建筑、缩放、正北和倾斜视角。
- 12 个中国大陆目的地：九寨沟、故宫、张家界、西湖、黄山、八达岭、兵马俑、漓江阳朔、布达拉宫、外滩、莫高窟、丽江。
- 搜索景点 / 城市 / 省份 / 亮点，按自然、人文、城市主题筛选；点击列表或地图标记飞行定位。
- 景点介绍、开放时间资料、官方来源链接。能确认的时段附核对日期；其余明确提示需查阅当日公告，不推断实时营业状态。
- 收藏、打卡日期、旅行手记，刷新后保留；可导出 JSON 旅行记录。
- 每个景点提供一间有公开来源的具体酒店参考、周边住宿区域与地方美食查询入口，点击查看酒店资料或在高德地图搜索。**当前不包含内嵌的实时酒店房价、餐厅评分和商户 POI 列表。**
- 本地模型 / 全景文件持久化、图层加载状态、隐藏显示、定位、模型经纬度 / 高程 / 旋转 / 比例调整、删除。
- 桌面布局与手机折叠侧栏、键盘可用的对话框和全景转动。
- 静态旅行相册子站 `/heritage/`，并与黄山、布达拉宫目的地互链。

## 导入格式

| 内容                     | 如何导入                                                                    | 边界                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| BIM / IFC                | 在“BIM / 模型”选择 `.ifc`；本地解析后生成 GLB                               | 单 IFC 不超过 100 MB；保留几何、材质、构件编号及名称到 glTF extras，尚无 BIM 属性树 / 构件编辑。RVT 需从 Revit 导出 IFC |
| GLB                      | 选择单个 `.glb`                                                             | 模型以米计，默认 glTF Y-up；用 WGS84 经纬度和椭球高放置                                                                 |
| glTF                     | 选择含 `.gltf`、`.bin`、纹理的完整文件夹，选择入口                          | 文件相对目录必须保持完整                                                                                                |
| OBJ mesh                 | 选择 `.obj`，同时选择 `.mtl` 与贴图，或整个目录                             | 浏览器转换为 GLB；大型航测网格建议先切片为 3D Tiles                                                                     |
| DJI Terra / 大疆智图实景 | 优先导出 B3DM / 3D Tiles，导入包含 `tileset.json`、子瓦片、纹理的完整文件夹 | 保留模型原有地理变换；单个 B3DM、OSGB、S3MB、PLY 均不直接导入。OSGB 先使用外部工具转换                                  |
| Cesium ion               | 输入已完成切片的 3D Tiles Asset ID                                          | 令牌需要具有该资源读取权限；不自动上传、创建资源或开启付费任务                                                          |
| 720° 全景                | 选择 JPG / PNG / WebP                                                       | 约 2:1 的等距柱状投影；最大宽度 16384 像素，并受实际显卡纹理限制；不支持六面立方体或自动街景导航网络                    |

本地上传单文件上限 512 MB、单次最多 5000 个文件。此版本是本机工作站应用，超大航测数据建议使用离线切片 + ion 或专用静态资源服务。

### 放置和浏览

1. 先定位到景点或目标区域，再点击“导入我的内容”。
2. 普通模型和全景默认取当前地图中心；景点详情页导入时取景点预设坐标。经纬度为 WGS84，高程为椭球高（米）。
3. 无地理坐标的 IFC 和 OBJ 在转换时将包围盒水平居中、底部归零；原始工程地理坐标不会自动转换。导入后务必核对坐标、高程和方向。
4. 点击“我的图层 → 定位”；模型在地面下时可提高高程，尺寸不符时调整比例。地形显示高度与本地工程高程基准可能不同。
5. 全景既可由“打开全景”进入，也可点击地图上的 `360` 标记。拖动环视，滚轮缩放，方向键转动，Esc 返回。
6. 3D Tiles 以 `tileset.json` 的地理变换为准，不重复套用普通模型的经纬度变换。

## 示例

`examples/sample-building.glb` 是本项目生成的简易建筑几何；`examples/sample.obj` 是简单网格；`examples/tiles/` 是位于成都的 B3DM + tileset 示例。它们仅用于测试导入，不代表真实建筑或航测成果。

## 数据位置

- 模型及全景浏览资源（IFC / OBJ 为转换后的 GLB）：`data/uploads/<图层 ID>/`。
- 图层目录和位置参数：`data/layers.json`。
- 收藏与打卡：当前浏览器、当前网址的 localStorage。`5173` 和 `3001` 是不同来源，不会共享浏览器收藏。
- 数据备份：复制整个 `data/` 目录；浏览器旅行记录在设置中导出 JSON。当前没有 JSON 重新导入功能。
- 删除图层会删除对应本地资源；对话框会在执行前确认。

## 验证

```sh
npm test
npm run build
```

已完成桌面端、移动端、景点跳转、收藏打卡、搜索筛选，以及 GLB、IFC、OBJ、3D Tiles 和 720° 全景图的浏览器验收。真实素材来自 Wikimedia，作者、许可证和源文件页见 `public/photo-sources.json`；界面中“地图设置 → 景点照片来源”可打开。

## 服务边界

Cesium ion 网络不可用时优先保留内置基础地球，并在界面提示。此应用并不包含 Google Earth 的专有摄影测量模型或 Street View 数据。景点酒店美食入口不是酒店预订系统，也不提供实时房态。

此版本不含账号系统、跨设备同步、共享权限、自动 BIM 切片服务或地图商用发布配置。完整图层上传能力仍依赖本机 Express；GitHub Pages 仅承载静态浏览（见上文降级表）。
