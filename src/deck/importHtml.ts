import render from "dom-serializer";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { Element, isTag } from "domhandler";
import type { DeckModel, EditableElement, EditPolicy, EditRole, SlideModel } from "./types";

const SLIDES_PLACEHOLDER = "__AIPPT_SLIDES__";

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

function findSlides(html: string): Element[] {
  const document = parseDocument(html, { recognizeSelfClosing: true });
  const slides = DomUtils.findAll((node) => {
    if (!isTag(node)) return false;
    const className = getAttr(node, "class") ?? "";
    return className.split(/\s+/).includes("slide");
  }, document.children);
  if (slides.length > 0) return slides;

  const sections = DomUtils.findAll((node) => {
    if (!isTag(node)) return false;
    const tag = node.name.toLowerCase();
    return tag === "section" && textOf(node).length > 12;
  }, document.children).slice(0, 24);
  if (sections.length > 0) return sections.map((section, index) => prepareGenericSlide(section, index));

  const body = DomUtils.findOne((node) => isTag(node) && node.name.toLowerCase() === "body", document.children);
  if (body) return [prepareGenericSlide(body, 0)];
  return [];
}

function prepareGenericSlide(element: Element, index: number): Element {
  const className = getAttr(element, "class") ?? "";
  const classes = new Set(className.split(/\s+/).filter(Boolean));
  classes.add("slide");
  if (index === 0) classes.add("active");
  setAttr(element, "class", Array.from(classes).join(" "));
  return element;
}

function roleForElement(element: Element): EditRole {
  const explicit = getAttr(element, "data-role") as EditRole | undefined;
  if (explicit) return explicit;

  const tag = element.name.toLowerCase();
  const className = getAttr(element, "class") ?? "";
  if (className.includes("slide-title") || tag === "h1") return "title";
  if (className.includes("slide-subtitle") || tag === "h2") return "subtitle";
  if (tag === "img") return "image";
  if (className.includes("quote")) return "quote";
  if (className.includes("card-icon")) return "icon";
  if (className.includes("metric") || className.includes("number")) return "metric";
  if (tag === "a" || tag === "button") return "cta";
  if (["h3", "h4", "h5", "h6"].includes(tag)) return "body";
  if (tag === "div" && textOf(element) && isLeafTextBlock(element)) return "body";
  if (
    className.includes("section-label") ||
    className.includes("card-title") ||
    className.includes("card-text") ||
    tag === "figcaption" ||
    tag === "p" ||
    tag === "li" ||
    tag === "td" ||
    tag === "th" ||
    tag === "span" ||
    tag === "small" ||
    tag === "strong" ||
    tag === "em" ||
    tag === "text" ||
    tag === "tspan"
  ) {
    return "body";
  }
  return "unknown";
}

function policyForElement(element: Element, role: EditRole): EditPolicy {
  const explicit = getAttr(element, "data-ai-policy") as EditPolicy | undefined;
  if (explicit) return explicit;
  if (role === "image") return "manual-only";
  return "rewrite-ok";
}

function shouldBeEditable(element: Element): boolean {
  if (getAttr(element, "data-edit-id")) return true;
  const tag = element.name.toLowerCase();
  const className = getAttr(element, "class") ?? "";
  const text = textOf(element);
  if (tag === "img") return true;
  if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "span", "small", "strong", "em", "a", "button", "figcaption", "text", "tspan"].includes(tag) && text) return true;
  if (tag === "div" && text && isLeafTextBlock(element)) return true;
  return [
    "section-label",
    "slide-title",
    "slide-subtitle",
    "card-icon",
    "card-title",
    "card-text",
    "quote-text",
    "card-highlight"
  ].some((name) => className.includes(name));
}

function isLeafTextBlock(element: Element): boolean {
  return !element.children.some((child) => isTag(child) && child.name.toLowerCase() !== "br");
}

function findEditable(slide: Element, slideId: string): EditableElement[] {
  const nodes = DomUtils.findAll((node) => isTag(node) && shouldBeEditable(node), slide.children);
  const topLevelNodes = filterNestedEditableNodes(nodes, slide);
  const seen = new Set<string>();

  return topLevelNodes
    .map((node, index) => {
      const role = roleForElement(node);
      if (role === "unknown") return null;
      const id = getAttr(node, "data-edit-id") ?? `${slideId}-${role}-${String(index + 1).padStart(2, "0")}`;
      if (seen.has(id)) return null;
      seen.add(id);

      const policy = policyForElement(node, role);
      setAttr(node, "data-edit-id", id);
      setAttr(node, "data-role", role);
      setAttr(node, "data-ai-policy", policy);

      const editable: EditableElement = {
        id,
        role,
        policy,
        text: role === "image" ? undefined : textOf(node),
        src: role === "image" ? getAttr(node, "src") : undefined,
        selectorHint: `[data-edit-id="${id}"]`
      };
      return editable;
    })
    .filter((item): item is EditableElement => item !== null);
}

function filterNestedEditableNodes(nodes: Element[], slide: Element): Element[] {
  const editableNodes = new Set(nodes);
  return nodes.filter((node) => {
    let parent = node.parent;
    while (parent && parent !== slide) {
      if (isTag(parent) && editableNodes.has(parent)) return false;
      parent = parent.parent;
    }
    return true;
  });
}

function titleForSlide(slide: Element): string {
  const titleElement = DomUtils.findOne((node) => {
    if (!isTag(node)) return false;
    const className = getAttr(node, "class") ?? "";
    return node.name.toLowerCase() === "h1" || className.includes("slide-title");
  }, slide.children);
  return titleElement ? textOf(titleElement) : `Slide ${getAttr(slide, "data-index") ?? ""}`.trim();
}

function purposeForIndex(index: number): string {
  if (index === 0) return "hook";
  if (index <= 2) return "pain";
  if (index <= 6) return "framework";
  if (index <= 10) return "proof";
  if (index <= 13) return "teaching";
  return "cta";
}

function archetypeForIndex(index: number): string {
  const defaults = [
    "cover-claim",
    "value-promise",
    "pain-teaser",
    "three-pillars",
    "framework-map",
    "layer-breakdown",
    "case-card",
    "workflow-overview",
    "role-matrix",
    "template-example",
    "step-breakdown",
    "rules-redline",
    "action-assignment",
    "metric-proof",
    "key-summary",
    "share-invite"
  ];
  return defaults[index] ?? "legacy-slide";
}

function buildShellHtml(html: string): string {
  const containerMatch = html.match(/<(?<tag>div|main|section)\b(?=[^>]*id=["']slides-container["'])[^>]*>/i);
  if (!containerMatch || containerMatch.index === undefined) {
    const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "<head><meta charset=\"UTF-8\"><title>AIPPT Import</title></head>";
    return `<!DOCTYPE html><html lang="zh-CN">${head}<body data-aippt-version="0.1"><main id="slides-container">${SLIDES_PLACEHOLDER}</main></body></html>`;
  }

  const openEnd = containerMatch.index + containerMatch[0].length;
  const closeMarker = /<\/(div|main|section)>\s*<!--\s*\/slides-container\s*-->/i;
  const closeFromBody = html.slice(openEnd).search(closeMarker);
  if (closeFromBody >= 0) {
    const closeStart = openEnd + closeFromBody;
    return `${html.slice(0, openEnd)}\n${SLIDES_PLACEHOLDER}\n${html.slice(closeStart)}`;
  }

  const firstSlide = html.indexOf('class="slide', openEnd);
  const lastSlide = html.lastIndexOf('<div class="slide');
  if (firstSlide >= 0 && lastSlide >= firstSlide) {
    const lastEndMarker = html.indexOf("</div>", lastSlide);
    if (lastEndMarker >= 0) {
      return `${html.slice(0, firstSlide)}${SLIDES_PLACEHOLDER}${html.slice(lastEndMarker + "</div>".length)}`;
    }
  }

  return `${html}\n<!-- ${SLIDES_PLACEHOLDER} -->`;
}

export function importHtmlDeck(html: string): DeckModel {
  const slides = findSlides(html);
  const warnings: string[] = [];
  if (slides.length === 0) warnings.push("No .slide elements were found.");

  const models: SlideModel[] = slides.map((slide, index) => {
    const id = getAttr(slide, "data-slide-id") ?? `s${String(index + 1).padStart(2, "0")}`;
    setAttr(slide, "data-slide-id", id);
    setAttr(slide, "data-index", String(index));
    setAttr(slide, "data-archetype", getAttr(slide, "data-archetype") ?? archetypeForIndex(index));
    setAttr(slide, "data-purpose", getAttr(slide, "data-purpose") ?? purposeForIndex(index));
    setAttr(slide, "data-edit-scope", getAttr(slide, "data-edit-scope") ?? "text");
    if (index === 0) {
      const className = getAttr(slide, "class") ?? "slide";
      if (!className.split(/\s+/).includes("active")) setAttr(slide, "class", `${className} active`);
    }

    const editable = findEditable(slide, id);

    return {
      id,
      index,
      archetype: getAttr(slide, "data-archetype") ?? "legacy-slide",
      purpose: getAttr(slide, "data-purpose") ?? "content",
      title: titleForSlide(slide),
      html: render(slide, { encodeEntities: "utf8" }),
      editable,
      snsCandidate: getAttr(slide, "data-sns-candidate") === "true" || [0, 2, 7, 14, 15].includes(index)
    };
  });

  return {
    id: `deck-${Date.now()}`,
    title: extractTitle(html),
    aipptVersion: "0.1",
    originalHtml: html,
    shellHtml: buildShellHtml(html),
    slides: models,
    warnings
  };
}

function extractTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/is);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "Imported HTML PPT";
}

export { SLIDES_PLACEHOLDER };
