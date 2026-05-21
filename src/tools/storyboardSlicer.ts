export type StoryboardImageFormat = "png" | "jpeg" | "webp";

export interface StoryboardGrid {
  rows: number;
  cols: number;
}

export interface StoryboardOptionsInput {
  rows?: unknown;
  cols?: unknown;
  panelCount?: unknown;
  marginX?: unknown;
  marginY?: unknown;
  gapX?: unknown;
  gapY?: unknown;
  trim?: unknown;
  scale?: unknown;
  startIndex?: unknown;
  quality?: unknown;
}

export interface NormalizedStoryboardOptions {
  rows: number;
  cols: number;
  panelCount: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  trim: number;
  scale: number;
  startIndex: number;
  quality: number;
}

export interface StoryboardTile {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const EXTENSION_BY_FORMAT: Record<StoryboardImageFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp"
};

function integerInRange(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function numberInRange(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function defaultStoryboardGrid(panelCount: unknown, imageWidth = 1, imageHeight = 1): StoryboardGrid {
  const count = integerInRange(panelCount, 1, 1, 400);
  const root = Math.sqrt(count);
  if (Number.isInteger(root)) return { rows: root, cols: root };

  const factors: StoryboardGrid[] = [];
  for (let rows = 1; rows <= count; rows += 1) {
    if (count % rows === 0) factors.push({ rows, cols: count / rows });
  }

  const portrait = imageHeight > imageWidth;
  const candidates = portrait ? factors.filter((grid) => grid.rows >= grid.cols) : factors.filter((grid) => grid.cols >= grid.rows);
  const pool = candidates.length ? candidates : factors;

  return pool.reduce((best, grid) => {
    const score = Math.abs(grid.rows - grid.cols);
    const bestScore = Math.abs(best.rows - best.cols);
    return score < bestScore ? grid : best;
  });
}

export function normalizeStoryboardOptions(options: StoryboardOptionsInput = {}): NormalizedStoryboardOptions {
  return {
    rows: integerInRange(options.rows, 1, 1, 20),
    cols: integerInRange(options.cols, 1, 1, 20),
    panelCount: integerInRange(options.panelCount, 1, 1, 400),
    marginX: integerInRange(options.marginX, 0, 0, 10000),
    marginY: integerInRange(options.marginY, 0, 0, 10000),
    gapX: integerInRange(options.gapX, 0, 0, 10000),
    gapY: integerInRange(options.gapY, 0, 0, 10000),
    trim: integerInRange(options.trim, 0, 0, 10000),
    scale: integerInRange(options.scale, 1, 1, 4),
    startIndex: integerInRange(options.startIndex, 1, 1, 10000),
    quality: numberInRange(options.quality, 0.92, 0.1, 1)
  };
}

export function computeStoryboardTiles(options: StoryboardOptionsInput & { imageWidth: unknown; imageHeight: unknown }): StoryboardTile[] {
  const normalized = normalizeStoryboardOptions(options);
  const imageWidth = integerInRange(options.imageWidth, 1, 1, 100000);
  const imageHeight = integerInRange(options.imageHeight, 1, 1, 100000);
  const tileCount = Math.min(normalized.panelCount, normalized.rows * normalized.cols);
  const availableWidth = imageWidth - normalized.marginX * 2 - normalized.gapX * (normalized.cols - 1);
  const availableHeight = imageHeight - normalized.marginY * 2 - normalized.gapY * (normalized.rows - 1);
  const cellWidth = Math.floor(availableWidth / normalized.cols);
  const cellHeight = Math.floor(availableHeight / normalized.rows);
  const width = Math.max(1, cellWidth - normalized.trim * 2);
  const height = Math.max(1, cellHeight - normalized.trim * 2);

  return Array.from({ length: tileCount }, (_, position) => {
    const index = position + 1;
    const row = Math.floor(position / normalized.cols);
    const col = position % normalized.cols;
    return {
      index,
      row,
      col,
      x: normalized.marginX + col * (cellWidth + normalized.gapX) + normalized.trim,
      y: normalized.marginY + row * (cellHeight + normalized.gapY) + normalized.trim,
      width,
      height
    };
  });
}

export function storyboardOutputName(
  prefix: string,
  tileIndex: number,
  totalCount: number,
  format: StoryboardImageFormat = "png",
  startIndex = 1
): string {
  const safePrefix = (prefix || "storyboard")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "storyboard";
  const sequence = tileIndex + integerInRange(startIndex, 1, 1, 10000) - 1;
  const digits = Math.max(String(totalCount + startIndex - 1).length, 2);
  return `${safePrefix}_${String(sequence).padStart(digits, "0")}.${EXTENSION_BY_FORMAT[format]}`;
}
