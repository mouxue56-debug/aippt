import render from "dom-serializer";
import { Element, Text, isTag } from "domhandler";
import { DomUtils, parseDocument } from "htmlparser2";
import type { DeckModel, EditableElement, SlideModel } from "./types";

export function addBlankSlide(deck: DeckModel, afterSlideId?: string): { deck: DeckModel; slideId: string } {
  const slideId = nextSlideId(deck);
  const slide = buildBlankSlide(slideId, deck.slides.length);
  const insertAt = insertIndexAfter(deck, afterSlideId);
  const slides = [...deck.slides.slice(0, insertAt), slide, ...deck.slides.slice(insertAt)];
  return { deck: { ...deck, slides: reindexSlides(slides) }, slideId };
}

export function deleteSlide(deck: DeckModel, slideId: string): DeckModel {
  if (deck.slides.length <= 1) return deck;
  return { ...deck, slides: reindexSlides(deck.slides.filter((slide) => slide.id !== slideId)) };
}

export function duplicateSlide(deck: DeckModel, slideId: string): { deck: DeckModel; slideId: string } {
  const source = deck.slides.find((slide) => slide.id === slideId);
  if (!source) return { deck, slideId };

  const nextId = nextSlideId(deck);
  const copy = rewriteSlideIdentity(source, nextId);
  const insertAt = insertIndexAfter(deck, slideId);
  const slides = [...deck.slides.slice(0, insertAt), copy, ...deck.slides.slice(insertAt)];
  return { deck: { ...deck, slides: reindexSlides(slides) }, slideId: nextId };
}

export function moveSlide(deck: DeckModel, slideId: string, direction: "up" | "down"): DeckModel {
  const currentIndex = deck.slides.findIndex((slide) => slide.id === slideId);
  if (currentIndex < 0) return deck;
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= deck.slides.length) return deck;

  const slides = [...deck.slides];
  const [slide] = slides.splice(currentIndex, 1);
  slides.splice(nextIndex, 0, slide);
  return { ...deck, slides: reindexSlides(slides) };
}

function buildBlankSlide(slideId: string, index: number): SlideModel {
  const titleId = `${slideId}-title`;
  const bodyId = `${slideId}-body`;
  return {
    id: slideId,
    index,
    archetype: "blank-visual",
    purpose: "content",
    title: "新页面标题",
    html: `<section class="slide" data-slide-id="${slideId}" data-index="${index}" data-archetype="blank-visual" data-purpose="content" data-edit-scope="text">
  <h1 class="slide-title" data-edit-id="${titleId}" data-role="title" data-ai-policy="rewrite-ok">新页面标题</h1>
  <p class="slide-subtitle" data-edit-id="${bodyId}" data-role="body" data-ai-policy="rewrite-ok">在这里写关键观点，或继续补充本页内容。</p>
</section>`,
    editable: [
      { id: titleId, role: "title", policy: "rewrite-ok", text: "新页面标题", selectorHint: `[data-edit-id="${titleId}"]` },
      {
        id: bodyId,
        role: "body",
        policy: "rewrite-ok",
        text: "在这里写关键观点，或继续补充本页内容。",
        selectorHint: `[data-edit-id="${bodyId}"]`
      }
    ],
    snsCandidate: false
  };
}

function rewriteSlideIdentity(slide: SlideModel, nextId: string): SlideModel {
  const document = parseDocument(slide.html, { recognizeSelfClosing: true });
  const root = findSlideRoot(document);
  const idMap = new Map<string, string>();

  slide.editable.forEach((item, index) => {
    idMap.set(item.id, remapEditableId(slide.id, nextId, item, index));
  });

  if (root) {
    root.attribs["data-slide-id"] = nextId;
    removeClass(root, "active");
    const editableNodes = DomUtils.findAll((node) => isTag(node) && !!node.attribs?.["data-edit-id"], [root]);
    editableNodes.forEach((node) => {
      const current = node.attribs["data-edit-id"];
      const next = idMap.get(current);
      if (next) node.attribs["data-edit-id"] = next;
      if (next && node.attribs["data-role"] === "title") node.children = [new Text(`${slide.title} 副本`)];
    });
  }

  const editable = slide.editable.map((item, index) => {
    const nextEditableId = idMap.get(item.id) ?? remapEditableId(slide.id, nextId, item, index);
    return {
      ...item,
      id: nextEditableId,
      text: item.role === "title" ? `${slide.title} 副本` : item.text,
      selectorHint: `[data-edit-id="${nextEditableId}"]`
    };
  });

  return {
    ...slide,
    id: nextId,
    index: slide.index + 1,
    title: `${slide.title} 副本`,
    html: render(document.children, { encodeEntities: "utf8" }),
    editable,
    snsCandidate: false
  };
}

function reindexSlides(slides: SlideModel[]): SlideModel[] {
  return slides.map((slide, index) => {
    const document = parseDocument(slide.html, { recognizeSelfClosing: true });
    const root = findSlideRoot(document);
    if (root) {
      root.attribs["data-index"] = String(index);
      if (index === 0) addClass(root, "active");
      else removeClass(root, "active");
    }
    return {
      ...slide,
      index,
      html: render(document.children, { encodeEntities: "utf8" })
    };
  });
}

function findSlideRoot(document: ReturnType<typeof parseDocument>): Element | null {
  const root = DomUtils.findOne((node) => {
    if (!isTag(node)) return false;
    const className = node.attribs?.class ?? "";
    return className.split(/\s+/).includes("slide");
  }, document.children);
  return root ?? null;
}

function addClass(element: Element, className: string): void {
  const classes = new Set((element.attribs.class ?? "").split(/\s+/).filter(Boolean));
  classes.add(className);
  element.attribs.class = Array.from(classes).join(" ");
}

function removeClass(element: Element, className: string): void {
  const classes = (element.attribs.class ?? "").split(/\s+/).filter((item) => item && item !== className);
  element.attribs.class = classes.join(" ");
}

function insertIndexAfter(deck: DeckModel, slideId?: string): number {
  const selectedIndex = slideId ? deck.slides.findIndex((slide) => slide.id === slideId) : -1;
  return selectedIndex >= 0 ? selectedIndex + 1 : deck.slides.length;
}

function nextSlideId(deck: DeckModel): string {
  const used = new Set(deck.slides.map((slide) => slide.id));
  let index = deck.slides.length + 1;
  let id = `s${String(index).padStart(2, "0")}`;
  while (used.has(id)) {
    index += 1;
    id = `s${String(index).padStart(2, "0")}`;
  }
  return id;
}

function remapEditableId(oldSlideId: string, newSlideId: string, editable: EditableElement, index: number): string {
  if (editable.id.startsWith(oldSlideId)) return `${newSlideId}${editable.id.slice(oldSlideId.length)}`;
  return `${newSlideId}-${editable.role}-${String(index + 1).padStart(2, "0")}`;
}
