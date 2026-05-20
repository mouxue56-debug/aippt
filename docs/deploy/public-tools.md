# Public Tools Deployment

目标入口：

- `/tools/`：福楽 AI 工具合集
- `/tools/aippt`：HTML PPT 精修台公开版

公开版约束：

- 不显示 HMS/Hermes/单页 AI 面板。
- 不开放 URL 抓取导入，只允许用户选择本地 HTML 文件。
- 用户内容在浏览器本地处理，保存草稿使用 `localStorage`，导出通过浏览器下载。

## Build

```bash
npm install
npm run build:public
```

`build:public` 会使用：

- `VITE_AIPPT_PUBLIC_MODE=1`
- `VITE_AIPPT_BASE_PATH=/tools/`

因此 `dist/` 的内容应作为主站静态目录 `/tools/` 的内容发布。

如果要生成一个能直接交给主站合并的包，使用：

```bash
npm run package:public
```

输出目录：

```txt
release/fuluckai-tools/
├── _headers
├── _redirects
├── DEPLOYMENT.md
└── tools/
```

## Main Site Integration

推荐路线：如果 `fuluckai.com` 主站是 Cloudflare Pages 或普通静态站：

1. 将本项目 `dist/` 内容复制到主站的 `public/tools/` 或等效静态目录。
2. 配置以下 fallback，让 `/tools/aippt` 返回 `/tools/index.html`：

```txt
/tools/aippt /tools/index.html 200
/tools/aippt/* /tools/index.html 200
```

3. 在主站导航添加 `/tools/` 入口。

备选路线：如果独立部署为 Cloudflare Pages 项目，建议先绑定子域：

- `tools.fuluckai.com`
- 或 `ppt.fuluckai.com`

不要直接抢占现有 `fuluckai.com` 根域绑定。

## Verification

```bash
npm test
npm run build:public
```

发布后检查：

- `https://fuluckai.com/tools/`
- `https://fuluckai.com/tools/aippt`
- 上传本地 HTML 文件后能编辑、保存、导出。
- 页面上不出现 `单页 AI`、`HMS`、`Hermes`、`导入网页`。

## Auto Recommendation

结合当前知识库和线上验证，推荐优先级如下：

1. **首选：合并进 fuluckai.com 主站的 Cloudflare Pages 发布目录。** 知识库记录 fuluckai.com 已经在 Cloudflare Pages 上运行，公开版 AIPPT 是纯静态工具，适合直接挂在 `/tools/`。这样不会新增一个抢根域的部署项目，也方便以后工具合集继续扩展。
2. **备选：独立 Cloudflare Pages 子域。** 如果暂时找不到主站源码或主站构建流程不稳定，用 `tools.fuluckai.com` 或 `ppt.fuluckai.com` 先上线，等主站目录确认后再迁移到 `/tools/`。
3. **不推荐：新项目直接绑定 fuluckai.com 根域。** 知识库里已有 aiblog 子站因为多个 Vercel 项目争抢同一 alias 导致 404 的历史，根域工具页也应避免同类问题。

当前线上状态：`https://fuluckai.com/tools/` 和 `https://fuluckai.com/tools/aippt` 会返回主站首页 HTML，说明工具目录尚未真正发布。
