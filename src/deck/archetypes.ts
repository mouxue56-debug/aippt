export interface ArchetypeInfo {
  id: string;
  label: string;
  role: string;
}

export const archetypes: ArchetypeInfo[] = [
  { id: "cover-claim", label: "主题封面", role: "开场定调" },
  { id: "answer-first", label: "结论先行页", role: "开场定调" },
  { id: "value-promise", label: "价值承诺页", role: "开场定调" },
  { id: "audience-fit", label: "适用人群页", role: "开场定调" },
  { id: "pain-teaser", label: "痛点预告页", role: "开场定调" },
  { id: "agenda-roadmap", label: "全局路线图页", role: "开场定调" },
  { id: "broken-status", label: "现状崩坏页", role: "问题与痛点" },
  { id: "pain-grid", label: "痛点清单页", role: "问题与痛点" },
  { id: "negative-case", label: "反面案例页", role: "问题与痛点" },
  { id: "old-process-diagnosis", label: "旧流程解剖页", role: "问题与痛点" },
  { id: "myth-truth", label: "认知误区页", role: "问题与痛点" },
  { id: "turning-point", label: "转折引子页", role: "问题与痛点" },
  { id: "three-pillars", label: "核心概念三分页", role: "概念与框架" },
  { id: "framework-map", label: "方法论总图页", role: "概念与框架" },
  { id: "input-output-map", label: "变量关系页", role: "概念与框架" },
  { id: "layer-breakdown", label: "框架拆解页", role: "概念与框架" },
  { id: "term-compare", label: "术语对照页", role: "概念与框架" },
  { id: "mechanism-diagram", label: "原理示意页", role: "概念与框架" },
  { id: "before-after", label: "前后对比页", role: "证据与案例" },
  { id: "case-card", label: "案例卡片页", role: "证据与案例" },
  { id: "metric-proof", label: "数据证据页", role: "证据与案例" },
  { id: "screenshot-proof", label: "现场截图页", role: "证据与案例" },
  { id: "decision-compare", label: "对比决策页", role: "证据与案例" },
  { id: "testimonial", label: "证言页", role: "证据与案例" },
  { id: "step-breakdown", label: "步骤分解页", role: "教学与操作" },
  { id: "workflow-overview", label: "工作流总览页", role: "教学与操作" },
  { id: "task-checklist", label: "任务清单页", role: "教学与操作" },
  { id: "template-example", label: "模板示例页", role: "教学与操作" },
  { id: "role-matrix", label: "角色分工页", role: "教学与操作" },
  { id: "rules-redline", label: "规则与禁区页", role: "教学与操作" },
  { id: "key-summary", label: "关键总结页", role: "收束与传播" },
  { id: "upgrade-path", label: "路线升级页", role: "收束与传播" },
  { id: "action-assignment", label: "行动任务页", role: "收束与传播" },
  { id: "faq", label: "FAQ 页", role: "收束与传播" },
  { id: "closing-slogan", label: "收官口号页", role: "收束与传播" },
  { id: "share-invite", label: "分享邀请页", role: "收束与传播" }
];

export const defaultCourseSequence = [
  "cover-claim",
  "value-promise",
  "pain-teaser",
  "broken-status",
  "three-pillars",
  "framework-map",
  "mechanism-diagram",
  "before-after",
  "case-card",
  "metric-proof",
  "step-breakdown",
  "template-example",
  "task-checklist",
  "key-summary",
  "upgrade-path",
  "closing-slogan"
];

export function getArchetypeLabel(id: string): string {
  return archetypes.find((item) => item.id === id)?.label ?? id;
}

