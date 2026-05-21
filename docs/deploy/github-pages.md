# GitHub Pages Deployment

公开仓库可以直接用 GitHub Pages 给观众预览和复刻。

当前公开仓库：

```txt
https://github.com/mouxue56-debug/aippt
```

当前 Pages 地址：

```txt
https://mouxue56-debug.github.io/aippt/
```

分享结构：

- `https://mouxue56-debug.github.io/aippt/`：网页工具合集首页，适合直接发给观众。
- `https://mouxue56-debug.github.io/aippt/#/aippt`：HTML PPT 精修台编辑器直达入口。

默认 Actions 工作流：

```txt
.github/workflows/pages.yml
```

它会在 `main` 分支 push 后：

1. 安装依赖。
2. 跑 `npm test`。
3. 用公开模式构建。
4. 生成 `404.html` 和 `.nojekyll`，让 GitHub Pages 支持 SPA fallback。
5. 发布到 GitHub Pages。

当前仓库名按 `aippt` 设计，因此 Pages base path 是：

```txt
/aippt/
```

如果仓库名改掉，需要同步修改 workflow 里的：

```txt
VITE_AIPPT_BASE_PATH
```

公开版边界：

- 只处理本地 HTML 文件。
- 不开放 URL 抓取。
- 不开放内部 AI/API 能力。
- 草稿保存在用户浏览器本地。

## Failed Run Note

2026-05-20 收到过一次 GitHub 邮件提示失败。失败 run 是 `26156803402`，原因是早期测试引用了本机文件：

```txt
/Users/willma/Downloads/deepseek_html_20260519_8c8811.html
```

GitHub runner 没有这个本机路径，所以 `npm test` 报 `ENOENT`。后续已把参考 deck 放进仓库 fixture，并且后续 workflow run 已通过。
