import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { buildPreviewHtml } from "../deck/previewHtml";
import type { PreviewMode } from "../deck/previewHtml";
import type { CanvasLayout, DeckModel, LayoutInput, SlideModel } from "../deck/types";

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 720;

interface SlidePreviewProps {
  deck: DeckModel | null;
  slide?: SlideModel;
  zoom: number;
  mode: PreviewMode;
  onSelect: (editId: string, layout?: CanvasLayout) => void;
  onLayout: (editId: string, layout: LayoutInput) => void;
}

export function SlidePreview({ deck, slide, zoom, mode, onSelect, onLayout }: SlidePreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ scale: 0.5, left: 0, top: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      const rect = host.getBoundingClientRect();
      const fitScale = Math.min(rect.width / PREVIEW_WIDTH, rect.height / PREVIEW_HEIGHT);
      const scale = Math.max(0.35, Math.min(1.35, fitScale * zoom));
      setFrame({
        scale,
        left: (rect.width - PREVIEW_WIDTH * scale) / 2,
        top: Math.max(0, (rect.height - PREVIEW_HEIGHT * scale) / 2)
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [zoom, deck?.id, slide?.id]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; editId?: string; x?: number; y?: number; width?: number; height?: number };
      if (!data || typeof data !== "object") return;
      if (data.type === "aippt-select" && data.editId) onSelect(data.editId, toCanvasLayout(data));
      if (data.type === "aippt-layout" && data.editId) {
        const layout = toLayoutInput(data);
        if (layout) onLayout(data.editId, layout);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLayout, onSelect]);

  if (!deck || !slide) {
    return <div className="empty-preview">导入 HTML 后，这里会显示保真预览。</div>;
  }

  return (
    <div ref={hostRef} className="slide-frame-wrap">
      <div
        className="slide-frame-canvas"
        style={{
          width: PREVIEW_WIDTH * frame.scale,
          height: PREVIEW_HEIGHT * frame.scale,
          marginLeft: frame.left,
          marginTop: frame.top
        }}
      >
        <iframe
          className="slide-frame"
          title={slide.title}
          srcDoc={buildPreviewHtml(deck, slide, mode)}
          style={{
            transform: `scale(${frame.scale})`
          }}
        />
      </div>
    </div>
  );
}

function toCanvasLayout(data: { x?: number; y?: number; width?: number; height?: number }): CanvasLayout | undefined {
  if (typeof data.x !== "number" || typeof data.y !== "number" || typeof data.width !== "number" || typeof data.height !== "number") return undefined;
  return { x: data.x, y: data.y, width: data.width, height: data.height };
}

function toLayoutInput(data: LayoutInput): LayoutInput | undefined {
  const layout: LayoutInput = {};
  for (const key of ["x", "y", "dx", "dy", "width", "height"] as const) {
    if (typeof data[key] === "number") layout[key] = data[key];
  }
  return Object.keys(layout).length ? layout : undefined;
}
