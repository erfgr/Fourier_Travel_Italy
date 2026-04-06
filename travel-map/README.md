# Fourier Travel Italy — 项目说明

这是一个基于 React + Vite 的轻量原型，使用 Leaflet 在地图上以漫画便签风格展示每日行程：每个景点为编号标记，线路以折线连接，点击标记可查看详情并跳转到 Google Maps。

快速开始

- 安装依赖：

```bash
npm install
```

- 本地开发（启动热重载本地服务器）：

```bash
npm run dev
```

- 本地预览打包产物：

```bash
npm run build
npm run preview
```

- 部署到 GitHub Pages（仓库已推送到 GitHub 且配置好 remote）：

```bash
npm run deploy
```

项目主要文件说明

- `src/`：React 源码（`App.jsx`、`components/MapView.jsx`、`components/PackingList.jsx` 等）。
- `public/`：静态资源，会被 Vite 映射到站点根路径（例如 `public/assets/bg-oil.jpg` → `/assets/bg-oil.jpg`）。
- `data/itinerary_full.json`：行程主数据（天数、景点、经纬度、停留时长、交通信息）。直接编辑该文件以修改行程。
- `data/packing.json`：行李清单数据。
- `scripts/extract.js`：（可选）用于从 PDF 中抽取文本并生成初步 JSON（需 Node 环境与 `pdf-parse`）。
- `scripts/geocode.js`：（可选）使用 Nominatim 对地址/地点做批量地理编码，脚本包含节流与重试机制，请在本地运行以避免触发限流。

常用脚本

- 启动开发服务器：

```bash
npm run dev
```

- 从 PDF 提取（如果想直接传参数给脚本，使用 node 命令）：

```bash
npm run extract
# 或者
node scripts/extract.js path/to/your.pdf
```

- 运行地理编码脚本（本地运行以保证合规）：

```bash
npm run geocode
# 或者带参数运行：
node scripts/geocode.js
```

背景图片与样式

- 背景图片位置：`public/assets/bg-oil.jpg`（页面使用 `/assets/bg-oil.jpg`）。
- 页面会在背景上应用 SVG 油画滤镜与遮罩；若想调整亮度或滤镜强度，请编辑 `src/styles.css` 中 `.body-bg::before` 与 `.body-bg::after` 的 `filter` 与 `background` 设置。

如何修改行程数据

- 打开并编辑 `data/itinerary_full.json`：每个 `day` 包含 `places` 数组，单项应包含 `name`, `lat`, `lng`, `time`, `duration_minutes`, `transport` 等字段。修改后保存，开发服务器会热重载。

部署注意事项

- `npm run deploy` 使用 `gh-pages` 将 `dist` 发布到 GitHub Pages：请确保仓库有远程且你有权限推送。若要发布到自定义域或其它主机，请根据目标平台调整构建产物的托管方式。

常见问题与排查

- 背景不显示：确认图片位于 `public/assets/bg-oil.jpg`，并在浏览器开发者工具 Network 面板检查是否返回 200。Vite 将 `public` 映射到根路径。
- 地图瓦片加载慢或无法加载：检查网络或改用其他瓦片服务（需遵守服务条款）。
- 批量地理编码被限流（HTTP 429）：不要同时在多台机器运行；脚本已带延迟/重试，若仍被限流请增加请求间隔。

如果你希望，我可以：

- 帮你把当前 `data/itinerary_full.json` 校对并补全经纬度（需要你允许我在本地运行 geocode 并提交结果，或你在本地运行脚本后发回结果）；
- 代为提交并推送到 GitHub（需要你授权并提供远程仓库 URL 或在本地执行 `git push`）；
- 生成更详尽的部署文档（Netlify / Vercel / Docker 等）。

欢迎告诉我下一步希望我代劳的具体项。
