import { editorHref, storyboardSlicerHref } from "./publicMode";

const tools = [
  {
    href: editorHref(),
    title: "HTML PPT 精修台",
    badge: "可用",
    description: "导入 AI 生成的网页 PPT，在浏览器本地改文字、颜色、图片、页面顺序和动效，再导出单文件 HTML。",
    meta: "本地处理 / 不开放 AI 后端"
  },
  {
    href: storyboardSlicerHref(),
    title: "分镜格图裁切器",
    badge: "新增",
    description: "把 6、8、12、25 格等分镜大图裁成多个小图片，支持格线修正、倍率放大和浏览器本地保存。",
    meta: "本地处理 / 不上传图片"
  }
];

export function ToolsHome() {
  return (
    <main className="tools-home">
      <header className="tools-header">
        <div>
          <p className="eyebrow">福楽 AI Tools</p>
          <h1>网页工具合集</h1>
        </div>
        <div className="tools-header-actions">
          <a href="https://github.com/mouxue56-debug/aippt" className="home-link">GitHub</a>
          <a href="https://fuluckai.com/" className="home-link">返回主页</a>
        </div>
      </header>

      <section className="tools-intro">
        <h2>视频里出现的 AI 工作流网页工具，会逐步放在这里。</h2>
        <p>公开版优先提供不需要账号、不上传服务器、观众能直接复刻的工具。涉及私有模型、内部接口和 API Key 的能力只保留在内部版。</p>
        <div className="share-strip" aria-label="分享入口">
          <span>公开预览：GitHub Pages</span>
          <span>官网路径：fuluckai.com/tools</span>
          <span>部署包：release/fuluckai-tools</span>
        </div>
      </section>

      <section className="tool-grid" aria-label="工具列表">
        {tools.map((tool) => (
          <a key={tool.href} className="tool-card" href={tool.href}>
            <span>{tool.badge}</span>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <em>{tool.meta}</em>
          </a>
        ))}
      </section>
    </main>
  );
}
