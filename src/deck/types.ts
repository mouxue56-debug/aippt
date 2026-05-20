export type EditPolicy = "rewrite-ok" | "style-only" | "manual-only" | "locked";

export type EditRole =
  | "title"
  | "subtitle"
  | "body"
  | "quote"
  | "metric"
  | "image"
  | "icon"
  | "cta"
  | "note"
  | "unknown";

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
  id: string;
  title: string;
  aipptVersion: string;
  originalHtml: string;
  shellHtml: string;
  slides: SlideModel[];
  warnings: string[];
}

export type VisualBlockKind = "image" | "process" | "mindmap" | "gantt";

export interface VisualBlockInput {
  kind: VisualBlockKind;
  src?: string;
  alt?: string;
}

export interface LayoutInput {
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}

export type TextStyleProperty =
  | "color"
  | "font-size"
  | "font-weight"
  | "font-style"
  | "text-align"
  | "line-height"
  | "letter-spacing"
  | "text-shadow";

export interface CanvasLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EditOperation =
  | { type: "replace-text"; slideId: string; editId: string; value: string }
  | { type: "set-style"; slideId: string; editId: string; property: string; value: string }
  | { type: "replace-image"; slideId: string; editId: string; src: string; alt: string }
  | { type: "set-motion"; slideId: string; editId: string; preset: string }
  | { type: "set-slide-motion"; slideId: string; preset: string }
  | { type: "insert-visual-block"; slideId: string; block: VisualBlockInput }
  | { type: "set-layout"; slideId: string; editId: string; layout: LayoutInput }
  | { type: "delete-object"; slideId: string; editId: string };
