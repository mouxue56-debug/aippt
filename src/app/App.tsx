import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { applyEditOperation } from "../deck/editOperations";
import { exportHtmlDeck, exportHtmlSlide } from "../deck/exportHtml";
import { importHtmlDeck } from "../deck/importHtml";
import type { PreviewMode } from "../deck/previewHtml";
import { addBlankSlide, deleteSlide, duplicateSlide, moveSlide } from "../deck/slideOperations";
import type { CanvasLayout, DeckModel, EditableElement, LayoutInput, SlideModel, TextStyleProperty, VisualBlockInput, VisualBlockKind } from "../deck/types";
import { isPublicMode } from "./publicMode";
import { ExportPanel } from "../ui/ExportPanel";
import { Inspector } from "../ui/Inspector";
import { SlideList } from "../ui/SlideList";
import { SlidePreview } from "../ui/SlidePreview";

const PROJECT_STORAGE_KEY = "aippt:last-project";
const DEFAULT_PREVIEW_ZOOM = 1.18;
const HISTORY_LIMIT = 40;
const InternalAiSlideTools = import.meta.env.VITE_AIPPT_PUBLIC_MODE === "1"
  ? null
  : lazy(() => import("./InternalAiSlideTools").then((module) => ({ default: module.InternalAiSlideTools })));

interface HistoryEntry {
  deck: DeckModel;
  selectedId?: string;
}

export function App() {
  const [deck, setDeck] = useState<DeckModel | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedEditId, setSelectedEditId] = useState<string | undefined>();
  const [objectLayouts, setObjectLayouts] = useState<Record<string, CanvasLayout>>({});
  const [pastDecks, setPastDecks] = useState<HistoryEntry[]>([]);
  const [futureDecks, setFutureDecks] = useState<HistoryEntry[]>([]);
  const [previewZoom, setPreviewZoom] = useState(DEFAULT_PREVIEW_ZOOM);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>();
  const [savedDraftMeta, setSavedDraftMeta] = useState(() => readSavedDraftMeta());
  const [url, setUrl] = useState("https://fuluckai.com/");
  const [status, setStatus] = useState("导入一个 HTML PPT 后开始精修。");
  const publicMode = isPublicMode();

  const selectedSlide = useMemo(() => {
    if (!deck) return undefined;
    return deck.slides.find((slide) => slide.id === selectedId) ?? deck.slides[0];
  }, [deck, selectedId]);

  async function importFile(file: File) {
    const html = await file.text();
    const nextDeck = importHtmlDeck(html);
    setDeck(nextDeck);
    setSelectedId(nextDeck.slides[0]?.id);
    setSelectedEditId(undefined);
    setObjectLayouts({});
    setPastDecks([]);
    setFutureDecks([]);
    setHasUnsavedChanges(false);
    setStatus(`已导入 ${nextDeck.slides.length} 页：${nextDeck.title}`);
  }

  async function importUrl() {
    setStatus("正在抓取网页...");
    const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      setStatus(`网页导入失败：${response.status}`);
      return;
    }
    const html = await response.text();
    const nextDeck = importHtmlDeck(html);
    setDeck(nextDeck);
    setSelectedId(nextDeck.slides[0]?.id);
    setSelectedEditId(undefined);
    setObjectLayouts({});
    setPastDecks([]);
    setFutureDecks([]);
    setHasUnsavedChanges(false);
    setStatus(`已从 URL 导入 ${nextDeck.slides.length} 页。`);
  }

  function commitDeck(nextDeck: DeckModel, message: string, nextSelectedId = selectedSlide?.id, clearObjectSelection = false) {
    if (!deck) return;
    const resolvedSelectedId = nextDeck.slides.some((slide) => slide.id === nextSelectedId) ? nextSelectedId : nextDeck.slides[0]?.id;
    setPastDecks((history) => [...history.slice(-(HISTORY_LIMIT - 1)), { deck, selectedId }]);
    setFutureDecks([]);
    setDeck(nextDeck);
    setSelectedId(resolvedSelectedId);
    setSelectedEditId((current) => {
      if (clearObjectSelection || !current) return undefined;
      const selected = nextDeck.slides.find((slide) => slide.id === resolvedSelectedId);
      return selected?.editable.some((item) => item.id === current) ? current : undefined;
    });
    if (clearObjectSelection) setObjectLayouts({});
    setHasUnsavedChanges(true);
    setStatus(message);
  }

  function updateDeckWithSlide(nextSlide: SlideModel, message: string) {
    if (!deck) return;
    commitDeck(
      {
        ...deck,
        slides: deck.slides.map((slide) => (slide.id === nextSlide.id ? nextSlide : slide))
      },
      message,
      nextSlide.id
    );
  }

  function undoDeck() {
    if (!deck || pastDecks.length === 0) return;
    const previous = pastDecks[pastDecks.length - 1];
    setPastDecks((history) => history.slice(0, -1));
    setFutureDecks((history) => [{ deck, selectedId }, ...history].slice(0, HISTORY_LIMIT));
    setDeck(previous.deck);
    setSelectedId(previous.deck.slides.some((slide) => slide.id === previous.selectedId) ? previous.selectedId : previous.deck.slides[0]?.id);
    setSelectedEditId(undefined);
    setObjectLayouts({});
    setHasUnsavedChanges(true);
    setStatus("已撤销上一步修改。");
  }

  function redoDeck() {
    if (!deck || futureDecks.length === 0) return;
    const next = futureDecks[0];
    setFutureDecks((history) => history.slice(1));
    setPastDecks((history) => [...history.slice(-(HISTORY_LIMIT - 1)), { deck, selectedId }]);
    setDeck(next.deck);
    setSelectedId(next.deck.slides.some((slide) => slide.id === next.selectedId) ? next.selectedId : next.deck.slides[0]?.id);
    setSelectedEditId(undefined);
    setObjectLayouts({});
    setHasUnsavedChanges(true);
    setStatus("已重做刚才撤销的修改。");
  }

  function replaceText(editId: string, value: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "replace-text", slideId: selectedSlide.id, editId, value }), "已更新文字。");
  }

  function applyTextStyle(editId: string, property: TextStyleProperty, value: string, label: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "set-style", slideId: selectedSlide.id, editId, property, value }), `已更新文字样式：${label}`);
  }

  function switchPreviewMode(mode: PreviewMode) {
    setPreviewMode(mode);
    if (mode === "playback") {
      setSelectedEditId(undefined);
      setStatus("演示预览：保留原网页动效。");
      return;
    }
    setStatus("编辑预览：可选择和修改对象。");
  }

  function selectObject(editId: string, layout?: CanvasLayout) {
    setSelectedEditId(editId);
    if (layout) setObjectLayouts((current) => ({ ...current, [editId]: layout }));
  }

  function setObjectLayout(editId: string, layout: LayoutInput) {
    if (!deck || !selectedSlide) return;
    const normalized = normalizeLayout(layout);
    setObjectLayouts((current) => ({ ...current, [editId]: layoutForState(normalized, current[editId]) }));
    commitDeck(applyEditOperation(deck, { type: "set-layout", slideId: selectedSlide.id, editId, layout: normalized }), "已调整对象位置。");
  }

  function deleteObject(editId: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "delete-object", slideId: selectedSlide.id, editId }), "已删除对象。");
  }

  function replaceImage(editId: string, src: string, alt: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "replace-image", slideId: selectedSlide.id, editId, src, alt }), "已替换图片。");
  }

  function applyMotion(editId: string, preset: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "set-motion", slideId: selectedSlide.id, editId, preset }), `已应用动效：${preset}`);
  }

  function applySlideMotion(preset: string) {
    if (!deck || !selectedSlide) return;
    commitDeck(applyEditOperation(deck, { type: "set-slide-motion", slideId: selectedSlide.id, preset }), `已应用整页动效：${preset}`);
  }

  function insertVisualBlock(block: VisualBlockInput) {
    if (!deck || !selectedSlide) return;
    const labels: Record<VisualBlockKind, string> = {
      image: "图片",
      process: "流程图",
      mindmap: "思维图",
      gantt: "甘特图"
    };
    commitDeck(applyEditOperation(deck, { type: "insert-visual-block", slideId: selectedSlide.id, block }), `已插入${labels[block.kind]}。`);
  }

  function addSlideAfterCurrent() {
    if (!deck) return;
    const result = addBlankSlide(deck, selectedSlide?.id);
    const nextSlide = result.deck.slides.find((slide) => slide.id === result.slideId);
    commitDeck(result.deck, `已新增页面：第 ${nextSlide ? String(nextSlide.index + 1).padStart(2, "0") : "--"} 页。`, result.slideId, true);
  }

  function duplicateCurrentSlide() {
    if (!deck || !selectedSlide) return;
    const result = duplicateSlide(deck, selectedSlide.id);
    const nextSlide = result.deck.slides.find((slide) => slide.id === result.slideId);
    commitDeck(result.deck, `已复制当前页：第 ${nextSlide ? String(nextSlide.index + 1).padStart(2, "0") : "--"} 页。`, result.slideId, true);
  }

  function deleteCurrentSlide() {
    if (!deck || !selectedSlide) return;
    if (deck.slides.length <= 1) {
      setStatus("至少保留一页，不能删除。");
      return;
    }
    const deletedIndex = selectedSlide.index;
    const nextDeck = deleteSlide(deck, selectedSlide.id);
    const nextSelected = nextDeck.slides[Math.min(deletedIndex, nextDeck.slides.length - 1)]?.id;
    commitDeck(nextDeck, `已删除页面：第 ${String(deletedIndex + 1).padStart(2, "0")} 页。`, nextSelected, true);
  }

  function moveCurrentSlide(direction: "up" | "down") {
    if (!deck || !selectedSlide) return;
    const nextDeck = moveSlide(deck, selectedSlide.id, direction);
    if (nextDeck === deck) return;
    commitDeck(nextDeck, direction === "up" ? "已上移当前页。" : "已下移当前页。", selectedSlide.id, true);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redoDeck();
      else undoDeck();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function saveDraft(scope: "project" | "slide") {
    if (!deck || !selectedSlide) return;
    const savedAt = new Date().toISOString();
    const payload: SavedProject = { version: 1, savedAt, selectedId: selectedSlide.id, deck };
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(payload));
    setLastSavedAt(savedAt);
    setSavedDraftMeta({ savedAt, slideCount: deck.slides.length });
    setHasUnsavedChanges(false);
    setStatus(scope === "slide" ? `已保存当前页修改：第 ${String(selectedSlide.index + 1).padStart(2, "0")} 页。` : `已保存整套草稿：${deck.slides.length} 页。`);
  }

  function restoreDraft() {
    const saved = readSavedDraft();
    if (!saved) {
      setStatus("没有可恢复的本机草稿。");
      return;
    }
    setDeck(saved.deck);
    setSelectedId(saved.selectedId ?? saved.deck.slides[0]?.id);
    setSelectedEditId(undefined);
    setObjectLayouts({});
    setPastDecks([]);
    setFutureDecks([]);
    setLastSavedAt(saved.savedAt);
    setSavedDraftMeta({ savedAt: saved.savedAt, slideCount: saved.deck.slides.length });
    setHasUnsavedChanges(false);
    setStatus(`已恢复本机草稿：${saved.deck.slides.length} 页。`);
  }

  function exportDeck() {
    if (!deck) return;
    downloadHtml(exportHtmlDeck(deck), `aippt-full-${deck.slides.length}p`);
    setStatus(`已导出整套 HTML：${deck.slides.length} 页。`);
  }

  function exportCurrentSlide() {
    if (!deck || !selectedSlide) return;
    downloadHtml(exportHtmlSlide(deck, selectedSlide), `aippt-slide-${String(selectedSlide.index + 1).padStart(2, "0")}`);
    setStatus(`已导出当前页 HTML：第 ${String(selectedSlide.index + 1).padStart(2, "0")} 页。`);
  }

  function downloadHtml(html: string, basename: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${basename}-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="panel panel-left">
        <header className="brand">
          <span className="brand-mark">🌸</span>
          <div>
            <p className="eyebrow">福楽 AI</p>
            <h1>HTML PPT 精修台</h1>
          </div>
        </header>

        <section className="import-box">
          <h2>{publicMode ? "导入 HTML" : "导入网页 / HTML"}</h2>
          {publicMode ? (
            <p className="privacy-note">公开版只处理你选择的本地 HTML 文件，内容保留在浏览器里，不调用 AI 后端。</p>
          ) : (
            <div className="url-row">
              <input value={url} onChange={(event) => setUrl(event.currentTarget.value)} placeholder="https://..." />
              <button onClick={() => void importUrl()}>导入网页</button>
            </div>
          )}
          <label className="file-input">
            <input
              aria-label="导入 HTML PPT"
              type="file"
              accept=".html,text/html"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void importFile(file);
              }}
            />
            <span>选择 HTML 文件</span>
          </label>
          <p>{deck ? `${deck.slides.length} 页已载入` : publicMode ? "支持 DeepSeek/ChatGPT 生成的单文件网页 PPT。" : "支持 URL、DeepSeek/ChatGPT 生成的单文件网页 PPT。"}</p>
        </section>

        <section className="deck-tools" aria-label="页面管理">
          <button disabled={!deck} onClick={addSlideAfterCurrent}>新增页面</button>
          <button disabled={!selectedSlide} onClick={duplicateCurrentSlide}>复制页面</button>
          <button disabled={!selectedSlide || (deck?.slides.length ?? 0) <= 1} onClick={deleteCurrentSlide}>删除页面</button>
          <button disabled={!selectedSlide || selectedSlide.index === 0} onClick={() => moveCurrentSlide("up")}>上移页面</button>
          <button disabled={!selectedSlide || selectedSlide.index >= (deck?.slides.length ?? 0) - 1} onClick={() => moveCurrentSlide("down")}>下移页面</button>
        </section>

        <SlideList
          slides={deck?.slides ?? []}
          selectedId={selectedSlide?.id}
          onSelect={(id) => {
            setSelectedId(id);
            setSelectedEditId(undefined);
            setObjectLayouts({});
          }}
        />
      </aside>

      <section className="stage">
        <div className="stage-toolbar">
          <div className="stage-title">
            <p className="eyebrow">预览</p>
            <h2>{selectedSlide?.title ?? "等待导入"}</h2>
          </div>
          <div className="stage-tools">
            <div className="history-actions" aria-label="历史操作">
              <button disabled={pastDecks.length === 0} onClick={undoDeck}>撤销</button>
              <button disabled={futureDecks.length === 0} onClick={redoDeck}>重做</button>
            </div>
            <div className="mode-toggle" aria-label="预览模式">
              <button className={previewMode === "edit" ? "active" : ""} onClick={() => switchPreviewMode("edit")}>编辑预览</button>
              <button className={previewMode === "playback" ? "active" : ""} onClick={() => switchPreviewMode("playback")}>演示预览</button>
            </div>
            <div className="zoom-controls" aria-label="画布缩放">
              <button aria-label="缩小画布" onClick={() => setPreviewZoom((value) => Math.max(0.8, Number((value - 0.12).toFixed(2))))}>-</button>
              <span>{Math.round(previewZoom * 100)}%</span>
              <button aria-label="适配画布" onClick={() => setPreviewZoom(1)}>适配</button>
              <button aria-label="放大画布" onClick={() => setPreviewZoom((value) => Math.min(1.6, Number((value + 0.12).toFixed(2))))}>+</button>
            </div>
            <span className="status-pill">{status}</span>
          </div>
        </div>
        <SlidePreview deck={deck} slide={selectedSlide} zoom={previewZoom} mode={previewMode} onSelect={selectObject} onLayout={setObjectLayout} />
      </section>

      <aside className="panel panel-right">
        <Inspector
          editable={selectedSlide?.editable ?? []}
          selected={selectedSlide?.editable.find((item) => item.id === selectedEditId)}
          selectedLayout={selectedEditId ? objectLayouts[selectedEditId] : undefined}
          onReplaceText={replaceText}
          onSetTextStyle={applyTextStyle}
          onReplaceImage={replaceImage}
          onSetLayout={setObjectLayout}
          onDeleteObject={deleteObject}
          onApplyMotion={applyMotion}
          onApplySlideMotion={applySlideMotion}
          onInsertVisualBlock={insertVisualBlock}
        />
        {publicMode || !InternalAiSlideTools ? null : (
          <Suspense fallback={null}>
            <InternalAiSlideTools
              disabled={!selectedSlide}
              selectedSlide={selectedSlide}
              onUpdateSlide={updateDeckWithSlide}
              onStatus={setStatus}
            />
          </Suspense>
        )}
        <ExportPanel
          disabled={!deck}
          slideCount={deck?.slides.length ?? 0}
          slideNumber={selectedSlide ? selectedSlide.index + 1 : undefined}
          dirty={hasUnsavedChanges}
          lastSavedLabel={lastSavedAt ? formatSavedAt(lastSavedAt) : undefined}
          savedDraftLabel={savedDraftMeta ? `${formatSavedAt(savedDraftMeta.savedAt)} / ${savedDraftMeta.slideCount}页` : undefined}
          onSaveProject={() => saveDraft("project")}
          onSaveSlide={() => saveDraft("slide")}
          onRestoreDraft={restoreDraft}
          onExportDeck={exportDeck}
          onExportSlide={exportCurrentSlide}
        />
        <DeckWarnings warnings={deck?.warnings ?? []} editable={selectedSlide?.editable ?? []} />
      </aside>
    </main>
  );
}

interface SavedProject {
  version: 1;
  savedAt: string;
  selectedId?: string;
  deck: DeckModel;
}

function readSavedDraft(): SavedProject | undefined {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SavedProject;
    if (!parsed.deck?.slides?.length || !parsed.savedAt) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function readSavedDraftMeta(): { savedAt: string; slideCount: number } | undefined {
  const saved = readSavedDraft();
  return saved ? { savedAt: saved.savedAt, slideCount: saved.deck.slides.length } : undefined;
}

function formatSavedAt(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function normalizeLayout(layout: LayoutInput): LayoutInput {
  return layout;
}

function layoutForState(layout: LayoutInput, measured?: CanvasLayout): CanvasLayout {
  return {
    x: typeof layout.x === "number" ? layout.x : (measured?.x ?? 0) + (layout.dx ?? 0),
    y: typeof layout.y === "number" ? layout.y : (measured?.y ?? 0) + (layout.dy ?? 0),
    width: typeof layout.width === "number" ? layout.width : measured?.width ?? 0,
    height: typeof layout.height === "number" ? layout.height : measured?.height ?? 0
  };
}

function DeckWarnings({ warnings, editable }: { warnings: string[]; editable: EditableElement[] }) {
  return (
    <section className="meta-panel">
      <h2>结构信息</h2>
      <p>当前页可编辑元素：{editable.length}</p>
      {warnings.length > 0 ? warnings.map((warning) => <p key={warning}>{warning}</p>) : <p>未发现导入阻塞问题。</p>}
    </section>
  );
}
