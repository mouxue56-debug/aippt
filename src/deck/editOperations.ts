import render from "dom-serializer";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { Element, Text, isTag } from "domhandler";
import type { DeckModel, EditOperation, EditableElement, LayoutInput, TextStyleProperty, VisualBlockInput } from "./types";

function findTarget(html: string, editId: string): { document: ReturnType<typeof parseDocument>; target: Element | null } {
  const document = parseDocument(html, { recognizeSelfClosing: true });
  const target = DomUtils.findOne((node) => isTag(node) && node.attribs?.["data-edit-id"] === editId, document.children);
  return { document, target: target ?? null };
}

function replaceTextContent(element: Element, value: string): void {
  element.children = [new Text(value)];
}

function updateEditable(editable: EditableElement, operation: EditOperation): EditableElement {
  if (
    operation.type === "set-slide-motion" ||
    operation.type === "insert-visual-block" ||
    operation.type === "set-layout" ||
    operation.type === "delete-object"
  ) {
    return editable;
  }
  if (editable.id !== operation.editId) return editable;
  if (operation.type === "replace-text") return { ...editable, text: operation.value };
  if (operation.type === "replace-image") return { ...editable, src: operation.src, text: operation.alt };
  return editable;
}

export function applyEditOperation(deck: DeckModel, operation: EditOperation): DeckModel {
  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      if (slide.id !== operation.slideId) return slide;
      if (operation.type === "set-slide-motion") {
        const document = parseDocument(slide.html, { recognizeSelfClosing: true });
        const slideRoot = findSlideRoot(document);
        if (!slideRoot) return slide;
        slideRoot.attribs["data-motion-preset"] = operation.preset;
        return { ...slide, html: render(document.children, { encodeEntities: "utf8" }) };
      }

      if (operation.type === "insert-visual-block") {
        const document = parseDocument(slide.html, { recognizeSelfClosing: true });
        const slideRoot = findSlideRoot(document);
        if (!slideRoot) return slide;
        const block = buildVisualBlock(slide.id, operation.block, slide.editable.length + 1);
        const blockDocument = parseDocument(block.html, { recognizeSelfClosing: true });
        slideRoot.children.push(...blockDocument.children);
        return {
          ...slide,
          html: render(document.children, { encodeEntities: "utf8" }),
          editable: [...slide.editable, ...block.editable]
        };
      }

      if (operation.type === "set-layout") {
        const { document, target } = findTarget(slide.html, operation.editId);
        if (!target) return slide;
        target.attribs.style = mergeStyle(target.attribs.style ?? "", layoutToStyle(operation.layout, target.attribs.style ?? "", target.attribs["data-role"]));
        return { ...slide, html: render(document.children, { encodeEntities: "utf8" }) };
      }

      if (operation.type === "delete-object") {
        const { document, target } = findTarget(slide.html, operation.editId);
        if (!target) return slide;
        DomUtils.removeElement(target);
        return {
          ...slide,
          html: render(document.children, { encodeEntities: "utf8" }),
          editable: slide.editable.filter((item) => item.id !== operation.editId)
        };
      }

      const { document, target } = findTarget(slide.html, operation.editId);
      if (!target) return slide;

      if (operation.type === "replace-text") {
        replaceTextContent(target, operation.value);
      }

      if (operation.type === "set-style") {
        if (isAllowedTextStyleProperty(operation.property)) {
          target.attribs.style = mergeStyle(target.attribs.style ?? "", {
            [operation.property]: operation.value
          });
        }
      }

      if (operation.type === "replace-image") {
        const imageTarget = target.name.toLowerCase() === "img" ? target : DomUtils.findOne((node) => isTag(node) && node.name.toLowerCase() === "img", target.children);
        if (imageTarget) {
          imageTarget.attribs.src = operation.src;
          imageTarget.attribs.alt = operation.alt;
        }
      }

      if (operation.type === "set-motion") {
        target.attribs["data-motion"] = operation.preset;
      }

      const updatedEditable = slide.editable.map((item) => updateEditable(item, operation));
      const updatedTitle =
        operation.type === "replace-text" && slide.editable.some((item) => item.id === operation.editId && item.role === "title")
          ? operation.value
          : slide.title;

      return {
        ...slide,
        title: updatedTitle,
        html: render(document.children, { encodeEntities: "utf8" }),
        editable: updatedEditable
      };
    })
  };
}

function isAllowedTextStyleProperty(property: string): property is TextStyleProperty {
  return [
    "color",
    "font-size",
    "font-weight",
    "font-style",
    "text-align",
    "line-height",
    "letter-spacing",
    "text-shadow"
  ].includes(property);
}

function findSlideRoot(document: ReturnType<typeof parseDocument>): Element | null {
  const root = DomUtils.findOne((node) => {
    if (!isTag(node)) return false;
    const className = node.attribs?.class ?? "";
    return className.split(/\s+/).includes("slide");
  }, document.children);
  return root ?? null;
}

function buildVisualBlock(slideId: string, input: VisualBlockInput, offset: number): { html: string; editable: EditableElement[] } {
  const baseId = `${slideId}-${input.kind}-${String(offset).padStart(2, "0")}`;
  if (input.kind === "image") {
    const editId = `${baseId}-image`;
    const src = input.src ?? "";
    const alt = input.alt ?? "插入图片";
    return {
      html: `<figure class="aippt-visual-card aippt-image-block" data-aippt-block="image" data-edit-id="${editId}" data-role="image" data-ai-policy="manual-only" style="position:absolute;left:720px;top:180px;width:360px;"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="width:100%;max-height:360px;object-fit:contain;border-radius:6px;"><figcaption data-edit-id="${baseId}-caption" data-role="note" data-ai-policy="rewrite-ok">图片说明</figcaption></figure>`,
      editable: [
        { id: editId, role: "image", policy: "manual-only", src, selectorHint: `[data-edit-id="${editId}"]` },
        { id: `${baseId}-caption`, role: "note", policy: "rewrite-ok", text: "图片说明", selectorHint: `[data-edit-id="${baseId}-caption"]` }
      ]
    };
  }

  if (input.kind === "process") {
    return diagramBlock(baseId, "process", ["输入资料", "AI 生成", "人工精修", "导出展示"], "流程图");
  }

  if (input.kind === "mindmap") {
    return {
      html: `<div class="aippt-visual-card aippt-mindmap" data-aippt-block="mindmap" style="display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:14px;align-items:center;text-align:center;"><div data-edit-id="${baseId}-left" data-role="body" data-ai-policy="rewrite-ok">素材</div><strong data-edit-id="${baseId}-center" data-role="title" data-ai-policy="rewrite-ok" style="color:var(--accent-a,#00e5ff);font-size:24px;">核心主题</strong><div data-edit-id="${baseId}-right" data-role="body" data-ai-policy="rewrite-ok">输出</div></div>`,
      editable: [
        editableText(`${baseId}-left`, "素材"),
        editableText(`${baseId}-center`, "核心主题", "title"),
        editableText(`${baseId}-right`, "输出")
      ]
    };
  }

  return {
    html: `<div class="aippt-visual-card aippt-gantt" data-aippt-block="gantt" style="display:grid;gap:10px;"><div data-edit-id="${baseId}-title" data-role="title" data-ai-policy="rewrite-ok" style="color:var(--accent-a,#00e5ff);font-weight:800;">执行节奏</div>${["准备", "生成", "精修"].map((label, index) => `<div style="display:grid;grid-template-columns:80px 1fr;gap:10px;align-items:center;"><span data-edit-id="${baseId}-task-${index + 1}" data-role="body" data-ai-policy="rewrite-ok">${label}</span><i style="display:block;height:12px;border-radius:999px;background:linear-gradient(90deg,var(--accent-a,#00e5ff),var(--accent-b,#b44dff));width:${55 + index * 18}%;"></i></div>`).join("")}</div>`,
    editable: [
      editableText(`${baseId}-title`, "执行节奏", "title"),
      editableText(`${baseId}-task-1`, "准备"),
      editableText(`${baseId}-task-2`, "生成"),
      editableText(`${baseId}-task-3`, "精修")
    ]
  };
}

function layoutToStyle(layout: LayoutInput, currentStyle: string, role?: string): Record<string, string> {
  const current = parseStyle(currentStyle);
  const hasAnchor = current.get("position") === "absolute" || current.has("left") || current.has("top");
  const shouldPosition = [layout.x, layout.y].some((value) => typeof value === "number") || (hasAnchor && [layout.dx, layout.dy].some((value) => typeof value === "number"));
  const styles: Record<string, string> = shouldPosition ? { position: "absolute" } : {};
  if (shouldPosition && role && ["title", "subtitle", "metric", "cta"].includes(role)) {
    styles["word-break"] = "keep-all";
    styles["overflow-wrap"] = "normal";
  }
  if (typeof layout.x === "number") styles.left = `${layout.x}px`;
  if (typeof layout.y === "number") styles.top = `${layout.y}px`;
  if (shouldPosition && typeof layout.dx === "number") styles.left = `${readPx(current.get("left")) + layout.dx}px`;
  if (shouldPosition && typeof layout.dy === "number") styles.top = `${readPx(current.get("top")) + layout.dy}px`;
  if (!shouldPosition && (typeof layout.dx === "number" || typeof layout.dy === "number")) {
    styles.transform = appendTranslate(current.get("transform"), layout.dx ?? 0, layout.dy ?? 0);
  }
  if (typeof layout.width === "number") styles.width = `${layout.width}px`;
  if (typeof layout.height === "number") styles.height = `${layout.height}px`;
  if (typeof layout.zIndex === "number") styles["z-index"] = String(layout.zIndex);
  return styles;
}

function appendTranslate(transform: string | undefined, dx: number, dy: number): string {
  const base = !transform || transform === "none" ? "" : `${transform} `;
  return `${base}translate(${dx}px, ${dy}px)`;
}

function mergeStyle(style: string, updates: Record<string, string>): string {
  const map = parseStyle(style);
  for (const [key, value] of Object.entries(updates)) {
    map.set(key, value);
  }
  return Array.from(map.entries()).map(([key, value]) => `${key}: ${value}`).join("; ");
}

function parseStyle(style: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of style.split(";")) {
    const [rawKey, ...rawValue] = part.split(":");
    const key = rawKey?.trim();
    const value = rawValue.join(":").trim();
    if (key && value) map.set(key, value);
  }
  return map;
}

function readPx(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function diagramBlock(baseId: string, kind: "process", labels: string[], title: string): { html: string; editable: EditableElement[] } {
  const steps = labels
    .map(
      (label, index) =>
        `<div style="display:flex;align-items:center;gap:10px;"><span style="color:var(--accent-c,#ffb347);font-family:var(--font-mono,monospace);">${String(index + 1).padStart(2, "0")}</span><strong data-edit-id="${baseId}-step-${index + 1}" data-role="body" data-ai-policy="rewrite-ok">${label}</strong></div>`
    )
    .join('<span style="color:var(--accent-a,#00e5ff);">→</span>');
  return {
    html: `<div class="aippt-visual-card aippt-process" data-aippt-block="${kind}"><div data-edit-id="${baseId}-title" data-role="title" data-ai-policy="rewrite-ok" style="margin-bottom:14px;color:var(--accent-a,#00e5ff);font-weight:800;">${title}</div><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;">${steps}</div></div>`,
    editable: [editableText(`${baseId}-title`, title, "title"), ...labels.map((label, index) => editableText(`${baseId}-step-${index + 1}`, label))]
  };
}

function editableText(id: string, text: string, role: EditableElement["role"] = "body"): EditableElement {
  return {
    id,
    role,
    policy: "rewrite-ok",
    text,
    selectorHint: `[data-edit-id="${id}"]`
  };
}

function escapeAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
