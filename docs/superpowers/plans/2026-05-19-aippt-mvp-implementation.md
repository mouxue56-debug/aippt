# AIPPT MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable AIPPT loop: import a single-file HTML PPT, inspect/edit one slide, route a single-slide AI edit through a pluggable adapter, export a single-file HTML deck, and verify it in the browser.

**Architecture:** Use a small local web app with a strict separation between imported source HTML, parsed deck model, edit operations, and exported HTML. The first parser is conservative: preserve runnable deck assets and scripts, edit only known slide fragments, and validate export by opening the result in a browser.

**Tech Stack:** Node.js, TypeScript, Vite, React, `parse5` or `htmlparser2` for HTML parsing, Playwright for browser verification, local filesystem storage during MVP, HMS/Hermes adapter behind a narrow API.

---

## File Structure

The implementation should create a focused app under the existing empty workspace:

- `package.json`: scripts and dependencies.
- `index.html`: Vite shell.
- `src/main.tsx`: React entrypoint.
- `src/app/App.tsx`: top-level layout and state wiring.
- `src/deck/types.ts`: `DeckModel`, `SlideModel`, `EditableElement`, `EditOperation`.
- `src/deck/importHtml.ts`: conservative HTML importer.
- `src/deck/exportHtml.ts`: single-file HTML exporter.
- `src/deck/editOperations.ts`: apply text/style/media/motion operations to a deck model.
- `src/deck/archetypes.ts`: archetype ids and Chinese labels from `docs/specs/ARCHETYPE_ID_MAP.md`.
- `src/ai/slideEditClient.ts`: HMS/Hermes client boundary plus local fallback.
- `src/ui/SlideList.tsx`: left slide list.
- `src/ui/SlidePreview.tsx`: isolated slide preview.
- `src/ui/Inspector.tsx`: right-side edit controls.
- `src/ui/AiSlidePanel.tsx`: single-slide AI edit panel.
- `src/ui/ExportPanel.tsx`: export and validation controls.
- `tests/deck/importHtml.test.ts`: importer tests.
- `tests/deck/exportHtml.test.ts`: exporter tests.
- `tests/deck/editOperations.test.ts`: editing tests.
- `tests/ai/slideEditClient.test.ts`: AI boundary tests.
- `tests/browser/aippt-smoke.spec.ts`: Playwright browser smoke test.

## Task 1: Scaffold the Local App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/app.css`

- [ ] **Step 1: Create package scripts and dependencies**

Create `package.json`:

```json
{
  "name": "aippt",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke": "playwright test tests/browser/aippt-smoke.spec.ts"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "htmlparser2": "^10.0.0",
    "dom-serializer": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^7.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create Vite HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AIPPT</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create the entrypoint**

Create `src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./app/app.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Create the initial layout**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <aside className="panel panel-left">Slides</aside>
      <section className="stage">Import an HTML PPT to begin.</section>
      <aside className="panel panel-right">Inspector</aside>
    </main>
  );
}
```

Create `src/app/app.css`:

```css
:root {
  color-scheme: dark;
  --bg: #080911;
  --panel: #111420;
  --border: #253043;
  --text: #eef5ff;
  --muted: #93a4ba;
  --accent: #00e5ff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.app-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 320px;
  height: 100vh;
}

.panel {
  background: var(--panel);
  border-color: var(--border);
  border-style: solid;
  padding: 16px;
  overflow: auto;
}

.panel-left {
  border-width: 0 1px 0 0;
}

.panel-right {
  border-width: 0 0 0 1px;
}

.stage {
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--muted);
}
```

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm install
npm run build
```

Expected: build succeeds and `dist/` is created.

## Task 2: Define Deck Types and Archetypes

**Files:**
- Create: `src/deck/types.ts`
- Create: `src/deck/archetypes.ts`
- Test: `tests/deck/archetypes.test.ts`

- [ ] **Step 1: Write archetype test**

Create `tests/deck/archetypes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { archetypes, getArchetypeLabel } from "../../src/deck/archetypes";

describe("archetypes", () => {
  it("contains the default course sequence ids", () => {
    const ids = new Set(archetypes.map((item) => item.id));
    expect(ids.has("cover-claim")).toBe(true);
    expect(ids.has("framework-map")).toBe(true);
    expect(ids.has("closing-slogan")).toBe(true);
  });

  it("returns a Chinese label for known ids", () => {
    expect(getArchetypeLabel("cover-claim")).toBe("主题封面");
  });
});
```

- [ ] **Step 2: Add deck types**

Create `src/deck/types.ts`:

```ts
export type EditPolicy = "rewrite-ok" | "style-only" | "manual-only" | "locked";
export type EditRole = "title" | "subtitle" | "body" | "quote" | "metric" | "image" | "icon" | "cta" | "note" | "unknown";

export interface EditableElement {
  id: string;
  role: EditRole;
  policy: EditPolicy;
  text?: string;
  src?: string;
  selectorHint: string;
}

export interface SlideModel {
  id: string;
  index: number;
  archetype: string;
  purpose: string;
  title: string;
  html: string;
  editable: EditableElement[];
  snsCandidate: boolean;
}

export interface DeckModel {
  title: string;
  aipptVersion: string;
  originalHtml: string;
  headHtml: string;
  beforeSlidesHtml: string;
  afterSlidesHtml: string;
  slides: SlideModel[];
  warnings: string[];
}

export type EditOperation =
  | { type: "replace-text"; slideId: string; editId: string; value: string }
  | { type: "set-style"; slideId: string; editId: string; property: string; value: string }
  | { type: "replace-image"; slideId: string; editId: string; src: string; alt: string }
  | { type: "set-motion"; slideId: string; editId: string; preset: string };
```

- [ ] **Step 3: Add archetype registry**

Create `src/deck/archetypes.ts`:

```ts
export const archetypes = [
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
] as const;

export function getArchetypeLabel(id: string): string {
  return archetypes.find((item) => item.id === id)?.label ?? id;
}
```

- [ ] **Step 4: Run archetype test**

Run:

```bash
npm test -- tests/deck/archetypes.test.ts
```

Expected: tests pass.

## Task 3: Build Conservative HTML Importer

**Files:**
- Create: `src/deck/importHtml.ts`
- Test: `tests/deck/importHtml.test.ts`

- [ ] **Step 1: Write importer tests**

Create `tests/deck/importHtml.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { importHtmlDeck } from "../../src/deck/importHtml";

const samplePath = "/Users/willma/Downloads/deepseek_html_20260519_8c8811.html";

describe("importHtmlDeck", () => {
  it("imports the reference deck as 16 slides", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);

    expect(deck.slides).toHaveLength(16);
    expect(deck.slides[0].index).toBe(0);
    expect(deck.slides[0].id).toBe("s01");
    expect(deck.slides[0].title).toContain("用ChatGPT搭建");
    expect(deck.warnings).toEqual(expect.any(Array));
  });

  it("discovers editable title-like elements", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);

    const firstSlide = deck.slides[0];
    expect(firstSlide.editable.some((item) => item.role === "title")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement importer**

Create `src/deck/importHtml.ts`:

```ts
import { DomUtils, Element, Text } from "htmlparser2";
import { parseDocument } from "htmlparser2";
import render from "dom-serializer";
import type { DeckModel, EditableElement, EditPolicy, EditRole, SlideModel } from "./types";

function getAttr(element: Element, name: string): string | undefined {
  return element.attribs?.[name];
}

function setAttr(element: Element, name: string, value: string): void {
  element.attribs = element.attribs ?? {};
  element.attribs[name] = value;
}

function textOf(element: Element): string {
  return DomUtils.textContent(element).replace(/\s+/g, " ").trim();
}

function findSlides(root: ReturnType<typeof parseDocument>): Element[] {
  return DomUtils.findAll((node) => {
    if (!(node instanceof Element)) return false;
    const className = getAttr(node, "class") ?? "";
    return className.split(/\s+/).includes("slide");
  }, root.children);
}

function roleForElement(element: Element): EditRole {
  const existing = getAttr(element, "data-role") as EditRole | undefined;
  if (existing) return existing;

  const className = getAttr(element, "class") ?? "";
  const tagName = element.name.toLowerCase();
  if (className.includes("slide-title") || tagName === "h1") return "title";
  if (className.includes("slide-subtitle") || tagName === "h2") return "subtitle";
  if (tagName === "img") return "image";
  if (className.includes("quote")) return "quote";
  if (className.includes("card") || tagName === "p" || tagName === "li" || tagName === "td") return "body";
  return "unknown";
}

function policyForElement(element: Element): EditPolicy {
  const existing = getAttr(element, "data-ai-policy") as EditPolicy | undefined;
  if (existing) return existing;
  if (element.name.toLowerCase() === "img") return "manual-only";
  return "rewrite-ok";
}

function findEditable(slide: Element, slideId: string): EditableElement[] {
  const candidates = DomUtils.findAll((node) => {
    if (!(node instanceof Element)) return false;
    const tag = node.name.toLowerCase();
    const className = getAttr(node, "class") ?? "";
    return Boolean(
      getAttr(node, "data-edit-id") ||
        tag === "h1" ||
        tag === "h2" ||
        tag === "p" ||
        tag === "li" ||
        tag === "td" ||
        tag === "img" ||
        className.includes("slide-title") ||
        className.includes("slide-subtitle") ||
        className.includes("card-title") ||
        className.includes("card-text")
    );
  }, slide.children);

  return candidates
    .map((node, index) => {
      const editId = getAttr(node, "data-edit-id") ?? `${slideId}-auto-${String(index + 1).padStart(2, "0")}`;
      setAttr(node, "data-edit-id", editId);
      const role = roleForElement(node);
      const policy = policyForElement(node);
      setAttr(node, "data-role", role);
      setAttr(node, "data-ai-policy", policy);
      const item: EditableElement = {
        id: editId,
        role,
        policy,
        text: role === "image" ? undefined : textOf(node),
        src: role === "image" ? getAttr(node, "src") : undefined,
        selectorHint: `[data-edit-id="${editId}"]`
      };
      return item;
    })
    .filter((item) => item.role !== "unknown");
}

function titleForSlide(slide: Element): string {
  const title = DomUtils.findOne((node) => {
    if (!(node instanceof Element)) return false;
    const className = getAttr(node, "class") ?? "";
    return node.name.toLowerCase() === "h1" || className.includes("slide-title");
  }, slide.children);

  return title instanceof Element ? textOf(title) : `Slide ${getAttr(slide, "data-index") ?? ""}`.trim();
}

export function importHtmlDeck(html: string): DeckModel {
  const document = parseDocument(html, { recognizeSelfClosing: true });
  const slides = findSlides(document);
  const warnings: string[] = [];

  if (slides.length === 0) warnings.push("No .slide elements were found.");

  const models: SlideModel[] = slides.map((slide, index) => {
    const id = getAttr(slide, "data-slide-id") ?? `s${String(index + 1).padStart(2, "0")}`;
    setAttr(slide, "data-slide-id", id);
    setAttr(slide, "data-index", String(index));
    if (!getAttr(slide, "data-archetype")) setAttr(slide, "data-archetype", index === 0 ? "cover-claim" : "legacy-slide");
    if (!getAttr(slide, "data-purpose")) setAttr(slide, "data-purpose", index === 0 ? "hook" : "content");
    if (!getAttr(slide, "data-edit-scope")) setAttr(slide, "data-edit-scope", "text");

    const editable = findEditable(slide, id);
    return {
      id,
      index,
      archetype: getAttr(slide, "data-archetype") ?? "legacy-slide",
      purpose: getAttr(slide, "data-purpose") ?? "content",
      title: titleForSlide(slide),
      html: render(slide),
      editable,
      snsCandidate: getAttr(slide, "data-sns-candidate") === "true"
    };
  });

  return {
    title: "Imported HTML PPT",
    aipptVersion: "0.1",
    originalHtml: html,
    headHtml: "",
    beforeSlidesHtml: "",
    afterSlidesHtml: "",
    slides: models,
    warnings
  };
}
```

- [ ] **Step 3: Run importer tests**

Run:

```bash
npm test -- tests/deck/importHtml.test.ts
```

Expected: imports the reference file as 16 slides.

## Task 4: Build Manual Text Editing and Export

**Files:**
- Create: `src/deck/editOperations.ts`
- Create: `src/deck/exportHtml.ts`
- Test: `tests/deck/editOperations.test.ts`
- Test: `tests/deck/exportHtml.test.ts`

- [ ] **Step 1: Write edit operation test**

Create `tests/deck/editOperations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyEditOperation } from "../../src/deck/editOperations";
import type { DeckModel } from "../../src/deck/types";

function deck(): DeckModel {
  return {
    title: "Test",
    aipptVersion: "0.1",
    originalHtml: "",
    headHtml: "",
    beforeSlidesHtml: "",
    afterSlidesHtml: "",
    warnings: [],
    slides: [
      {
        id: "s01",
        index: 0,
        archetype: "cover-claim",
        purpose: "hook",
        title: "Old",
        html: '<section class="slide" data-slide-id="s01"><h1 data-edit-id="s01-title">Old</h1></section>',
        editable: [{ id: "s01-title", role: "title", policy: "rewrite-ok", text: "Old", selectorHint: '[data-edit-id="s01-title"]' }],
        snsCandidate: true
      }
    ]
  };
}

describe("applyEditOperation", () => {
  it("replaces editable text in one slide", () => {
    const edited = applyEditOperation(deck(), { type: "replace-text", slideId: "s01", editId: "s01-title", value: "New Title" });
    expect(edited.slides[0].html).toContain("New Title");
    expect(edited.slides[0].title).toBe("New Title");
  });
});
```

- [ ] **Step 2: Implement edit operations**

Create `src/deck/editOperations.ts`:

```ts
import { DomUtils, Element, Text } from "htmlparser2";
import { parseDocument } from "htmlparser2";
import render from "dom-serializer";
import type { DeckModel, EditOperation } from "./types";

function findByEditId(html: string, editId: string): Element | null {
  const document = parseDocument(html);
  return (
    DomUtils.findOne((node) => node instanceof Element && node.attribs?.["data-edit-id"] === editId, document.children) ??
    null
  );
}

function replaceTextContent(element: Element, value: string): void {
  element.children = [new Text(value)];
}

export function applyEditOperation(deck: DeckModel, operation: EditOperation): DeckModel {
  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      if (slide.id !== operation.slideId) return slide;
      const document = parseDocument(slide.html);
      const target = DomUtils.findOne(
        (node) => node instanceof Element && node.attribs?.["data-edit-id"] === operation.editId,
        document.children
      );
      if (!(target instanceof Element)) return slide;

      if (operation.type === "replace-text") {
        replaceTextContent(target, operation.value);
      }
      if (operation.type === "set-style") {
        const prior = target.attribs.style ? `${target.attribs.style}; ` : "";
        target.attribs.style = `${prior}${operation.property}: ${operation.value}`;
      }
      if (operation.type === "replace-image") {
        target.attribs.src = operation.src;
        target.attribs.alt = operation.alt;
      }
      if (operation.type === "set-motion") {
        target.attribs["data-motion"] = operation.preset;
      }

      const html = render(document.children);
      const titleEditable = slide.editable.find((item) => item.role === "title");
      const newTitle = titleEditable?.id === operation.editId && operation.type === "replace-text" ? operation.value : slide.title;
      return { ...slide, html, title: newTitle };
    })
  };
}
```

- [ ] **Step 3: Write export test**

Create `tests/deck/exportHtml.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exportHtmlDeck } from "../../src/deck/exportHtml";
import type { DeckModel } from "../../src/deck/types";

describe("exportHtmlDeck", () => {
  it("exports a single file with slide html and manifest", () => {
    const deck: DeckModel = {
      title: "Export Test",
      aipptVersion: "0.1",
      originalHtml: "",
      headHtml: "",
      beforeSlidesHtml: "",
      afterSlidesHtml: "",
      warnings: [],
      slides: [
        {
          id: "s01",
          index: 0,
          archetype: "cover-claim",
          purpose: "hook",
          title: "Title",
          html: '<section class="slide active" data-slide-id="s01">Title</section>',
          editable: [],
          snsCandidate: true
        }
      ]
    };

    const html = exportHtmlDeck(deck);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("aippt-manifest");
    expect(html).toContain("Title");
  });
});
```

- [ ] **Step 4: Implement exporter**

Create `src/deck/exportHtml.ts`:

```ts
import type { DeckModel } from "./types";

export function exportHtmlDeck(deck: DeckModel): string {
  const manifest = {
    aipptVersion: deck.aipptVersion,
    title: deck.title,
    aspect: "16:9",
    slideCount: deck.slides.length,
    slides: deck.slides.map((slide) => ({
      id: slide.id,
      index: slide.index,
      archetype: slide.archetype,
      purpose: slide.purpose,
      title: slide.title,
      snsCandidate: slide.snsCandidate,
      editable: slide.editable.map((item) => item.id)
    }))
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(deck.title)}</title>
  <style>
    body { margin: 0; background: #0a0a0f; color: #e8eef8; font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif; overflow: hidden; }
    #slides-container { width: 100vw; height: 100vh; position: relative; }
    .slide { position: absolute; inset: 0; display: none; padding: 60px 80px; }
    .slide.active { display: flex; }
  </style>
</head>
<body data-aippt-version="${deck.aipptVersion}">
  <main id="slides-container">
    ${deck.slides.map((slide, index) => normalizeActiveClass(slide.html, index === 0)).join("\n")}
  </main>
  <script type="application/json" id="aippt-manifest">${JSON.stringify(manifest)}</script>
  <script>
    (() => {
      const slides = Array.from(document.querySelectorAll(".slide"));
      let current = 0;
      function show(index) {
        if (index < 0 || index >= slides.length) return;
        current = index;
        slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
      }
      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") { event.preventDefault(); show(current + 1); }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); show(current - 1); }
      });
      show(0);
    })();
  </script>
</body>
</html>`;
}

function normalizeActiveClass(html: string, active: boolean): string {
  const withoutActive = html.replace(/\sactive(\s|")/g, "$1");
  if (!active) return withoutActive;
  return withoutActive.replace('class="slide', 'class="slide active');
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
```

- [ ] **Step 5: Run deck tests**

Run:

```bash
npm test -- tests/deck/editOperations.test.ts tests/deck/exportHtml.test.ts
```

Expected: tests pass.

## Task 5: Add HMS/Hermes Slide Edit Boundary

**Files:**
- Create: `src/ai/slideEditClient.ts`
- Test: `tests/ai/slideEditClient.test.ts`

- [ ] **Step 1: Write AI boundary tests**

Create `tests/ai/slideEditClient.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { localFallbackSlideEdit, validateSlideEditResponse } from "../../src/ai/slideEditClient";

describe("slide edit client", () => {
  it("rejects responses that remove the slide id", () => {
    const result = validateSlideEditResponse({
      updatedSlideHtml: '<section class="slide">Missing id</section>',
      patch: [],
      warnings: [],
      modelUsed: "test",
      costTokens: 0
    }, "s01");

    expect(result.ok).toBe(false);
  });

  it("local fallback only returns text-level changes", () => {
    const result = localFallbackSlideEdit("压缩标题", '<section class="slide" data-slide-id="s01"><h1>这是一个非常非常长的标题</h1></section>');
    expect(result.updatedSlideHtml).toContain("data-slide-id=\"s01\"");
    expect(result.warnings[0]).toContain("本地降级");
  });
});
```

- [ ] **Step 2: Implement AI boundary**

Create `src/ai/slideEditClient.ts`:

```ts
export interface SlideEditRequest {
  slideId: string;
  slideIndex: number;
  selectedHtml: string;
  editIntent: string;
  constraints: string[];
  templateId: string;
}

export interface SlideEditResponse {
  updatedSlideHtml: string;
  patch: Array<{ op: string; path: string; value?: string }>;
  warnings: string[];
  modelUsed: string;
  costTokens: number;
}

export function validateSlideEditResponse(response: SlideEditResponse, slideId: string): { ok: boolean; reason?: string } {
  if (!response.updatedSlideHtml.includes(`data-slide-id="${slideId}"`)) {
    return { ok: false, reason: "AI response removed or changed the selected slide id." };
  }
  if (/<script[\s>]/i.test(response.updatedSlideHtml)) {
    return { ok: false, reason: "AI response attempted to inject script into a slide fragment." };
  }
  if (/\son[a-z]+\s*=/i.test(response.updatedSlideHtml)) {
    return { ok: false, reason: "AI response attempted to add inline event handlers." };
  }
  return { ok: true };
}

export async function requestHermesSlideEdit(endpoint: string, request: SlideEditRequest): Promise<SlideEditResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error(`Hermes slide edit failed: ${response.status}`);
  }
  return (await response.json()) as SlideEditResponse;
}

export function localFallbackSlideEdit(editIntent: string, selectedHtml: string): SlideEditResponse {
  return {
    updatedSlideHtml: selectedHtml,
    patch: [],
    warnings: [`本地降级模式：已记录意图「${editIntent}」，未调用远端模型。`],
    modelUsed: "local-fallback",
    costTokens: 0
  };
}
```

- [ ] **Step 3: Run AI tests**

Run:

```bash
npm test -- tests/ai/slideEditClient.test.ts
```

Expected: tests pass.

## Task 6: Wire the MVP UI

**Files:**
- Modify: `src/app/App.tsx`
- Create: `src/ui/SlideList.tsx`
- Create: `src/ui/SlidePreview.tsx`
- Create: `src/ui/Inspector.tsx`
- Create: `src/ui/AiSlidePanel.tsx`
- Create: `src/ui/ExportPanel.tsx`

- [ ] **Step 1: Create slide list**

Create `src/ui/SlideList.tsx`:

```tsx
import type { SlideModel } from "../deck/types";

interface SlideListProps {
  slides: SlideModel[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function SlideList({ slides, selectedId, onSelect }: SlideListProps) {
  return (
    <div className="slide-list">
      {slides.map((slide) => (
        <button key={slide.id} className={slide.id === selectedId ? "slide-row selected" : "slide-row"} onClick={() => onSelect(slide.id)}>
          <span>{String(slide.index + 1).padStart(2, "0")}</span>
          <strong>{slide.title}</strong>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create slide preview**

Create `src/ui/SlidePreview.tsx`:

```tsx
import type { SlideModel } from "../deck/types";

interface SlidePreviewProps {
  slide?: SlideModel;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
  if (!slide) return <div className="empty-preview">Import an HTML PPT to begin.</div>;
  return <iframe className="slide-frame" title={slide.title} srcDoc={previewDoc(slide.html)} />;
}

function previewDoc(slideHtml: string): string {
  return `<!doctype html><html lang="zh-CN"><head><style>body{margin:0;background:#0a0a0f;color:#eef5ff;font-family:sans-serif}.slide{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;padding:48px;box-sizing:border-box}</style></head><body>${slideHtml}</body></html>`;
}
```

- [ ] **Step 3: Create inspector**

Create `src/ui/Inspector.tsx`:

```tsx
import type { EditableElement } from "../deck/types";

interface InspectorProps {
  editable: EditableElement[];
  onReplaceText: (editId: string, value: string) => void;
}

export function Inspector({ editable, onReplaceText }: InspectorProps) {
  return (
    <div className="inspector">
      <h2>精修</h2>
      {editable.filter((item) => item.text).map((item) => (
        <label key={item.id} className="field">
          <span>{item.role}</span>
          <textarea defaultValue={item.text} onBlur={(event) => onReplaceText(item.id, event.currentTarget.value)} />
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create AI panel and export panel**

Create `src/ui/AiSlidePanel.tsx`:

```tsx
interface AiSlidePanelProps {
  disabled: boolean;
}

export function AiSlidePanel({ disabled }: AiSlidePanelProps) {
  return (
    <section className="ai-panel">
      <h2>单页 AI</h2>
      <textarea placeholder="例如：把这一页改得更适合公开课讲解" disabled={disabled} />
      <button disabled={disabled}>生成单页草案</button>
    </section>
  );
}
```

Create `src/ui/ExportPanel.tsx`:

```tsx
interface ExportPanelProps {
  disabled: boolean;
  onExport: () => void;
}

export function ExportPanel({ disabled, onExport }: ExportPanelProps) {
  return (
    <section className="export-panel">
      <h2>导出</h2>
      <button disabled={disabled} onClick={onExport}>导出单文件 HTML</button>
    </section>
  );
}
```

- [ ] **Step 5: Wire App state**

Modify `src/app/App.tsx`:

```tsx
import { useMemo, useState } from "react";
import { importHtmlDeck } from "../deck/importHtml";
import { exportHtmlDeck } from "../deck/exportHtml";
import { applyEditOperation } from "../deck/editOperations";
import type { DeckModel } from "../deck/types";
import { AiSlidePanel } from "../ui/AiSlidePanel";
import { ExportPanel } from "../ui/ExportPanel";
import { Inspector } from "../ui/Inspector";
import { SlideList } from "../ui/SlideList";
import { SlidePreview } from "../ui/SlidePreview";

export function App() {
  const [deck, setDeck] = useState<DeckModel | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selectedSlide = useMemo(() => deck?.slides.find((slide) => slide.id === selectedId) ?? deck?.slides[0], [deck, selectedId]);

  async function importFile(file: File) {
    const html = await file.text();
    const nextDeck = importHtmlDeck(html);
    setDeck(nextDeck);
    setSelectedId(nextDeck.slides[0]?.id);
  }

  function replaceText(editId: string, value: string) {
    if (!deck || !selectedSlide) return;
    setDeck(applyEditOperation(deck, { type: "replace-text", slideId: selectedSlide.id, editId, value }));
  }

  function exportDeck() {
    if (!deck) return;
    const blob = new Blob([exportHtmlDeck(deck)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aippt-${Date.now()}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="panel panel-left">
        <input type="file" accept=".html,text/html" onChange={(event) => event.currentTarget.files?.[0] && importFile(event.currentTarget.files[0])} />
        <SlideList slides={deck?.slides ?? []} selectedId={selectedSlide?.id} onSelect={setSelectedId} />
      </aside>
      <section className="stage">
        <SlidePreview slide={selectedSlide} />
      </section>
      <aside className="panel panel-right">
        <Inspector editable={selectedSlide?.editable ?? []} onReplaceText={replaceText} />
        <AiSlidePanel disabled={!selectedSlide} />
        <ExportPanel disabled={!deck} onExport={exportDeck} />
      </aside>
    </main>
  );
}
```

- [ ] **Step 6: Add UI CSS**

Append to `src/app/app.css`:

```css
.slide-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.slide-row {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  background: #151a28;
  color: var(--text);
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
}

.slide-row.selected {
  border-color: var(--accent);
}

.slide-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slide-frame {
  width: min(100%, 1280px);
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
  background: #05070d;
}

.empty-preview {
  color: var(--muted);
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.field span {
  color: var(--muted);
  font-size: 12px;
}

textarea {
  min-height: 72px;
  resize: vertical;
  background: #0c101a;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
}

button {
  border: 1px solid var(--border);
  background: #172033;
  color: var(--text);
  border-radius: 6px;
  padding: 8px 10px;
}
```

- [ ] **Step 7: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 7: Add Browser Smoke Verification

**Files:**
- Create: `tests/browser/aippt-smoke.spec.ts`

- [ ] **Step 1: Create smoke test**

Create `tests/browser/aippt-smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("AIPPT app loads", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("http://127.0.0.1:5173");
  await expect(page.getByText("Slides")).toBeVisible();
  await expect(page.getByText("Inspector")).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run dev server and smoke test**

Run in one terminal:

```bash
npm run dev
```

Run in another terminal:

```bash
npm run smoke
```

Expected: Playwright test passes.

## Self-Review

Spec coverage:

- Import reference single-file deck: Tasks 3 and 6.
- Manual text refinement: Tasks 4 and 6.
- Export single-file HTML: Task 4.
- Single-slide AI boundary: Task 5.
- Browser verification: Task 7.
- Archetype/template contract: Task 2.

Known gaps intentionally deferred:

- Image replacement UI.
- Motion preset UI.
- Full original CSS/JS preserving exporter.
- 9:16 and 1:1 screenshot crop verification.
- Version history.

These gaps are v0.2/v1 work packages, not MVP blockers.

