# 旅行相册子站 / Heritage album sub-site

静态相册页来自公开仓库 [xixia-heritage](https://github.com/xtzhou960821/xixia-heritage)，经 Vite `public/` 随主站发布到 `/heritage/`。

## 体积策略（方案 b）

完整 `images/` 约 860MB，不宜并入本仓库。因此：

- 本目录仅保留 **HTML + CSS + JS**（约 200KB）
- 所有 `images/...` 引用已改写为绝对地址：  
  `https://xtzhou960821.github.io/xixia-heritage/images/...`
- 相册页在本机 `/heritage/` 或 GitHub Pages 下均可浏览；**图片需能访问上述公开 Pages**

若需要完全离线图片：可将 `xixia-heritage` 以 submodule / 稀疏检出放到 `public/heritage/images/`，并把 HTML 中的图片 URL 改回相对路径 `images/...`（勿把整树强行提交进常规 PR）。

## 本地打开

开发：`http://127.0.0.1:5173/heritage/`  
生产（Express）：`http://127.0.0.1:3001/heritage/`

独立公开站仍可用：https://xtzhou960821.github.io/xixia-heritage/
