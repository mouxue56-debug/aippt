import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");
const releaseDir = join(root, "release", "fuluckai-tools");
const toolsDir = join(releaseDir, "tools");

await rm(releaseDir, { recursive: true, force: true });
await mkdir(toolsDir, { recursive: true });
await cp(distDir, toolsDir, { recursive: true });

await writeFile(
  join(releaseDir, "_redirects"),
  [
    "/tools/aippt /tools/index.html 200",
    "/tools/aippt/* /tools/index.html 200",
    ""
  ].join("\n")
);

await writeFile(
  join(releaseDir, "_headers"),
  [
    "/tools/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/tools/*",
    "  Cache-Control: public, max-age=0, must-revalidate",
    ""
  ].join("\n")
);

await writeFile(
  join(releaseDir, "DEPLOYMENT.md"),
  [
    "# fuluckai.com tools package",
    "",
    "推荐部署方式：把本目录内容合并进 fuluckai.com 主站的 Cloudflare Pages 发布目录。",
    "",
    "合并后路径：",
    "",
    "- `/tools/` -> 工具合集",
    "- `/tools/aippt` -> HTML PPT 精修台公开版",
    "",
    "文件说明：",
    "",
    "- `tools/`：AIPPT public build 产物。",
    "- `_redirects`：让 `/tools/aippt` 回落到 `/tools/index.html`。",
    "- `_headers`：给 hashed assets 设置长期缓存，HTML 保持即时更新。",
    "",
    "发布后验证：",
    "",
    "```bash",
    "curl -I https://fuluckai.com/tools/",
    "curl -I https://fuluckai.com/tools/aippt",
    "curl -L https://fuluckai.com/tools/aippt | head",
    "```",
    "",
    "公开版边界：只允许本地 HTML 文件导入，不开放 URL 抓取、私有模型、内部 API 或 AI 面板。",
    ""
  ].join("\n")
);

console.log(`Packaged public tools bundle at ${releaseDir}`);
