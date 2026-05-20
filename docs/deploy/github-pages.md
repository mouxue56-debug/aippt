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

默认 Actions 工作流：

```txt
.github/workflows/pages.yml
```

它会在 `main` 分支 push 后：

1. 安装依赖。
2. 跑 `npm test`。
3. 用公开模式构建。
4. 发布到 GitHub Pages。

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
