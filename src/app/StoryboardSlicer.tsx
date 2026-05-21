import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeStoryboardTiles,
  defaultStoryboardGrid,
  normalizeStoryboardOptions,
  storyboardOutputName,
  type StoryboardImageFormat,
  type StoryboardTile
} from "../tools/storyboardSlicer";

interface OutputImage {
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

interface SlicerControls {
  panelCount: string;
  rows: string;
  cols: string;
  marginX: string;
  marginY: string;
  gapX: string;
  gapY: string;
  trim: string;
  scale: string;
  format: StoryboardImageFormat;
  quality: string;
  startIndex: string;
  prefix: string;
  sharpen: boolean;
}

interface DirectoryHandle {
  getFileHandle(name: string, options: { create: boolean }): Promise<{ createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }> }>;
}

const MIME_BY_FORMAT: Record<StoryboardImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

const initialControls: SlicerControls = {
  panelCount: "9",
  rows: "3",
  cols: "3",
  marginX: "0",
  marginY: "0",
  gapX: "0",
  gapY: "0",
  trim: "0",
  scale: "2",
  format: "png",
  quality: "0.92",
  startIndex: "1",
  prefix: "storyboard",
  sharpen: true
};

function basename(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "storyboard";
}

function revokeOutputs(outputs: OutputImage[]) {
  outputs.forEach((output) => URL.revokeObjectURL(output.url));
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("浏览器没有生成图片。"));
      },
      mimeType,
      quality
    );
  });
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function sharpenCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || canvas.width < 3 || canvas.height < 3) return;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const source = new Uint8ClampedArray(data);
  const amount = 0.18;

  for (let y = 1; y < canvas.height - 1; y += 1) {
    for (let x = 1; x < canvas.width - 1; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source[offset + channel];
        const top = source[offset - canvas.width * 4 + channel];
        const bottom = source[offset + canvas.width * 4 + channel];
        const left = source[offset - 4 + channel];
        const right = source[offset + 4 + channel];
        data[offset + channel] = clampByte(center * (1 + amount * 4) - amount * (top + bottom + left + right));
      }
    }
  }

  context.putImageData(imageData, 0, 0);
}

export function StoryboardSlicer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const [controls, setControls] = useState<SlicerControls>(initialControls);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [imageMeta, setImageMeta] = useState("等待图片");
  const [summary, setSummary] = useState("未生成格线");
  const [status, setStatus] = useState("选择一张分镜格图开始。");
  const [outputs, setOutputs] = useState<OutputImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const options = useMemo(() => normalizeStoryboardOptions(controls), [controls]);
  const filePicker = window as Window & { showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandle> };

  useEffect(() => () => image?.close(), [image]);
  useEffect(() => () => revokeOutputs(outputs), [outputs]);

  function clearOutputs() {
    setOutputs((current) => {
      revokeOutputs(current);
      return [];
    });
  }

  function updateControl<K extends keyof SlicerControls>(key: K, value: SlicerControls[K]) {
    clearOutputs();
    setControls((current) => ({ ...current, [key]: value }));
  }

  function validateGeometry(tileOptions = options): string {
    if (!image) return "请先选择图片。";
    const usableWidth = image.width - tileOptions.marginX * 2 - tileOptions.gapX * (tileOptions.cols - 1);
    const usableHeight = image.height - tileOptions.marginY * 2 - tileOptions.gapY * (tileOptions.rows - 1);
    if (usableWidth <= 0 || usableHeight <= 0) return "边距或格线过大，已经超过图片尺寸。";
    const cellWidth = Math.floor(usableWidth / tileOptions.cols);
    const cellHeight = Math.floor(usableHeight / tileOptions.rows);
    if (cellWidth <= tileOptions.trim * 2 || cellHeight <= tileOptions.trim * 2) return "内缩过大，单格已经没有可裁切区域。";
    return "";
  }

  function drawPreview() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (!image) {
      canvas.width = 1;
      canvas.height = 1;
      setSummary("未生成格线");
      return;
    }

    const maxWidth = Math.max(320, (dropZoneRef.current?.clientWidth ?? 880) - 32);
    const maxHeight = Math.max(360, Math.round(window.innerHeight * 0.68));
    const previewScale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, Math.round(image.width * previewScale));
    const cssHeight = Math.max(1, Math.round(image.height * previewScale));

    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, cssWidth, cssHeight);

    const geometryError = validateGeometry();
    if (geometryError) {
      setSummary(geometryError);
      return;
    }

    const tiles = computeStoryboardTiles({ ...options, imageWidth: image.width, imageHeight: image.height });
    drawTileOverlay(context, tiles, previewScale);
    const first = tiles[0];
    setSummary(
      `${options.rows} 行 x ${options.cols} 列，输出 ${tiles.length} 张，单张 ${first.width}x${first.height} -> ${first.width * options.scale}x${first.height * options.scale}`
    );
  }

  useEffect(drawPreview, [image, options]);

  function drawTileOverlay(context: CanvasRenderingContext2D, tiles: StoryboardTile[], previewScale: number) {
    context.lineWidth = 2;
    context.strokeStyle = "#00b894";
    context.fillStyle = "rgba(0, 184, 148, 0.14)";
    context.font = "12px ui-sans-serif, system-ui, sans-serif";
    context.textBaseline = "top";
    tiles.forEach((tile) => {
      const x = tile.x * previewScale;
      const y = tile.y * previewScale;
      const width = tile.width * previewScale;
      const height = tile.height * previewScale;
      context.fillRect(x, y, width, height);
      context.strokeRect(x, y, width, height);
      context.fillStyle = "#00866d";
      context.fillRect(x + 4, y + 4, 28, 20);
      context.fillStyle = "#fff";
      context.fillText(String(tile.index), x + 10, y + 8);
      context.fillStyle = "rgba(0, 184, 148, 0.14)";
    });
  }

  async function loadFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("请选择图片文件。");
      return;
    }
    clearOutputs();
    const bitmap = await createImageBitmap(file);
    const grid = defaultStoryboardGrid(controls.panelCount, bitmap.width, bitmap.height);
    setImage(bitmap);
    setImageMeta(`${file.name} / ${bitmap.width}x${bitmap.height}`);
    setControls((current) => ({
      ...current,
      rows: String(grid.rows),
      cols: String(grid.cols),
      prefix: basename(file.name)
    }));
    setStatus("图片已载入。调整格数、边距或格线后生成小图。");
  }

  function autoGrid() {
    if (!image) return;
    const grid = defaultStoryboardGrid(controls.panelCount, image.width, image.height);
    clearOutputs();
    setControls((current) => ({ ...current, rows: String(grid.rows), cols: String(grid.cols) }));
  }

  async function generateSlices(): Promise<OutputImage[]> {
    if (!image) {
      setStatus("请先选择图片。");
      return [];
    }
    const geometryError = validateGeometry();
    if (geometryError) {
      setStatus(geometryError);
      return [];
    }

    setBusy(true);
    clearOutputs();
    const tiles = computeStoryboardTiles({ ...options, imageWidth: image.width, imageHeight: image.height });
    const nextOutputs: OutputImage[] = [];
    const mimeType = MIME_BY_FORMAT[controls.format];

    try {
      for (const [position, tile] of tiles.entries()) {
        setStatus(`正在生成 ${position + 1}/${tiles.length}...`);
        const canvas = document.createElement("canvas");
        canvas.width = tile.width * options.scale;
        canvas.height = tile.height * options.scale;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("浏览器不支持 Canvas。");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, tile.x, tile.y, tile.width, tile.height, 0, 0, canvas.width, canvas.height);
        if (controls.sharpen) sharpenCanvas(canvas);
        const blob = await canvasToBlob(canvas, mimeType, options.quality);
        nextOutputs.push({
          name: storyboardOutputName(controls.prefix, tile.index, tiles.length, controls.format, options.startIndex),
          blob,
          url: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height
        });
      }
      setOutputs(nextOutputs);
      setStatus(`已生成 ${nextOutputs.length} 张小图。`);
      return nextOutputs;
    } catch (error) {
      revokeOutputs(nextOutputs);
      setStatus(error instanceof Error ? error.message : "生成失败。");
      return [];
    } finally {
      setBusy(false);
    }
  }

  async function ensureOutputs(): Promise<OutputImage[]> {
    if (outputs.length) return outputs;
    return generateSlices();
  }

  async function saveToFolder() {
    if (!filePicker.showDirectoryPicker) {
      setStatus("当前浏览器不支持直接保存到文件夹，请使用逐张下载。");
      return;
    }
    const currentOutputs = await ensureOutputs();
    if (!currentOutputs.length) return;
    const directory = await filePicker.showDirectoryPicker({ mode: "readwrite" });
    setBusy(true);
    try {
      for (const [index, output] of currentOutputs.entries()) {
        setStatus(`正在保存 ${index + 1}/${currentOutputs.length}...`);
        const handle = await directory.getFileHandle(output.name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(output.blob);
        await writable.close();
      }
      setStatus(`已保存 ${currentOutputs.length} 张小图。`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadEach() {
    const currentOutputs = await ensureOutputs();
    for (const output of currentOutputs) {
      const anchor = document.createElement("a");
      anchor.href = output.url;
      anchor.download = output.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    if (currentOutputs.length) setStatus(`已触发 ${currentOutputs.length} 个下载。`);
  }

  return (
    <main className="slicer-shell">
      <header className="slicer-topbar">
        <div>
          <p className="eyebrow">福楽 AI Tools</p>
          <h1>分镜格图裁切器</h1>
          <p>{imageMeta}</p>
        </div>
        <nav className="slicer-nav" aria-label="工具导航">
          <a href="#/">网页工具合集</a>
          <label className="slicer-file-button">
            选择图片
            <input aria-label="分镜图片" type="file" accept="image/*" onChange={(event) => void loadFile(event.currentTarget.files?.[0])} />
          </label>
        </nav>
      </header>

      <section className="slicer-workspace">
        <section className="slicer-preview-card">
          <div
            ref={dropZoneRef}
            className={`slicer-dropzone${dragging ? " dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void loadFile(event.dataTransfer.files?.[0]);
            }}
          >
            <canvas ref={canvasRef} aria-label="分镜裁切预览" />
            {image ? null : <div className="slicer-empty">拖入分镜大图</div>}
          </div>
          <footer>
            <span>{summary}</span>
            <button type="button" onClick={drawPreview}>刷新预览</button>
          </footer>
        </section>

        <aside className="slicer-controls">
          <section>
            <h2>格子</h2>
            <div className="slicer-preset-grid">
              {["6", "8", "9", "12", "16", "25"].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    updateControl("panelCount", count);
                    if (image) {
                      const grid = defaultStoryboardGrid(count, image.width, image.height);
                      setControls((current) => ({ ...current, panelCount: count, rows: String(grid.rows), cols: String(grid.cols) }));
                    }
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="slicer-field-row">
              <label>
                总格数
                <input value={controls.panelCount} type="number" min="1" max="400" onChange={(event) => updateControl("panelCount", event.currentTarget.value)} />
              </label>
              <button type="button" onClick={autoGrid}>自动行列</button>
            </div>
            <div className="slicer-field-row two">
              <label>
                行
                <input value={controls.rows} type="number" min="1" max="20" onChange={(event) => updateControl("rows", event.currentTarget.value)} />
              </label>
              <label>
                列
                <input value={controls.cols} type="number" min="1" max="20" onChange={(event) => updateControl("cols", event.currentTarget.value)} />
              </label>
            </div>
          </section>

          <section>
            <h2>裁切</h2>
            <div className="slicer-field-row two">
              <NumberField label="外边距 X" value={controls.marginX} onChange={(value) => updateControl("marginX", value)} />
              <NumberField label="外边距 Y" value={controls.marginY} onChange={(value) => updateControl("marginY", value)} />
            </div>
            <div className="slicer-field-row two">
              <NumberField label="格线 X" value={controls.gapX} onChange={(value) => updateControl("gapX", value)} />
              <NumberField label="格线 Y" value={controls.gapY} onChange={(value) => updateControl("gapY", value)} />
            </div>
            <NumberField label="内缩" value={controls.trim} onChange={(value) => updateControl("trim", value)} />
          </section>

          <section>
            <h2>输出</h2>
            <div className="slicer-field-row two">
              <label>
                放大
                <select value={controls.scale} onChange={(event) => updateControl("scale", event.currentTarget.value)}>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                </select>
              </label>
              <label>
                格式
                <select value={controls.format} onChange={(event) => updateControl("format", event.currentTarget.value as StoryboardImageFormat)}>
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
            </div>
            <div className="slicer-field-row two">
              <label>
                质量
                <input value={controls.quality} type="number" min="0.1" max="1" step="0.01" onChange={(event) => updateControl("quality", event.currentTarget.value)} />
              </label>
              <label>
                起始编号
                <input value={controls.startIndex} type="number" min="1" onChange={(event) => updateControl("startIndex", event.currentTarget.value)} />
              </label>
            </div>
            <label>
              文件前缀
              <input value={controls.prefix} onChange={(event) => updateControl("prefix", event.currentTarget.value)} />
            </label>
            <label className="slicer-checkbox">
              <input checked={controls.sharpen} type="checkbox" onChange={(event) => updateControl("sharpen", event.currentTarget.checked)} />
              <span>轻微锐化</span>
            </label>
          </section>

          <section className="slicer-actions">
            <button className="primary" type="button" disabled={busy} onClick={() => void generateSlices()}>生成小图</button>
            <button type="button" disabled={busy || !filePicker.showDirectoryPicker} onClick={() => void saveToFolder()}>保存到文件夹</button>
            <button type="button" disabled={busy} onClick={() => void downloadEach()}>逐张下载</button>
          </section>

          <p className="slicer-status">{status}</p>
        </aside>
      </section>

      <section className="slicer-output">
        <header>
          <h2>小图</h2>
          <span>{outputs.length} 张</span>
        </header>
        <div className="slicer-thumb-grid">
          {outputs.map((output) => (
            <article className="slicer-thumb" key={output.url}>
              <img src={output.url} alt={output.name} />
              <div>
                <strong>{output.name}</strong>
                <span>{output.width}x{output.height}</span>
                <a href={output.url} download={output.name}>下载</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} type="number" min="0" onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}
