import { SLIDES_PLACEHOLDER } from "./importHtml";
import { aiEffectsStyle } from "./aiEffects";
import type { DeckModel, SlideModel } from "./types";

export type PreviewMode = "edit" | "playback";

export function buildPreviewHtml(deck: DeckModel, slide: SlideModel, mode: PreviewMode = "edit"): string {
  const shell = markPreviewBody(mode === "edit" ? stripRuntimeScripts(deck.shellHtml) : deck.shellHtml, mode);
  const slideHtml = ensureActive(slide.html);
  const html = shell.includes(SLIDES_PLACEHOLDER)
    ? shell.replace(SLIDES_PLACEHOLDER, slideHtml)
    : `<!doctype html><html lang="zh-CN"><body data-aippt-preview="true" data-aippt-preview-mode="${mode}">${slideHtml}</body></html>`;

  const withStyles = injectAiEffects(injectPreviewOverrides(html, mode));
  return mode === "edit" ? injectEditorBridge(withStyles) : withStyles;
}

function stripRuntimeScripts(html: string): string {
  return html.replace(/<script\b(?![^>]*type=["']application\/json["'])[\s\S]*?<\/script>/gi, "");
}

function markPreviewBody(html: string, mode: PreviewMode): string {
  if (/<body\b[^>]*data-aippt-preview=/i.test(html)) return html;
  return html.replace(/<body\b/i, `<body data-aippt-preview="true" data-aippt-preview-mode="${mode}"`);
}

function injectPreviewOverrides(html: string, mode: PreviewMode): string {
  const style = `<style id="aippt-editor-preview-overrides">
    [data-aippt-preview-mode="edit"] #page-num,
    [data-aippt-preview-mode="edit"] #page-indicator,
    [data-aippt-preview-mode="edit"] #nav-hint { display: none !important; }
    [data-aippt-preview] #slides-container {
      position: relative !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
    }
    [data-aippt-preview] .slide {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 1 !important;
      transform: none !important;
      pointer-events: auto !important;
    }
    [data-aippt-preview] .slide:not(.active) { display: none !important; }
    [data-aippt-preview] [data-motion-preset="guided-reveal"] [data-role],
    [data-aippt-preview] [data-motion-preset="cinematic-focus"] [data-role] {
      animation-duration: 0.65s;
      animation-fill-mode: both;
    }
    [data-aippt-preview] [data-aippt-block] {
      margin-top: 24px;
      width: min(920px, 88vw);
    }
    [data-aippt-preview] .aippt-visual-card {
      border: 1px solid rgba(0,229,255,0.35);
      background: rgba(10,16,32,0.72);
      box-shadow: 0 0 28px rgba(0,229,255,0.16);
      border-radius: 8px;
      padding: 18px;
      color: var(--text, #e8eef8);
    }
    [data-aippt-preview] [data-edit-id] {
      cursor: move;
    }
    [data-aippt-preview] [data-aippt-selected="true"] {
      outline: 2px solid #ff8db3 !important;
      outline-offset: 4px;
      box-shadow: 0 0 0 6px rgba(255, 141, 179, 0.18), 0 10px 28px rgba(255, 141, 179, 0.22) !important;
    }
  </style>`;
  const modeComment = `<!-- aippt preview mode: ${mode} -->`;
  return html.includes("</head>") ? html.replace("</head>", `${modeComment}${style}</head>`) : `${modeComment}${style}${html}`;
}

function injectAiEffects(html: string): string {
  if (html.includes('id="aippt-ai-effects"') || html.includes("id='aippt-ai-effects'")) return html;
  return html.includes("</head>") ? html.replace("</head>", `${aiEffectsStyle()}</head>`) : `${aiEffectsStyle()}${html}`;
}

function injectEditorBridge(html: string): string {
  const script = `<script id="aippt-editor-bridge">
    (() => {
      let selected = null;
      let drag = null;
      const editableSelector = '[data-edit-id]';
      function containingBlockFor(el) {
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (getComputedStyle(parent).position !== 'static') return parent;
          parent = parent.parentElement;
        }
        return el.closest('.slide') || document.documentElement;
      }
      function measure(el) {
        const rect = el.getBoundingClientRect();
        const origin = containingBlockFor(el).getBoundingClientRect();
        return {
          x: Math.max(0, Math.round(rect.left - origin.left)),
          y: Math.max(0, Math.round(rect.top - origin.top)),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
      function readNumber(value, fallback) {
        const parsed = parseFloat(value || '');
        return Number.isFinite(parsed) ? parsed : fallback;
      }
      function isAnchored(el) {
        const style = getComputedStyle(el);
        return style.position === 'absolute' || style.position === 'fixed' || !!el.style.left || !!el.style.top;
      }
      function select(el) {
        if (selected) selected.removeAttribute('data-aippt-selected');
        selected = el;
        if (selected) selected.setAttribute('data-aippt-selected', 'true');
        const rect = measure(el);
        window.parent.postMessage({
          type: 'aippt-select',
          editId: el.getAttribute('data-edit-id'),
          role: el.getAttribute('data-role') || 'unknown',
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }, '*');
      }
      document.addEventListener('click', (event) => {
        const el = event.target.closest(editableSelector);
        if (!el) return;
        event.preventDefault();
        event.stopPropagation();
        select(el);
      }, true);
      document.addEventListener('pointerdown', (event) => {
        const el = event.target.closest(editableSelector);
        if (!el || event.button !== 0) return;
        select(el);
        const rect = measure(el);
        const style = getComputedStyle(el);
        const anchored = isAnchored(el);
        if (anchored && style.position === 'static') {
          el.style.position = 'absolute';
          el.style.left = rect.x + 'px';
          el.style.top = rect.y + 'px';
        }
        drag = {
          el,
          startX: event.clientX,
          startY: event.clientY,
          mode: anchored ? 'anchor' : 'flow',
          baseTransform: el.style.transform && el.style.transform !== 'none' ? el.style.transform : '',
          left: readNumber(el.style.left, rect.x),
          top: readNumber(el.style.top, rect.y),
          dx: 0,
          dy: 0
        };
        el.setPointerCapture?.(event.pointerId);
      }, true);
      document.addEventListener('pointermove', (event) => {
        if (!drag) return;
        drag.dx = Math.round(event.clientX - drag.startX);
        drag.dy = Math.round(event.clientY - drag.startY);
        if (drag.mode === 'anchor') {
          const x = Math.max(0, Math.round(drag.left + drag.dx));
          const y = Math.max(0, Math.round(drag.top + drag.dy));
          drag.el.style.left = x + 'px';
          drag.el.style.top = y + 'px';
        } else {
          drag.el.style.transform = (drag.baseTransform ? drag.baseTransform + ' ' : '') + 'translate(' + drag.dx + 'px, ' + drag.dy + 'px)';
        }
      }, true);
      document.addEventListener('pointerup', () => {
        if (!drag) return;
        if (Math.abs(drag.dx) < 1 && Math.abs(drag.dy) < 1) {
          drag = null;
          return;
        }
        const rect = measure(drag.el);
        const payload = drag.mode === 'anchor'
          ? {
            type: 'aippt-layout',
            editId: drag.el.getAttribute('data-edit-id'),
            x: readNumber(drag.el.style.left, rect.x),
            y: readNumber(drag.el.style.top, rect.y),
            width: rect.width,
            height: rect.height
          }
          : {
            type: 'aippt-layout',
            editId: drag.el.getAttribute('data-edit-id'),
            dx: drag.dx,
            dy: drag.dy,
            width: rect.width,
            height: rect.height
          };
        window.parent.postMessage(payload, '*');
        drag = null;
      }, true);
    })();
  </script>`;
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}

function ensureActive(html: string): string {
  if (/\bactive\b/.test(html)) return html;
  if (html.includes('class="slide ')) return html.replace('class="slide ', 'class="slide active ');
  return html.replace('class="slide"', 'class="slide active"');
}
