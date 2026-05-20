import type { DeckModel, SlideModel } from "./types";
import { SLIDES_PLACEHOLDER } from "./importHtml";
import { aiEffectsStyle } from "./aiEffects";

export function exportHtmlDeck(deck: DeckModel): string {
  const manifest = buildManifest(deck);
  const slidesHtml = deck.slides.map((slide, index) => normalizeActiveClass(slide.html, index === 0)).join("\n\n");
  const manifestScript = `<script type="application/json" id="aippt-manifest">${escapeScriptJson(JSON.stringify(manifest))}</script>`;
  const shellWithSlides = deck.shellHtml.includes(SLIDES_PLACEHOLDER)
    ? deck.shellHtml.replace(SLIDES_PLACEHOLDER, slidesHtml)
    : buildFallbackShell(deck.title, slidesHtml);

  const withEffects = injectAiEffects(shellWithSlides);

  if (withEffects.includes("id=\"aippt-manifest\"") || withEffects.includes("id='aippt-manifest'")) return withEffects;

  return withEffects.replace("</body>", `\n${manifestScript}\n</body>`);
}

export function exportHtmlSlide(deck: DeckModel, slide: SlideModel): string {
  return exportHtmlDeck({
    ...deck,
    title: `${deck.title} - ${slide.title}`,
    slides: [{ ...slide, index: 0 }]
  });
}

function buildManifest(deck: DeckModel) {
  return {
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
}

function normalizeActiveClass(html: string, active: boolean): string {
  const withoutActive = html.replace(/\bactive\b/g, "").replace(/\sclass="slide\s+/g, ' class="slide ');
  if (!active) return withoutActive;
  if (withoutActive.includes('class="slide ')) return withoutActive.replace('class="slide ', 'class="slide active ');
  return withoutActive.replace('class="slide"', 'class="slide active"');
}

function buildFallbackShell(title: string, slidesHtml: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; overflow: hidden; background: #0a0a0f; color: #e8eef8; font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif; }
    #slides-container { width: 100vw; height: 100vh; position: relative; }
    .slide { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 60px 80px; box-sizing: border-box; }
    .slide.active { display: flex; }
  </style>
</head>
<body data-aippt-version="0.1">
  <div id="slides-container">${slidesHtml}</div>
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

function injectAiEffects(html: string): string {
  if (html.includes('id="aippt-ai-effects"') || html.includes("id='aippt-ai-effects'")) return html;
  return html.includes("</head>") ? html.replace("</head>", `${aiEffectsStyle()}</head>`) : `${aiEffectsStyle()}${html}`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeScriptJson(value: string): string {
  return value.replaceAll("</script", "<\\/script");
}
