# AIPPT Archetype ID Map

Status: draft v0.1  
Date: 2026-05-19

## Purpose

`TEMPLATE_LIBRARY_TAXONOMY.md` uses Chinese names because they are easier for the user and content AIs to reason about. The editor and generator need stable English ids. This file maps both layers.

Rule:

- UI may show Chinese names.
- Manifest and HTML must use stable English ids in `data-archetype`.
- Prompt templates may include both.

## Archetype Mapping

| ID | Chinese name | Narrative role | Typical purpose |
|---|---|---|---|
| `cover-claim` | 主题封面 | 开场定调 | hook |
| `answer-first` | 结论先行页 | 开场定调 | hook |
| `value-promise` | 价值承诺页 | 开场定调 | outcome |
| `audience-fit` | 适用人群页 | 开场定调 | relevance |
| `pain-teaser` | 痛点预告页 | 开场定调 | tension |
| `agenda-roadmap` | 全局路线图页 | 开场定调 | roadmap |
| `broken-status` | 现状崩坏页 | 问题与痛点 | pain |
| `pain-grid` | 痛点清单页 | 问题与痛点 | pain |
| `negative-case` | 反面案例页 | 问题与痛点 | risk |
| `old-process-diagnosis` | 旧流程解剖页 | 问题与痛点 | diagnosis |
| `myth-truth` | 认知误区页 | 问题与痛点 | correction |
| `turning-point` | 转折引子页 | 问题与痛点 | transition |
| `three-pillars` | 核心概念三分页 | 概念与框架 | framework |
| `framework-map` | 方法论总图页 | 概念与框架 | system |
| `input-output-map` | 变量关系页 | 概念与框架 | relation |
| `layer-breakdown` | 框架拆解页 | 概念与框架 | explanation |
| `term-compare` | 术语对照页 | 概念与框架 | alignment |
| `mechanism-diagram` | 原理示意页 | 概念与框架 | mechanism |
| `before-after` | 前后对比页 | 证据与案例 | proof |
| `case-card` | 案例卡片页 | 证据与案例 | case |
| `metric-proof` | 数据证据页 | 证据与案例 | proof |
| `screenshot-proof` | 现场截图页 | 证据与案例 | demo |
| `decision-compare` | 对比决策页 | 证据与案例 | decision |
| `testimonial` | 证言页 | 证据与案例 | trust |
| `step-breakdown` | 步骤分解页 | 教学与操作 | teaching |
| `workflow-overview` | 工作流总览页 | 教学与操作 | workflow |
| `task-checklist` | 任务清单页 | 教学与操作 | action |
| `template-example` | 模板示例页 | 教学与操作 | template |
| `role-matrix` | 角色分工页 | 教学与操作 | organization |
| `rules-redline` | 规则与禁区页 | 教学与操作 | boundary |
| `key-summary` | 关键总结页 | 收束与传播 | summary |
| `upgrade-path` | 路线升级页 | 收束与传播 | next-stage |
| `action-assignment` | 行动任务页 | 收束与传播 | task |
| `faq` | FAQ 页 | 收束与传播 | answer |
| `closing-slogan` | 收官口号页 | 收束与传播 | memory |
| `share-invite` | 分享邀请页 | 收束与传播 | cta |

## Default 16-Slide Course Sequence

Use ids in deck manifests:

1. `cover-claim`
2. `value-promise`
3. `pain-teaser`
4. `broken-status`
5. `three-pillars`
6. `framework-map`
7. `mechanism-diagram`
8. `before-after`
9. `case-card`
10. `metric-proof`
11. `step-breakdown`
12. `template-example`
13. `task-checklist`
14. `key-summary`
15. `upgrade-path`
16. `closing-slogan`

## Default 16-Slide Training Sequence

Use ids in deck manifests:

1. `cover-claim`
2. `audience-fit`
3. `pain-grid`
4. `myth-truth`
5. `term-compare`
6. `framework-map`
7. `workflow-overview`
8. `step-breakdown`
9. `template-example`
10. `role-matrix`
11. `rules-redline`
12. `screenshot-proof`
13. `decision-compare`
14. `action-assignment`
15. `faq`
16. `share-invite`

