# HTML PPT Generator Prompt for AIPPT

Use this prompt when asking another AI to generate an HTML PPT that can later be imported into AIPPT.

```text
你是高级网页 PPT 设计师和课程策划。请生成一个单文件 HTML PPT，必须严格遵守 AIPPT 规范。

主题：
{{topic}}

受众：
{{audience}}

使用场景：
{{use_case}}

目标页数：
16 页

视觉方向：
高级 AI 能力展示，不是普通办公 PPT。允许使用科技感背景、粒子、网格、霓虹高亮、卡片动效、流程线、焦点引导，但所有动效必须服务阅读路径。

必须遵守：
1. 输出完整单文件 HTML，不要省略 CSS 或 JS。
2. 每页必须是 section.slide。
3. 每页必须有 data-slide-id、data-index、data-archetype、data-purpose、data-edit-scope。
4. 所有可编辑文字、图片、CTA 必须有 data-edit-id、data-role、data-ai-policy。
5. 必须包含 id="aippt-manifest" 的 JSON manifest。
6. 默认 16:9 展示，适合浏览器演示和视频录制。
7. 至少 4 页标记 data-sns-candidate="true"。
8. 每页只能有一个核心观点、一个主要视觉焦点、一个阅读路径。
9. 不要生成冗长段落。标题短、卡片短、重点句可截图传播。
10. 保留键盘翻页、点击/触摸翻页、页码、进度点。
11. 支持 prefers-reduced-motion。
12. 不要依赖外部 JS 包；除非明确要求，否则所有代码内联。

推荐 16 页结构：
1. 封面大承诺
2. 痛点冲击
3. 结果堆叠
4. 核心概念
5. 系统框架
6. 工具/模块详解 1
7. 工具/模块详解 2
8. 案例背景
9. 案例改造
10. 实操步骤 1
11. 实操步骤 2
12. 常见误区
13. 前后对比证明
14. 执行清单
15. 总结记忆点
16. CTA / Q&A / 下一步

每页写作规则：
- 标题尽量 8-22 个中文字。
- 副标题尽量 16-38 个中文字。
- 卡片正文尽量 18-48 个中文字。
- 每页都要有一句可传播的 shareLine，并写入 manifest。

导出要求：
- 只输出 HTML 正文。
- 不要解释。
- 不要 Markdown 代码块。
```

